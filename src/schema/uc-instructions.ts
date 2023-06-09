import { asArray } from '@proc7ts/primitives';

/**
 * Per-tool schema processing instructions.
 *
 * Contains instructions for named processing tools.
 */
export interface UcInstructions {
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
 * The instructions specified later take precedence over preceding ones.
 *
 * @param instructions - Instructions to combine.
 *
 * @returns Combined instructions or `undefined` if nothing to combine.
 */
export function ucInstructions(...instructions: UcInstructions[]): UcInstructions | undefined {
  if (instructions.length < 2) {
    return instructions.length ? instructions[0] : undefined;
  }

  const result: {
    -readonly [tool in keyof UcInstructions]: UcInstructions[tool];
  } = {};

  for (const instr of instructions.reverse()) {
    for (const [tool, forTool] of Object.entries(instr) as [
      keyof UcInstructions,
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
