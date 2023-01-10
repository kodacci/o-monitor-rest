import 'reflect-metadata'

import { config } from '@application/config/config'
import { SystemStatsRepo, DbConnService } from '@modules/database'
import { LoggerFactory } from '@modules/logger'
import { DateTime } from 'luxon'
import { ErrorCode, ServerError } from '@modules/error'

describe('SystemStatsRepo', () => {
  afterAll(() => jest.clearAllMocks())

  it('should throw server error on exception inside read', async () => {
    const loggerFactory = new LoggerFactory()
    const service = new DbConnService(config, loggerFactory)
    const repo = new SystemStatsRepo(service)

    const error = new Error('Dummy error')

    jest.spyOn(DbConnService.prototype, 'getConn').mockRejectedValueOnce(error)

    await expect(repo.read(DateTime.local(), DateTime.local())).rejects.toEqual(
      new ServerError(error, ErrorCode.SYSTEM_STATS_REPOSITORY_READ_ERROR)
    )

    await service.release()
  })

  it('should throw server error on exception inside write', async () => {
    const loggerFactory = new LoggerFactory()
    const service = new DbConnService(config, loggerFactory)
    const repo = new SystemStatsRepo(service)

    const error = new Error('Dummy error')

    jest.spyOn(DbConnService.prototype, 'getConn').mockRejectedValueOnce(error)

    await expect(
      repo.write({
        timestamp: DateTime.local().toISO(),
        temperature: 10,
        memory: {
          freeBytes: 0,
          usedBytes: 0,
          totalBytes: 0,
        },
        cpu: {
          name: 'Dummy CPU',
          coresCount: 1,
          load: [10],
        },
      })
    ).rejects.toEqual(
      new ServerError(error, ErrorCode.SYSTEM_STATS_REPOSITORY_WRITE_ERROR)
    )

    await service.release()
  })

  it('should throw server error on exception inside clearOld', async () => {
    const loggerFactory = new LoggerFactory()
    const service = new DbConnService(config, loggerFactory)
    const repo = new SystemStatsRepo(service)

    const error = new Error('Dummy error')

    jest.spyOn(DbConnService.prototype, 'getConn').mockRejectedValueOnce(error)

    await expect(repo.clearOld(DateTime.local())).rejects.toEqual(
      new ServerError(error, ErrorCode.SYSTEM_STATS_REPOSITORY_CLEANUP_ERROR)
    )

    await service.release()
  })
})
