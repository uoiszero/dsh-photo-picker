import sharp from 'sharp'

const MODEL_EDGE = 1300

/** 把源文件/缓冲转成单张精评用的 1300px JPEG 附件数据。 */
export async function renderPhotoForModel(input) {
  const data = await sharp(input)
    .rotate()
    .resize({ width: MODEL_EDGE, height: MODEL_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()
  return { data, mediaType: 'image/jpeg' }
}
