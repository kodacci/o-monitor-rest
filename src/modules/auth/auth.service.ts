import { inject, injectable } from 'inversify'
import { DiSymbols } from '@application/di-symbols'
import { Hasher, UserPrivilege } from '@modules/auth'
import {
  AuthData,
  AuthRequest,
  UpdateTokenData,
  UpdateTokenRequest,
} from '@/api/auth/auth.interfaces'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { AppConfig } from '@application/config/config'
import { UnauthorizedError } from '@modules/error'
import { userBaseKeys } from '@api/common'
import Joi from 'joi'
import { LoggerFactory } from '@modules/logger'
import { Logger } from 'winston'
import { v1 as uuid } from 'uuid'
import { AuthRepo, AuthUserDto } from '@modules/database/auth-repo'

interface TokensData {
  tokenId: string
  accessToken: string
  refreshToken: string
}

interface TokenUserData {
  id: number
  login: string
  privilege: UserPrivilege
}

interface TokenPayload {
  id: string
  type: 'ACCESS' | 'REFRESH'
  user: TokenUserData
}

const tokenPayloadSchema = Joi.object()
  .keys({
    payload: Joi.object().keys({
      id: Joi.string().uuid().required(),
      user: Joi.object().keys({
        id: Joi.number().positive().required(),
        login: userBaseKeys.login,
        privilege: userBaseKeys.privilege,
      }),
      type: Joi.string().valid('ACCESS', 'REFRESH').required(),
    }),
  })
  .unknown(true)

@injectable()
export class AuthService {
  private readonly logger: Logger
  private readonly hasher = new Hasher()

  constructor(
    @inject(DiSymbols.AuthRepo) private readonly authRepo: AuthRepo,
    @inject(DiSymbols.config) private readonly config: AppConfig,
    @inject(DiSymbols.LoggerFactory) loggerFactory: LoggerFactory
  ) {
    this.logger = loggerFactory.getLogger('SERVICES.AUTH')
  }

  private genTokens(user: TokenUserData): TokensData {
    const tokenId = uuid()

    return {
      tokenId,
      accessToken: jwt.sign(
        { payload: { id: tokenId, user, type: 'ACCESS' } },
        this.config.get('jwt_secret'),
        {
          expiresIn: '10m',
        }
      ),
      refreshToken: jwt.sign(
        { payload: { id: tokenId, user, type: 'REFRESH' } },
        this.config.get('jwt_secret'),
        {
          expiresIn: '1h',
        }
      ),
    }
  }

  async validateUser(
    login: string,
    password: string
  ): Promise<TokenUserData | undefined> {
    const user = await this.authRepo.findById(login)
    if (!user) {
      return undefined
    }

    const valid = await this.hasher.compare(password, user.password)
    return valid
      ? { id: user.id, login: user.login, privilege: user.privilege }
      : undefined
  }

  async authenticate(data: AuthRequest, path: string): Promise<AuthData> {
    const user = await this.validateUser(data.login, data.password)
    if (!user) {
      throw new UnauthorizedError(path)
    }

    const tokens = this.genTokens(user)
    await this.authRepo.setTokenId(user.id, tokens.tokenId)

    return {
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
    }
  }

  private verify(token: string, path: string): JwtPayload | string {
    try {
      return jwt.verify(token, this.config.get('jwt_secret'))
    } catch (err: unknown) {
      throw new UnauthorizedError(path)
    }
  }

  private verifyAndExtractToken(
    token: string,
    type: 'ACCESS' | 'REFRESH',
    path: string
  ): TokenPayload {
    const tokenData = this.verify(token, path)
    const { error } = tokenPayloadSchema.validate(tokenData)
    if (error) {
      this.logger.error('Invalid JWT payload data:', error)
      throw new Error('Invalid JWT payload data')
    }

    const { payload } = tokenData as { payload: TokenPayload }
    if (payload.type !== type) {
      throw new UnauthorizedError(path)
    }

    return payload
  }

  async updateToken(
    path: string,
    data: UpdateTokenRequest
  ): Promise<UpdateTokenData> {
    const payload = this.verifyAndExtractToken(
      data.refreshToken,
      'REFRESH',
      path
    )

    const tokenId = await this.authRepo.getTokenId(payload.user.id)
    if (tokenId !== payload.id) {
      throw new UnauthorizedError('/api/v1/auth/token')
    }

    const tokens = this.genTokens(payload.user)
    await this.authRepo.setTokenId(payload.user.id, tokens.tokenId)

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  }

  async getUser(
    token: string | undefined,
    path: string
  ): Promise<AuthUserDto | undefined> {
    if (!token) {
      return undefined
    }

    const { id, user } = this.verifyAndExtractToken(token, 'ACCESS', path)

    const dbUser = await this.authRepo.findById(user.login)

    return dbUser && id === dbUser.tokenId ? dbUser : undefined
  }
}
