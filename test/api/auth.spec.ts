import 'reflect-metadata'
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import { server } from '../../src/server'
import { FailureResponse, SuccessResponse } from '@api/common'
import { AuthData, UpdateTokenData } from '@api/auth'
import { TestUtils } from '../test-utils'
import { UserPrivilege } from '@modules/auth/user.enums'
import { DateTime } from 'luxon'
import { ApiError, ErrorCode } from '@modules/error'
import jwt from 'jsonwebtoken'
import { config } from '@application/config/config'
import { AuthRepo } from '@modules/database/auth-repo'

chai.use(chaiHttp)

const user = {
  id: 0,
  login: 'auth-tester',
  name: 'Admin',
  privilege: UserPrivilege.ADMIN,
}

let refreshToken = ''

function validateUnauthorized(body: unknown): void {
  expect(body).to.be.a('object')
  expect(body).to.have.property('success').to.equal(false)
  expect(body).to.have.property('error').to.be.a('object')

  const { error } = body as FailureResponse
  expect(error).to.have.property('httpCode').to.equal(401)
  expect(error).to.have.property('details').to.be.a('object')
  expect(error.details)
    .to.have.property('code')
    .to.equal(ErrorCode.UNAUTHORIZED)
  expect(error.details)
    .to.have.property('description')
    .to.equal('Unauthorized access')
}

describe('/api/v1/auth', () => {
  beforeAll(async () => {
    await TestUtils.deleteUser(user.login)
    const userData = await TestUtils.createUser({
      ...user,
      password: 'abc12345',
    })

    user.id = userData.id
  })

  afterAll(async () => {
    await TestUtils.deleteUser(user.id)
  })

  it('should authenticate on POST on /api/v1/auth', async () => {
    const res = await chai
      .request(server)
      .post('/api/v1/auth')
      .send({ login: user.login, password: 'abc12345' })

    expect(res).to.have.status(200)
    expect(res.body).to.be.a('object')
    expect(res.body).to.have.property('success').to.equal(true)
    expect(res.body).to.have.property('result').to.be.a('object')

    const { result } = res.body as SuccessResponse<AuthData>
    expect(result.accessToken).to.be.a('string')
    expect(result.refreshToken).to.be.a('string')

    refreshToken = result.refreshToken
  })

  it('should not authenticate with non existent user', async () => {
    const res = await chai
      .request(server)
      .post('/api/v1/auth')
      .send({ login: 'unknown', password: 'abc12345' })

    expect(res).to.have.status(401)
    validateUnauthorized(res.body)
  })

  it('should return Unauthorized error on wrong password', async () => {
    const res = await chai
      .request(server)
      .post('/api/v1/auth')
      .send({ login: user.login, password: 'bad_password' })

    expect(res).to.have.status(401)
    validateUnauthorized(res.body)
  })

  it('should return Unauthorized error at any request with required auth', async () => {
    const res = await chai
      .request(server)
      .get('/api/v1/monitoring')
      .query({ from: DateTime.local().toISO() })

    expect(res).to.have.status(401)
    validateUnauthorized(res.body)
  })

  it('should return Unauthorize on request with invalid token', async () => {
    const res = await chai
      .request(server)
      .get('/api/v1/monitoring')
      .query({ from: DateTime.local().toISO() })
      .set('x-auth-token', 'invalid_token')

    expect(res).to.have.status(401)
    validateUnauthorized(res.body)
  })

  it('should return Unauthorized on request with invalid token type', async () => {
    const res = await chai
      .request(server)
      .get('/api/v1/monitoring')
      .query({ from: DateTime.local().toISO() })
      .set('x-auth-token', refreshToken)

    expect(res).to.have.status(401)
    validateUnauthorized(res.body)
  })

  it('should update token pair on POST on /api/v1/auth/token', async () => {
    const res = await chai
      .request(server)
      .post('/api/v1/auth/token')
      .send({ refreshToken })

    expect(res).to.have.status(200)
    expect(res.body).to.be.a('object')
    expect(res.body).to.have.property('success').to.equal(true)
    expect(res.body).to.have.property('result').to.be.a('object')

    const { result } = res.body as SuccessResponse<UpdateTokenData>
    expect(result).to.have.property('accessToken').to.be.a('string')
    expect(result).to.have.property('refreshToken').to.be.a('string')
  })

  it('should return Unauthorized on POST on /api/v1/auth/token with old token', async () => {
    const res = await chai
      .request(server)
      .post('/api/v1/auth/token')
      .send({ refreshToken })

    expect(res).to.have.status(401)
    validateUnauthorized(res.body)
  })

  it('should return 500 error on using invalid token payload', async () => {
    const token = jwt.sign(
      { payload: { unexpected: 'value' }, type: 'REFRESH' },
      config.get('jwt_secret'),
      { expiresIn: '10m' }
    )

    const res = await chai
      .request(server)
      .post('/api/v1/auth/token')
      .send({ refreshToken: token })

    expect(res).to.have.status(500)
    expect(res?.body).to.be.a('object')
    expect(res?.body).to.have.property('success').equals(false)
    expect(res?.body).not.to.have.property('result')
    expect(res?.body).to.have.property('error').to.be.a('object')

    const { error } = res?.body as { success: false; error: ApiError }
    expect(error.httpCode).to.equal(500)
    expect(error.details).to.be.a('object')
    expect(error.details.message).to.eq('Invalid JWT payload data')
  })

  it('should return 500 error on AuthRepo findById error', async () => {
    jest
      .spyOn(AuthRepo.prototype, 'findById')
      .mockRejectedValueOnce(new Error('Dummy error'))

    const res = await chai
      .request(server)
      .post('/api/v1/auth')
      .send({ login: 'nonExistent', password: 'abc12345' })

    expect(res).to.have.status(500)
    expect(res?.body).to.be.a('object')
    expect(res?.body).to.have.property('success').equals(false)
    expect(res?.body).not.to.have.property('result')
    expect(res?.body).to.have.property('error').to.be.a('object')

    const { error } = res?.body as { success: false; error: ApiError }
    expect(error.httpCode).to.equal(500)
    expect(error.details).to.be.a('object')
    expect(error.details.message).to.eq('Dummy error')
  })

  it('should return 400 on bad body on POST /api/auth/token', async () => {
    const res = await chai
      .request(server)
      .post('/api/v1/auth/token')
      .send({ unexpected: 'value' })

    expect(res).to.have.status(400)
    expect(res?.body).to.be.a('object')
    expect(res?.body).to.have.property('success').equals(false)
    expect(res?.body).not.to.have.property('result')
    expect(res?.body).to.have.property('error').to.be.a('object')

    const { error } = res?.body as { success: false; error: ApiError }
    expect(error.httpCode).to.equal(400)
    expect(error.details).to.be.a('object')
  })
})
