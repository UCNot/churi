import { UcToken } from '../syntax/uc-token.js';
import { UcrxContext } from './ucrx-context.js';
import { Ucrx } from './ucrx.js';

/**
 * Formatted data receiver.
 *
 * Formatted data has syntax like `!format'data`.
 *
 * @param cx - Charge processing context.
 * @param rx - Charge receiver.
 * @param format - Name of format to decode.
 * @param data - Formatted data tokens. For example, this may be e.g. a base64-encoded value.
 *
 * @returns Either `1` if formatted data processed successfully, or `0` if format can not be recognized. The next format
 * receiver will be used in the latter case.
 */
export type FormatUcrx = (
  this: void,
  cx: UcrxContext,
  rx: Ucrx,
  format: string,
  data: readonly UcToken[],
) => 0 | 1;
