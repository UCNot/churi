import { UccCode } from '../ucc-code.js';
import { UcrxTemplate } from './ucrx-template.js';

export class UcrxMethod<in out TArgs extends string[] = [string]> {

  static get predefined(): UcrxMethod.Predefined {
    return UcrxMethod$predefined;
  }

  readonly #key: string;
  readonly #typeName: string | undefined;
  readonly #args: TArgs;

  constructor(
    options: [string] extends TArgs ? UcrxMethod.StandardOptions : UcrxMethod.Options<TArgs>,
  );

  constructor({ key, args = ['value'] as unknown as TArgs, typeName }: UcrxMethod.Options<TArgs>) {
    this.#key = key;
    this.#args = args;
    this.#typeName = typeName;
  }

  get key(): string {
    return this.#key;
  }

  get typeName(): string | undefined {
    return this.#typeName;
  }

  get args(): TArgs {
    return this.#args;
  }

  declare(template: UcrxTemplate, key: string, declare: UcrxMethod.Decl<TArgs>): UccCode.Source {
    const args = this.#createArgs(template);

    return code => {
      code
        .write(`${key}(${args.join(', ')}) {`)
        .indent(declare({ template, method: this, key, args, prefix: 'return ', suffix: ';' }))
        .write(`}`);
    };
  }

  #createArgs(template: UcrxTemplate): TArgs {
    const { args } = this;

    if (!args.length) {
      return args;
    }

    const ns = template.lib.ns.nest();

    return args.map(arg => ns.name(arg)) as TArgs;
  }

}

const UcrxMethod$predefined: UcrxMethod.Predefined = {
  bol: /*#__PURE__*/ new UcrxMethod({ key: 'bol', typeName: 'boolean' }),
  big: /*#__PURE__*/ new UcrxMethod({ key: 'big', typeName: 'bigint' }),
  nls: /*#__PURE__*/ new UcrxMethod<[]>({
    key: 'nls',
    args: [],
    typeName: 'nested list',
  }),
  num: /*#__PURE__*/ new UcrxMethod({ key: 'num', typeName: 'number' }),
  str: /*#__PURE__*/ new UcrxMethod({ key: 'str', typeName: 'string' }),
  for: /*#__PURE__*/ new UcrxMethod({ key: 'for', args: ['for'] }),
  map: /*#__PURE__*/ new UcrxMethod<[]>({ key: 'for', args: [], typeName: 'map' }),
  em: /*#__PURE__*/ new UcrxMethod<[]>({ key: 'em', args: [] }),
  ls: /*#__PURE__*/ new UcrxMethod<[]>({ key: 'ls', args: [] }),
  any: /*#__PURE__*/ new UcrxMethod({ key: 'any', typeName: 'any' }),
  nul: /*#__PURE__*/ new UcrxMethod<[]>({ key: 'nul', args: [], typeName: 'null' }),
};

export namespace UcrxMethod {
  export interface Options<out TArgs extends string[]> {
    readonly key: string;
    readonly args: TArgs;
    readonly typeName?: string | undefined;
  }

  export interface StandardOptions {
    readonly key: string;
    readonly args?: [string] | undefined;
    readonly typeName?: string | undefined;
  }

  export type Decl<in TArgs extends string[]> = (location: Location<TArgs>) => UccCode.Source;

  export interface Location<out TArgs extends string[]> {
    readonly template: UcrxTemplate;
    readonly method: UcrxMethod<TArgs>;
    readonly key: string;
    readonly args: TArgs;
    readonly prefix: string;
    readonly suffix: string;
  }

  export interface Predefined {
    readonly bol: UcrxMethod;
    readonly big: UcrxMethod;
    readonly nls: UcrxMethod<[]>;
    readonly num: UcrxMethod;
    readonly str: UcrxMethod;
    readonly for: UcrxMethod;
    readonly map: UcrxMethod<[]>;
    readonly em: UcrxMethod<[]>;
    readonly ls: UcrxMethod<[]>;
    readonly any: UcrxMethod;
    readonly nul: UcrxMethod<[]>;
  }

  export type ArgsType<TMethod extends UcrxMethod<any>> = TMethod extends UcrxMethod<infer TArgs>
    ? TArgs
    : never;
}
