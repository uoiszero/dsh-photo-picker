import { createReadStream } from 'node:fs'

const BODY_LIMIT = 1024 * 1024

function send(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

async function readJson(req) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > BODY_LIMIT) {
      const error = new Error('request body too large')
      error.statusCode = 413
      throw error
    }
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function streamSse(service, req, res, projectId) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  })
  const sendEvent = event => {
    if (event.projectId !== projectId) return
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }
  service.events.on('event', sendEvent)
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 15_000)
  req.on('close', () => {
    clearInterval(heartbeat)
    service.events.off('event', sendEvent)
  })
}

/** 本机 HTTP 路由；Host 服务在构造时把它挂到 `/photo-picker` 前缀。 */
export function createHttpHandler(service) {
  return async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://local')
      const pathname = decodeURIComponent(url.pathname)

      if (pathname === '/photo-picker/api/health') return send(res, 200, { ok: true })

      if (pathname === '/photo-picker/api/projects' && req.method === 'GET') {
        return send(res, 200, await service.listProjects())
      }
      if (pathname === '/photo-picker/api/projects' && req.method === 'POST') {
        return send(res, 201, await service.createProject(await readJson(req)))
      }

      const projectMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)$/)
      if (projectMatch !== null && req.method === 'GET') {
        return send(res, 200, await service.getProjectDetail(projectMatch[1]))
      }

      const photosMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/photos$/)
      if (photosMatch !== null && req.method === 'GET') {
        return send(res, 200, await service.listPhotos(photosMatch[1], {
          state: url.searchParams.get('state') ?? undefined,
          limit: Number(url.searchParams.get('limit') ?? 60),
          offset: Number(url.searchParams.get('offset') ?? 0),
        }))
      }

      const actionsMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/actions$/)
      if (actionsMatch !== null && req.method === 'POST') {
        const body = await readJson(req)
        return send(res, 200, await service.startStage(actionsMatch[1], body.stage))
      }

      const eventsMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/events$/)
      if (eventsMatch !== null && req.method === 'GET') {
        return streamSse(service, req, res, eventsMatch[1])
      }

      if (pathname === '/photo-picker/api/fs/list') {
        return send(res, 200, await service.listDir(url.searchParams.get('path') ?? undefined))
      }
      if (pathname === '/photo-picker/api/fs/choose' && req.method === 'POST') {
        return send(res, 200, { path: await service.chooseFolder() })
      }

      const thumbMatch = pathname.match(/^\/photo-picker\/media\/thumb\/([^/]+)\/([^/]+)$/)
      if (thumbMatch !== null) {
        const file = await service.thumbFile(thumbMatch[1], thumbMatch[2])
        if (file === undefined) {
          return send(res, 404, { error: { code: 'NOT_FOUND', message: 'thumbnail not found' } })
        }
        res.writeHead(200, { 'content-type': 'image/webp', 'cache-control': 'private, max-age=86400' })
        createReadStream(file).pipe(res)
        return
      }

      return send(res, 404, { error: { code: 'NOT_FOUND', message: pathname } })
    } catch (error) {
      return send(res, error?.statusCode ?? 500, {
        error: { code: error?.code ?? 'INTERNAL', message: String(error?.message ?? error) },
      })
    }
  }
}
