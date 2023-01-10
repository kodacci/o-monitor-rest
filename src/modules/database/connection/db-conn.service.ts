import { inject, injectable } from 'inversify'
import { Pool, PoolClient } from 'pg'
import { DiSymbols } from '@application/di-symbols'
import { AppConfig } from '@application/config/config'
import { LoggerFactory } from '@modules/logger'

@injectable()
export class DbConnService {
  constructor(
    @inject(DiSymbols.config) config: AppConfig,
    @inject(DiSymbols.LoggerFactory) loggerFactory: LoggerFactory,
    private readonly pool = new Pool(config.get('database')),
    logger = loggerFactory.getLogger('DB')
  ) {
    this.pool.on('error', (err) => {
      logger.error(`SQL driver error: ${err.message}`)
    })
  }

  getConn(): Promise<PoolClient> {
    return this.pool.connect()
  }

  release(): Promise<void> {
    return this.pool.end()
  }
}
