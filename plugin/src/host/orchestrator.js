/**
 * 顺序执行阶段。runStage 返回 { paused: true } 表示该阶段被预算/暂停中断；
 * pauseBetween 为 true 时每阶段结束后停下，模拟“阶段间暂停”。
 * @returns {{ completed: string[], stoppedAt: string|null, reason: 'done'|'paused'|'aborted' }}
 */
export async function runPipeline({ stages, runStage, signal, onStage = () => {}, pauseBetween = false }) {
  const completed = []
  for (let index = 0; index < stages.length; index++) {
    const stage = stages[index]
    if (signal?.aborted === true) return { completed, stoppedAt: stage, reason: 'aborted' }
    onStage({ stage, phase: 'start' })
    const result = await runStage(stage)
    completed.push(stage)
    onStage({ stage, phase: 'done', result })
    if (result?.paused === true) return { completed, stoppedAt: stage, reason: 'paused' }
    if (signal?.aborted === true) {
      return { completed, stoppedAt: stages[index + 1] ?? null, reason: 'aborted' }
    }
    if (pauseBetween && index < stages.length - 1) {
      return { completed, stoppedAt: stages[index + 1], reason: 'paused' }
    }
  }
  return { completed, stoppedAt: null, reason: 'done' }
}
