import { router } from '../app';
import { setMetaData } from './index';

export interface Action {
  url: string,
  method?: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH'
}

export function action({url, method}: Action) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    router.route(url)[method.toLowerCase()](descriptor.value.bind(target));
    setMetaData(target.constructor.name, propertyKey, {
      url,
      method: method.toLowerCase(),
      params: {
        tags: [target.constructor.name]
      }
    })
  }
}

export function GET(url: string) {
  return action({url, method: 'GET'})
}

export function POST(url: string) {
  return action({url, method: 'POST'})
}

export function PUT(url: string) {
  return action({url, method: 'PUT'})
}

export function DELETE(url: string) {
  return action({url, method: 'DELETE'})
}

export function PATCH(url: string) {
  return action({url, method: 'PATCH'})
}