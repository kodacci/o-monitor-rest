import { expect } from 'chai'
import { StatusCodes } from 'http-status-codes'
import Joi, { ValidationError } from 'joi'
import {
  BadRequestError,
  ErrorCode,
  errorDescriptions,
  ServerError,
} from '../src/modules/error'

describe('ServerError', () => {
  it('should return HTTP status code, ErrorCode, Error and string value', () => {
    const dummy = new Error('Dummy error')
    const code = ErrorCode.SYSTEM_STATS_REPOSITORY_READ_ERROR
    const error = new ServerError(dummy, code)

    expect(error.getHttpCode()).to.equal(StatusCodes.INTERNAL_SERVER_ERROR)
    expect(error.getCode()).to.equal(code)
    expect(error.getError()).to.equal(dummy)
    expect(error.toString()).to.equal(`Code ${code}: ${dummy.message}`)
  })

  it('should handle parent error', () => {
    const parentErr = new Error('Parent` error')
    const parent = new ServerError(parentErr)
    const child = new ServerError(parent)

    expect(child.getError()).to.equal(parentErr)
  })

  it('should handle unknown error', () => {
    const error = new ServerError('test')
    expect(error.getError()?.message).to.equal('Unknown error: "test"')
  })

  it('should convert server error to API error', () => {
    const dummy = new Error('Dummy error')
    const error = ServerError.toApiError(dummy)
    expect(error).to.be.a('object')
    expect(error)
      .to.have.property('httpCode')
      .to.equal(StatusCodes.INTERNAL_SERVER_ERROR)
    expect(error).to.have.property('details').to.be.a('object')
    expect(error.details)
      .to.have.property('code')
      .to.equal(ErrorCode.UNKNOWN_ERROR)
    expect(error.details).to.have.property('description').to.be.a('string')
    expect(error.details).to.have.property('message').to.equal(dummy.message)
    expect(error.details).to.have.property('stack').to.be.a('string')
  })
})

describe('BadRequestError', () => {
  it('should return string representation of error', () => {
    const res = Joi.number().integer().min(0).validate(-1)
    expect(res.error).not.to.be.undefined
    const validationError = res.error as ValidationError

    const error = new BadRequestError(validationError)
    expect(error.toString()).to.equal(
      `Code ${ErrorCode.BAD_REQUEST_PARAMETERS}: ${validationError.details
        .map((item) => item.message)
        .join('; ')}`
    )
    expect(error.getError()).to.be.undefined

    jest.spyOn(errorDescriptions, 'get').mockReturnValueOnce(undefined)
    expect(error.getErrorDetails().description).to.equal('')
    jest.clearAllMocks()
  })
})
