import bodyParser from 'body-parser'
import { DiSymbols } from '@application/di-symbols'
import { config } from '@application/config/config'
import morgan from 'morgan'
import { Container } from 'inversify'
import { InversifyExpressServer } from 'inversify-express-utils'
import { LoggerFactory } from '@modules/logger'
import {
  systemWatcherModule,
  SystemWatcherService,
} from '@modules/system-watcher'
import { databaseModule, UserRepo } from '@modules/database'
import { apiModule } from '@api/api.module'
import { AppErrorImpl, ServerError } from '@modules/error'
import { Request, Response } from 'express'
import { ApiResponse } from '@api/common'
import { SwaggerService } from '@api/swagger'
import swaggerUi from 'swagger-ui-express'
import { AuthProvider } from '@modules/auth'
import { authModule } from '@modules/auth/auth.module'
import { TelegramBotService, telegramModule } from '@modules/telegram'
import { Logger } from 'winston'

export class Application {
  private readonly container = new Container()

  private setup(): void {
    this.container.bind(DiSymbols.config).toConstantValue(config)
    this.container
      .bind(DiSymbols.LoggerFactory)
      .to(LoggerFactory)
      .inSingletonScope()

    this.container.load(apiModule)
    this.container.load(systemWatcherModule)
    this.container.load(databaseModule)
    this.container.load(authModule)
    this.container.load(telegramModule)
  }

  private setupUserRepo(logger: Logger): void {
    const userRepo = this.container.get<UserRepo>(DiSymbols.UserRepo)
    userRepo
      .createDefaultUser()
      .then((created) =>
        created ? logger.info(`Created default user`) : void 0
      )
      .catch((err: unknown) => {
        logger.error(
          `Error creating default user: ${
            err instanceof Error ? err.message : JSON.stringify(err)
          }`
        )
      })
  }

  start(): Express.Application {
    this.setup()

    this.container.get<SystemWatcherService>(DiSymbols.SystemWatcherService)

    const logger = this.container
      .get<LoggerFactory>(DiSymbols.LoggerFactory)
      .getLogger()

    logger.info(`Loaded configuration: ${config.toString()}`)

    this.setupUserRepo(logger)

    const swaggerService = this.container.get<SwaggerService>(
      DiSymbols.SwaggerService
    )

    const botService = this.container.get<TelegramBotService>(
      DiSymbols.TelegramBotService
    )
    botService.start()

    const port = config.get('port')
    const server = new InversifyExpressServer(
      this.container,
      null,
      null,
      null,
      AuthProvider
    )
    const application = server
      .setConfig((app) => {
        app.use(bodyParser.json())
        app.use(morgan('dev'))

        // Configure swagger schema URL
        app.get('/api-docs/swagger.json', (_req: Request, res: Response) =>
          res.json(swaggerService.getSchema())
        )
      })
      .setErrorConfig((app) => {
        app.use(
          (err: unknown, _req: unknown, res: Response, _next: unknown) => {
            const error =
              err instanceof AppErrorImpl ? err : new ServerError(err)
            logger.error(`Api error: ${error.toString()}`)
            const response: ApiResponse<undefined> = {
              success: false,
              error: error.toJson(),
            }
            res.status(error.getHttpCode()).json(response)
          }
        )
      })
      .build()
      .use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerService.getSchema())
      )
      .listen(port, () => logger.info(`Started http server on port ${port}`))

    return application
  }
}
