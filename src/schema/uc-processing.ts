/**
 * Per-tool schema processing instructions.
 *
 * Contains instructions for named processing tools.
 */
export interface UcProcessing {
  /**
   * Schema deserializer instructions.
   */
  readonly deserializer?: UcProcessing.Instruction;

  /**
   * Schema serializer instructions.
   */
  readonly serializer?: UcProcessing.Instruction;

  readonly [tool: string]: UcProcessing.Instruction;
}

export namespace UcProcessing {
  /**
   * One or more schema processing instructions.
   */
  export type Instructions = Instruction | readonly Instructions[] | undefined;

  /**
   * Schema processing instruction.
   *
   * Specifies a configuration to import from specific ECMAScript module. The imported configuration is a function with
   * signature specific to processing tool.
   */
  export interface Instruction {
    /**
     * Name of ECMAScript module to import configuration from.
     */
    readonly from: string;

    /**
     * Configuration symbol to import {@link from} the module.
     *
     * The symbol is either a function to call, or an object with {@link method} to call if the latter specified.
     */
    readonly symbol: string;

    /**
     * Static method to call on imported {@link symbol}.
     */
    readonly method?: string | undefined;
  }
}
