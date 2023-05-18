import 'reflect-metadata'
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import { server } from '../../src/server'
import { Tables } from '@modules/database'
import { TestUtils } from '../test-utils'
import _ from 'lodash'
import {
  CountResponse,
  DeleteResponse,
  FailureResponse,
  SuccessResponse,
} from '@api/common'
import { ErrorCode } from '@modules/error'
import { UserData } from '@api/users'
import { UserPrivilege } from '@modules/auth/user.enums'

chai.use(chaiHttp)

const testUser = {
  login: 'test',
  email: 'test@example.com',
  name: 'Tester',
  privilege: 'admin',
  password: 'abc12345',
}

const testUserRet = _.omit(testUser, 'password')

function validateUser(
  user: UserData,
  reference: typeof testUserRet = testUserRet
): void {
  expect(user).to.include(reference)
  expect(user).to.have.property('id').to.be.a('number')
  expect(user).to.have.property('deleted').to.equal(false)
  expect(user)
    .to.have.property('createdAt')
    .to.be.a('string')
    .to.match(
      /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/
    )
}

async function getUserId(): Promise<number> {
  const rows = await TestUtils.executeQuery<{ id: number }>(
    `SELECT id FROM ${Tables.USERS} WHERE login = '${testUser.login}'`
  )
  const { id } = rows[0] as { id: number }

  return id
}

async function getUserCount(): Promise<number> {
  const rows = await TestUtils.executeQuery<{ count: string }>(
    `SELECT count(*) FROM ${Tables.USERS}`
  )

  return Number.parseInt(rows[0].count)
}

const authUser = {
  login: 'users-test',
  name: 'Tester',
  privilege: UserPrivilege.ADMIN,
  password: 'abc12345',
}
let accessToken = ''

