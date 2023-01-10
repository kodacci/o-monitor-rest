import {
  defaultErrors,
  genApiResponseContent,
  notFound,
  userDataSchema,
} from '@api/common'
import { ApiValidator } from '@api/common/api-validator'
import { SwaggerService } from '@api/swagger'
import { DiSymbols } from '@application/di-symbols'
import { inject, injectable } from 'inversify'
import Joi, { ObjectSchema } from 'joi'
import j2s from 'joi-to-swagger'

@injectable()
export class AuthenticateValidator extends ApiValidator {
  protected getBodySchema(): ObjectSchema | undefined {
    return Joi.object().keys({
      login: Joi.string().required(),
      password: Joi.string().required(),
    })
  }

  constructor(@inject(DiSymbols.SwaggerService) swagger: SwaggerService) {
    super()

    const tags = ['authorization']
    swagger.appendPath('/api/v1/auth', {
      post: {
        tags,
        summary: 'Authenticate user',
        responses: {
          '200': {
            description: 'User authenticated',
            content: genApiResponseContent(
              j2s(
                Joi.object().keys({
                  user: userDataSchema,
                  accessToken: Joi.string().required(),
                  refreshToken: Joi.string().required(),
                })
              ).swagger
            ),
          },
          ...defaultErrors,
          ...notFound,
        },
      },
    })
  }
}

@injectable()
export class UpdateTokenValidator extends ApiValidator {
  protected getBodySchema(): ObjectSchema | undefined {
    return Joi.object().keys({
      refreshToken: Joi.string().required(),
    })
  }

  constructor(@inject(DiSymbols.SwaggerService) swagger: SwaggerService) {
    super()

    const tags = ['authorization']
    swagger.appendPath('/api/v1/auth/token', {
      post: {
        tags,
        summary: 'Update tokens pair',
        responses: {
          '200': {
            description: 'Received new token pair',
            content: genApiResponseContent(
              j2s(
                Joi.object().keys({
                  accessToken: Joi.string().required(),
                  refreshToken: Joi.string().required(),
                })
              ).swagger
            ),
            ...defaultErrors,
          },
        },
      },
    })
  }
}
