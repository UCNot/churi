import { EsCode, EsSnippet, EsVarSymbol, esline } from 'esgen';
import { UcrxSetterSignature } from '../rx/ucrx-setter.js';

export function ucvValidate(
  args: UcrxSetterSignature.Values,
  validate: (context: UcvValidationContext) => EsSnippet,
): EsSnippet;

export function ucvValidate(
  args: UcrxSetterSignature.Values,
  validate: (context: UcvValidationContext) => EsSnippet,
): EsSnippet {
  return (code, scope) => {
    code.write(scope.get(UcvValidationSnippet).validate(args, validate));
  };
}

export interface UcvValidationContext {
  readonly value: EsSnippet;
  reject(this: void, reason: EsSnippet): EsSnippet;
}

class UcvValidationSnippet {
  static esScopedValue(): UcvValidationSnippet {
    return new UcvValidationSnippet();
  }

  readonly #validations: ((context: UcvValidationContext) => EsSnippet)[] = [];
  #args!: UcrxSetterSignature.Values;

  validate(
    args: UcrxSetterSignature.Values,
    validate: (context: UcvValidationContext) => EsSnippet,
  ): EsSnippet {
    const code = this.#init(args);

    this.#validations.push(validate);

    return code;
  }

  #init(args: UcrxSetterSignature.Values): EsSnippet {
    if (this.#args) {
      return EsCode.none;
    }

    this.#args = args;

    return code => {
      if (this.#validations.length > 1) {
        const invalid = new EsVarSymbol('invalid');

        code.write(invalid.let({ value: () => '0' }));
        for (const validate of this.#validations) {
          code.write(
            validate({
              value: this.#args.value,
              reject: reason => code => {
                code.write(esline`${this.#args.cx}.reject(${reason});`, esline`${invalid} = 1;`);
              },
            }),
          );
        }

        code
          .write(esline`if (${invalid}) {`)
          .indent('return 0;')
          .write('}');
      } else {
        const [validate] = this.#validations;

        code.write(
          validate({
            value: this.#args.value,
            reject: reason => code => {
              code.write(esline`return ${this.#args.cx}.reject(${reason});`);
            },
          }),
        );
      }
    };
  }
}
