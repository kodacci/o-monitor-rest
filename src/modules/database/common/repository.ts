import { EntityData, Id, OmitId } from '../database.interfaces'

export interface CountRepository {
  count(): Promise<number>
}

export interface ReadRepository<ID extends Id, T> {
  findById(id: ID): Promise<T | undefined>
}

export interface WriteRepository<
  ID extends Id,
  T extends EntityData<ID> = EntityData<ID>,
  C = OmitId<T>
> {
  findAll(): Promise<T[]>
  create(data: C): Promise<T>
  update(id: ID, data: Partial<C>): Promise<T>
  delete(id: ID): Promise<boolean>
}
