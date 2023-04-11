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
  }
}
