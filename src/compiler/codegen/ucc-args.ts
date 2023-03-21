import { arraysAreEqual } from '@proc7ts/primitives';
import { UccNamespace } from './ucc-namespace.js';

export class UccArgs<in out TArg extends string = ''> {

  readonly #list: readonly TArg[];
  readonly #byName: UccArgs.ByName<TArg>;

  constructor(...args: TArg[]) {
    this.#list = args;
    this.#byName = Object.fromEntries<string>(args.map(arg => [arg, arg])) as UccArgs.ByName<TArg>;
  }

  get list(): readonly TArg[] {
    return this.#list;
  }

  get byName(): UccArgs.ByName<TArg> {
    return this.#byName;
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

  call<TCallArg extends string>(args: UccArgs.ByName<TCallArg>): UccArgs.Binding<TArg> {
    const list: string[] = [];

    for (const arg of this.list) {
      const subst = args[arg as string as TCallArg];

      if (!subst) {
        const actualArgs =
          '{'
          + Object.entries(args)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
          + '}';

        throw new TypeError(`Can not substitute ${actualArgs} to ${this} args. ${arg} is missing`);
      }

      list.push(subst);
    }

    return {
      args: args as UccArgs.ByName<string>,
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
  export type ByName<in TArg extends string> = { readonly [key in TArg]: string };

  export interface Binding<in TArg extends string> {
    readonly args: ByName<TArg>;
    readonly list: readonly string[];
    toString(): string;
  }
}
