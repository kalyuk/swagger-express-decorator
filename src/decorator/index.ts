import { defaultsDeep } from 'lodash';

const metaData: any = {};

export function setMetaData(name: string, key: string, value: any) {
  if (!metaData[name]) {
    metaData[name] = {};
  }

  if (typeof value === 'object') {
    if (!metaData[name][key]) {
      metaData[name][key] = {};
    }
    metaData[name][key] = defaultsDeep(value, metaData[name][key])
  } else {
    metaData[name][key] = value;
  }
}

export function getMetaData(name?: string, key?: string) {
  if (!name) {
    return metaData;
  }
  if (!key) {
    return metaData[name];
  }

  return metaData[name][key];
}