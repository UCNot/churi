import { UcConstraints, ucConstraints } from './uc-constraints.js';
import { UcSchema } from './uc-schema.js';

/**
 * Schema {@link UcConstraints constraints} for schema instance presentations.
 *
 * Each property corresponds to particular schema instance presentation.
 *
 * More presentations may be added by augmenting this interface.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Supported schema type.
 */
export interface UcPresentations<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {
  /**
   * Marker method needed for correct type inference.
   *
   * Not supposed to be defined.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __UcPresentations__?(schema: TSchema): TSchema;

  /**
   * Constraints for schema instance represented as URI Charge.
   */
  readonly charge?: UcConstraints | undefined;

  /**
   * Constraints for schema instance represented as URI {@link ChURIParams parameter} value.
   *
   * This works for e.g.:
   *
   * - {@link ChURIQuery URI query} parameters,
   * - {@link ChURIMatrix URI matrix} parameters,
   * - {@link ChURIAnchor URI hash} parameters,
   * - `application/x-www-form-urlencoded` body.
   */
  readonly uriParam?: UcConstraints | undefined;
}

/**
 * Name of schema instance presentation.
 *
 * Used to provide {@link UcConstraints schema constraints} for particular presentation.
 */
export type UcPresentationName = Exclude<keyof UcPresentations, '__UcPresentations__'>;

/**
 * Combines schema instance presentation constraints.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Supported schema type.
 * @param presentations - Constraints to combine.
 *
 * @returns Combined schema constraints, or `undefined` if nothing to combine.
 */
/*#__NO_SIDE_EFFECTS__*/
export function ucPresentations<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  ...presentations: UcPresentations<T, TSchema>[]
): UcPresentations<T, TSchema> | undefined {
  if (presentations.length < 2) {
    return presentations.length ? presentations[0] : undefined;
  }

  const result: {
    -readonly [presentationName in UcPresentationName]?: UcPresentations<
      T,
      TSchema
    >[presentationName];
  } = {};

  for (const constr of presentations) {
    for (const [presentationName, constraints] of Object.entries(constr) as [
      UcPresentationName,
      UcConstraints | undefined,
    ][]) {
      if (constraints) {
        const prevConstraints = result[presentationName];

        if (prevConstraints) {
          result[presentationName] = ucConstraints(prevConstraints, constraints);
        } else {
          result[presentationName] = constraints;
        }
      }
    }
  }

  return result;
}
