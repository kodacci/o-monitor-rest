import { AppConfig } from '@application/config'
import { DiSymbols } from '@application/di-symbols'
import { LoggerFactory } from '@modules/logger'
import { inject, injectable } from 'inversify'
import { URL } from 'node:url'
import axios, { AxiosError, AxiosInstance } from 'axios'
import { ServerError } from '@modules/error'
import {
  BotUpdate,
  GetUpdatesApiResponse,
  SendMessageApiRequest,
} from './telegram.interfaces'
import { SystemWatcherService } from '@modules/system-watcher'

@injectable()
export class TelegramBotService {
  private readonly request: AxiosInstance
  private polling = false
  private lastUpdateId = -1

  constructor(
    @inject(DiSymbols.config) config: AppConfig,
    @inject(DiSymbols.LoggerFactory) loggerFactory: LoggerFactory,
    @inject(DiSymbols.SystemWatcherService)
    private readonly watcher: SystemWatcherService,
    private readonly logger = loggerFactory.getLogger('TELEGRAM')
  ) {
    const { token, api_base_url } = config.get('telegram_bot')
    const url = new URL(encodeURI(`/bot${String(token)}`), api_base_url)
    this.request = axios.create({
      baseURL: url.toString(),
      timeout: 5000,
    })
  }

  start(): void {
    this.polling = true
    this.poll().catch((err: unknown) => void err)
  }

  stop(): void {
    this.polling = false
  }

  private delay(timeoutMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeoutMs))
  }

  private async handleUpdate(update: BotUpdate): Promise<void> {
    if (update.update_id <= this.lastUpdateId) {
      return
    }
    this.lastUpdateId = update.update_id

    if (!update.message) {
      return
    }

    const cpu = `Cpu load: ${this.watcher
      .getCpuLoad()
      .map((load) => Math.round(load))
      .join('%, ')}%`
    const memory = `memory usage: ${Math.round(this.watcher.getMemoryLoad())}%`
    const temperature = `temperature: ${await this.watcher.getTemperature()} C`

    const body: SendMessageApiRequest = {
      chat_id: update.message.chat.id,
      text: `${cpu}, ${memory}, ${temperature}`,
    }

    await this.request.post('/sendMessage', body)
  }

  private async poll(): Promise<void> {
    while (this.polling) {
      try {
        const res = await this.request.get<GetUpdatesApiResponse>('/getUpdates')
        const updates = res.data.result
        if (updates && updates.length) {
          await this.handleUpdate(updates[updates.length - 1])
          await this.delay(3000)
        }
      } catch (err: unknown) {
        this.logger.error(
          `Error handling bot updates: ${this.handleAxiosError(err)}`
        )
        await this.delay(3000)
      }
    }
  }

  private handleAxiosError(err: unknown): string {
    if (err instanceof AxiosError) {
      return `${err.status ?? 'Unknown'}: ${err.message}`
    }

    return new ServerError(err).toString()
  }
}
