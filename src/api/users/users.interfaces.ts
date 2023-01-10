import { UserPrivilege } from '@modules/auth/user.enums'
import { EntityApiData } from '@api/common'

export interface UserData extends EntityApiData {
  login: string
  email?: string
  name: string
  privilege: UserPrivilege
}
