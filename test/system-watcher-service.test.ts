import 'reflect-metadata'
import { config } from '@application/config'
import { DbConnService, SystemStatsRepo } from '@modules/database'
import { LoggerFactory } from '@modules/logger'
import { SystemWatcherService } from '@modules/system-watcher'

describe('SystemWatcherService', () => {
  afterAll(() => jest.clearAllMocks())

  it('should handle stats cleanup error', async () => {
    const loggerFactory = new LoggerFactory()
    const service = new DbConnService(config, loggerFactory)
    const repo = new SystemStatsRepo(service)
    const error = new Error('Dummy error')

    const mock = jest.spyOn(repo, 'clearOld').mockRejectedValueOnce(error)
    const watcher = new SystemWatcherService(config, repo, loggerFactory)

    await service.release()
    watcher.release()
    expect(mock).toHaveBeenCalled()
  })
})
