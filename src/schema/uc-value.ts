import { UcEntity } from './uc-entity.js';
import { UcList } from './uc-list.js';
import { UcMap } from './uc-map.js';
import { UcPrimitive } from './uc-primitive.js';

/**
 * URI charge value represented as native JavaScript value.
 *
 * May be one of:
 *
 * - value of base type.
 * - {@link UcPrimitive primitive value},
 * - object representing {@link UcMap map},
 * - array representing {@link UcList list},
 * - opaque {@link UcEntity entity}.
 *
 * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
 */
export type UcValue<TValue = UcPrimitive> =
  | TValue
  | UcPrimitive
  | UcEntity
  | UcMap<TValue>
  | UcList<TValue>;
