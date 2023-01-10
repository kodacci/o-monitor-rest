import { UserPrivilege } from '../../auth/user.enums'
import { EntityData } from '../database.interfaces'

export interface UserEntity extends EntityData {
  login: string
  email?: string
  password: string
  name: string
  privilege: UserPrivilege
  tokenId?: string
}
