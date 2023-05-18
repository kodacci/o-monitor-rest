export interface ReadRepository<ID, T> {
  findById: (id: ID) => Promise<T | undefined>
}
