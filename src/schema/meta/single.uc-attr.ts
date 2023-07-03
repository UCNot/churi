import { UcMetaAttr } from './uc-meta-attr.js';
import { UcMeta } from './uc-meta.js';

/**
 * Typed {@link UcMeta charge metadata} attribute that stores single, last assigned, value.
 *
 * @typeParam T - Attribute value type.
 */
export class SingleUcAttr<out T = unknown> extends UcMetaAttr<T, T, T> {

  override extract(data: T | undefined, meta: UcMeta): T | undefined;
  override extract(data: T | undefined, _meta: UcMeta): T | undefined {
    return data;
  }

  override extractAll(data: T | undefined, meta: UcMeta): T[];
  override extractAll(data: T | undefined, _meta: UcMeta): T[] {
    return data !== undefined ? [data] : [];
  }

  override store(data: T | undefined, value: T, meta: UcMeta): T;
  override store(_data: T | undefined, value: T, _meta: UcMeta): T {
    return value;
  }

  override clone(data: T): T {
    return data;
  }

  override merge(first: T, second: T): T;
  override merge(_first: T, second: T): T {
    return second;
  }

}
