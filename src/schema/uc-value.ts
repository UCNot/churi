import { UcDirective } from './uc-directive.js';
import { UcEntity } from './uc-entity.js';
import { UcList } from './uc-list.js';
import { UcMap } from './uc-map.js';

/**
 * URI charge value represented as native JavaScript value.
 *
 * May be one of:
 *
 * - value of base type.
 * - {@link UcPrimitive primitive value},
 * - object representing {@link UcMap map},
 * - array representing {@link UcList list},
 * - unrecognized {@link UcEntity entity},
 * - unrecognized {@link UcDirective directive} containing charge value.
 *
 * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
 */
export type UcValue<TValue = UcPrimitive> =
  | TValue
  | UcPrimitive
  | UcEntity
  | UcMap<TValue>
  | UcList<TValue>
  | UcDirective<UcValue<TValue>>;

/**
 * Primitive value that may be present within URI charge.
 *
 * Any JavaScript primitive, including `null`, and excluding `Symbol` and `undefined`.
 */
export type UcPrimitive = bigint | boolean | number | string | null;
