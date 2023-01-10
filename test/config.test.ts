import { isoDuration } from '@application/config/validators'

describe('config', () => {
  it('should validate ISO duration format', () => {
    expect(() => isoDuration('BAD FORMAT')).toThrow(
      'Invalid duration BAD FORMAT'
    )
  })
})
