import { UserPrivilege } from '../../auth/user.enums'
import { EntityData } from '../database.interfaces'

export interface CreateUserDto {
  login: string
  email?: string
  name: string
  privilege: UserPrivilege
  password: string
}

export interface UserEntity extends EntityData {
  login: string
  email?: string
  name: string
  privilege: UserPrivilege
}
