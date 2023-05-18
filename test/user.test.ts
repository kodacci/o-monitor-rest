import { User, UserPrivilege } from '@modules/auth'
import { UserEntity } from '@modules/database'
import { expect } from 'chai'

describe('User', () => {
  it('should get id and entity', () => {
    const entity: UserEntity = {
      id: 1,
      login: 'admin',
      password: 'abc12345',
      name: 'Admin',
      privilege: UserPrivilege.ADMIN,
    }

    const user = new User(entity)

    expect(user.getId()).to.equal(1)
    expect(user.toEntity()).to.eql(entity)
  })
})
