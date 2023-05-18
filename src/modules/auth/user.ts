import { UserEntity } from '../database/user-repo'
import { UserData } from '@api/users'

export class User {
  private readonly entity: UserEntity

  constructor(entity: UserEntity) {
    this.entity = { ...entity }
  }

  getId(): number {
    return this.entity.id
  }

  toEntity(): UserEntity {
    return this.entity
  }

  toData(): UserData {
    return {
      id: this.entity.id,
      deleted: !!this.entity.deleted,
      createdAt: this.entity.createdAt?.toISOString(),
      updatedAt: this.entity.updatedAt?.toISOString(),
      deletedAt: this.entity.deletedAt?.toISOString(),
      login: this.entity.login,
      name: this.entity.name,
      email: this.entity.email,
      privilege: this.entity.privilege,
    }
  }
}
