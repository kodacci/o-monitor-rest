export const monitoringResponseSchema = {
  type: 'object',
  required: ['success', 'result'],
  properties: {
    success: { type: 'boolean', example: 'true' },
    result: {
      type: 'object',
      required: ['timestamp', 'temperature', 'memory', 'cpu'],
      properties: {
        timestamp: { type: 'string', format: 'date-time' },
        temperature: { type: 'integer', minimum: 0 },
        memory: {
          type: 'object',
          required: ['freeBytes', 'usedBytes', 'totalBytes'],
          properties: {
            freeBytes: { type: 'integer', format: 'int64', minimum: 0 },
            usedBytes: { type: 'integer', format: 'int64', minimum: 0 },
            totalBytes: { type: 'integer', format: 'int64', minimum: 0 },
          },
        },
        cpu: {
          type: 'object',
          required: ['name', 'coresCount', 'load'],
          properties: {
            name: { type: 'string' },
            coresCount: { type: 'integer', minimum: 1 },
            load: {
              type: 'array',
              items: { type: 'number', format: 'double' },
            },
          },
        },
      },
    },
  },
}
