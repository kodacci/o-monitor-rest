import { readFile } from 'node:fs/promises'
import os, { freemem, totalmem } from 'node:os'
import { Job, RecurrenceRule, scheduleJob } from 'node-schedule'
import { inject, injectable } from 'inversify'
import { DiSymbols } from '@application/di-symbols'
import {
  SystemStats,
  SystemStatsRepo,
} from '@modules/database/system-stats-repo'
import { LoggerFactory } from '@modules/logger'
import { ServerError, ErrorCode } from '@modules/error'
import { AppConfig } from '@application/config/config'
import { DateTime } from 'luxon'

interface CpuIdleInfo {
  ts: number
  idle: number[]
}

@injectable()
export class SystemWatcherService {
  private static readonly TEMP_FILE_PATH =
    '/sys/devices/virtual/thermal/thermal_zone0/temp'

  private static readonly STATS_SECONDS_RECCURENCE = [0, 10, 20, 30, 40, 50]
  private static readonly CLEANUP_HOUR = 3

  private cpuIdle: number[] = os.cpus().map(() => 100)
  private readonly prevCpuInfo: CpuIdleInfo = {
    ts: Date.now(),
    idle: os.cpus().map((info) => info.times.idle),
  }
  private readonly statsJob: Job
  private readonly cleanupJob: Job

  private updateCpuStats(): void {
    const idle = os.cpus().map((info) => info.times.idle)
    this.cpuIdle = this.prevCpuInfo.idle.map(
      (prev, idx) =>
        ((idle[idx] - prev) * 100) / (Date.now() - this.prevCpuInfo.ts)
    )
  }

  private async saveStats(): Promise<void> {
    try {
      const stats: SystemStats = {
        temperature: await this.getTemperature(),
        memory: {
          freeBytes: freemem(),
          totalBytes: totalmem(),
          usedBytes: totalmem() - freemem(),
        },
        cpu: {
          name: this.getCpuName(),
          coresCount: this.getCpuCount(),
          load: this.getCpuLoad(),
        },
        timestamp: DateTime.local().toISO(),
      }

      await this.repo.write(stats)
    } catch (err: unknown) {
      const error = new ServerError(
        err,
        ErrorCode.SYSTEM_WATCHER_SAVE_STATS_ERROR
      )
      this.logger.error(
        `Error saving system stats to repository: ${error.toString()}`
      )
    }
  }

  private async clearStats(): Promise<void> {
    try {
      const now = DateTime.local()
      const before = now.minus(this.config.get('system_stats_archive_depth'))
      const records = await this.repo.clearOld(before)

      this.logger.info(`Deleted ${records} old stats records`)
    } catch (err) {
      const error = new ServerError(
        err,
        ErrorCode.SYSTEM_WATCHER_CLEANUP_STATS_ERROR
      )
      this.logger.error(`Error cleaning up old stats: ${error.toString()}`)
    }
  }

  constructor(
    @inject(DiSymbols.config) private readonly config: AppConfig,
    @inject(DiSymbols.SystemStatsRepo) private readonly repo: SystemStatsRepo,
    @inject(DiSymbols.LoggerFactory) loggerFactory: LoggerFactory,
    private readonly logger = loggerFactory.getLogger('SYSTEM-WATCHER')
  ) {
    setInterval(
      () => this.updateCpuStats(),
      config.get('cpu_load_update_interval_ms')
    )

    const rule = new RecurrenceRule()
    rule.second = SystemWatcherService.STATS_SECONDS_RECCURENCE
    this.statsJob = scheduleJob(rule, () => this.saveStats())

    this.cleanupJob = scheduleJob(
      { hour: SystemWatcherService.CLEANUP_HOUR, minute: 0 },
      () => this.clearStats()
    )
    this.cleanupJob.invoke()

    logger.info('Started system watcher service')
  }

  getCpuName(): string {
    return os.cpus()[0].model
  }

  getCpuCount(): number {
    return os.cpus().length
  }

  getCpuLoad(): number[] {
    return this.cpuIdle.map((item) => (item < 100 ? 100 - item : 0))
  }

  async getTemperature(): Promise<number> {
    try {
      const tempStr = await readFile(SystemWatcherService.TEMP_FILE_PATH, {
        encoding: 'utf-8',
      })

      return Number.parseInt(tempStr) / 1000
    } catch (err) {
      throw new ServerError(err, ErrorCode.SYSTEM_WATCHER_GET_TEMPERATURE_ERROR)
    }
  }

  release(): void {
    this.statsJob.cancel()
    this.cleanupJob.cancel()
  }
}
