import { UccArgs } from './ucc-args.js';
import { UccCode } from './ucc-code.js';
import { UccNamespace } from './ucc-namespace.js';

export class UccMethod<in out TArg extends string = string> {

  readonly #name: string;
  readonly #args: UccArgs<TArg>;

  constructor(name: string, args: UccArgs.Spec<TArg>) {
    this.#name = name;
    this.#args = UccArgs.by(args);
  }

  get name(): string {
    return this.#name;
  }

  get args(): UccArgs<TArg> {
    return this.#args;
  }

  declare(ns: UccNamespace, body: UccMethod.Body<TArg>): UccCode.Source {
    return code => {
      const binding = this.args.declare(ns);

      code.write(`${this.name}(${binding}) {`).indent(body(binding.args, this)).write(`}`);
    };
  }

  call(target: string, args: UccArgs.ByName<TArg>): string {
    return `${target}.${this.name}(${this.args.call(args)})`;
  }

  bind(target: string): string {
    return `${target}.${this.name}.bind(${target})`;
  }

}

export namespace UccMethod {
  export type Body<in out TArg extends string = string> = (
    args: UccArgs.ByName<TArg>,
    method: UccMethod<TArg>,
  ) => UccCode.Source;
}
