/**
 * A location within source code to place charge receiver {@link UcrxTemplate#newInstance instantiation} code.
 *
 * The generated code expected to be placed between the give {@link UcrxLocation#prefix prefix}
 * and {@link UcrxLocation#suffix suffix}.
 */
export interface UcrxLocation {
  /**
   * An expression resolved to value setter function.
   */
  readonly setter: string;

  /**
   * An expression resolved to charge processing {@link UcrxContext context}.
   */
  readonly context: string;

  /**
   * The code immediately preceding the instantiation.
   */
  readonly prefix: string;

  /**
   * The code immediately following the instantiation.
   */
  readonly suffix: string;
}
