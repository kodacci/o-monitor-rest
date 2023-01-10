import { StatusCodes } from 'http-status-codes'
import { AppErrorImpl } from './app-error-impl'
import { ErrorCode } from './error-codes'
import { errorDescriptions } from './error-descriptions'
import { ErrorDetails } from './error.interfaces'

export class NotFoundError<ID = number> extends AppErrorImpl {
  private readonly error: Error

  constructor(
    private readonly entityName: string,
    private readonly entityId: ID
  ) {
    super(StatusCodes.NOT_FOUND, ErrorCode.ENTITY_NOT_FOUND)
    this.error = new Error(
      `Entity "${entityName}" with id "${JSON.stringify(
        this.entityId
      )}" does not exist`
    )
  }

  toString(): string {
    return `Entity ${this.entityName} #${JSON.stringify(
      this.entityId
    )} not found`
  }

  getErrorDetails(): ErrorDetails {
    return {
      code: this.code,
      description: errorDescriptions.get(this.code) ?? '',
      message: this.error.message,
      stack: this.error.stack,
    }
  }
}
