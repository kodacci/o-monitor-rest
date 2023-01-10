import 'reflect-metadata'
import { Application } from '@application/application'

describe('server', () => {
  it('should handle application unexpected error', () => {
    jest.spyOn(Application.prototype, 'start').mockImplementationOnce(() => {
      throw new Error('Dummy error')
    })
    const consoleSpy = jest.spyOn(console, 'error')
    consoleSpy.mockImplementationOnce((message: string) =>
      // eslint-disable-next-line no-console
      console.log(`Hidden message: ${message}`)
    )

    require('../src/server')

    expect(consoleSpy).toHaveBeenCalled()
    jest.clearAllMocks()
  })
})
