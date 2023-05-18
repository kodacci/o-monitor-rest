export interface AuthRequest {
  login: string
  password: string
}

export interface AuthData {
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
