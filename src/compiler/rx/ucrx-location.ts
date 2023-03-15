import { UccArgs } from '../ucc-args.js';

/**
 * A location within source code to place charge receiver {@link UcrxTemplate#newInstance instantiation} code.
 *
 * The generated code expected to be placed between the give {@link UcrxLocation#prefix prefix}
 * and {@link UcrxLocation#suffix suffix}.
 */
export interface UcrxLocation<TArg extends string = string> {
  /**
   * New instance arguments.
   */
  readonly args: UccArgs.ByName<TArg>;

  /**
   * The code immediately preceding the instantiation.
   */
  readonly prefix: string;

  /**
   * The code immediately following the instantiation.
   */
  readonly suffix: string;
}
