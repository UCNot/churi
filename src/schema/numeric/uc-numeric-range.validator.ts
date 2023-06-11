import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcSchema } from '../uc-schema.js';
import { UcvNumericRange } from './uc-numeric-range.impl.js';

export function ucMin(min: number, message?: string): UcSchema.Extension<number | bigint>;
export function ucMin(min: bigint, message?: string): UcSchema.Extension<bigint>;

export function ucMin(min: number | bigint, message?: string): UcSchema.Extension<number | bigint> {
  return ucNumericRangeValidator({
    type: 'min',
    bound: min,
    message,
  });
}

export function ucGreaterThan(min: number, message?: string): UcSchema.Extension<number | bigint>;
export function ucGreaterThan(min: bigint, message?: string): UcSchema.Extension<bigint>;

export function ucGreaterThan(
  min: number | bigint,
  message?: string,
): UcSchema.Extension<number | bigint> {
  return ucNumericRangeValidator({
    type: 'min',
    bound: min,
    message,
  });
}

export function ucMax(max: number, message?: string): UcSchema.Extension<number | bigint>;
export function ucMax(max: bigint, message?: string): UcSchema.Extension<bigint>;

export function ucMax(max: number | bigint, message?: string): UcSchema.Extension<number | bigint> {
  return ucNumericRangeValidator({
    type: 'max',
    bound: max,
    message,
  });
}

export function ucLessThan(max: number, message?: string): UcSchema.Extension<number | bigint>;
export function ucLessThan(max: bigint, message?: string): UcSchema.Extension<bigint>;

export function ucLessThan(
  max: number | bigint,
  message?: string,
): UcSchema.Extension<number | bigint> {
  return ucNumericRangeValidator({
    type: 'max',
    bound: max,
    message,
  });
}

function ucNumericRangeValidator(options: UcvNumericRange): UcSchema.Extension<number | bigint> {
  return {
    with: {
      validator: {
        use: {
          from: COMPILER_MODULE,
          feature: 'ucvSupportNumericRange',
          options,
        },
      },
    },
  };
}
