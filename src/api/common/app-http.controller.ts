import { BaseHttpController } from 'inversify-express-utils'
import { JsonResult } from 'inversify-express-utils/lib/results'
import { ApiResponse, FailureResponse } from '@api/common'
import { AppErrorImpl, ServerError } from '@modules/error'
import { StatusCodes } from 'http-status-codes'
import { Logger } from 'winston'

export class AppHttpController extends BaseHttpController {
  constructor(protected readonly logger: Logger) {
    super()
  }

  protected async toResult<T>(
    promise: Promise<T>,
    statusCode = StatusCodes.OK
  ): Promise<JsonResult> {
    return promise
      .then((result: T) => {
        const res: ApiResponse<T> = { success: true, result }
        return this.json(res, statusCode)
      })
      .catch((err: unknown) => this.toErrorResult(err))
  }

  protected toErrorResult(err: unknown): JsonResult {
    const error = err instanceof AppErrorImpl ? err : new ServerError(err)
    const response: FailureResponse = {
      success: false,
      error: error.toJson(),
    }
    this.logger.error(`API error: ${error.toString()}`)

    return this.json(response, response.error?.httpCode)
  }
}
