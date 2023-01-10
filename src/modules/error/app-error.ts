import { ErrorCode } from './error-codes'
import { ApiError, ErrorDetails } from './error.interfaces'

export interface AppError {
  getHttpCode: () => number
  getCode: () => ErrorCode
  getError: () => Error | undefined
  toString: () => string
  getErrorDetails: () => ErrorDetails
  toJson: () => ApiError
}
