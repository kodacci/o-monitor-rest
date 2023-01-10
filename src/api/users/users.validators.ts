import { inject, injectable } from 'inversify'
import Joi, { ObjectSchema, StringSchema } from 'joi'
import j2s from 'joi-to-swagger'
import { DiSymbols } from '@application/di-symbols'
import {
  defaultErrors,
  notFound,
  patchSchema,
  userDataSchema,
  userSchema,
} from '@api/common'
import { ApiValidator } from '@api/common/api-validator'
import { genApiResponseContent } from '@api/common'
import { SwaggerService } from '@api/swagger'

@injectable()
export class GetUserValidator extends ApiValidator {
  protected getIdParamSchema(): StringSchema | undefined {
    return Joi.string().min(1).regex(/^\d+$/).required()
  }
}

@injectable()
export class AddUserValidator extends ApiValidator {
  protected getBodySchema(): ObjectSchema | undefined {
    return userSchema
  }

  constructor(@inject(DiSymbols.SwaggerService) swagger: SwaggerService) {
    super()

    const tags = ['users, authorization']

    swagger.appendPath('/api/v1/users', {
      // GET
      get: {
        tags,
        summary: 'Get all users',
        responses: {
          '200': {
            description: 'Successfully got users list',
            content: genApiResponseContent(
              j2s(Joi.array().items(userDataSchema)).swagger
            ),
          },
        },
      },

      // POST
      post: {
        tags,
        summary: 'Add new user',
        requestBody: {
          description: 'User data',
          content: {
            'application/json': {
              schema: j2s(userSchema).swagger,
            },
          },
          required: true,
        },
        responses: {
          '201': {
            description: 'Successfully added new user',
            content: genApiResponseContent(j2s(userDataSchema).swagger),
          },
          ...defaultErrors,
        },
      },
    })

    swagger.appendPath('/api/v1/users/{id}', {
      // GET
      get: {
        tags,
        summary: 'Get user by id',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'User id',
            required: true,
            schema: j2s(Joi.number().positive()).swagger,
          },
        ],
        responses: {
          '200': {
            description: 'Successfully received new user',
            content: genApiResponseContent(j2s(userSchema).swagger),
          },
          ...notFound,
          ...defaultErrors,
        },
      },

      // PATCH
      patch: {
        tags,
        summary: 'Update user data',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'User id',
            required: true,
            schema: j2s(Joi.number().positive()).swagger,
          },
        ],
        requestBody: {
          description: 'User data',
          content: {
            'application/json': {
              schema: j2s(patchSchema).swagger,
            },
          },
        },
        responses: {
          '200': {
            description: 'Successfully updated user data',
            content: genApiResponseContent(j2s(userSchema).swagger),
          },
          ...notFound,
          ...defaultErrors,
        },
      },

      // DELETE
      delete: {
        tags,
        summary: 'Delete specified user',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'User id',
            required: true,
            schema: j2s(Joi.number().positive()).swagger,
          },
        ],
        responses: {
          '200': {
            description: 'Successfully deleted user',
            content: genApiResponseContent(
              j2s(
                Joi.object().keys({ count: Joi.number().positive().required() })
              ).swagger
            ),
          },
        },
      },
    })
  }
}

@injectable()
export class PatchUserValidator extends ApiValidator {
  protected getBodySchema(): ObjectSchema | undefined {
    return patchSchema
  }
}
