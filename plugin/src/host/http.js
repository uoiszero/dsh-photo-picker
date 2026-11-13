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

      if (pathname === '/photo-picker/api/prompt' && req.method === 'GET') {
        return send(res, 200, await service.promptInfo(url.searchParams.get('project') ?? undefined))
      }
      if (pathname === '/photo-picker/api/models' && req.method === 'GET') {
        return send(res, 200, await service.models(url.searchParams.get('route') ?? 'deepseek-official'))
      }

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
      if (projectMatch !== null && req.method === 'PATCH') {
        return send(res, 200, await service.updateSettings(projectMatch[1], await readJson(req)))
      }

      const photosMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/photos$/)
      if (photosMatch !== null && req.method === 'GET') {
        const query = url.searchParams
        return send(res, 200, await service.reviewPhotos(photosMatch[1], {
          scope: query.get('scope') ?? undefined,
          state: query.get('state') ?? undefined,
          verdict: query.get('verdict') ?? undefined,
          groupId: query.get('group') ?? undefined,
          sort: query.get('sort') ?? undefined,
          scoreMin: query.get('scoreMin') === null ? undefined : Number(query.get('scoreMin')),
          scoreMax: query.get('scoreMax') === null ? undefined : Number(query.get('scoreMax')),
          limit: Number(query.get('limit') ?? 60),
          offset: Number(query.get('offset') ?? 0),
        }))
      }

      const photoMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/photos\/([^/]+)$/)
      if (photoMatch !== null && req.method === 'GET') {
        return send(res, 200, await service.photoDetail(photoMatch[1], photoMatch[2]))
      }

      const decisionsMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/decisions$/)
      if (decisionsMatch !== null && req.method === 'POST') {
        const body = await readJson(req)
        return send(res, 200, await service.setDecisions(decisionsMatch[1], {
          photoIds: body.photoIds,
          verdict: body.verdict,
        }))
      }

      const statsMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/stats$/)
      if (statsMatch !== null && req.method === 'GET') {
        return send(res, 200, await service.stats(statsMatch[1]))
      }

      const groupsMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/groups$/)
      if (groupsMatch !== null && req.method === 'GET') {
        return send(res, 200, await service.groups(groupsMatch[1], {
          limit: Number(url.searchParams.get('limit') ?? 100),
          offset: Number(url.searchParams.get('offset') ?? 0),
        }))
      }

      const groupMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/groups\/([^/]+)$/)
      if (groupMatch !== null && req.method === 'GET') {
        return send(res, 200, await service.group(groupMatch[1], groupMatch[2]))
      }

      const calibrationSampleMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/calibration\/sample$/)
      if (calibrationSampleMatch !== null && req.method === 'GET') {
        return send(res, 200, await service.calibrationSample(calibrationSampleMatch[1], {
          size: Number(url.searchParams.get('size') ?? 80),
        }))
      }

      const calibrationMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/calibration$/)
      if (calibrationMatch !== null && req.method === 'GET') {
        return send(res, 200, await service.calibrationReport(calibrationMatch[1]))
      }
      if (calibrationMatch !== null && req.method === 'POST') {
        const body = await readJson(req)
        return send(res, 200, await service.calibrate(calibrationMatch[1], body.labels))
      }

      const exportPreviewMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/export\/preview$/)
      if (exportPreviewMatch !== null && req.method === 'POST') {
        const body = await readJson(req)
        return send(res, 200, await service.exportPreview(exportPreviewMatch[1], body))
      }

      const exportRunMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/export\/run$/)
      if (exportRunMatch !== null && req.method === 'POST') {
        const body = await readJson(req)
        return send(res, 200, await service.exportRun(exportRunMatch[1], body))
      }

      const actionsMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/actions$/)
      if (actionsMatch !== null && req.method === 'POST') {
        const body = await readJson(req)
        if (body.action === 'run_all') {
          return send(res, 200, await service.startPipeline(actionsMatch[1], { stages: body.stages }))
        }
        return send(res, 200, await service.startStage(actionsMatch[1], body.stage, {
          action: body.action ?? 'start',
        }))
      }

      const checkpointsMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/checkpoints$/)
      if (checkpointsMatch !== null && req.method === 'GET') {
        return send(res, 200, await service.checkpoints(checkpointsMatch[1]))
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
      if (pathname === '/photo-picker/api/fs/reveal' && req.method === 'POST') {
        const body = await readJson(req)
        return send(res, 200, await service.reveal(body.path))
      }

      const previewMatch = pathname.match(/^\/photo-picker\/media\/preview\/([^/]+)\/([^/]+)$/)
      if (previewMatch !== null) {
        const file = await service.previewFile(previewMatch[1], previewMatch[2])
        if (file === undefined) {
          return send(res, 404, { error: { code: 'NOT_FOUND', message: 'preview not found' } })
        }
        res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=86400' })
        createReadStream(file).pipe(res)
        return
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

      const editMatch = pathname.match(/^\/photo-picker\/media\/edit\/([^/]+)\/([^/]+)$/)
      if (editMatch !== null) {
        const file = await service.editedFile(editMatch[1], editMatch[2])
        if (file === undefined) {
          return send(res, 404, { error: { code: 'NOT_FOUND', message: 'edited preview not found' } })
        }
        res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=0, must-revalidate' })
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
