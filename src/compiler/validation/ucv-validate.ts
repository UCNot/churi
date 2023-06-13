import { EsSnippet, esline } from 'esgen';
import { UcrxSetterSignature } from '../rx/ucrx-setter.js';

export function ucvValidate(
  args: UcrxSetterSignature.Values,
  validate: (context: UcvValidationContext) => EsSnippet,
): EsSnippet;
export function ucvValidate(
  { value, reject }: UcrxSetterSignature.Values,
  validate: (context: UcvValidationContext) => EsSnippet,
): EsSnippet {
  return validate({
    value,
    reject(reason) {
      return esline`return ${reject}(${reason});`;
    },
  });
}

export interface UcvValidationContext {
  readonly value: EsSnippet;
  reject(this: void, reason: EsSnippet): EsSnippet;
}
