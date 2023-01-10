import { ContainerModule } from 'inversify'
import { DiSymbols } from '@application/di-symbols'
import { SystemWatcherService } from './system-watcher.service'

export const systemWatcherModule = new ContainerModule((bind) => {
  bind(DiSymbols.SystemWatcherService)
    .to(SystemWatcherService)
    .inSingletonScope()
})
