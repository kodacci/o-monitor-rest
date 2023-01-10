import { ErrorCode } from './error-codes'

export const errorDescriptions = new Map([
  [ErrorCode.UNKNOWN_ERROR, 'Unknown server error'],
  [
    ErrorCode.SYSTEM_STATS_REPOSITORY_WRITE_ERROR,
    'System stats database write error',
  ],
  [
    ErrorCode.SYSTEM_STATS_REPOSITORY_READ_ERROR,
    'System stats database read error',
  ],
  [ErrorCode.SYSTEM_WATCHER_GET_TEMPERATURE_ERROR, 'Error getting temperature'],
  [
    ErrorCode.SYSTEM_WATCHER_SAVE_STATS_ERROR,
    'Error saving system watcher statistics',
  ],
  [
    ErrorCode.MONITORING_SERVICE_GET_SYSTEM_STATS_ERROR,
    'Error getting system stats',
  ],
  [ErrorCode.BAD_REQUEST_PARAMETERS, 'Bad request parameters'],
  [ErrorCode.ENTITY_NOT_FOUND, 'Entity not found'],
  [ErrorCode.UNAUTHORIZED, 'Unauthorized access'],
])
