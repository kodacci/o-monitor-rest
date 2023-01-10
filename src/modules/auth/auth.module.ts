import { DiSymbols } from '@application/di-symbols'
import { ContainerModule } from 'inversify'
import { AuthChecker } from './auth-checker'
import { AuthService } from './auth.service'

export const authModule = new ContainerModule((bind) => {
  bind(DiSymbols.AuthChecker).to(AuthChecker)
  bind<AuthService>(DiSymbols.AuthService).to(AuthService)
})
