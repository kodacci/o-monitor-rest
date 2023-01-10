import { ContainerModule } from 'inversify'
import { DiSymbols } from '@application/di-symbols'
import { UpdateTokenValidator } from '@api/auth'
import { MonitoringService } from '@api/monitoring'
import { GetMonitoringValidator } from '@api/monitoring'
import { SwaggerService } from '@api/swagger'
import { PatchUserValidator, UsersService } from '@api/users'
import { AddUserValidator, GetUserValidator } from '@api/users'
import { AuthenticateValidator } from '@api/auth'

export const apiModule = new ContainerModule((bind) => {
  bind<MonitoringService>(DiSymbols.MonitoringService).to(MonitoringService)

  bind<SwaggerService>(DiSymbols.SwaggerService)
    .to(SwaggerService)
    .inSingletonScope()

  bind<GetMonitoringValidator>(DiSymbols.GetMonitoringValidator)
    .to(GetMonitoringValidator)
    .inSingletonScope()

  bind<AuthenticateValidator>(DiSymbols.AuthenticateValidator)
    .to(AuthenticateValidator)
    .inSingletonScope()
  bind<UpdateTokenValidator>(DiSymbols.UpdateTokenValidator)
    .to(UpdateTokenValidator)
    .inSingletonScope()

  bind<UsersService>(DiSymbols.UsersService).to(UsersService)
  bind<AddUserValidator>(DiSymbols.AddUserValidator)
    .to(AddUserValidator)
    .inSingletonScope()
  bind<GetUserValidator>(DiSymbols.GetUserValidator)
    .to(GetUserValidator)
    .inSingletonScope()
  bind<PatchUserValidator>(DiSymbols.PatchUserValidator)
    .to(PatchUserValidator)
    .inRequestScope()
})
