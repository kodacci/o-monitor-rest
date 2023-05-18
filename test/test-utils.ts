import { config } from '../src/application/config/config'
import { Client } from 'pg'
import { UserData } from '@api/users'
import { CreateUserDto, Tables } from '@modules/database'
import { Hasher } from '@modules/auth'
import { omit } from 'lodash'
import { AuthData, AuthRequest } from '@api/auth'
import chai from 'chai'
import chaiHttp from 'chai-http'
import { SuccessResponse } from '@api/common'

chai.use(chaiHttp)

export class TestUtils {
  static async clearTable(table: string): Promise<void> {
    const client = new Client(config.get('database'))
    await client.connect()
    await client.query(`DELETE FROM "${table}"`)
    await client.end()
  }

  static async executeQuery<R = unknown>(
    query: string,
    args?: unknown[]
  ): Promise<R[]> {
    const client = new Client(config.get('database'))
    await client.connect()
    const res = await client.query(query, args)
    await client.end()

    return res.rows as R[]
  }

  static async createUser(user: CreateUserDto): Promise<UserData> {
    const hasher = new Hasher()
    const password = await hasher.hash(user.password ?? '')

    const { id: privilege } = (
      await TestUtils.executeQuery<{ id: number }>(
        `SELECT id FROM "${Tables.USER_PRIVILEGES}" WHERE name='${user.privilege}'`
      )
    )[0]

    const res = await TestUtils.executeQuery<{ id: number }>(
      `INSERT INTO "${Tables.USERS}" (login, name, email, privilege, password)` +
        `VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [user.login, user.name, user.email, privilege, password]
    )

    return {
      ...omit(user, 'password', 'createdAt', 'deletedAt', 'updatedAt'),
      id: res[0].id,
      deleted: false,
    }
  }

  static async deleteUser(idOrLogin: number | string): Promise<void> {
    if (typeof idOrLogin === 'number') {
      await TestUtils.executeQuery(
        `DELETE FROM "${Tables.USERS}" WHERE id=${idOrLogin}`
      )
    } else {
      await TestUtils.executeQuery(
        `DELETE FROM "${Tables.USERS}" WHERE login='${idOrLogin}'`
      )
    }
  }

  static async getAuthToken(
    auth: AuthRequest,
    app?: Express.Application
  ): Promise<string> {
    const res = await chai.request(app).post('/api/v1/auth').send(auth)

    const authData = res.body as SuccessResponse<AuthData>
    return authData.result.accessToken
  }
}
