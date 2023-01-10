import { ErrorCode } from './error-codes'
import { errorDescriptions } from './error-descriptions'
import { ApiError, ErrorDetails } from './error.interfaces'
import { StatusCodes } from 'http-status-codes'
import { AppErrorImpl } from './app-error-impl'

export class ServerError extends AppErrorImpl {
  private readonly error?: Error
  private readonly parent?: ServerError

  static toApiError(
    err: unknown,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR
  ): ApiError {
    return new ServerError(err, code).toJson()
  }

  constructor(error: unknown, code: ErrorCode = ErrorCode.UNKNOWN_ERROR) {
    super(StatusCodes.INTERNAL_SERVER_ERROR, code)

    if (error instanceof Error) {
      this.error = error
    } else if (error instanceof ServerError) {
      this.parent = error
    } else {
      this.error = new Error(`Unknown error: ${JSON.stringify(error)}`)
    }
  }

  private findError(): Error | undefined {
    let error = this.error
    let parent = this.parent
    while (parent && !error) {
      error = parent?.error
      parent = parent?.parent
    }

    return error
  }

  toString(): string {
    return `Code ${this.code}: ${this.findError()?.message ?? ''}`
  }

  getError(): Error | undefined {
    return this.findError()
  }

  getErrorDetails(): ErrorDetails {
    return {
      code: this.code,
      description: errorDescriptions.get(this.code) ?? '',
      message: this.error?.message,
      stack: this.error?.stack,
      parent: this.parent?.getErrorDetails(),
    }
  }
}
