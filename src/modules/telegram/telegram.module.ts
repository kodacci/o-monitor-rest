import { DiSymbols } from '@application/di-symbols'
import { ContainerModule } from 'inversify'
import { TelegramBotService } from './telegram-bot.service'

export const telegramModule = new ContainerModule((bind) => {
  bind(DiSymbols.TelegramBotService).to(TelegramBotService).inSingletonScope()
})
