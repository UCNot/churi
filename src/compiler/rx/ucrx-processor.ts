import { EsSignature } from 'esgen';
import { UcDataType, UcSchema } from '../../schema/uc-schema.js';
import { UccProcessor } from '../processor/ucc-processor.js';
import { UcrxLib } from './ucrx-lib.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxClass, UcrxFactory } from './ucrx.class.js';

/**
 * Schema processor utilizing {@link churi!Ucrx charge receiver} code generation.
 *
 * @typeParam TProcessor - Type of this schema processor.
 */
export abstract class UcrxProcessor<
  TProcessor extends UcrxProcessor<TProcessor>,
> extends UccProcessor<TProcessor> {

  readonly #types = new Map<string | UcDataType, UcrxClass$Entry>();
  readonly #methods = new Set<UcrxMethod<any>>();

  /**
   * Assigns {@link churi!Ucrx Ucrx} class to use for the given `type` processing.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   * @param type - Target type name or class.
   * @param factory - Ucrx class factory.
   *
   * @returns `this` instance.
   */
  useUcrxClass<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    type: TSchema['type'],
    factory: UcrxFactory<T, TSchema>,
  ): this {
    this.#ucrxEntryFor(type).useFactory(factory);

    return this;
  }

  /**
   * Declares `method` to present in all {@link churi!Ucrx charge receiver} implementations.
   *
   * @typeParam TArgs - Type of method arguments definition.
   * @typeParam TMod - Type of method modifier.
   * @param method - Declaration of method to add to charge receiver template.
   *
   * @returns `this` instance.
   */
  declareUcrxMethod<TArgs extends EsSignature.Args, TMod>(method: UcrxMethod<TArgs, TMod>): this {
    this.#methods.add(method);

    return this;
  }

  /**
   * Modifies the `method` of the target `type` receiver.
   *
   * @typeParam TArgs - Type of method arguments definition.
   * @typeParam TMod - Type of method modifier.
   * @param type - Target type name or class.
   * @param method - Method to modify.
   * @param mod - Modifier to apply to target `method`.
   *
   * @returns `this` instance.
   */
  modifyUcrxMethod<TArgs extends EsSignature.Args, TMod>(
    type: UcSchema['type'],
    method: UcrxMethod<TArgs, TMod>,
    mod: TMod,
  ): this {
    this.#ucrxEntryFor(type).modifyMethod(method, mod);

    return this;
  }

  createUcrxLibOptions(): UcrxLib.Options {
    return {
      methods: this.#methods,
      ucrxFactoryFor: this.#ucrxFactoryFor.bind(this),
    };
  }

  #ucrxFactoryFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcrxFactory<T, TSchema> | undefined {
    return (this.#ucrxEntryFor(schema.type) as UcrxClass$Entry<T, TSchema>).factory;
  }

  #ucrxEntryFor(type: UcSchema['type']): UcrxClass$Entry {
    let entry = this.#types.get(type);

    if (!entry) {
      entry = new UcrxClass$Entry();
      this.#types.set(type, entry);
    }

    return entry;
  }

}

class UcrxClass$Entry<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  #rawFactory?: UcrxFactory<T, TSchema>;
  #factory: UcrxFactory<T, TSchema> | undefined;
  readonly #mods: ((ucrxClass: UcrxClass.Any) => void)[] = [];

  get factory(): UcrxFactory<T, TSchema> | undefined {
    if (!this.#factory) {
      const factory = this.#rawFactory;

      if (factory) {
        this.#factory = (lib, schema) => {
          const ucrxClass = factory(lib, schema);

          if (ucrxClass) {
            this.#mods.forEach(mod => mod(ucrxClass));
            ucrxClass.initUcrx(lib);
          }

          return ucrxClass;
        };
      }
    }

    return this.#factory;
  }

  useFactory(factory: UcrxFactory<T, TSchema>): void {
    this.#rawFactory = factory;
    this.#factory = undefined;
  }

  modifyMethod<TArgs extends EsSignature.Args, TMod>(
    method: UcrxMethod<TArgs, TMod>,
    mod: TMod,
  ): void {
    this.#mods.push(ucrxClass => ucrxClass.modifyMethod(method, mod));
  }

}
