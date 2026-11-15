import { useState } from 'react'
import type { ToastMessage } from '../components/Toast'
import { describeOutcome, type Outcome } from './analysis'
import type { ForecastOutcome, ForecastState } from './forecast'

/**
 * Shows a message once when an analysis or a forecast ends (done, failed, cancelled). The last outcome seen is kept
 * in state and compared while rendering, so each outcome is announced one time.
 */
export function useFinishMessages(analysis: Outcome | null, forecast: ForecastState, show: (t: ToastMessage) => void) {
  const [seenAnalysis, setSeenAnalysis] = useState<Outcome | null>(null)
  const [seenForecast, setSeenForecast] = useState<ForecastOutcome | null>(null)
  if (analysis !== seenAnalysis) {
    setSeenAnalysis(analysis)
    if (analysis) show({ id: `analysis-${analysis.id}`, ...describeOutcome(analysis) })
  }
  if (forecast.outcome !== seenForecast) {
    setSeenForecast(forecast.outcome)
    const o = forecast.outcome
    if (o) {
      const id = `forecast-${o.id}`
      const weak = forecast.result && Object.values(forecast.result.backscatter).some((b) => !b.reliable)
      if (o.kind === 'cancelled') show({ id, level: 'info', lines: [{ text: 'Forecast cancelled.' }] })
      else if (o.kind === 'error') show({ id, level: o.code === 'insufficient-history' ? 'warning' : 'error', lines: [{ text: 'The forecast could not be made: {message}', vars: { message: o.message ?? '' } }] })
      else if (weak) show({ id, level: 'warning', lines: [{ text: 'Forecast ready.' }, { text: 'Some series are marked weak: the history is short or noisy for a confident forecast.' }] })
      else show({ id, level: 'success', lines: [{ text: 'Forecast ready.' }] })
    }
  }
}
