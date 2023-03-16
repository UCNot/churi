import { jsStringLiteral } from '../../impl/quote-property-key.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccArgs } from '../ucc-args.js';
import { UccCode } from '../ucc-code.js';
import { UcrxCore } from './ucrx-core.js';
import { UcrxLib } from './ucrx-lib.js';
import { UcrxLocation } from './ucrx-location.js';
import { UcrxMethod } from './ucrx-method.js';

export class UcrxTemplate<
  out T = unknown,
  out TSchema extends UcSchema<T> = UcSchema<T>,
  in out TArg extends string = string,
> {

  readonly #lib: UcrxLib;
  readonly #schema: TSchema;
  readonly #base: UcrxTemplate | string;
  readonly #preferredClassName: string;
  #className?: string;
  readonly #args: UccArgs<TArg>;
  readonly #methodDecls: UcrxTemplate.Options<T, TSchema, TArg>['methods'];
  #ownMethods?: UcrxTemplate.Methods;
  #definedMethods?: UcrxTemplate.Methods;
  #expectedTypes?: readonly [set: ReadonlySet<string>, sameAsBase: boolean];

  constructor(options: UcrxTemplate.Options<T, TSchema, TArg>);
  constructor({
    lib,
    schema,
    base = lib.voidUcrx,
    className,
    args,
    methods,
  }: UcrxTemplate.Options<T, TSchema, TArg>) {
    this.#lib = lib;
    this.#schema = schema;
    this.#base = base;
    this.#preferredClassName = className;
    this.#methodDecls = methods;

    if (typeof base === 'string') {
      this.#args = args ? new UccArgs(...args) : new UccArgs('set' as TArg);
    } else {
      this.#args = args ? new UccArgs(...args) : (base.args as UccArgs<any>);
    }
  }

  get lib(): UcrxLib {
    return this.#lib;
  }

  get schema(): TSchema {
    return this.#schema;
  }

  get base(): UcrxTemplate | string {
    return this.#base;
  }

  get className(): string {
    return (this.#className ??= this.#declare());
  }

  #declare(): string {
    const { base } = this;

    if (typeof base === 'string') {
      return this.lib.import(base, this.#preferredClassName);
    }

    return this.#lib.declarations.declareClass(
      this.#preferredClassName,
      name => this.#declareClass(name),
      { baseClass: base.className },
    );
  }

  get args(): UccArgs<TArg> {
    return this.#args;
  }

  get expectedTypes(): ReadonlySet<string> {
    return this.#getExpectedTypes()[0];
  }

  #getExpectedTypes(): readonly [set: ReadonlySet<string>, sameAsBase: boolean] {
    return (this.#expectedTypes ??= this.#buildExpectedTypes());
  }

  #buildExpectedTypes(): readonly [set: ReadonlySet<string>, sameAsBase: boolean] {
    const types = new Set<string>();

    for (const {
      method: { typeName },
    } of Object.values(this.ownMethods)) {
      if (typeName) {
        types.add(typeName);
      }
    }

    const { base } = this;
    const sameAsBase = !types.size;

    if (typeof base !== 'string') {
      base.expectedTypes.forEach(type => types.add(type));
    }

    return [types, sameAsBase];
  }

  get ownMethods(): UcrxTemplate.Methods {
    return (this.#ownMethods ??= this.#buildOwnMethods());
  }

  get definedMethods(): UcrxTemplate.Methods {
    return (this.#definedMethods ??=
      typeof this.base === 'string'
        ? this.ownMethods
        : { ...this.base.definedMethods, ...this.ownMethods });
  }

  #buildOwnMethods(): UcrxTemplate.Methods {
    const methods: Record<string, UcrxTemplate.Method<string>> = {};

    if (this.#methodDecls) {
      for (const [key, value] of Object.entries(this.#methodDecls)) {
        if (value) {
          if (key === 'custom') {
            for (const { method, declare } of value as UcrxTemplate.Method<string>[]) {
              methods[this.#lib.ucrxMethodKey(method)] = {
                method,
                declare,
              };
            }
          } else {
            methods[key] = {
              method: UcrxCore[key as keyof UcrxCore] as UcrxMethod<any>,
              declare: value as UcrxMethod.Decl<string>,
            };
          }
        }
      }
    }

    return methods as UcrxTemplate.Methods;
  }

  newInstance(location: UcrxLocation<T, TSchema, TArg>): UccCode.Source;
  newInstance({ args, prefix, suffix }: UcrxLocation<T, TSchema, TArg>): UccCode.Source {
    return `${prefix}new ${this.className}(${this.args.call(args)})${suffix}`;
  }

  #declareClass(_className: string): UccCode.Source {
    return code => {
      code.write(this.#declareConstructor(), this.#declareTypes());
      for (const [key, { method, declare }] of Object.entries(this.ownMethods)) {
        code.write(
          method.declare(this as unknown as UcrxTemplate, key, declare as UcrxMethod.Decl<string>),
        );
      }
    };
  }

  #declareConstructor(): UccCode.Source {
    const base = typeof this.base === 'string' ? this.lib.voidUcrx : this.base;

    return code => {
      if (!this.args.equals(base.args)) {
        const args = this.args.declare(this.lib.ns.nest());

        code
          .write(`constructor(${args}) {`)
          .indent(code => {
            code.write(`super(${base.args.call(args.args)});`);
          })
          .write(`}`);
      }
    };
  }

  #declareTypes(): UccCode.Source {
    return code => {
      const [types, baseTypes] = this.#getExpectedTypes();

      if (!baseTypes) {
        code
          .write('get types() {')
          .indent(code => {
            const typeNames = [...types].map(type => jsStringLiteral(type)).join(', ');

            code.write(`return [${typeNames}];`);
          })
          .write('}');
      }
    };
  }

}

export namespace UcrxTemplate {
  export interface Options<out T, out TSchema extends UcSchema<T>, out TArg extends string> {
    readonly lib: UcrxLib;
    readonly schema: TSchema;
    readonly base?: UcrxTemplate | string | undefined;
    readonly className: string;
    readonly args?: readonly TArg[] | undefined;

    readonly methods?: {
      readonly [key in keyof UcrxCore]?:
        | UcrxMethod.Decl<UcrxMethod.ArgType<UcrxCore[key]>>
        | undefined;
    } & {
      readonly custom?: Method[] | undefined;
    };
  }

  export type Methods = {
    readonly [key in keyof UcrxCore]?: Method<UcrxMethod.ArgType<UcrxCore[key]>> | undefined;
  } & {
    readonly [key in Exclude<string, keyof UcrxCore>]: Method;
  };

  export interface Method<in out TArg extends string = string> {
    readonly method: UcrxMethod<TArg>;
    readonly declare: UcrxMethod.Decl<TArg>;
  }
}
