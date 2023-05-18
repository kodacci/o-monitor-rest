import { UserPrivilege } from '@modules/auth'

export class Mappers {
  static mapUserPrivilege(name: string): UserPrivilege {
    switch (name) {
      case UserPrivilege.USER:
        return UserPrivilege.USER
      case UserPrivilege.ADMIN:
        return UserPrivilege.ADMIN
      default:
        throw new Error(`Unexpected user privilege name ${name}`)
    }
  }
}
