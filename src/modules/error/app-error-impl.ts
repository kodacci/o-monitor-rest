import { StatusCodes } from 'http-status-codes'
import { AppError } from './app-error'
import { ErrorCode } from './error-codes'
import { ApiError, ErrorDetails } from './error.interfaces'

export abstract class AppErrorImpl implements AppError {
  abstract toString(): string
  abstract getErrorDetails(): ErrorDetails

  constructor(
    protected readonly httpCode: StatusCodes,
    protected readonly code: ErrorCode
  ) {}

  getHttpCode(): StatusCodes {
    return this.httpCode
  }

  getCode(): ErrorCode {
    return this.code
  }

  getError(): Error | undefined {
    return void 0
  }

  toJson(): ApiError {
    return {
      httpCode: this.httpCode,
      details: this.getErrorDetails(),
    }
  }
}
