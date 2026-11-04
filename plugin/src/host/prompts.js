/** 提示词版本；改动提示词时同步 bump，assessments 幂等键依赖它。 */
export const PROMPT_VERSION = 'v1'

const THEME_HINTS = {
  portrait: '这是一个以人像为主的项目：优先看眼神、皮肤、表情与人物姿态，容许背景虚化。',
  landscape: '这是一个以风光为主的项目：优先看构图层次、光线时刻、地平线与清晰度。',
  event: '这是一个活动纪实项目：优先看瞬间、人物互动、叙事性与主体可辨识度。',
  mixed: '',
}

export const GRID_SYSTEM = '你是一位有经验的摄影编辑，只输出 JSON，不输出任何解释。'

/** 网格粗筛的 user 提示词（spec 18.2 v1）。 */
export function gridUserPrompt({ count, cols, rows, theme = 'mixed' }) {
  const hint = THEME_HINTS[theme] ?? ''
  const lines = [
    `下面是一张由 ${count} 张照片拼成的网格图（${cols} 列 × ${rows} 行），每格左上角有编号 A1–${String.fromCharCode(64 + cols)}${rows}，编号按行优先排列。`,
    '',
    '请选出构图有重点、光影有层次、主体清晰、值得进入下一轮的照片，目标大约选出 30%。如果同一场景/连拍有多张相似照片，只选其中最好的一张。',
  ]
  if (hint !== '') lines.push('', hint)
  lines.push('', '只返回一个 JSON 数组，元素是格子编号字符串，例如 ["A1","B3","C2"]。不要输出任何解释。')
  return lines.join('\n')
}

export const GRID_RETRY_USER = '上一次没有返回可解析的 JSON 数组。请只返回一个非空的 JSON 数组，元素是格子编号字符串，例如 ["A1","B3"]，不要输出任何解释。'

export const RANK_SYSTEM = '你是一位有经验的摄影编辑，只输出 JSON，不输出任何解释。'

/** 组内排序的 user 提示词。 */
export function rankUserPrompt({ count }) {
  const labels = Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i)).join('、')
  return [
    `这些是同一场景或连拍的照片，共 ${count} 张，按 ${labels} 排列。`,
    '',
    '请按“值得保留”的程度排序，并指出最好的一张。',
    '',
    '只返回 JSON：{"order":["A","C","B"],"best":"A","reason":"一句话理由"}',
  ].join('\n')
}

export const SCORE_SYSTEM = '你是一位有经验的摄影编辑，只输出 JSON，不输出任何解释。'

/** 单张精评的 user 提示词。 */
export function scoreUserPrompt({ theme = 'mixed' } = {}) {
  const hint = THEME_HINTS[theme] ?? ''
  const lines = [
    '你是一位有经验的摄影编辑。请从六个维度评价这张照片（0–10 分）：',
    '构图 composition、光影 light、色彩 color、技术质量 technique、',
    '后期潜力 post_potential、瞬间与叙事 moment。',
    '',
    '然后给出：总分 score（0–10，保留一位小数）、建议 verdict（keep / maybe / reject）、',
    '后期建议 post_processing（可多选，代码如 crop_left/crop_right/straighten_+1.5/',
    'exposure_+0.3/white_balance/warm/cool）、一句中文理由 reason（不超过 60 字）。',
  ]
  if (hint !== '') lines.push('', hint)
  lines.push(
    '',
    '只返回如下结构的 JSON（不要围栏、不要解释）：',
    '{"score":8.2,"dimensions":{"composition":8,"light":7,"color":8,"technique":9,"post_potential":7,"moment":6},"verdict":"keep","post_processing":["crop_right"],"reason":"主体清晰，侧光有层次"}',
  )
  return lines.join('\n')
}
