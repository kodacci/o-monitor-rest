import { ErrorCode } from './error-codes'
import { ValidationErrorItem } from 'joi'

export interface ErrorDetails {
  code: ErrorCode
  description: string
  message?: string
  validationErrors?: ValidationErrorItem[]
  stack?: string
  parent?: ErrorDetails
}

export interface ApiError {
  httpCode: number
  details: ErrorDetails
}
