import { capitalize } from '../../impl/capitalize.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccCode, UccSource } from '../codegen/ucc-code.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { UccNamespace } from '../codegen/ucc-namespace.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { BaseUcrxTemplate } from './base.ucrx-template.js';
import { UcrxTemplate } from './ucrx-template.js';
import { UcrxArgs } from './ucrx.args.js';

export class CustomUcrxTemplate<
  out T = unknown,
  out TSchema extends UcSchema<T> = UcSchema<T>,
> extends UcrxTemplate<T, TSchema> {

  readonly #preferredClassName: string;
  readonly #schema: TSchema;

  #className?: string;

  #privateNs?: UccNamespace;
  readonly #privates = new UccCode();
  readonly #privateMethods = new UccCode();

  constructor(options: CustomUcrxTemplate.Options<T, TSchema>) {
    super(options);

    const { schema, className = capitalize(ucSchemaSymbol(schema)) + 'Ucrx' } = options;

    this.#preferredClassName = className;
    this.#schema = schema;
  }

  get schema(): TSchema {
    return this.#schema;
  }

  override get className(): string {
    return (this.#className ??= this.#declareClass());
  }

  #declareClass(): string {
    const { base } = this;

    return this.lib.declarations.declareClass(
      this.#preferredClassName,
      name => this.#declareBody(name),
      { baseClass: base.className },
    );
  }

  #declareBody(className: string): UccSource {
    this.#className = className;

    return code => {
      code.write(
        this.#privates,
        this.#declareConstructor(),
        this.declareTypes(),
        this.declareMethods(),
        this.#privateMethods,
      );
    };
  }

  #declareConstructor(): UccSource {
    return code => {
      const { base } = this;
      const args = this.args.declare(this.lib.ns.nest());
      const callSuperConstr = this.callSuperConstructor(base, args.args);
      const constr = this.declareConstructor(args.args);

      if (constr || callSuperConstr || !this.args.equals(base.args)) {
        code
          .write(`constructor(${args}) {`)
          .indent(code => {
            code.write(callSuperConstr ?? `super(${base.args.call(args.args)});`);
            if (constr) {
              code.write(constr);
            }
          })
          .write(`}`);
      }
    };
  }

  protected callSuperConstructor(
    _base: BaseUcrxTemplate,
    _args: UcrxArgs.ByName,
  ): UccSource | undefined {
    return;
  }

  protected declareConstructor(_args: UcrxArgs.ByName): UccSource | undefined {
    return;
  }

  declarePrivate(preferredName: string, init?: string): string {
    const name = this.#privateName(preferredName);

    if (init) {
      this.#privates.write(`#${name} = ${init};`);
    } else {
      this.#privates.write(`#${name};`);
    }

    return `this.#${name}`;
  }

  declarePrivateMethod<TArg extends string>(
    preferredName: string,
    args: UccArgs.Spec<TArg>,
    body: (args: UccArgs.ByName<TArg>) => UccSource,
  ): UccMethod<TArg> {
    const name = this.#privateName(preferredName);
    const methodRef = new UccMethod(`#${name}`, args);

    this.#privateMethods.write(methodRef.declare(this.lib.ns.nest(), body));

    return methodRef;
  }

  #privateName(preferred: string): string {
    return (this.#privateNs ??= this.lib.ns.nest()).name(preferred);
  }

}

export interface CustomUcrxTemplate<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>>
  extends BaseUcrxTemplate {
  get base(): BaseUcrxTemplate;
}

export namespace CustomUcrxTemplate {
  export interface Options<out T, out TSchema extends UcSchema<T>> extends UcrxTemplate.Options {
    readonly className?: string | undefined;
    readonly schema: TSchema;
  }
}
