import 'reflect-metadata'
import { interfaces } from 'inversify-express-utils'
import { ResourceId } from './resource-id'
import { UserPrivilege } from './user.enums'
import { AuthUserDto } from '@modules/database/auth-repo'

export class Principal implements interfaces.Principal {
  public constructor(public details: AuthUserDto | undefined) {}

  public isAuthenticated(): Promise<boolean> {
    return Promise.resolve(!!this.details)
  }

  public isResourceOwner(resourceId: unknown): Promise<boolean> {
    if (!(resourceId instanceof ResourceId)) {
      throw new Error('Bad resource id')
    }

    if (resourceId.getMethod() !== 'GET') {
      return Promise.resolve(this.isInRole(UserPrivilege.ADMIN))
    }

    return Promise.resolve(!!this.details)
  }

  public isInRole(role: string): Promise<boolean> {
    return Promise.resolve(this.details?.privilege === role)
  }
}
