import { DiSymbols } from '@application/di-symbols'
import { inject, injectable } from 'inversify'
import { Mappers } from '../common'
import { ReadRepository } from '../common/read-repository'
import { DbConnService } from '../connection'
import { Tables } from '../tables'
import { AuthUserDto } from './auth-repo.interfaces'

interface AuthUserRecord {
  id: number
  login: string
  password: string
  tokenId?: string
  privilegeName: string
}

@injectable()
export class AuthRepo implements ReadRepository<string, AuthUserDto> {
  constructor(
    @inject(DiSymbols.DbConnService) private readonly db: DbConnService
  ) {}

  private map(record: AuthUserRecord | undefined): AuthUserDto | undefined {
    if (!record) {
      return undefined
    }

    return {
      id: record.id,
      login: record.login,
      password: record.password,
      tokenId: record.tokenId,
      privilege: Mappers.mapUserPrivilege(record.privilegeName),
    }
  }

  async findById(id: string): Promise<AuthUserDto | undefined> {
    const client = await this.db.getConn()
    const res = await client.query(
      `SELECT id, login, password, "tokenId", "privilegeName" ` +
        `FROM "${Tables.USERS_WITH_PRIVILEGE_NAME}" WHERE login = $1`,
      [id]
    )

    client.release()

    return this.map(res.rows[0] as AuthUserRecord | undefined)
  }

  async setTokenId(id: number, tokenId: string): Promise<void> {
    const client = await this.db.getConn()
    await client.query(
      `UPDATE "${Tables.USERS}" SET "tokenId"=$1 WHERE id=$2 AND deleted=false`,
      [tokenId, id]
    )

    client.release()
  }

  async getTokenId(id: number): Promise<string | undefined> {
    const client = await this.db.getConn()
    const res = await client.query(
      `SELECT "tokenId" FROM "${Tables.USERS}" WHERE id=$1 AND deleted=false`,
      [id]
    )
    client.release()

    const data = res.rows[0] as { tokenId: string | undefined } | undefined

    return data?.tokenId
  }
}
