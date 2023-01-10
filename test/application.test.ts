import 'reflect-metadata'

const logger: Record<string, unknown> = {
  debug: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  child: jest.fn(() => logger),
}

jest.mock('winston', () => ({
  format: {
    colorize: jest.fn(),
    combine: jest.fn(),
    label: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
  },
  createLogger: jest.fn().mockReturnValue(logger),
  transports: {
    Console: jest.fn(),
  },
}))

import chai from 'chai'
import chaiHttp from 'chai-http'
import { Application } from '@application/application'
import { controller, httpGet } from 'inversify-express-utils'
import { UserRepo } from '@modules/database'

chai.use(chaiHttp)

@controller('/some-dummy-path')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class DummyController {
  @httpGet('/')
  private get(): void {
    throw new Error('Dummy API error')
  }
}

describe('Application', () => {
  afterAll(() => jest.clearAllMocks())

  it('should handle createDefaultUser error', async () => {
    jest
      .spyOn(UserRepo.prototype, 'createDefaultUser')
      .mockRejectedValueOnce(new Error('Dummy error'))

    const app = new Application()
    const server = app.start()

    await chai.request(server).get('/api-docs')

    expect(logger.error).toHaveBeenCalled()
  })

  it('should handle unhandled api error', async () => {
    const app = new Application()
    const server = app.start()

    const res = await chai.request(server).get('/some-dummy-path')
    expect(res.status).toEqual(500)
  })
})
