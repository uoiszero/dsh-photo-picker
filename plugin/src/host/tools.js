import { defineTool } from '@deepseek-ai/dsh-tools'

/** 给 agent 的 v1 工具：建/列/查项目，跑扫描与预处理。 */
export function createPhotoPickerTool(service) {
  return defineTool({
    name: 'photo_picker',
    description:
      '管理照片工作台项目：创建本地照片项目、列出或查看项目、运行扫描（scan）或本地预处理（preprocess）。'
      + '创建项目时 source 必填；不知道照片目录就先问用户，不要默认当前目录。',
    parameters: {
      action: {
        type: 'string',
        required: true,
        enum: ['create', 'list', 'get', 'run_stage', 'status', 'pause', 'cancel'],
        description: 'create / list / get / run_stage / status / pause / cancel',
      },
      project: { type: 'string', description: '项目 id 或名称（get / run_stage / status 必填）' },
      source: {
        type: 'object',
        additionalProperties: false,
        description: 'create 必填：本机照片目录',
        properties: {
          kind: { type: 'string', required: true, enum: ['local'] },
          path: { type: 'string', required: true },
        },
      },
      name: { type: 'string', description: '项目名；省略时取文件夹名' },
      theme: { type: 'string', enum: ['portrait', 'landscape', 'event', 'mixed'] },
      budgetCny: { type: 'number' },
      stage: { type: 'string', enum: ['scan', 'preprocess', 'grid', 'rank', 'score'] },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          result: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.result }],
    },
    async execute(args) {
      let payload
      switch (args.action) {
        case 'create':
          payload = await service.createProject({
            source: args.source,
            name: args.name,
            theme: args.theme,
            budgetCny: args.budgetCny,
          })
          break
        case 'list':
          payload = await service.listProjects()
          break
        case 'get':
        case 'status':
          payload = await service.getProjectDetail(await service.resolveProject(args.project))
          break
        case 'run_stage':
          payload = await service.startStage(
            await service.resolveProject(args.project),
            args.stage,
            { action: 'start' },
          )
          break
        case 'pause':
        case 'cancel':
          payload = await service.startStage(
            await service.resolveProject(args.project),
            args.stage,
            { action: args.action },
          )
          break
        default:
          throw new Error(`unsupported action: ${args.action}`)
      }
      return { result: JSON.stringify(payload) }
    },
  })
}

/** 导出工具：先 preview 汇总，再 run 执行并写 manifest。 */
export function createPhotoPickerExportTool(service) {
  return defineTool({
    name: 'photo_picker_export',
    description:
      '导出照片工作台里按判定分桶（keep / maybe / reject）的照片到本机目录：'
      + 'action=preview 做 dry-run 汇总，action=run 执行硬链接或复制并写 manifest。'
      + 'dest 必须是本机绝对路径；不确定时先用 preview 给用户看数量与冲突。',
    parameters: {
      action: {
        type: 'string',
        required: true,
        enum: ['preview', 'run'],
        description: 'preview / run',
      },
      project: { type: 'string', required: true, description: '项目 id 或名称' },
      dest: { type: 'string', required: true, description: '本机导出目录绝对路径' },
      buckets: {
        type: 'array',
        description: '要导出的分桶，默认 keep + maybe',
        items: { type: 'string', enum: ['keep', 'maybe', 'reject'] },
      },
      mode: { type: 'string', enum: ['hardlink', 'copy'], description: '硬链接（默认）或复制' },
      layout: { type: 'string', enum: ['mirror', 'flat'], description: '保留相对目录结构（默认）或平铺' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          result: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.result }],
    },
    async execute(args) {
      const id = await service.resolveProject(args.project)
      const options = { dest: args.dest, buckets: args.buckets, mode: args.mode, layout: args.layout }
      const payload = args.action === 'preview'
        ? await service.exportPreview(id, options)
        : await service.exportRun(id, options)
      return { result: JSON.stringify(payload) }
    },
  })
}
