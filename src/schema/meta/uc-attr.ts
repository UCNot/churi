import { UcMetaAttr } from './uc-meta-attr.js';
import { UcMeta } from './uc-meta.js';

/**
 * Default typed {@link UcMeta charge metadata} attribute implementation.
 *
 * Stores all values added to metadata as array. Extracts the latest one as single attribute value.
 *
 * @typeParam T - Attribute value type.
 */
export class UcAttr<out T = unknown> extends UcMetaAttr<T, T, T[]> {
  override extract(data: T[] | undefined, meta: UcMeta): T | undefined;
  override extract(data: T[] | undefined, _meta: UcMeta): T | undefined {
    return data && data[data.length - 1];
  }

  override extractAll(data: T[] | undefined, meta: UcMeta): T[];
  override extractAll(data: T[] | undefined, _meta: UcMeta): T[] {
    return data ? data.slice() : [];
  }

  override store(data: T[] | undefined, value: T, meta: UcMeta): T[];
  override store(data: T[] | undefined, value: T, _meta: UcMeta): T[] {
    if (data) {
      data.push(value);

      return data;
    }

    return [value];
  }

  override clone(data: T[]): T[] {
    return data.slice();
  }

  override merge(first: T[], second: T[]): T[] {
    return [...first, ...second];
  }
}