describe('/api/v1/users', () => {
  beforeAll(async () => {
    await TestUtils.clearTable(Tables.USERS_WITH_PRIVILEGE_NAME)
    await TestUtils.createUser(authUser)
    accessToken = await TestUtils.getAuthToken(
      {
        login: authUser.login,
        password: authUser.password,
      },
      server
    )
  })

  afterAll(async () => {
    await TestUtils.clearTable(Tables.USERS_WITH_PRIVILEGE_NAME)
  })

  it('should add new user on /api/v1/users POST', async () => {
    const res = await chai
      .request(server)
      .post('/api/v1/users')
      .set('x-auth-token', accessToken)
      .send(testUser)

    expect(res).to.have.status(201)
    expect(res).to.have.property('body').to.be.a('object')
    expect(res.body).to.have.property('success').to.equal(true)
    expect(res.body).to.have.property('result').to.be.a('object')

    const { result } = res.body as SuccessResponse<UserData>
    validateUser(result)
  })

  it('should get user by id on /api/v1/users/{id} GET', async () => {
    const id = await getUserId()
    const res = await chai
      .request(server)
      .get(`/api/v1/users/${id}`)
      .set('x-auth-token', accessToken)

    expect(res).to.have.status(200)
    expect(res).to.have.property('body').to.be.a('object')
    expect(res.body).to.have.property('success').to.equal(true)
    expect(res.body).to.have.property('result').to.be.a('object')

    const { result } = res.body as SuccessResponse<UserData>
    validateUser(result)
    expect(result).to.have.property('id').to.equal(id)
  })

  it('should get all users on /api/v1/users GET', async () => {
    const count = await getUserCount()

    const res = await chai
      .request(server)
      .get('/api/v1/users')
      .set('x-auth-token', accessToken)

    expect(res).to.have.status(200)
    expect(res).to.have.property('body').to.be.a('object')
    expect(res.body).to.have.property('success').to.equal(true)
    expect(res.body).to.have.property('result').to.be.a('array')

    const { result } = res.body as SuccessResponse<UserData[]>
    expect(result).to.have.lengthOf(count)
    validateUser(result.find((user) => user.login === 'test') as UserData)
  })

  it('should get users count on /api/v1/users/count GET', async () => {
    const count = await getUserCount()

    const res = await chai
      .request(server)
      .get('/api/v1/users/count')
      .set('x-auth-token', accessToken)

    expect(res).to.have.status(200)
    expect(res).to.have.property('body').to.be.a('object')
    expect(res.body).to.have.property('success').to.equal(true)
    expect(res.body).to.have.property('result').to.be.a('object')

    const { result } = res.body as SuccessResponse<CountResponse>
    expect(result).to.have.property('count').to.equal(count)
  })

  it('should return error on bad user privilege name on /api/v1/users/{id} GET', async () => {
    await TestUtils.executeQuery(
      `INSERT INTO ${Tables.USER_PRIVILEGES} (name) VALUES ('bad_name') ` +
        `ON CONFLICT DO NOTHING`
    )
    const rows = await TestUtils.executeQuery<{ id: number }>(
      `SELECT id FROM ${Tables.USER_PRIVILEGES} WHERE name='bad_name'`
    )

    const id = await getUserId()
    await TestUtils.executeQuery(
      `UPDATE ${Tables.USERS} SET privilege=${rows[0].id} WHERE id=${id}`
    )

    const res = await chai
      .request(server)
      .get(`/api/v1/users/${id}`)
      .set('x-auth-token', accessToken)

    expect(res).to.have.status(500)
    expect(res).to.property('body').to.be.a('object')
    expect(res.body).to.have.property('success').to.equal(false)
    expect(res.body).to.have.property('error').to.be.a('object')

    const { error } = res.body as FailureResponse
    expect(error).to.have.property('httpCode').to.equal(500)
    expect(error).to.have.property('details').to.be.a('object')
    expect(error.details).to.have.property('code').to.equal(0)
    expect(error.details)
      .to.have.property('message')
      .to.equal('Unexpected user privilege name bad_name')

    await TestUtils.executeQuery(
      `UPDATE ${Tables.USERS} SET privilege = 1 WHERE id = ${id}`
    )
    await TestUtils.executeQuery(
      `DELETE FROM ${Tables.USER_PRIVILEGES} WHERE name='bad_name'`
    )
  })

  it('should update user data on /api/v1/users/{id} PATCH', async () => {
    const name = 'Tester Test'
    const password = 'newPassword1'
    const id = await getUserId()
    const res = await chai
      .request(server)
      .patch(`/api/v1/users/${id}`)
      .set('x-auth-token', accessToken)
      .send({ name, password })

    expect(res).to.have.status(200)
    expect(res).to.have.property('body').to.be.a('object')
    expect(res.body).to.have.property('success').to.equal(true)
    expect(res.body).to.have.property('result').to.be.a('object')

    const { result } = res.body as SuccessResponse<UserData>
    validateUser(result, { ...testUserRet, name })

    const rows = await TestUtils.executeQuery<{ name: string }>(
      `SELECT name FROM ${Tables.USERS} WHERE id=${id}`
    )

    expect(rows[0].name).to.equal(name)
  })

  it('should update user privilege on /api/v1/users/{id} PATCH', async () => {
    const name = 'Tester 111'
    const privilege = 'user'
    const id = await getUserId()
    const res = await chai
      .request(server)
      .patch(`/api/v1/users/${id}`)
      .set('x-auth-token', accessToken)
      .send({ name, privilege })

    expect(res).to.have.status(200)
    expect(res).to.have.property('body').to.be.a('object')
    expect(res.body).to.have.property('success').to.equal(true)
    expect(res.body).to.have.property('result').to.be.a('object')

    const { result } = res.body as SuccessResponse<UserData>
    validateUser(result, { ...testUserRet, name, privilege })

    const rows = await TestUtils.executeQuery<{
      name: string
      privilegeName: string
    }>(
      `SELECT name, "privilegeName" FROM ${Tables.USERS_WITH_PRIVILEGE_NAME} WHERE id=${id}`
    )

    expect(rows[0].name).to.equal(name)
    expect(rows[0].privilegeName).to.equal(privilege)
  })

  it('should delete user on /api/v1/users/{id} DELETE', async () => {
    const id = await getUserId()

    const res = await chai
      .request(server)
      .delete(`/api/v1/users/${id}`)
      .set('x-auth-token', accessToken)

    expect(res).to.have.status(200)
    expect(res).to.have.property('body').to.be.a('object')
    expect(res.body).to.have.property('success').to.equal(true)
    expect(res.body).to.have.property('result').to.be.a('object')

    const { result } = res.body as SuccessResponse<DeleteResponse>
    expect(result).to.have.property('count').to.equal(1)

    const rows = await TestUtils.executeQuery(
      `SELECT id, deleted FROM ${Tables.USERS} WHERE id=${id}`
    )
    expect(rows.length).to.equal(1)
    expect(rows[0]).to.be.a('object').to.have.property('deleted').to.equal(true)
  })

  it('should return count 0 on deleting non existing user on /api/v1/users/{id} DELETE', async () => {
    const res = await chai
      .request(server)
      .delete('/api/v1/users/100500')
      .set('x-auth-token', accessToken)

    expect(res).to.have.status(200)
    expect(res).to.have.property('body').to.be.a('object')
    expect(res.body).to.have.property('success').to.equal(true)
    expect(res.body).to.have.property('result').to.be.a('object')

    const { result } = res.body as SuccessResponse<DeleteResponse>
    expect(result).to.have.property('count').to.equal(0)
  })

  it('should return NOT FOUND error on getting not existing user on /api/v1/users/{id} GET', async () => {
    const res = await chai
      .request(server)
      .get('/api/v1/users/100500')
      .set('x-auth-token', accessToken)

    expect(res).to.have.status(404)
    expect(res).to.have.property('body').to.be.a('object')
    expect(res.body).to.have.property('success').to.equal(false)
    expect(res.body).to.have.property('error').to.be.a('object')

    const { error } = res.body as FailureResponse
    expect(error).to.have.property('httpCode').to.equal(404)
    expect(error).to.have.property('details').to.be.a('object')
    expect(error.details)
      .to.have.property('code')
      .to.equal(ErrorCode.ENTITY_NOT_FOUND)
  })

  it('should return BAD REQUEST on getting user by bad formatted id', async () => {
    const res = await chai
      .request(server)
      .get('/api/v1/users/abcd')
      .set('x-auth-token', accessToken)

    expect(res).to.have.status(400)
    expect(res).to.have.property('body').to.be.a('object')
    expect(res.body).to.have.property('success').to.equal(false)
    expect(res.body).to.have.property('error').to.be.a('object')

    const { error } = res.body as FailureResponse
    expect(error).to.have.property('httpCode').to.equal(400)
    expect(error).to.have.property('details').to.be.a('object')
    expect(error.details)
      .to.have.property('code')
      .to.equal(ErrorCode.BAD_REQUEST_PARAMETERS)
  })
})
