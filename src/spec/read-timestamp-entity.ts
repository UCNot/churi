import { UcrxSetter } from '../compiler/rx/ucrx-setter.js';
import { UcdReader } from '../deserializer/ucd-reader.js';
import { UcrxContext } from '../rx/ucrx-context.js';
import { ucrxUnexpectedTypeError } from '../rx/ucrx-errors.js';
import { Ucrx } from '../rx/ucrx.js';
import { printUcTokens } from '../syntax/print-uc-token.js';
import { UcToken } from '../syntax/uc-token.js';

export function readTimestampEntity(
  reader: UcdReader,
  rx: Ucrx,
  _prefix: readonly UcToken[],
  args: readonly UcToken[],
): void {
  ucrxTimestamp(reader, rx, new Date(printUcTokens(args)));
}

export const TimestampUcrxMethod = new UcrxSetter({
  key: 'date',
  stub: ({ value }) => `return this.num(${value}.getTime());`,
  typeName: 'date',
});

function ucrxTimestamp(context: UcrxContext, rx: Ucrx, value: Date): void {
  const tsRx = rx as TimestampUcrx;

  if (!tsRx.date(value)) {
    context.error(ucrxUnexpectedTypeError('date', rx));
  }
}

interface TimestampUcrx extends Ucrx {
  date(date: Date): 0 | 1;
}
