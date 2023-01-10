import 'reflect-metadata'
import './api/monitoring/monitoring.controller'
import './api/users/users.controller'
import './api/auth/auth.controller'
import { Application } from './application'

export let server: Express.Application | undefined = undefined

try {
  const app = new Application()
  server = app.start()
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Application unexpected error', err)
}
