import { Service } from '@deepseek-ai/cordis'

/** 照片工作台的 Host 服务；Client 与 agent 工具共用这一份状态。 */
export class PhotoPickerService extends Service {
  static inject = ['tools', 'webServer', 'llm', 'attachments']

  constructor(ctx) {
    super(ctx, 'photoPicker')
    this.ctx = ctx
  }
}
