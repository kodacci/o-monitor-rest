/* eslint-disable @typescript-eslint/no-floating-promises */
import 'reflect-metadata'
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import { server } from '../../src/server'

chai.use(chaiHttp)

describe('/api-docs/swagger.json', () => {
  it('should return swagger API docs on GET on /api-docs/swagger.json', async () => {
    const res = await chai.request(server).get('/api-docs/swagger.json')

    expect(res).to.have.status(200)
    expect(res).to.be.a('object')
  })
})
