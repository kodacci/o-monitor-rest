import { ResponseObject } from '@api/swagger'

const errorSchema = {
  type: 'object',
  required: ['httpCode', 'details'],
  properties: {
    httpCode: {
      type: 'integer',
    },
    details: {
      type: 'object',
      required: ['code', 'description'],
      properties: {
        code: { type: 'integer' },
        description: { type: 'string' },
        message: { type: 'string' },
        stack: { type: 'string' },
        validationErrors: {
          type: 'object',
          required: ['message', 'path', 'type'],
          properties: {
            message: { type: 'string' },
            path: {
              type: 'array',
              items: { type: 'string' },
            },
            type: { type: 'string' },
            context: { type: 'object' },
          },
        },
      },
    },
  },
}

const errorContent = {
  'application/json': {
    schema: {
      type: 'object',
      required: ['success', 'error'],
      properties: {
        success: { type: 'boolean', example: false },
        error: errorSchema,
      },
    },
  },
}

export const badRequest: ResponseObject = {
  '400': {
    description: 'Bad request parameters',
    content: errorContent,
  },
}

export const notFound: ResponseObject = {
  '404': {
    description: 'Entity not found',
    content: errorContent,
  },
}

export const serverError: ResponseObject = {
  '500': {
    description: 'Internal server error',
    content: errorContent,
  },
}

export const unauthorized: ResponseObject = {
  '401': {
    description: 'Unauthorized',
    content: errorContent,
  },
}

export const defaultErrors = {
  ...badRequest,
  ...serverError,
  ...unauthorized,
}
