export type Id = number | string

export type DatabaseValue = string | number | Date | boolean | undefined

export interface EntityData<ID extends Id = number> {
  id: ID
  deleted?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export type EntityRecord<ID extends Id = number> = EntityData<ID>

export interface CountResult {
  count: number
}

export type OmitId<T> = Omit<T, 'id'>
