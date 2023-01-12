import convict from 'convict'
import { Duration } from 'luxon'
import path from 'node:path'
import { isoDuration } from './validators'
import validators from 'convict-format-with-validator'

convict.addFormat({
  name: 'ISO Duration',
  validate: isoDuration,
  coerce: (val: unknown): Duration => {
    return Duration.fromISO(String(val))
  },
})

convict.addFormats(validators)

export const config = convict({
  port: {
    doc: 'Port of HTTP server',
    format: 'port',
    arg: 'port',
    env: 'MONITOR_PORT',
    default: 4000,
  },
  cpu_load_update_interval_ms: {
    doc: 'CPU load recalculation interval in milliseconds',
    format: 'nat',
    default: 1000,
  },
  system_stats_archive_depth: {
    doc: 'Stats history length in ISO8601 duration format',
    format: 'ISO Duration',
    default: Duration.fromISO('P30D'),
    env: 'SYSTEM_STATS_ARCHIVE_DEPTH',
  },
  jwt_secret: {
    doc: 'JWT sign secret',
    format: String,
    default: 'top secret',
    env: 'JWT_SECRET',
  },
  database: {
    host: {
      doc: 'Database host address',
      format: String,
      env: 'DATABASE_HOST',
      default: 'localhost',
    },
    port: {
      doc: 'Database port',
      format: 'port',
      env: 'DATABASE_PORT',
      default: 5432,
    },
    database: {
      doc: 'Database name',
      format: String,
      env: 'DATABASE_NAME',
      default: 'ra-tech',
    },
    user: {
      doc: 'Database user name',
      format: String,
      default: 'o-monitor',
    },
    password: {
      doc: 'Database password',
      format: String,
      default: 'o-monitor',
    },
    schema: {
      doc: 'Main database schema name',
      format: String,
      env: 'SCHEMA',
      default: 'o-monitor',
    },
  },
  default_user: {
    login: {
      doc: 'Default user login',
      format: String,
      env: 'DEFAULT_USER_LOGIN',
      default: 'admin',
    },
    password: {
      doc: 'Default user password',
      format: String,
      env: 'DEFAULT_USER_PASSWORD',
      default: 'abc12345',
    },
  },
  telegram_bot: {
    api_base_url: {
      doc: 'Telegram bot API base url',
      format: 'url',
      env: 'TELEGRAM_BOT_API_BASE_URL',
      default: 'https://api.telegram.org/',
    },
    token: {
      doc: 'Telegram bot token',
      format: String,
      env: 'TELEGRAM_BOT_TOKEN',
      default: '',
    },
  },
})
  .loadFile(
    path.join(process.cwd(), `./config/${process.env.NODE_ENV ?? ''}.json`)
  )
  .validate({ allowed: 'strict' })

export type AppConfig = typeof config
