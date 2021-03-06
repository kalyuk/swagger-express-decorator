import { getMetaData, setMetaData } from './index';
import { ColumnOptions, getMetadataArgsStorage } from 'typeorm';

export interface SwaggerInfoContact {
  email: string;
}

export interface SwaggerInfo {
  description?: string;
  version?: string;
  title?: string;
  termsOfService?: string;
  contact?: SwaggerInfoContact
}

export interface SwaggerTag {
  name: string;
  description: string;
  externalDocs?: {
    description: string;
    url: string;
  }
}

export type DataTypes = 'application/json' | 'application/xml';
export type ParamType = 'body' | 'path' | 'query' | 'header' | 'cockie';

export interface Parametr {
  in: ParamType,
  name: string,
  description?: string,
  required?: boolean,
  schema: any
}

export interface SwaggerPathDescription {
  tags?: string[];
  summary?: string;
  description?: string;
  consumes?: DataTypes[],
  produces?: DataTypes[],
  parameters?: Parametr[],
  responses?: {
    [key: number]: {
      description?: string
      content?: any
    }
  }
}

export interface SwaggerPaths {
  [url: string]: {
    get?: SwaggerPathDescription,
    post?: SwaggerPathDescription,
    put?: SwaggerPathDescription,
    patch?: SwaggerPathDescription,
    delete?: SwaggerPathDescription,
    options?: SwaggerPathDescription
  }
}

export type schemes = 'http' | 'https'

export interface Swagger {
  swagger?: string;
  info?: SwaggerInfo
  host: string;
  basePath?: string;
  tags?: SwaggerTag[];
  schemes?: schemes[];
  paths?: SwaggerPaths,
  definitions?: {
    [name: string]: any
  };
}

const $swagger: Swagger = {
  host: 'localhost',
  swagger: '2.0',
  basePath: '',
  info: {},
  tags: [],
  schemes: ['http'],
  paths: {},
  definitions: {}
};


export function swaggerDoc() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.value = function () {
      return $swagger;
    };

    return descriptor;
  }
}

export function swaggerController(swagger: Swagger) {
  Object.assign($swagger, swagger);
  return (target) => target;
}

export function swagger(swagger: SwaggerPathDescription = {}) {
  return function (target: any, propertyKey: string) {
    setMetaData(target.constructor.name, propertyKey, {params: swagger});
    const {url, method, params} = getMetaData(target.constructor.name, propertyKey);
    setPath(url, method, params);
  }
}

export function swaggerParam(name: string, type: ParamType, params: any = {}) {
  return function (target: any, propertyKey: string) {
    const meta = getMetaData(target.constructor.name, propertyKey);
    const data = {name, in: type, ...params};

    if (data.schema) {
      data.schema = {
        $ref: `#/definitions/${data.schema.name}`
      }
    }

    if (!meta.params.parameters) {
      meta.params.parameters = [];
    }
    meta.params.parameters.push(data);


    return swagger(meta.params)(target, propertyKey);
  }
}

export function swaggerResponse(ref: Function | Function[], statusCode = 200, description = '') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    const responses: any = {};
    const data: any = {};
    const {pagination} = getMetaData(target.constructor.name, propertyKey);

    if (ref instanceof Array) {

      if (pagination) {

        data.pageSize = {
          type: 'string',
          enum: pagination.sizes
        };
        swaggerParam('pageSize', 'query', {type: 'string', enum: pagination.sizes, default: pagination.sizes[0]})(target, propertyKey);

        if (pagination.type === 'classic') {
          swaggerParam('page', 'query', {type: 'number', default: 1})(target, propertyKey);
          data.page = {type: 'number'};
        } else {
          swaggerParam('cursor', 'query', {type: 'string'})(target, propertyKey);
          data.cursor = {type: 'string'};
        }
      }

      data.total = {type: 'number'};
      data.items = {
        type: 'array',
        items: {
          $ref: `#/definitions/${ref[0].name}`
        }
      }
    } else {
      data.item = {
        type: 'object',
        $ref: `#/definitions/${ref.name}`
      }
    }

    responses[statusCode] = {
      description,
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: data
          }
        }
      }
    };

    return swagger({responses})(target, propertyKey);
  }
}

export function setPath(url, method, params: SwaggerPathDescription = {}) {
  if (!$swagger.paths[url]) {
    $swagger.paths[url] = {};
  }

  if (!$swagger.paths[url][method.toLowerCase()]) {
    $swagger.paths[url][method.toLowerCase()] = {};
  }

  Object.assign($swagger.paths[url][method.toLowerCase()], params);
}

export interface ModelParams {
  name?: string,
  hidden?: string[]
}

export function swaggerModel(params: ModelParams = {}) {
  return (target) => {
    const meta = getMetadataArgsStorage();
    const properties: any = {};

    meta.filterColumns(target)
      .forEach(({propertyName, options}) => {
        if (!params.hidden || (params.hidden && params.hidden.indexOf(propertyName) === -1)) {
          if (!options) {
            options = {
              type: 'varchar'
            }
          }

          properties[propertyName] = getType(options)
        }
      });

    $swagger.definitions[target.name] = {
      type: 'object',
      required: [],
      properties
    };


    return target;
  }
}

function getType(options: ColumnOptions) {
  const {type, isArray} = options;
  switch (type) {
    case 'int2':
    case 'int4':
    case 'int8':
    case 'int32':
    case 'int64':
    case 'integer':
    case 'float':
    case 'smallint':
    case 'bigint':
    case 'decimal':
    case 'numeric':
    case 'double':
      return {
        type: 'number'
      };
    case 'date':
      return {
        format: 'date',
        type: 'string'
      };
    case 'json':
    case 'jsonb':
      return {
        type: isArray ? 'array' : 'object'
      };
    case 'datetime':
      return {
        format: 'date-time',
        type: 'string'
      };
    case 'timestamp':
      return {
        format: 'date-time',
        type: 'number'
      };
    case 'enum':
      return {
        enum: options.enum,
        type: 'string'
      };
    default:
      return {
        type: 'string'
      }
  }
}