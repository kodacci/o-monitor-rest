import { Id } from '@modules/database'
import { ApiError } from '@modules/error'

export interface SuccessResponse<T = unknown> {
  success: true
  result: T
}

export interface FailureResponse {
  success: false
  error: ApiError
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | FailureResponse

export interface EntityApiData<ID extends Id = number> {
  id: ID
  deleted: boolean
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
}

export interface DeleteResponse {
  count: number
}

export interface CountResponse {
  count: number
}
