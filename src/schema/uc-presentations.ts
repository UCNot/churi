import { UcConstraints, ucConstraints } from './uc-constraints.js';
import { UcSchema } from './uc-schema.js';

/**
 * Schema {@link UcConstraints constraints} for schema instances.
 *
 * Each property corresponds to particular schema instance presentation.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Supported schema type.
 */
export type UcPresentations<
  T = unknown,
  TSchema extends UcSchema<T> = UcSchema<T>,
> = UcFormatPresentations<T, TSchema> & UcInsetPresentations<T, TSchema>;

/**
 * Name of schema instance presentation.
 *
 * Used to provide {@link UcConstraints schema constraints} for particular presentation.
 */
export type UcPresentationName = keyof UcPresentations;

/**
 * Schema {@link UcConstraints constraints} for presentations of schema instances used as top-level formats.
 *
 * Each property corresponds to particular format presentation.
 *
 * More presentations may be added by augmenting this interface.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Supported schema type.
 */
export interface UcFormatPresentations<
  out T = unknown,
  out TSchema extends UcSchema<T> = UcSchema<T>,
> {
  /**
   * Constraints for schema instance represented in {@link UcChargeLexer URI Charge Notation}.
   */
  readonly charge?: UcConstraints<T, TSchema> | undefined;

  /**
   * Constraints for schema instance represented as {@link UcPlainTextLexer plain text}.
   */
  readonly plainText?: UcConstraints<T, TSchema> | undefined;

  /**
   * Constraints for schema instance represented as {@link UcURIEncodedLexer URI-encoded value}.
   */
  readonly uriEncoded?: UcConstraints<T, TSchema> | undefined;

  /**
   * Constraints for schema instance represented as `&` or `;` - separated {@link UcURIParamsLexer URI parameters}.
   *
   * This works for e.g.:
   *
   * - {@link ChURIQuery URI query} parameters,
   * - {@link ChURIMatrix URI matrix} parameters,
   * - {@link ChURIAnchor URI hash} parameters,
   * - `application/x-www-form-urlencoded` body.
   */
  readonly uriParams?: UcConstraints<T, TSchema> | undefined;
}

/**
 * Name of supported input format presentation.
 */
export type UcFormatName = keyof UcFormatPresentations;

/**
 * Schema {@link UcConstraints constraints} for presentations of schema instances existing as other presentations'
 * insets.
 *
 * Each property corresponds to particular inset presentation.
 *
 * More presentations may be added by augmenting this interface.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Supported schema type.
 */
export interface UcInsetPresentations<
  out T = unknown,
  out TSchema extends UcSchema<T> = UcSchema<T>,
> {
  /**
   * Constraints for default inset formatting.
   */
  readonly inset?: UcConstraints<T, TSchema> | undefined;

  /**
   * Constraints for schema instance represented as {@link UcURIParamsLexer URI parameter} value.
   *
   * This works for e.g.:
   *
   * - {@link ChURIQuery URI query} parameters,
   * - {@link ChURIMatrix URI matrix} parameters,
   * - {@link ChURIAnchor URI hash} parameters,
   * - `application/x-www-form-urlencoded` body.
   */
  readonly uriParam?: UcConstraints<T, TSchema> | undefined;
}

/**
 * Name of supported inset presentation.
 */
export type UcInsetName = keyof UcInsetPresentations;

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
      UcConstraints<T, TSchema> | undefined,
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
