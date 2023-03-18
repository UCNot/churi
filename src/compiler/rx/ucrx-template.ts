import { valueRecipe } from '@proc7ts/primitives';
import { jsStringLiteral } from '../../impl/quote-property-key.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccArgs } from '../ucc-args.js';
import { UccCode } from '../ucc-code.js';
import { UccMethodRef } from '../ucc-method-ref.js';
import { UccNamespace } from '../ucc-namespace.js';
import { UcrxCore } from './ucrx-core.js';
import { UcrxLib } from './ucrx-lib.js';
import { UcrxLocation } from './ucrx-location.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxArgs } from './ucrx.args.js';

export class UcrxTemplate<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #lib: UcrxLib;
  readonly #schema: TSchema;
  readonly #base: () => UcrxTemplate | string;
  readonly #preferredClassName: string;
  #className?: string;
  readonly #args: () => UcrxArgs;
  readonly #methodDecls: (() => UcrxTemplate.MethodDecls) | undefined;
  #ownMethods?: UcrxTemplate.Methods;
  #definedMethods?: UcrxTemplate.Methods;
  #expectedTypes?: readonly [set: ReadonlySet<string>, sameAsBase: boolean];

  #privateNs?: UccNamespace;
  #privates?: UccCode;
  #privateMethods?: UccCode;

  constructor(options: UcrxTemplate.Options<T, TSchema>);
  constructor({
    lib,
    schema,
    base = lib.voidUcrx,
    className,
    args,
    methods,
  }: UcrxTemplate.Options<T, TSchema>) {
    this.#lib = lib;
    this.#schema = schema;
    this.#base = valueRecipe(base);
    this.#preferredClassName = className;
    this.#methodDecls = methods && valueRecipe(methods);

    if (args) {
      this.#args = () => new UccArgs(...args);
    } else {
      this.#args = () => {
        const base = this.base;

        return typeof base === 'string' ? new UccArgs<UcrxArgs.Arg>('set') : base.args;
      };
    }

    this.#privateNs = lib.ns.nest();
  }

  get lib(): UcrxLib {
    return this.#lib;
  }

  get schema(): TSchema {
    return this.#schema;
  }

  get base(): UcrxTemplate | string {
    return this.#base();
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

  get args(): UcrxArgs {
    return this.#args();
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
      for (const [key, value] of Object.entries(this.#methodDecls())) {
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
              declare: value as UcrxMethod.Body<string>,
            };
          }
        }
      }
    }

    return methods as UcrxTemplate.Methods;
  }

  newInstance(location: UcrxLocation): UccCode.Source;
  newInstance({ args, prefix, suffix }: UcrxLocation): UccCode.Source {
    return `${prefix}new ${this.className}(${this.args.call(args)})${suffix}`;
  }

  #declareClass(_className: string): UccCode.Source {
    return code => {
      code.write(
        this.#declarePrivates(),
        this.#declareConstructor(),
        this.#declarePrivateMethods(),
        this.#declareTypes(),
      );
      for (const [key, { method, declare }] of Object.entries(this.ownMethods)) {
        code.write(
          method.declare(this as unknown as UcrxTemplate, key, declare as UcrxMethod.Body<string>),
        );
      }
    };
  }

  #declareConstructor(): UccCode.Source {
    const base = typeof this.base === 'string' ? this.lib.voidUcrx : this.base;

    return code => {
      const args = this.args.declare(this.lib.ns.nest());
      const constr = this.declareConstructor(args.args);

      if (constr || !this.args.equals(base.args)) {
        code
          .write(`constructor(${args}) {`)
          .indent(code => {
            code.write(`super(${base.args.call(args.args)});`);
            if (constr) {
              code.write(constr);
            }
          })
          .write(`}`);
      }
    };
  }

  protected declareConstructor(_args: UcrxArgs.ByName): UccCode.Source | undefined {
    return;
  }

  declarePrivate(
    preferredName: string,
    init?: string | ((prefix: string, suffix: string) => UccCode.Source),
  ): string {
    const name = this.#privateName(preferredName);

    this.#privates ??= new UccCode();

    if (!init) {
      this.#privates.write(`#${name};`);
    } else if (typeof init === 'string') {
      this.#privates.write(`#${name} = ${init};`);
    } else {
      this.#privates.write(init(`#${name} = `, `;`));
    }

    return `this.#${name}`;
  }

  declarePrivateMethod<TArg extends string>(
    preferredName: string,
    args: UccArgs<TArg>,
    body: (args: UccArgs.ByName<TArg>) => UccCode.Source,
  ): UccMethodRef<TArg> {
    const name = this.#privateName(preferredName);

    this.#privateMethods ??= new UccCode();

    const methodRef = new UccMethodRef(`#${name}`, args);

    this.#privateMethods.write(methodRef.declare(this.lib.ns.nest(), body));

    return methodRef;
  }

  #privateName(preferred: string): string {
    return (this.#privateNs ??= this.lib.ns.nest()).name(preferred);
  }

  #declarePrivates(): UccCode.Source {
    return code => {
      if (this.#privates) {
        code.write(this.#privates);
      }
    };
  }

  #declarePrivateMethods(): UccCode.Source {
    return code => {
      if (this.#privateMethods) {
        code.write(this.#privateMethods);
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
  export interface Options<out T, out TSchema extends UcSchema<T>> {
    readonly lib: UcrxLib;
    readonly schema: TSchema;
    readonly base?: UcrxTemplate | string | (() => UcrxTemplate | string) | undefined;
    readonly className: string;
    readonly args?: readonly UcrxArgs.Arg[] | undefined;

    readonly methods?: MethodDecls | (() => MethodDecls);
  }

  export type MethodDecls = {
    readonly [key in keyof UcrxCore]?:
      | UcrxMethod.Body<UcrxMethod.ArgType<UcrxCore[key]>>
      | undefined;
  } & {
    readonly custom?: Method[] | undefined;
  };

  export type Methods = {
    readonly [key in keyof UcrxCore]?: Method<UcrxMethod.ArgType<UcrxCore[key]>> | undefined;
  } & {
    readonly [key in Exclude<string, keyof UcrxCore>]: Method;
  };

  export interface Method<in out TArg extends string = string> {
    readonly method: UcrxMethod<TArg>;
    readonly declare: UcrxMethod.Body<TArg>;
  }
}
