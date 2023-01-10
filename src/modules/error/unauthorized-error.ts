import { StatusCodes } from 'http-status-codes'
import { AppErrorImpl } from './app-error-impl'
import { ErrorCode } from './error-codes'
import { errorDescriptions } from './error-descriptions'
import { ErrorDetails } from './error.interfaces'

export class UnauthorizedError extends AppErrorImpl {
  constructor(private readonly path: string) {
    super(StatusCodes.UNAUTHORIZED, ErrorCode.UNAUTHORIZED)
  }

  toString(): string {
    return `Unauthorized access to ${this.path}`
  }

  getErrorDetails(): ErrorDetails {
    return {
      code: this.code,
      description: errorDescriptions.get(this.code) ?? '',
    }
  }
}
