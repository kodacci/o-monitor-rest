import { SwaggerSchema } from 'joi-to-swagger'

export type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'head'
  | 'options'

export interface ParametersObject {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description?: string
  required: boolean
  schema: SwaggerSchema
}

export type HttpCodesKeys = '200' | '201' | '400' | '404' | '401' | '500'

export enum MediaType {
  APPLICATION_JSON = 'application/json',
  MULTIPART_FORM_DATA = 'multipart/form-data',
}

export type ContentObject = {
  [key in MediaType]?: {
    schema?: SwaggerSchema
  }
}

export type ResponseObject = {
  [key in HttpCodesKeys]?: {
    description: string
    content?: ContentObject
  }
}

export interface RequestBodyObject {
  description?: string
  content: ContentObject
  required?: boolean
}

export type PathItemObject = {
  [key in HttpMethod]?: {
    tags?: string[]
    summary?: string
    description?: string
    parameters?: ParametersObject[]
    requestBody?: RequestBodyObject
    responses: ResponseObject
  }
}

export interface Swagger {
  openapi: string
  info: {
    title: string
    version: string
  }
  paths: {
    [key: string]: PathItemObject
  }
}
