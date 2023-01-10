import { inject, injectable } from 'inversify'
import { DiSymbols } from '@application/di-symbols'
import { DbConnService } from '../connection'
import { Tables } from '../tables'
import { SystemStats } from './system-stats-repo.interfaces'
import { DateTime } from 'luxon'
import { ServerError, ErrorCode } from '@modules/error'

interface StatsRecord {
  timestamp: string
  temperature: number
  freeBytes: string
  usedBytes: string
  totalBytes: string
  cpuLoad: number[]
}

type StatsPropertyType = string | number | number[] | Date

@injectable()
export class SystemStatsRepo {
  private static readonly PROPS: (keyof StatsRecord)[] = [
    'timestamp',
    'temperature',
    'freeBytes',
    'usedBytes',
    'totalBytes',
    'cpuLoad',
  ]

  private static readonly PROPS_STR = SystemStatsRepo.PROPS.map(
    (prop) => `"${prop}"`
  ).join(',')

  private static readonly READ_LIMIT = 5000

  constructor(
    @inject(DiSymbols.DbConnService)
    private readonly db: DbConnService
  ) {}

  private statsToValues(stats: SystemStats): StatsPropertyType[] {
    return [
      DateTime.fromISO(stats.timestamp).toJSDate(),
      stats.temperature,
      stats.memory.freeBytes,
      stats.memory.usedBytes,
      stats.memory.totalBytes,
      stats.cpu.load,
    ]
  }

  async write(stats: SystemStats): Promise<void> {
    try {
      const client = await this.db.getConn()
      const values = this.statsToValues(stats)
      const valuesSubs = values.map((_item, idx) => `$${idx + 1}`).join(',')

      await client.query(
        `INSERT INTO "${Tables.MONITORING}" (${SystemStatsRepo.PROPS_STR}) VALUES (${valuesSubs})`,
        values
      )
      client.release()
    } catch (err: unknown) {
      throw new ServerError(err, ErrorCode.SYSTEM_STATS_REPOSITORY_WRITE_ERROR)
    }
  }

  private statsFromRecord(record: StatsRecord): SystemStats {
    return {
      timestamp: record.timestamp,
      temperature: record.temperature,
      memory: {
        freeBytes: Number.parseInt(record.freeBytes, 10),
        usedBytes: Number.parseInt(record.usedBytes, 10),
        totalBytes: Number.parseInt(record.totalBytes, 10),
      },
      cpu: {
        load: record.cpuLoad,
        name: '',
        coresCount: record.cpuLoad.length,
      },
    }
  }

  async read(from: DateTime, to: DateTime): Promise<SystemStats[]> {
    try {
      const client = await this.db.getConn()
      const res = await client.query(
        `SELECT ${SystemStatsRepo.PROPS_STR} FROM ${
          Tables.MONITORING
        } WHERE timestamp BETWEEN '${from.toISO()}'::timestamptz AND '${to.toISO()}'::timestamptz LIMIT ${
          SystemStatsRepo.READ_LIMIT
        }`
      )
      client.release()

      return res.rows.map((row: StatsRecord) => this.statsFromRecord(row))
    } catch (err: unknown) {
      throw new ServerError(err, ErrorCode.SYSTEM_STATS_REPOSITORY_READ_ERROR)
    }
  }

  async clearOld(before: DateTime): Promise<number> {
    try {
      const client = await this.db.getConn()
      const res = await client.query(
        `DELETE FROM ${
          Tables.MONITORING
        } WHERE timestamp < '${before.toISO()}'::timestamptz`
      )
      client.release()

      return res.rowCount
    } catch (err: unknown) {
      throw new ServerError(
        err,
        ErrorCode.SYSTEM_STATS_REPOSITORY_CLEANUP_ERROR
      )
    }
  }
}
