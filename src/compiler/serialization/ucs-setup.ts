import { asArray, mayHaveProperties } from '@proc7ts/primitives';
import { jsPropertyKey, jsStringLiteral } from '../../impl/quote-property-key.js';
import { UcInstructions } from '../../schema/uc-instructions.js';
import { UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UccLib } from '../codegen/ucc-lib.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { ucsCheckConstraints } from '../impl/ucs-check-constraints.js';
import { UcsFeature, UcsSchemaFeature } from './ucs-feature.js';
import { UcsFunction } from './ucs-function.js';
import { UcsGenerator } from './ucs-generator.js';
import { UcsLib } from './ucs-lib.js';
import { ucsSupportDefaults } from './ucs-support-defaults.js';

/**
 * Serializer setup used to {@link UcsSetup#bootstrap bootstrap} {@link UcsLib serializer library}.
 *
 * Passed to {@link UcsFeature serializer feature} when the latter enabled.
 *
 * @typeParam TSchemae - Compiled schemae type.
 */
export class UcsSetup<TSchemae extends UcsLib.Schemae = UcsLib.Schemae> {

  readonly #options: UcsSetup.Options<TSchemae>;
  readonly #enabled = new Set<UcsFeature>();
  readonly #uses = new Map<UcSchema['type'], UcsSetup$FeatureUse>();
  #hasPendingInstructions = false;
  readonly #generators = new Map<string | UcSchema.Class, UcsGenerator>();

  /**
   * Starts serializer setup.
   *
   * @param options - Setup options.
   */
  constructor(options: UcsSetup.Options<TSchemae>) {
    this.#options = options;
  }

  /**
   * Enables the given serializer `feature`, unless enabled already.
   *
   * @param feature - Serializer feature to enable.
   *
   * @returns `this` instance.
   */
  enable(feature: UcsFeature): this {
    if (!this.#enabled.has(feature)) {
      this.#enabled.add(feature);
      if ('configureSerializer' in feature) {
        feature.configureSerializer(this);
      } else {
        feature(this);
      }
    }

    return this;
  }

  /**
   * Applies schema serialization instructions.
   *
   * @param spec - Target schema specifier.
   *
   * @returns `this` instance.
   */
  processSchema<T>(spec: UcSchema.Spec<T>): this {
    const schema = ucSchema(spec);
    const use = asArray(schema.with?.serializer?.use);

    use.forEach(useFeature => this.#useFeature(schema, useFeature));

    return this;
  }

  #useFeature(schema: UcSchema, { from, feature }: UcInstructions.UseFeature): void {
    const useId = `${ucSchemaSymbol(schema)}::${from}::${feature}`;

    if (!this.#uses.has(useId)) {
      this.#hasPendingInstructions = true;
      this.#uses.set(useId, new UcsSetup$FeatureUse(schema, from, feature));
    }
  }

  /**
   * Assigns serialization code generator for the given type.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   * @param type - Target type name or class.
   * @param generator - Assigned generator.
   *
   * @returns `this` instance.
   */
  useUcsGenerator<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    type: TSchema['type'],
    generator: UcsGenerator<T, TSchema>,
  ): this {
    this.#generators.set(
      type,
      (fn: UcsFunction, schema: TSchema, value: string, asItem: string) => {
        const onValue = generator(fn, schema, value, asItem);

        return onValue && ucsCheckConstraints(fn, schema, value, onValue);
      },
    );

    return this;
  }

  /**
   * Bootstraps serializer library.
   *
   * Enables configured {@link UcsFeature serialization features}, bootstraps {@link bootstrapOptions library
   * options}, then creates library with that options.
   *
   * @returns Promise resolved to configured serializer library.
   */
  async bootstrap(): Promise<UcsLib<TSchemae>> {
    return new UcsLib(await this.bootstrapOptions());
  }

  /**
   * Bootstraps serializer library options.
   *
   * Enables configured {@link UcsFeature serialization features}.
   *
   * @returns Promise resolved to serializer library options.
   */
  async bootstrapOptions(): Promise<UcsLib.Options<TSchemae>> {
    await this.#init();

    return {
      ...this.#options,
      generatorFor: this.#generatorFor.bind(this),
    };
  }

  async #init(): Promise<void> {
    this.#enableDefaultFeatures();
    this.#collectInstructions();
    await this.#processInstructions();
    this.#enableExplicitFeatures();
    await this.#processInstructions(); // More instructions may be added by explicit features.
  }

  #enableDefaultFeatures(): void {
    const { features } = this.#options;

    if (!features) {
      this.enable(ucsSupportDefaults);
    }
  }

  #collectInstructions(): void {
    const { schemae } = this.#options;

    Object.values(schemae).forEach(spec => {
      this.processSchema(spec);
    });
  }

  async #processInstructions(): Promise<void> {
    while (this.#hasPendingInstructions) {
      this.#hasPendingInstructions = false;
      await Promise.all([...this.#uses.values()].map(async use => await use.enable(this)));
    }
  }

  #enableExplicitFeatures(): void {
    const { features } = this.#options;

    asArray(features).forEach(feature => {
      this.enable(feature);
    });
  }

  #generatorFor<T, TSchema extends UcSchema<T>>(
    type: TSchema['type'],
  ): UcsGenerator<T, TSchema> | undefined {
    return this.#generators.get(type) as UcsGenerator<T, TSchema> | undefined;
  }

}

export namespace UcsSetup {
  export interface Options<TSchemae extends UcsLib.Schemae> extends UccLib.Options {
    readonly schemae: TSchemae;
    readonly features?: UcsFeature | readonly UcsFeature[] | undefined;

    createSerializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcsFunction.Options<T, TSchema>,
    ): UcsFunction<T, TSchema>;
  }
}

class UcsSetup$FeatureUse {

  readonly #schema: UcSchema;
  readonly #from: string;
  readonly #name: string;
  #enabled = false;

  constructor(schema: UcSchema, from: string, name: string) {
    this.#schema = schema;
    this.#from = from;
    this.#name = name;
  }

  async enable(setup: UcsSetup): Promise<void> {
    if (this.#enabled) {
      return;
    }

    this.#enabled = true;

    const { [this.#name]: feature }: { [name: string]: UcsFeature | UcsSchemaFeature } =
      await import(this.#from);

    if (mayHaveProperties(feature)) {
      let configured = false;

      if ('configureSerializer' in feature) {
        setup.enable(feature);
        configured = true;
      }
      if ('configureSchemaSerializer' in feature) {
        feature.configureSchemaSerializer(setup, this.#schema);
        configured = true;
      }

      if (configured) {
        return;
      }

      if (typeof feature === 'function') {
        (feature as UcsSchemaFeature.Function)(setup, this.#schema);

        return;
      }
    }

    if (feature === undefined) {
      throw new ReferenceError(`No such serializer feature: ${this}`);
    }

    throw new ReferenceError(`Not a serializer feature: ${this}`);
  }

  toString(): string {
    return `import(${jsStringLiteral(this.#from)}).${jsPropertyKey(this.#name)}`;
  }

}
