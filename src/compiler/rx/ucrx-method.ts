import { UccArgs } from '../codegen/ucc-args.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { BaseUcrxTemplate } from './base.ucrx-template.js';
import { UcrxLib } from './ucrx-lib.js';

export class UcrxMethod<in out TArg extends string = string> {

  readonly #key: string;
  readonly #args: UccArgs<TArg>;
  readonly #stub: UcrxMethod.Body<TArg>;
  readonly #typeName: string | undefined;

  constructor(options: UcrxMethod.Options<TArg>);

  constructor({ key, args, stub, typeName }: UcrxMethod.Options<TArg>) {
    this.#key = key;
    this.#args = UccArgs.by(args);
    this.#stub = stub;
    this.#typeName = typeName;
  }

  get preferredKey(): string {
    return this.#key;
  }

  get args(): UccArgs<TArg> {
    return this.#args;
  }

  get stub(): UcrxMethod.Body<TArg> {
    return this.#stub;
  }

  get typeName(): string | undefined {
    return this.#typeName;
  }

  declare(template: BaseUcrxTemplate, body: UcrxMethod.Body<TArg>): UccCode.Source {
    return this.toMethod(template.lib).declare(template.lib.ns.nest(), (args, method) => body(args, method, template));
  }

  toMethod(lib: UcrxLib): UccMethod<TArg> {
    return lib.ucrxMethod(this);
  }

  toString(): string {
    return `Ucrx.${this.preferredKey}${this.args}`;
  }

}

export namespace UcrxMethod {
  export interface Options<in out TArg extends string> {
    readonly key: string;
    readonly args: UccArgs.Spec<TArg>;
    readonly stub: UcrxMethod.Body<TArg>;
    readonly typeName?: string | undefined;
  }

  export type Body<TArg extends string> = (
    args: UccArgs.ByName<TArg>,
    method: UccMethod<TArg>,
    template: BaseUcrxTemplate,
  ) => UccCode.Source;

  export type ArgType<TMethod extends UcrxMethod<any>> = TMethod extends UcrxMethod<infer TArg>
    ? TArg
    : never;
}
