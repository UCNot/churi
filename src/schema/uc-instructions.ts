import { asArray } from '@proc7ts/primitives';
import { UcSchema } from './uc-schema.js';

/**
 * Per-tool schema processing instructions.
 *
 * Contains instructions for named processing tools.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Supported schema type.
 */
export interface UcInstructions<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {
  /**
   * Marker method needed for correct type inference.
   *
   * Not supposed to be defined.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __UcInstructions__?(schema: TSchema): TSchema;

  /**
   * Schema deserializer instructions.
   */
  readonly deserializer?: UcInstructions.ForTool;

  /**
   * Schema serializer instructions.
   */
  readonly serializer?: UcInstructions.ForTool;
}

export namespace UcInstructions {
  /**
   * Name of schema processing tool.
   */
  export type ToolName = Exclude<keyof UcInstructions, '__UcInstructions__'>;

  /**
   * Schema processing instructions for particular tool.
   */
  export interface ForTool {
    /**
     * Features to enable for schema processing.
     */
    readonly use?: UseFeature | readonly UseFeature[] | undefined;
  }

  /**
   * An instruction to enable schema processing feature.
   *
   * The feature is declared in ECMAScript module and exported from it as a named symbol.
   *
   * The feature signature is specific to processing tool.
   */
  export interface UseFeature {
    /**
     * Name of ECMAScript module to import the feature from.
     */
    readonly from: string;

    /**
     * ECMAScript symbol to import {@link from} the module and use as schema processing feature.
     */
    readonly feature: string;

    /**
     * Additional options for the feature.
     */
    readonly options?: unknown;
  }
}

/**
 * Combines per-tool schema processing instructions.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Supported schema type.
 * @param instructions - Instructions to combine.
 *
 * @returns Combined instructions or `undefined` if nothing to combine.
 */
/*#__NO_SIDE_EFFECTS__*/
export function ucInstructions<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  ...instructions: UcInstructions<T, TSchema>[]
): UcInstructions<T, TSchema> | undefined {
  if (instructions.length < 2) {
    return instructions.length ? instructions[0] : undefined;
  }

  const result: {
    -readonly [tool in keyof UcInstructions<T, TSchema>]: UcInstructions<T, TSchema>[tool];
  } = {};

  for (const instr of instructions) {
    for (const [tool, forTool] of Object.entries(instr) as [
      UcInstructions.ToolName,
      UcInstructions.ForTool | undefined,
    ][]) {
      if (forTool) {
        const prevForTool = result[tool] as UcInstructions.ForTool | undefined;

        if (prevForTool) {
          result[tool] = {
            use: [...asArray(prevForTool.use), ...asArray(forTool.use)],
          };
        } else {
          result[tool] = forTool;
        }
      }
    }
  }

  return result;
}
