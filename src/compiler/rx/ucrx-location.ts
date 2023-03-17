import { UcrxArgs } from './ucrx.args.js';

/**
 * A location within source code to place charge receiver {@link UcrxTemplate#newInstance instantiation} code.
 *
 * The generated code expected to be placed between the give {@link UcrxLocation#prefix prefix}
 * and {@link UcrxLocation#suffix suffix}.
 *
 * @typeParam TArg - Type of arguments of charge receiver's constructor.
 */
export interface UcrxLocation {
  /**
   * New instance arguments.
   */
  readonly args: UcrxArgs.ByName;

  /**
   * The code immediately preceding the instantiation.
   */
  readonly prefix: string;

  /**
   * The code immediately following the instantiation.
   */
  readonly suffix: string;
}
