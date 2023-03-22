import { UcrxSetter } from '../compiler/rx/ucrx-setter.js';

export const TimestampUcrxMethod = new UcrxSetter({
  key: 'date',
  stub: ({ value }) => `return this.num(${value}.getTime());`,
  typeName: 'date',
});
