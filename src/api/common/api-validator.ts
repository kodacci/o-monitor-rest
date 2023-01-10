import { BaseMiddleware } from 'inversify-express-utils'
import { Request, Response, NextFunction } from 'express'
import { AnySchema, ObjectSchema, StringSchema } from 'joi'
import { ApiResponse } from '@api/common'
import { BadRequestError } from '@modules/error'

export abstract class ApiValidator extends BaseMiddleware {
  protected getIdParamSchema(): StringSchema | undefined {
    return undefined
  }

  protected getQuerySchema(): ObjectSchema | undefined {
    return undefined
  }
  protected getBodySchema(): ObjectSchema | undefined {
    return undefined
  }

  private validate<T>(
    schema: AnySchema | undefined,
    data: T,
    res: Response
  ): boolean {
    if (!schema) {
      return true
    }

    const { error } = schema.validate(data)
    if (error) {
      const apiError = new BadRequestError(error)
      const data: ApiResponse<undefined> = {
        success: false,
        error: apiError.toJson(),
      }
      res.status(apiError.getHttpCode()).json(data)
      return false
    }

    return true
  }

  handler(req: Request, res: Response, next: NextFunction): void {
    if (!this.validate(this.getIdParamSchema(), req.params.id, res)) {
      return
    }

    if (!this.validate(this.getQuerySchema(), req.query, res)) {
      return
    }

    if (!this.validate(this.getBodySchema(), req.body, res)) {
      return
    }

    next()
  }
}
