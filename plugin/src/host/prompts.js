/** 提示词版本；改动提示词时同步 bump，assessments 幂等键依赖它。 */
export const PROMPT_VERSION = 'v5'

export const GRID_SYSTEM = '你是一位有经验的摄影编辑，只输出 JSON，不输出任何解释。'

/** 网格粗筛的 user 提示词（spec 18.2 v1）。 */
export function gridUserPrompt({ count, cols, rows }) {
  const lines = [
    `下面是一张由 ${count} 张照片拼成的网格图（${cols} 列 × ${rows} 行），每格左上角有编号 A1–${String.fromCharCode(64 + cols)}${rows}，编号按行优先排列。`,
    '',
    '这些照片可能包含人像、风光、建筑、街拍、活动等混合内容；不要假设项目题材，按每格画面本身判断主体、构图、光影和清晰度。',
    '',
    '请选出构图有重点、光影有层次、主体清晰、值得进入下一轮的照片，目标大约选出 30%。如果同一场景/连拍有多张相似照片，只选其中最好的一张。',
  ]
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
export function scoreUserPrompt() {
  const lines = [
    '你是一位有经验的摄影编辑。请先判断这张照片的主要内容，再从六个维度评价它（0–10 分）。',
    '',
    '先输出 scenes（1–3 个场景/题材标签，按画面本身判断）：',
    'portrait 人像、landscape 风光、architecture 建筑、street 街拍、event 活动/纪实、other 其他。',
    '再输出 primary_scene，选择最贴近画面主体的一个；primary_scene 必须在 scenes 中。',
    '允许一张照片有多个标签，例如活动中的单人瞬间可以是 ["portrait","event"]；',
    '但不要为了凑标签而强行添加，混合/街拍内容按主要主体判断。',
    '',
    '评分时以 primary_scene 相应的标准为主，但仍要兼顾六维完整评分：',
    '- portrait：眼神、表情、皮肤、姿态；背景虚化可接受。',
    '- landscape：构图层次、光线时刻、地平线、清晰度。',
    '- architecture：线条、透视、对称、畸变、细节。',
    '- street / event：瞬间、人物互动、叙事性、主体可辨识度。',
    '- other：通用构图与光影。',
    '',
    '六个维度（0–10 分）：',
    '构图 composition、光影 light、色彩 color、技术质量 technique、',
    '后期潜力 post_potential、瞬间与叙事 moment。',
    '',
    '然后给出：总分 score（0–10，保留一位小数）、建议 verdict（keep / maybe / reject）、',
    '后期建议 post_processing（可多选，代码如 crop_left/crop_right/straighten_+1.5/',
    'exposure_+0.3/white_balance/warm/cool）、一句中文理由 reason（不超过 60 字）。',
    '',
    '如果确实有可执行的后期建议，再额外给出 edit_recipe（与软件无关的参数）：',
    '{"version":1,"crop":{"left":0,"top":0,"width":1,"height":1},"rotate":0,',
    '"exposureEv":0,"contrast":0,"saturation":0,"sharpen":0}。',
    '先逐边检查左、右、上、下：只有某条边存在明确分散注意力的元素（路人、杂物、半截物体等），',
    '且裁掉后主体仍完整时，才裁切；否则保持全画幅。不要为了填字段而套用固定边距。',
    '不同照片应因主体和干扰位置不同而给出不同的裁切框；不要照抄示例里的数字。',
    '裁切必须有构图意义：如果所有被裁的边都小于 18%，就不要裁，保持全画幅；轻微边缘干扰应忽略。',
    'crop 是 0–1 的归一化坐标，按“先旋转校正并自动裁掉黑角后的画布”计算；',
    'left/top 是保留区域左上角，width/height 是保留比例；rotate 单位是度（-5–5）；',
    'exposureEv 是曝光补偿（-2–2）；contrast/saturation 是 -1–1；sharpen 是 0–2。',
    '没有明确可执行的调整时，省略 edit_recipe 或返回全 0/全画幅；不要编造 8% 边距。',
  ]
  lines.push(
    '',
    '只返回如下结构的 JSON（不要围栏、不要解释）；示例中的 crop 是全画幅，数字只是字段格式，不要照抄：',
    '{"scenes":["architecture","street"],"primary_scene":"architecture","score":8.2,"dimensions":{"composition":8,"light":7,"color":8,"technique":9,"post_potential":7,"moment":6},"verdict":"keep","post_processing":["crop_right"],"edit_recipe":{"version":1,"crop":{"left":0,"top":0,"width":1,"height":1},"rotate":0,"exposureEv":0,"contrast":0,"saturation":0,"sharpen":0},"reason":"线条清晰，侧光有层次"}',
  )
  return lines.join('\n')
}
