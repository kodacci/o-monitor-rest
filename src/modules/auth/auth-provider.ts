import { Request, Response, NextFunction } from 'express'
import { inject, injectable } from 'inversify'
import { interfaces } from 'inversify-express-utils'
import { DiSymbols } from '@application/di-symbols'
import { Principal } from './principal'
import { LoggerFactory } from '@modules/logger'
import { ServerError } from '@modules/error'
import { AuthService } from './auth.service'

@injectable()
export class AuthProvider implements interfaces.AuthProvider {
  @inject(DiSymbols.AuthService)
  private readonly authService!: AuthService
  @inject(DiSymbols.LoggerFactory)
  private readonly loggerFactory!: LoggerFactory

  async getUser(
    req: Request,
    _res: Response,
    _next: NextFunction
  ): Promise<interfaces.Principal> {
    try {
      const token = req.header('x-auth-token')
      const user = await this.authService.getUser(token, req.path)

      return new Principal(user)
    } catch (err: unknown) {
      const logger = this.loggerFactory.getLogger('REST.AUTH_PROVIDER')
      logger.error(
        `Error getting auth user: ${new ServerError(err).toString()}`
      )

      return new Principal(undefined)
    }
  }
}
