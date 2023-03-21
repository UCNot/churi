import { UccArgs } from '../codegen/ucc-args.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { UcrxTemplate } from './ucrx-template.js';

export class UcrxMethod<in out TArg extends string = string> {

  readonly #method: UccMethod<TArg>;
  readonly #typeName: string | undefined;

  constructor(options: UcrxMethod.Options<TArg>);

  constructor({ key, args = ['value' as TArg], typeName }: UcrxMethod.Options<TArg>) {
    this.#method = new UccMethod(key, args);
    this.#typeName = typeName;
  }

  get key(): string {
    return this.#method.name;
  }

  get args(): UccArgs<TArg> {
    return this.#method.args;
  }

  get typeName(): string | undefined {
    return this.#typeName;
  }

  declare(template: UcrxTemplate, key: string, body: UcrxMethod.Body<TArg>): UccCode.Source {
    return this.#method.declare(template.lib.ns.nest(), args => body({ template, method: this, key, args }));
  }

}

export namespace UcrxMethod {
  export interface Options<in out TArg extends string> {
    readonly key: string;
    readonly args: UccArgs.Spec<TArg>;
    readonly typeName?: string | undefined;
  }

  export type Body<in TArg extends string> = (location: Declaration<TArg>) => UccCode.Source;

  export interface Declaration<out TArg extends string> {
    readonly template: UcrxTemplate;
    readonly method: UcrxMethod<TArg>;
    readonly key: string;
    readonly args: UccArgs.ByName<TArg>;
  }

  export type ArgType<TMethod extends UcrxMethod<any>> = TMethod extends UcrxMethod<infer TArg>
    ? TArg
    : never;
}
