import { inject, injectable } from 'inversify'
import _ from 'lodash'
import { DiSymbols } from '@application/di-symbols'
import { UserPrivilege } from '@modules/auth'
import { NotFoundError } from '@modules/error'
import { RepoImpl } from '../common'
import { DbConnService } from '../connection'
import { EntityRecord, OmitId } from '../database.interfaces'
import { Tables } from '../tables'
import { UserEntity } from './user-repo.interfaces'
import { AppConfig } from '@application/config/config'

interface UserRecord extends EntityRecord<number> {
  login: string
  email?: string
  name: string
  privilegeName: string
  password: string
  tokenId?: string
}

@injectable()
export class UserRepo extends RepoImpl<number, UserEntity, UserRecord> {
  private static readonly WRITE_PROPS: (keyof OmitId<UserEntity>)[] = [
    'login',
    'email',
    'name',
    'privilege',
    'password',
  ]

  private static readonly READ_PROPS: (keyof UserRecord)[] = [
    'id',
    'login',
    'email',
    'name',
    'privilegeName',
    'password',
    'tokenId',
    'createdAt',
    'updatedAt',
    'deletedAt',
  ]

  private static readonly USER_LIMIT: 1000

  constructor(
    @inject(DiSymbols.config) private readonly config: AppConfig,
    @inject(DiSymbols.DbConnService) db: DbConnService
  ) {
    super(db)
  }

  protected getReadPropsString(): string {
    return UserRepo.READ_PROPS.map((prop) => `"${prop}"`).join(',')
  }

  protected getWriteProps(): (keyof OmitId<UserEntity>)[] {
    return UserRepo.WRITE_PROPS
  }

  protected getTable(): string {
    return Tables.USERS_WITH_PRIVILEGE_NAME
  }

  protected getEntityName(): string {
    return 'user'
  }

  private toPrivilege(name: string): UserPrivilege {
    switch (name) {
      case UserPrivilege.USER:
        return UserPrivilege.USER
      case UserPrivilege.ADMIN:
        return UserPrivilege.ADMIN
      default:
        throw new Error(`Unexpected user privilege name ${name}`)
    }
  }

  protected toEntity(record: UserRecord): UserEntity {
    return {
      ...this.toBaseEntity(record),
      login: record.login,
      name: record.name,
      email: record.email ?? undefined,
      password: record.password,
      tokenId: record.tokenId,
      privilege: this.toPrivilege(record.privilegeName),
    }
  }

  async findByLogin(login: string): Promise<UserEntity> {
    const client = await this.db.getConn()
    const res = await client.query(
      `SELECT ${this.getReadPropsString()} FROM ${this.getTable()} ` +
        'WHERE login=$1 AND deleted = false',
      [login]
    )
    client.release()

    if (!res.rows.length) {
      throw new NotFoundError(this.getEntityName(), login)
    }

    return this.toEntity(res.rows[0] as UserRecord)
  }

  async create(data: OmitId<UserEntity>): Promise<UserEntity> {
    const client = await this.db.getConn()
    const privilege = data.privilege
    const { keys, values } = this.extractKeysAndValues(
      _.omit(data, 'privilege')
    )
    const placeholders = this.genPlaceholdersStr(values)

    const res = await client.query(
      `INSERT INTO "${this.getTable()}" (${keys.join(
        ','
      )}, privilege) VALUES (${placeholders}, (SELECT id FROM "${
        Tables.USER_PRIVILEGES
      }" WHERE name = '${privilege}')) RETURNING id`,
      values
    )

    const { id } = res.rows[0] as { id: number }

    const user = await this.findById(id)
    client.release()

    return user
  }

  async update(id: number, data: Partial<UserEntity>): Promise<UserEntity> {
    if (!data.privilege) {
      return super.update(id, data)
    }

    const client = await this.db.getConn()
    const noPrivilege = _.omit(data, 'privilege')
    const keys = _.keys(noPrivilege)
    const values = _.values(noPrivilege)
    const placeholders = keys
      .map((key, idx) => `"${key}"=$${idx + 1}`)
      .join(',')

    const queryString =
      `UPDATE "${this.getTable()}" users SET ${placeholders}, privilege = privileges.id ` +
      `FROM "${Tables.USER_PRIVILEGES}" privileges ` +
      `WHERE privileges.name = '${data.privilege}' AND users.id = ${id} AND users.deleted = false`

    await client.query(queryString, [...values])

    client.release()
    const user = await this.findById(id)

    return user
  }

  async setTokenId(id: number, tokenId: string): Promise<void> {
    const client = await this.db.getConn()
    await client.query(
      `UPDATE "${this.getTable()}" SET "tokenId"=$1 WHERE id=$2 AND deleted=false`,
      [tokenId, id]
    )

    client.release()
  }

  async getTokenId(id: number): Promise<string | undefined> {
    const client = await this.db.getConn()
    const res = await client.query(
      `SELECT "tokenId" FROM "${this.getTable()}" WHERE id=$1 AND deleted=false`,
      [id]
    )
    client.release()

    const data = res.rows[0] as { tokenId: string | undefined } | undefined

    return data?.tokenId
  }

  async createDefaultUser(): Promise<boolean> {
    const count = await this.count()
    if (count) {
      return false
    }

    const defaults = this.config.get('default_user')
    await this.create({
      ...defaults,
      privilege: UserPrivilege.ADMIN,
      name: 'admin',
    })

    return true
  }
}
