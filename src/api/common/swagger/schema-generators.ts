import { ContentObject } from '@api/swagger'

export function genApiResponseContent<R>(result: R): ContentObject {
  return {
    'application/json': {
      schema: {
        type: 'object',
        required: ['success', 'result'],
        properties: {
          success: { type: 'boolean', example: 'true' },
          result,
        },
      },
    },
  }
}
