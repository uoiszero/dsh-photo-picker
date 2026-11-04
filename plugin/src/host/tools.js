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
        enum: ['create', 'list', 'get', 'run_stage', 'status'],
        description: 'create / list / get / run_stage / status',
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
      stage: { type: 'string', enum: ['scan', 'preprocess'] },
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
          )
          break
        default:
          throw new Error(`unsupported action: ${args.action}`)
      }
      return { result: JSON.stringify(payload) }
    },
  })
}
