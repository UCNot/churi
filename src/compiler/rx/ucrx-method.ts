import { UccArgs } from '../codegen/ucc-args.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UcrxTemplate } from './ucrx-template.js';

export class UcrxMethod<in out TArg extends string = string> {

  readonly #key: string;
  readonly #typeName: string | undefined;
  readonly #args: UccArgs<TArg>;

  constructor(options: UcrxMethod.Options<TArg>);

  constructor({ key, args = ['value' as TArg], typeName }: UcrxMethod.Options<TArg>) {
    this.#key = key;
    this.#args = new UccArgs(...args);
    this.#typeName = typeName;
  }

  get key(): string {
    return this.#key;
  }

  get typeName(): string | undefined {
    return this.#typeName;
  }

  get args(): UccArgs<TArg> {
    return this.#args;
  }

  declare(template: UcrxTemplate, key: string, declare: UcrxMethod.Body<TArg>): UccCode.Source {
    const args = this.args.declare(template.lib.ns.nest());

    return code => {
      code
        .write(`${key}(${args}) {`)
        .indent(declare({ template, method: this, key, args: args.args }))
        .write(`}`);
    };
  }

}

export namespace UcrxMethod {
  export interface Options<out TArg extends string> {
    readonly key: string;
    readonly args: readonly TArg[];
    readonly typeName?: string | undefined;
  }

  export type Body<in TArg extends string> = (location: Location<TArg>) => UccCode.Source;

  export interface Location<out TArg extends string> {
    readonly template: UcrxTemplate;
    readonly method: UcrxMethod<TArg>;
    readonly key: string;
    readonly args: UccArgs.ByName<TArg>;
  }

  export type ArgType<TMethod extends UcrxMethod<any>> = TMethod extends UcrxMethod<infer TArg>
    ? TArg
    : never;
}
