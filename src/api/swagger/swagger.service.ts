import { injectable } from 'inversify'
import { PathItemObject, Swagger } from './swagger.interfaces'

@injectable()
export class SwaggerService {
  private readonly swagger: Swagger = {
    openapi: '3.0.3',
    info: {
      title: 'O-MONITOR REST API',
      version: '1.0.0',
    },
    paths: {},
  }

  appendPath(path: string, pathSchema: PathItemObject): void {
    this.swagger.paths[path] = {
      ...(this.swagger.paths[path] ?? {}),
      ...pathSchema,
    }
  }

  getSchema(): Swagger {
    return this.swagger
  }
}
