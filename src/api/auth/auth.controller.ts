import { LoggerFactory } from '@modules/logger'
import { inject } from 'inversify'
import {
  controller,
  httpPost,
  requestBody,
  request,
} from 'inversify-express-utils'
import { DiSymbols } from '@application/di-symbols'
import { AppHttpController } from '@api/common'
import { AuthService } from '../../modules/auth/auth.service'
import { JsonResult } from 'inversify-express-utils/lib/results'
import { AuthRequest, UpdateTokenRequest } from './auth.interfaces'
import { Request } from 'express'

@controller('/api/v1/auth')
export class AuthController extends AppHttpController {
  constructor(
    @inject(DiSymbols.AuthService) private readonly service: AuthService,
    @inject(DiSymbols.LoggerFactory) loggerFactory: LoggerFactory
  ) {
    super(loggerFactory.getLogger('REST.AUTH'))
  }

  @httpPost('/', DiSymbols.AuthenticateValidator)
  private authenticate(
    @request() req: Request,
    @requestBody() auth: AuthRequest
  ): Promise<JsonResult> {
    return this.toResult(this.service.authenticate(auth, req.path))
  }

  @httpPost('/token', DiSymbols.UpdateTokenValidator)
  private updateToken(
    @request() req: Request,
    @requestBody() body: UpdateTokenRequest
  ): Promise<JsonResult> {
    return this.toResult(this.service.updateToken(req.path, body))
  }
}
