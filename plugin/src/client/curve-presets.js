import { normalizeCurves } from '../shared/curves.js'

const identity = [[0, 0], [1, 1]]
const make = (master, r = identity, g = identity, b = identity) => normalizeCurves({ master, r, g, b })

export const BUILTIN_CURVE_PRESETS = [
  {
    id: 'soft-contrast',
    nameKey: 'curvePresetSoftContrast',
    descriptionKey: 'curvePresetSoftContrastHint',
    curves: make([[0, 0], [0.25, 0.22], [0.5, 0.5], [0.75, 0.78], [1, 1]]),
  },
  {
    id: 'strong-contrast',
    nameKey: 'curvePresetStrongContrast',
    descriptionKey: 'curvePresetStrongContrastHint',
    curves: make([[0, 0], [0.25, 0.16], [0.5, 0.5], [0.75, 0.84], [1, 1]]),
  },
  {
    id: 'shadow-lift',
    nameKey: 'curvePresetShadowLift',
    descriptionKey: 'curvePresetShadowLiftHint',
    curves: make([[0, 0], [0.15, 0.26], [0.5, 0.56], [1, 1]]),
  },
  {
    id: 'highlight-rolloff',
    nameKey: 'curvePresetHighlightRolloff',
    descriptionKey: 'curvePresetHighlightRolloffHint',
    curves: make([[0, 0], [0.5, 0.52], [0.8, 0.72], [1, 1]]),
  },
  {
    id: 'matte-fade',
    nameKey: 'curvePresetMatteFade',
    descriptionKey: 'curvePresetMatteFadeHint',
    curves: make([[0, 0], [0.12, 0.18], [0.5, 0.5], [0.88, 0.82], [1, 1]]),
  },
  {
    id: 'warm-film',
    nameKey: 'curvePresetWarmFilm',
    descriptionKey: 'curvePresetWarmFilmHint',
    curves: make(
      [[0, 0], [1, 1]],
      [[0, 0], [0.5, 0.54], [1, 1]],
      [[0, 0], [1, 1]],
      [[0, 0], [0.5, 0.47], [1, 1]],
    ),
  },
  {
    id: 'cool-cinema',
    nameKey: 'curvePresetCoolCinema',
    descriptionKey: 'curvePresetCoolCinemaHint',
    curves: make(
      [[0, 0], [1, 1]],
      [[0, 0], [0.5, 0.46], [1, 1]],
      [[0, 0], [1, 1]],
      [[0, 0], [0.5, 0.54], [1, 1]],
    ),
  },
]

export function builtinCurvePreset(id) {
  return BUILTIN_CURVE_PRESETS.find(preset => preset.id === id)
}
