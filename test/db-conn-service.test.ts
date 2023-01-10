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

import { config } from '@application/config'
import { DbConnService } from '@modules/database'
import { LoggerFactory } from '@modules/logger'
import { Pool } from 'pg'

describe('DbConnService', () => {
  afterAll(() => jest.clearAllMocks())

  it('should handle pg pool error', async () => {
    const loggerFactory = new LoggerFactory()
    const pool = new Pool({ host: 'some.unknown.host', port: 999 })

    const conn = new DbConnService(config, loggerFactory, pool)

    pool.emit('error', new Error('Dummy error'))
    await conn.release()

    expect(logger.error).toHaveBeenCalled()
  })
})
