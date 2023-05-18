import { UserPrivilege } from '@modules/auth'

export interface AuthUserDto {
  id: number
  login: string
  password: string
  tokenId?: string
  privilege: UserPrivilege
}
