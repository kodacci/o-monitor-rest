import { UserEntity } from '../database/user-repo'
import { UserPrivilege } from './user.enums'
import { Hasher } from './hasher'
import { UserData } from '@api/users'

export class User {
  private readonly entity: UserEntity
  private readonly hasher: Hasher = new Hasher()

  constructor(entity: UserEntity) {
    this.entity = { ...entity }
  }

  getPrivilege(): UserPrivilege {
    return this.entity.privilege
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

  async isPasswordValid(challenge: string): Promise<boolean> {
    const password = this.entity.password
    if (!password) {
      return false
    }

    return await this.hasher.compare(challenge, password)
  }
}
