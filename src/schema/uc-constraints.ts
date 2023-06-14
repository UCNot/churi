import { asArray, elementOrArray } from '@proc7ts/primitives';
import { UcSchema } from './uc-schema.js';

/**
 * Schema constraints for schema processors.
 *
 * Each property corresponds to particular schema processor.
 *
 * More processors may be added by augmenting this interface.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Supported schema type.
 */
export interface UcConstraints<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {
  /**
   * Marker method needed for correct type inference.
   *
   * Not supposed to be defined.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __UcConstraints__?(schema: TSchema): TSchema;

  /**
   * Schema deserializer constraints.
   */
  readonly deserializer?: UcFeatureConstraint | readonly UcFeatureConstraint[] | undefined;

  /**
   * Schema serializer constraints.
   */
  readonly serializer?: UcFeatureConstraint | readonly UcFeatureConstraint[] | undefined;

  /**
   * Schema validation constraints.
   */
  readonly validator?: UcFeatureConstraint | readonly UcFeatureConstraint[] | undefined;
}

/**
 * Name of schema processor.
 *
 * Used to provide {@link UcConstraints schema constraints} for particular processor.
 */
export type UcProcessorName = Exclude<keyof UcConstraints, '__UcConstraints__'>;

/**
 * {@link UcConstraint Schema constraint} instructing a processor to enable and use particular processing feature.
 *
 * The feature is declared in ECMAScript module and exported from it as a named symbol.
 *
 * The feature interface is specific to schema processor.
 */
export interface UcFeatureConstraint {
  /**
   * Feature name to use.
   *
   * ECMAScript symbol to import {@link from} the module and use as schema processing feature.
   */
  readonly use: string;

  /**
   * Name of ECMAScript module to import the feature from.
   */
  readonly from: string;

  /**
   * Additional options to pass to the feature.
   *
   * The format is specific to the feature.
   */
  readonly with?: unknown;
}

/**
 * Combines schema constraints.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Supported schema type.
 * @param constraints - Constraints to combine.
 *
 * @returns Combined schema constraints, or `undefined` if nothing to combine.
 */
/*#__NO_SIDE_EFFECTS__*/
export function ucConstraints<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  ...constraints: UcConstraints<T, TSchema>[]
): UcConstraints<T, TSchema> | undefined {
  if (constraints.length < 2) {
    return constraints.length ? constraints[0] : undefined;
  }

  const result: {
    -readonly [processorName in keyof UcConstraints<T, TSchema>]: UcConstraints<
      T,
      TSchema
    >[processorName];
  } = {};

  for (const constr of constraints) {
    for (const [processorName, forProcessor] of Object.entries(constr) as [
      UcProcessorName,
      UcFeatureConstraint | readonly UcFeatureConstraint[] | undefined,
    ][]) {
      if (forProcessor) {
        const prevForProcessor = result[processorName];

        if (prevForProcessor) {
          result[processorName] = elementOrArray([
            ...asArray(prevForProcessor),
            ...asArray(forProcessor),
          ]);
        } else {
          result[processorName] = forProcessor;
        }
      }
    }
  }

  return result;
}
