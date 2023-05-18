import { EntityData, Id, OmitId } from '../database.interfaces'

export interface RwRepository<
  ID extends Id,
  T extends EntityData<ID> = EntityData<ID>
> {
  findAll: () => Promise<T[]>
  findById: (id: ID) => Promise<T>
  count: () => Promise<number>
  create: (data: OmitId<T>) => Promise<T>
  update: (id: ID, data: Partial<T>) => Promise<T>
  delete: (id: ID) => Promise<boolean>
}
