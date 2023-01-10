import { FailureResponse } from '@api/common'
import { AppErrorImpl, ServerError } from '@modules/error'
import { UnauthorizedError } from '@modules/error'
import { NextFunction, Request, Response } from 'express'
import { injectable } from 'inversify'
import { BaseMiddleware } from 'inversify-express-utils'
import { ResourceId } from './resource-id'

@injectable()
export class AuthChecker extends BaseMiddleware {
  private async checkAuth(req: Request): Promise<void> {
    const principal = this.httpContext.user
    const owner = await principal.isResourceOwner(
      new ResourceId(req.path, req.method)
    )
    const authenticated = await principal.isAuthenticated()

    if (!authenticated || !owner) {
      throw new UnauthorizedError(req.path)
    }
  }

  handler(req: Request, res: Response, next: NextFunction): void {
    this.checkAuth(req)
      .then(next)
      .catch((err: unknown) => {
        const error = err instanceof AppErrorImpl ? err : new ServerError(err)
        const response: FailureResponse = {
          success: false,
          error: error.toJson(),
        }
        res.status(error.getHttpCode()).json(response)
      })
  }
}
