import { inject, injectable } from 'inversify'
import Joi, { ObjectSchema } from 'joi'
import { DiSymbols } from '@application/di-symbols'
import { ApiValidator } from '@api/common/api-validator'
import { SwaggerService } from '@api/swagger'
import j2s from 'joi-to-swagger'
import { monitoringResponseSchema } from './monitoring.schemas'
import { defaultErrors } from '@api/common'

@injectable()
export class GetMonitoringValidator extends ApiValidator {
  private readonly querySchema = Joi.object({
    from: Joi.string().isoDate().required(),
    to: Joi.string().isoDate(),
  })

  constructor(@inject(DiSymbols.SwaggerService) swagger: SwaggerService) {
    super()

    swagger.appendPath('/api/v1/monitoring', {
      get: {
        tags: ['monitoring'],
        summary: 'Get system statistics',
        parameters: [
          {
            name: 'from',
            in: 'query',
            description: 'Date to get stats from in ISO format',
            required: true,
            schema: j2s(Joi.string().isoDate()).swagger,
          },
          {
            name: 'to',
            in: 'query',
            description: 'Date to get stats to in ISO format',
            required: false,
            schema: j2s(Joi.string().isoDate()).swagger,
          },
        ],
        responses: {
          '200': {
            description:
              'Successfully got system stats for specified time interval',
            content: {
              'application/json': {
                schema: monitoringResponseSchema,
              },
            },
          },
          ...defaultErrors,
        },
      },
    })
  }

  protected getQuerySchema(): ObjectSchema | undefined {
    return this.querySchema
  }
}
