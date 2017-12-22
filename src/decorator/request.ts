import { setMetaData } from './index';

export function pagination(type: 'classic' | 'cursor' = 'classic', pageSize: number = 10, sizes: number[] = [10, 15, 20, 25, 50, 100]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    method.bind(target);

    setMetaData(target.constructor.name, propertyKey, {pagination: {type, pageSize, sizes}});

    descriptor.value = (req) => {
      const page = req.query.page ? parseInt(req.query.page) : 1;

      let size = pageSize;
      if (req.query.pageSize) {
        const $size = parseInt(req.query.pageSize);
        if (sizes.indexOf($size) !== -1) {
          size = $size;
        }
      }
      req.params.page = page;
      req.params.pageSize = size;
      if (type === 'classic') {
        req.params.offset = (page - 1) * size;
      } else {
        req.params.cursor = req.query.cursor || null;
      }

      return method(req);
    }
  }
}