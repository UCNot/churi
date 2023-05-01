import { arraysAreEqual, isArray } from '@proc7ts/primitives';
import { UccNamespace } from './ucc-namespace.js';

export class UccArgs<in out TArg extends string = ''> {

  static by<TArg extends string>(spec: UccArgs.Spec<TArg>): UccArgs<TArg> {
    return isArray(spec) ? new UccArgs(...spec) : spec;
  }

  readonly #list: readonly TArg[];
  #byName?: UccArgs.ByName<TArg>;

  constructor(...args: TArg[]) {
    this.#list = args;
  }

  get list(): readonly TArg[] {
    return this.#list;
  }

  get byName(): UccArgs.ByName<TArg> {
    return (this.#byName ??= Object.fromEntries<string>(
      this.list.map(arg => [arg, arg]),
    ) as UccArgs.ByName<TArg>);
  }

  declare(ns: UccNamespace): UccArgs.Binding<TArg> {
    const args: Record<string, string> = {};
    const list: string[] = [];

    for (const arg of this.list) {
      const alias = ns.name(arg);

      args[arg] = alias;
      list.push(arg);
    }

    return {
      args: args as UccArgs.ByName<TArg>,
      list,
      toString: () => list.join(', '),
    };
  }

  bind(byName: UccArgs.ByName<TArg>): UccArgs.Binding<TArg> {
    const args: Record<string, string> = {};
    const list: string[] = [];

    for (const arg of this.list) {
      const alias = byName[arg];

      args[arg] = alias;
      list.push(arg);
    }

    return {
      args: args as UccArgs.ByName<TArg>,
      list,
      toString: () => list.join(', '),
    };
  }

  call<TCallArg extends string>(args: UccArgs.ByName<TCallArg>): UccArgs.Binding<TArg> {
    const list: string[] = [];
    const byName: Partial<Record<TArg, string>> = {};

    for (const arg of this.list) {
      const value = args[arg as string as TCallArg];

      if (!value) {
        const actualArgs =
          '{'
          + Object.entries(args)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
          + '}';

        throw new TypeError(
          `Can not substitute ${actualArgs} to ${this} args. "${arg}" argument is missing`,
        );
      }

      list.push(value);
      byName[arg] = value;
    }

    return {
      args: byName as UccArgs.ByName<TArg>,
      list,
      toString: () => list.join(', '),
    };
  }

  equals<TOtherArg extends string>(other: UccArgs<TOtherArg>): boolean {
    return arraysAreEqual<string>(this.list, other.list);
  }

  toString(): string {
    return '(' + this.#list.join(', ') + ')';
  }

}

export namespace UccArgs {
  export type Spec<TArg extends string> = readonly TArg[] | UccArgs<TArg>;

  export type ByName<in TArg extends string> = { readonly [key in TArg]: string };

  export interface Binding<in TArg extends string> {
    readonly args: ByName<TArg>;
    readonly list: readonly string[];
    toString(): string;
  }
}
