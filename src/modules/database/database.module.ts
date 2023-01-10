import { ContainerModule } from 'inversify'
import { DiSymbols } from '@application/di-symbols'
import { DbConnService } from './connection'
import { SystemStatsRepo } from './system-stats-repo'
import { UserRepo } from './user-repo'

export const databaseModule = new ContainerModule((bind) => {
  bind(DiSymbols.DbConnService).to(DbConnService).inSingletonScope()
  bind(DiSymbols.SystemStatsRepo).to(SystemStatsRepo)
  bind(DiSymbols.UserRepo).to(UserRepo)
})
