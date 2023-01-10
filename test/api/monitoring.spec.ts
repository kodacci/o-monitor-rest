/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-floating-promises */
import 'reflect-metadata'
import '@api/monitoring/monitoring.controller'
import '@api/auth/auth.controller'
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import { DateTime } from 'luxon'
import { SystemStats, SystemStatsRepo, Tables } from '@modules/database'
import { ApiError } from '@modules/error'
import { TestUtils } from '../test-utils'
import { SystemWatcherService } from '@modules/system-watcher'
import { Application } from '@application/application'
import fs from 'node:fs'
import { setTimeout } from 'timers/promises'
import { UserPrivilege } from '@modules/auth/user.enums'
import { AuthData } from '@api/auth'
import { SuccessResponse } from '@api/common'

chai.use(chaiHttp)

const user = {
  login: 'monitoring-user',
  name: 'Monitor',
  password: 'abc12345',
  privilege: UserPrivilege.USER,
}

let accessToken = ''

function assertError(body: unknown): void {
  expect(body).to.be.a('object')
  expect(body).to.have.property('success').equals(false)
  expect(body).not.to.have.property('result')
  expect(body).to.have.property('error').to.be.a('object')

  const { error } = body as { success: false; error: ApiError }
  expect(error.httpCode).to.equal(500)
  expect(error.details).to.be.a('object')
  expect(error.details.message).to.eq('Dummy read error')
}

describe('/api/v1/monitoring', function () {
  jest.setTimeout(4000)

  let server: Express.Application | undefined = undefined
  let agent: ChaiHttp.Agent | undefined = undefined

  beforeAll(async () => {
    await TestUtils.clearTable(Tables.MONITORING)

    const recs = []
    for (let i = 0; i < 60; ++i) {
      recs.push(i)
    }
    // @ts-ignore
    SystemWatcherService['STATS_SECONDS_RECCURENCE'] = recs

    const app = new Application()
    server = app.start()
    agent = chai.request(server).keepOpen()

    await TestUtils.deleteUser(user.login)
    await TestUtils.createUser(user)

    const authRes = await agent
      .post('/api/v1/auth')
      .send({ login: user.login, password: user.password })

    const { result } = authRes.body as SuccessResponse<AuthData>
    accessToken = result.accessToken

    await setTimeout(1100)
  })

  afterAll(async () => {
    jest.clearAllMocks()
    await TestUtils.deleteUser(user.login)
    await new Promise((resolve) => agent?.close(resolve))
    await TestUtils.clearTable(Tables.MONITORING)
    await setTimeout(1000)
  })

  it('should get bad request error on GET on /api/v1/monitoring with bad query parameters', async () => {
    const res = await agent
      ?.get('/api/v1/monitoring')
      .set('x-auth-token', accessToken)

    expect(res).not.to.be.null
    expect(res).to.have.status(400)
    expect(res?.body).to.be.a('object')
    expect(res?.body).to.have.property('success').equals(false)
    expect(res?.body).not.to.have.property('result')
    expect(res?.body).to.have.property('error').to.be.a('object')

    const { error } = res?.body as { success: false; error: ApiError }
    expect(error.httpCode).to.equal(400)
    expect(error.details).to.be.a('object')
    expect(error.details.validationErrors).to.exist
  })

  it('should get system stats on GET on /api/v1/monitoring', async () => {
    const res = await agent
      ?.get('/api/v1/monitoring')
      .query({
        from: DateTime.local().minus({ hours: 1 }).toISO(),
        to: DateTime.local().toISO(),
      })
      .set('x-auth-token', accessToken)

    expect(res).to.have.status(200)
    expect(res?.body).to.be.a('object')
    expect(res?.body).to.have.property('success').equals(true)
    expect(res?.body).to.have.property('result').to.be.a('array')

    const { result } = res?.body as { success: true; result: SystemStats[] }
    expect(result).to.have.lengthOf.at.least(1)
    expect(result[0]).to.be.a('object')

    const stats = result[0]
    expect(stats).to.have.property('timestamp').to.be.a('string')
    expect(stats).to.have.property('temperature').to.be.a('number')
    expect(stats).to.have.property('memory').to.be.a('object')
    expect(stats).to.have.property('cpu').to.be.a('object')
    expect(stats.memory).to.have.property('freeBytes').to.be.a('number')
    expect(stats.memory).to.have.property('usedBytes').to.be.a('number')
    expect(stats.memory).to.have.property('totalBytes').to.be.a('number')
    expect(stats.cpu).to.have.property('name').to.be.a('string')
    expect(stats.cpu)
      .to.have.property('load')
      .to.be.a('array')
      .to.have.lengthOf.at.least(1)
    for (const core of stats.cpu.load) {
      expect(core).to.be.a('number')
    }
    expect(stats.cpu.coresCount).to.equal(stats.cpu.load.length)
  })

  it('should return 500 error on db error on GET on /api/v1/monitoring', async () => {
    jest
      .spyOn(SystemStatsRepo.prototype, 'read')
      .mockRejectedValue(new Error('Dummy read error'))

    const readFileMock = jest
      .spyOn(fs.promises, 'readFile')
      .mockRejectedValue(new Error('Dummy file error')).mock

    const res = await agent
      ?.get('/api/v1/monitoring')
      .query({ from: DateTime.local().minus({ hours: 1 }).toISO() })
      .set('x-auth-token', accessToken)

    expect(res).to.have.status(500)
    assertError(res?.body)

    await setTimeout(1000)
    expect(readFileMock.calls).to.have.lengthOf.at.least(1)
  })
})
