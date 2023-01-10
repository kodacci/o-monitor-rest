import { Duration } from 'luxon'

export const isoDuration = (val: unknown): void => {
  const value = String(val)
  const duration = Duration.fromISO(value)
  if (!duration.isValid) {
    throw new Error(`Invalid duration ${value}`)
  }
}
