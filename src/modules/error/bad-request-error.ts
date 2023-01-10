import { ErrorCode } from './error-codes'
import { ValidationError } from 'joi'
import { ErrorDetails } from './error.interfaces'
import { StatusCodes } from 'http-status-codes'
import { errorDescriptions } from './error-descriptions'
import { AppErrorImpl } from './app-error-impl'

export class BadRequestError extends AppErrorImpl {
  constructor(private readonly error: ValidationError) {
    super(StatusCodes.BAD_REQUEST, ErrorCode.BAD_REQUEST_PARAMETERS)
  }

  toString(): string {
    return `Code ${this.code}: ${this.error.details
      .map((item) => item.message)
      .join('; ')}`
  }

  getErrorDetails(): ErrorDetails {
    return {
      code: this.code,
      description: errorDescriptions.get(this.code) ?? '',
      message: this.error.message,
      stack: this.error.stack,
      validationErrors: this.error.details,
    }
  }
}
