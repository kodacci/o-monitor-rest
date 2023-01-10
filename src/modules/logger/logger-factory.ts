import { injectable } from 'inversify'
import { createLogger, format, Logger, transports } from 'winston'

@injectable()
export class LoggerFactory {
  private static readonly rootLabel = 'O-MONITOR'
  private static readonly rootLogger = createLogger({
    level: 'debug',
    defaultMeta: {},
    format: format.combine(
      format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss.SSS' }),
      format.label({ label: LoggerFactory.rootLabel }),
      format.colorize(),
      format.printf(
        ({ timestamp, level, label, message, module }) =>
          `[${timestamp as string}] ${label as string}${
            module ? `.${module as string}` : ''
          } ${level} ${message as string}`
      )
    ),
    transports: [new transports.Console()],
  })

  getLogger(name?: string): Logger {
    if (!name) {
      return LoggerFactory.rootLogger
    }

    return LoggerFactory.rootLogger.child({
      module: name.toUpperCase(),
    })
  }
}
