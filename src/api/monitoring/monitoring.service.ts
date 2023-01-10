import { inject, injectable } from 'inversify'
import { DateTime } from 'luxon'
import { DiSymbols } from '@application/di-symbols'
import { SystemStats, SystemStatsRepo } from '@modules/database'
import { ServerError, ErrorCode } from '@modules/error'
import { SystemWatcherService } from '@modules/system-watcher'

@injectable()
export class MonitoringService {
  constructor(
    @inject(DiSymbols.SystemStatsRepo)
    private readonly repo: SystemStatsRepo,
    @inject(DiSymbols.SystemWatcherService)
    private readonly systemWatcher: SystemWatcherService
  ) {}

  async getSystemStats(from: string, to?: string): Promise<SystemStats[]> {
    try {
      const fromDt = DateTime.fromISO(from)
      const toDt = to ? DateTime.fromISO(to) : DateTime.local()
      const ret = await this.repo.read(fromDt, toDt)
      const cpuName = this.systemWatcher.getCpuName()

      ret.forEach((stat) => (stat.cpu.name = cpuName))

      return ret
    } catch (err: unknown) {
      throw new ServerError(
        err,
        ErrorCode.MONITORING_SERVICE_GET_SYSTEM_STATS_ERROR
      )
    }
  }
}
