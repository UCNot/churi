import { UcSchema } from '../../schema/uc-schema.js';
import { UccArgs } from '../ucc-args.js';
import { UcrxArgs } from './ucrx-args.js';
import { UcrxLib } from './ucrx-lib.js';

/**
 * A location within source code to place charge receiver {@link UcrxTemplate#newInstance instantiation} code.
 *
 * The generated code expected to be placed between the give {@link UcrxLocation#prefix prefix}
 * and {@link UcrxLocation#suffix suffix}.
 */
export interface UcrxLocation<
  out T = unknown,
  out TSchema extends UcSchema<T> = UcSchema<T>,
  in TArg extends string = UcrxArgs.Arg,
> {
  /**
   * Charge receiver library.
   */
  readonly lib: UcrxLib;

  /**
   * Data schema supported by charge receiver.
   */
  readonly schema: TSchema;

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
