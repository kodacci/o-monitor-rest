import { StatusCodes } from 'http-status-codes'
import { inject } from 'inversify'
import {
  controller,
  httpDelete,
  httpGet,
  httpPatch,
  httpPost,
  requestBody,
  requestParam,
} from 'inversify-express-utils'
import { JsonResult } from 'inversify-express-utils/lib/results'
import { DiSymbols } from '@application/di-symbols'
import { OmitId, UserEntity } from '@modules/database'
import { AppHttpController } from '@api/common'
import { UsersService } from './users.service'
import { LoggerFactory } from '@modules/logger'

@controller('/api/v1/users')
export class UsersController extends AppHttpController {
  constructor(
    @inject(DiSymbols.UsersService) private readonly service: UsersService,
    @inject(DiSymbols.LoggerFactory) loggerFactory: LoggerFactory
  ) {
    super(loggerFactory.getLogger('REST.USERS'))
  }

  @httpGet('/', DiSymbols.AuthChecker)
  private getUsers(): Promise<JsonResult> {
    return this.toResult(this.service.findAll())
  }

  @httpGet('/count', DiSymbols.AuthChecker)
  private getUsersCount(): Promise<JsonResult> {
    return this.toResult(this.service.count())
  }

  @httpGet('/:id', DiSymbols.AuthChecker, DiSymbols.GetUserValidator)
  private getUser(@requestParam('id') id: string): Promise<JsonResult> {
    return this.toResult(this.service.findById(Number(id)))
  }

  @httpPost('/', DiSymbols.AuthChecker, DiSymbols.AddUserValidator)
  private addUser(
    @requestBody() user: OmitId<UserEntity>
  ): Promise<JsonResult> {
    return this.toResult(this.service.createNew(user), StatusCodes.CREATED)
  }

  @httpPatch(
    '/:id',
    DiSymbols.AuthChecker,
    DiSymbols.GetUserValidator,
    DiSymbols.PatchUserValidator
  )
  private updateUser(
    @requestParam('id') id: string,
    @requestBody() userData: Partial<UserEntity>
  ): Promise<JsonResult> {
    return this.toResult(this.service.update(Number(id), userData))
  }

  @httpDelete('/:id', DiSymbols.AuthChecker, DiSymbols.GetUserValidator)
  private deleteUser(@requestParam('id') id: string): Promise<JsonResult> {
    return this.toResult(this.service.delete(Number(id)))
  }
}
