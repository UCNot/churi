import { UcPrimitive } from './uc-primitive.js';
import { UcValue } from './uc-value.js';

/**
 * URI charge list represented as JavaScript array.
 *
 * @typeParam TValue - List item value type.
 */

export type UcList<TValue = UcPrimitive> = UcValue<TValue>[];
