import { inject, injectable } from 'inversify'
import { DiSymbols } from '@application/di-symbols'
import { User } from '@modules/auth'
import { UserRepo } from '@modules/database'
import {
  AuthData,
  AuthRequest,
  UpdateTokenData,
  UpdateTokenRequest,
} from '@/api/auth/auth.interfaces'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { AppConfig } from '@application/config/config'
import { NotFoundError, UnauthorizedError } from '@modules/error'
import { UserData } from '@api/users'
import { userDataSchema } from '@api/common'
import Joi from 'joi'
import { LoggerFactory } from '@modules/logger'
import { Logger } from 'winston'
import { v1 as uuid } from 'uuid'

interface TokensData {
  tokenId: string
  accessToken: string
  refreshToken: string
}

interface TokenPayload {
  id: string
  type: 'ACCESS' | 'REFRESH'
  user: UserData
}

const tokenPayloadSchema = Joi.object()
  .keys({
    payload: Joi.object().keys({
      id: Joi.string().uuid().required(),
      user: userDataSchema,
      type: Joi.string().valid('ACCESS', 'REFRESH').required(),
    }),
  })
  .unknown(true)

@injectable()
export class AuthService {
  private readonly logger: Logger

  constructor(
    @inject(DiSymbols.UserRepo) private readonly userRepo: UserRepo,
    @inject(DiSymbols.config) private readonly config: AppConfig,
    @inject(DiSymbols.LoggerFactory) loggerFactory: LoggerFactory
  ) {
    this.logger = loggerFactory.getLogger('SERVICES.AUTH')
  }

  private genTokens(user: UserData): TokensData {
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

  private async findUser(login: string, path: string): Promise<User> {
    try {
      return new User(await this.userRepo.findByLogin(login))
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError(path)
      }

      throw error
    }
  }

  async authenticate(data: AuthRequest, path: string): Promise<AuthData> {
    const user = await this.findUser(data.login, path)
    const valid = await user.isPasswordValid(data.password)
    if (!valid) {
      throw new UnauthorizedError(path)
    }

    const userData = user.toData()
    const tokens = this.genTokens(userData)
    await this.userRepo.setTokenId(userData.id, tokens.tokenId)

    return {
      user: userData,
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

    const tokenId = await this.userRepo.getTokenId(payload.user.id)
    if (tokenId !== payload.id) {
      throw new UnauthorizedError('/api/v1/auth/token')
    }

    const tokens = this.genTokens(payload.user)
    await this.userRepo.setTokenId(payload.user.id, tokens.tokenId)

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  }

  async getUser(
    token: string | undefined,
    path: string
  ): Promise<User | undefined> {
    if (!token) {
      return undefined
    }

    const { id, user } = this.verifyAndExtractToken(token, 'ACCESS', path)

    const dbUser = await this.userRepo.findById(user.id)

    return dbUser && id === dbUser.tokenId ? new User(dbUser) : undefined
  }
}
