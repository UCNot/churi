/**
 * Per-tool schema processing instructions.
 *
 * Contains instructions for named processing tools.
 */
export interface UcProcessing {
  /**
   * Schema deserializer instructions.
   */
  readonly deserializer?: UcProcessing.Feature;

  /**
   * Schema serializer instructions.
   */
  readonly serializer?: UcProcessing.Feature;

  readonly [tool: string]: UcProcessing.Feature;
}

export namespace UcProcessing {
  /**
   * Schema processing instructions.
   */
  export type Instruction = Feature | readonly Feature[] | undefined;

  /**
   * An instruction to enable schema processing feature.
   *
   * The feature is declared in ECMAScript module and exported from it as a named symbol.
   *
   * The feature signature is specific to processing tool.
   */
  export interface Feature {
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
