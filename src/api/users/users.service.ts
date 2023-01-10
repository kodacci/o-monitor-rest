import { inject, injectable } from 'inversify'
import { DiSymbols } from '@application/di-symbols'
import { Hasher, User } from '@modules/auth'
import { OmitId, UserEntity, UserRepo } from '@modules/database'
import { CountResponse, DeleteResponse } from '@api/common'
import { UserData } from './users.interfaces'

@injectable()
export class UsersService {
  private readonly hasher = new Hasher()

  constructor(@inject(DiSymbols.UserRepo) private readonly repo: UserRepo) {}

  toUserData(user: UserEntity): UserData {
    return new User(user).toData()
  }

  async findAll(): Promise<UserData[]> {
    const users = await this.repo.findAll()

    return users.map((user) => this.toUserData(user))
  }

  async findById(id: number): Promise<UserData> {
    const user = await this.repo.findById(id)

    return this.toUserData(user)
  }

  async createNew(data: OmitId<UserEntity>): Promise<UserData> {
    data.password = await this.hasher.hash(data.password)

    return this.toUserData(await this.repo.create(data))
  }

  async update(id: number, data: Partial<UserEntity>): Promise<UserData> {
    if (data.password) {
      data.password = await this.hasher.hash(data.password)
    }

    return this.toUserData(await this.repo.update(id, data))
  }

  async delete(id: number): Promise<DeleteResponse> {
    return {
      count: (await this.repo.delete(id)) ? 1 : 0,
    }
  }

  async count(): Promise<CountResponse> {
    return {
      count: await this.repo.count(),
    }
  }
}
