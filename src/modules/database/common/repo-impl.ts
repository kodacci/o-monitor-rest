import { injectable } from 'inversify'
import _ from 'lodash'
import { NotFoundError } from '../../error/not-found-error'
import { DbConnService } from '../connection'
import { EntityData, EntityRecord, Id, OmitId } from '../database.interfaces'
import { Repository } from './repository'

@injectable()
export abstract class RepoImpl<
  ID extends Id = number,
  T extends EntityData<ID> = EntityData<ID>,
  R extends EntityRecord<ID> = EntityRecord<ID>
> implements Repository<ID, T>
{
  constructor(protected readonly db: DbConnService) {}

  protected abstract getReadPropsString(): string
  protected abstract getWriteProps(): (keyof OmitId<T>)[]
  protected abstract getTable(): string
  protected abstract getEntityName(): string
  protected abstract toEntity(record: R): T

  protected toBaseEntity(record: R): EntityRecord<ID> {
    return {
      id: record.id,
      deleted: record.deleted,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.updatedAt,
    }
  }

  async findAll(): Promise<T[]> {
    const client = await this.db.getConn()
    const res = await client.query(
      `SELECT ${this.getReadPropsString()} FROM "${this.getTable()}" WHERE deleted = false`
    )
    client.release()

    return res.rows.map((row: R) => this.toEntity(row))
  }

  async findById(id: ID): Promise<T> {
    const client = await this.db.getConn()
    const res = await client.query(
      `SELECT ${this.getReadPropsString()} FROM "${this.getTable()}" WHERE id = $1`,
      [id]
    )

    if (!res.rows.length) {
      throw new NotFoundError(this.getEntityName(), id)
    }

    client.release()

    return this.toEntity(res.rows[0] as R)
  }

  async count(): Promise<number> {
    const client = await this.db.getConn()
    const res = await client.query(`SELECT count(*) FROM "${this.getTable()}"`)
    client.release()

    const { count } = res.rows[0] as { count: number }
    return Number(count)
  }

  protected extractKeysAndValues(data: Partial<OmitId<T>>): {
    keys: (keyof OmitId<T>)[]
    values: Partial<OmitId<T>>[keyof OmitId<T>][]
  } {
    const keys = this.getWriteProps().filter((prop: keyof T) => prop in data)
    const values = keys.map((prop) => data[prop])

    return { keys, values }
  }

  protected genPlaceholdersStr(values: unknown[]): string {
    return values.map((_val, idx) => `$${idx + 1}`).join(',')
  }

  abstract create(data: OmitId<T>): Promise<T>

  async update(id: ID, data: Partial<T>): Promise<T> {
    const client = await this.db.getConn()
    const keys = _.keys(data)
    const values = _.values(data)

    const placeholders = keys
      .map((key, idx) => `"${key}"=$${idx + 1}`)
      .join(',')

    await client.query(
      `UPDATE ${this.getTable()} SET ${placeholders} WHERE id = $${
        keys.length + 1
      } AND deleted = false`,
      [...values, id]
    )

    client.release()
    const entity = await this.findById(id)

    return entity
  }

  async delete(id: ID): Promise<boolean> {
    const client = await this.db.getConn()
    const res = await client.query(
      `UPDATE ${this.getTable()} SET deleted = true WHERE id = $1 AND deleted = false`,
      [id]
    )
    client.release()

    return res.rowCount > 0
  }
}
