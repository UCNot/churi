import { UccArgs } from '../codegen/ucc-args.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { BaseUcrxTemplate } from './base.ucrx-template.js';

export class UcrxMethod<in out TArg extends string = string> {

  readonly #key: string;
  readonly #args: UccArgs<TArg>;
  readonly #stub: UccMethod.Body<TArg>;
  readonly #typeName: string | undefined;

  constructor(options: UcrxMethod.Options<TArg>);

  constructor({ key, args, stub, typeName }: UcrxMethod.Options<TArg>) {
    this.#key = key;
    this.#args = UccArgs.by(args);
    this.#stub = stub;
    this.#typeName = typeName;
  }

  get key(): string {
    return this.#key;
  }

  get args(): UccArgs<TArg> {
    return this.#args;
  }

  get stub(): UccMethod.Body<TArg> {
    return this.#stub;
  }

  get typeName(): string | undefined {
    return this.#typeName;
  }

  declare(template: BaseUcrxTemplate, body?: UccMethod.Body<TArg>): UccCode.Source;
  declare({ lib }: BaseUcrxTemplate, body: UccMethod.Body<TArg> = this.stub): UccCode.Source {
    const method = lib.ucrxMethod(this);

    return method.declare(lib.ns.nest(), body);
  }

  toString(): string {
    return `Ucrx.${this.key}(${this.#args})`;
  }

}

export namespace UcrxMethod {
  export interface Options<in out TArg extends string> {
    readonly key: string;
    readonly args: UccArgs.Spec<TArg>;
    readonly stub: UccMethod.Body<TArg>;
    readonly typeName?: string | undefined;
  }

  export type ArgType<TMethod extends UcrxMethod<any>> = TMethod extends UcrxMethod<infer TArg>
    ? TArg
    : never;
}
