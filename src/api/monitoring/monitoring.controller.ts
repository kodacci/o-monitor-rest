import { LoggerFactory } from '@modules/logger'
import { inject } from 'inversify'
import { controller, httpGet, queryParam } from 'inversify-express-utils'
import { JsonResult } from 'inversify-express-utils/lib/results'
import { DiSymbols } from '@application/di-symbols'
import { AppHttpController } from '@api/common'
import { MonitoringService } from './monitoring.service'

@controller('/api/v1/monitoring')
export class MonitoringController extends AppHttpController {
  constructor(
    @inject(DiSymbols.MonitoringService)
    private readonly service: MonitoringService,
    @inject(DiSymbols.LoggerFactory) loggerFactory: LoggerFactory
  ) {
    super(loggerFactory.getLogger('REST.MONITORING'))
  }

  @httpGet('/', DiSymbols.AuthChecker, DiSymbols.GetMonitoringValidator)
  private async getStats(
    @queryParam('from') from: string,
    @queryParam('to') to?: string
  ): Promise<JsonResult> {
    return this.toResult(this.service.getSystemStats(from, to))
  }
}
