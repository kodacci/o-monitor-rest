import { UserData } from '@api/users'

export interface AuthRequest {
  login: string
  password: string
}

export interface AuthData {
  user: UserData
  accessToken: string
  refreshToken: string
}

export interface UpdateTokenRequest {
  refreshToken: string
}

export interface UpdateTokenData {
  accessToken: string
  refreshToken: string
}
