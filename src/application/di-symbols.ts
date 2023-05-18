export const DiSymbols = {
  // Application general
  config: Symbol.for('config'),
  LoggerFactory: Symbol.for('LoggerFactory'),
  DbConnService: Symbol.for('DbConnService'),
  SwaggerService: Symbol.for('SwaggerService'),

  // Monitoring
  MonitoringService: Symbol.for('MonitoringService'),
  SystemWatcherService: Symbol.for('SystemWatcherService'),
  SystemStatsRepo: Symbol.for('SystemStatsRepo'),
  GetMonitoringValidator: Symbol.for('GetMonitoringValidator'),

  // Authentication
  AuthService: Symbol.for('AuthService'),
  AuthenticateValidator: Symbol.for('AuthenticateValidator'),
  UpdateTokenValidator: Symbol.for('UpdateTokenValidator'),
  AuthChecker: Symbol.for('AuthChecker'),

  // Users
  UsersService: Symbol.for('UsersService'),
  UserRepo: Symbol.for('UserRepo'),
  AddUserValidator: Symbol.for('AddUserValidator'),
  GetUserValidator: Symbol.for('GetUserValidator'),
  PatchUserValidator: Symbol.for('PatchUserValidator'),
  AuthRepo: Symbol.for('AuthRepository'),
}
