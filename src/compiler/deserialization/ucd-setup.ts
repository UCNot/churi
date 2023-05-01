import { asArray, mayHaveProperties } from '@proc7ts/primitives';
import { jsStringLiteral, quoteJsKey } from 'httongue';
import { UcDeserializer } from '../../mod.js';
import { UcInstructions } from '../../schema/uc-instructions.js';
import { UcDataType, UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UcToken } from '../../syntax/uc-token.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcdEntityFeature } from './ucd-entity-feature.js';
import { UcdFeature, UcdSchemaFeature } from './ucd-feature.js';
import { UcdFunction } from './ucd-function.js';
import { UcdLib } from './ucd-lib.js';
import { ucdSupportDefaults } from './ucd-support-defaults.js';

/**
 * Deserializer setup used to {@link UcdSetup#bootstrap bootstrap} {@link UcdLib deserializer library}.
 *
 * Passed to {@link UcdFeature deserializer feature} when the latter enabled.
 *
 * @typeParam TModels - Compiled models record type.
 */
export class UcdSetup<
  out TModels extends UcdLib.Models = UcdLib.Models,
  out TMode extends UcDeserializer.Mode = 'universal',
> {

  readonly #options: UcdSetup.Options<TModels, TMode>;
  readonly #enabled = new Set<UcdFeature>();
  readonly #uses = new Map<UcSchema['type'], UcdSetup$FeatureUse>();
  #hasPendingInstructions = false;
  readonly #types = new Map<string | UcDataType, UcrxTemplate.Factory>();
  #defaultEntities: UcdLib.EntityConfig[] | undefined;
  #entities: UcdLib.EntityConfig[] | undefined = [];
  readonly #methods = new Set<UcrxMethod<any>>();

  /**
   * Starts deserializer setup.
   *
   * @param options - Setup options.
   */
  constructor(
    ...options: TMode extends 'sync' | 'async'
      ? [UcdSetup.Options<TModels, TMode>]
      : [UcdSetup.DefaultOptions<TModels>]
  );

  constructor(options: UcdSetup.Options<TModels, TMode>) {
    this.#options = options;
  }

  /**
   * Enables the given deserializer `feature`, unless enabled already.
   *
   * @param feature - Deserializer feature to enable.
   *
   * @returns `this` instance.
   */
  enable(feature: UcdFeature): this {
    if (!this.#enabled.has(feature)) {
      this.#enabled.add(feature);
      if ('configureDeserializer' in feature) {
        feature.configureDeserializer(this);
      } else if (feature === ucdSupportDefaults) {
        this.#enableDefault();
      } else {
        feature(this);
      }
    }

    return this;
  }

  #enableDefault(): void {
    if (this.#entities?.length) {
      // Custom entities registered already.
      ucdSupportDefaults(this);

      return;
    }

    ucdSupportDefaults(this);

    // Stop registering default entities.
    // Start registering custom ones.
    this.#defaultEntities = this.#entities;
    this.#entities = undefined;
  }

  /**
   * Applies model deserialization instructions.
   *
   * @typeParam T - Implied data type.
   * @param model - Target model.
   *
   * @returns `this` instance.
   */
  processModel<T>(model: UcModel<T>): this {
    const schema = ucSchema(model);
    const use = asArray(schema.with?.deserializer?.use);

    use.forEach(useFeature => this.#useFeature(schema, useFeature));

    return this;
  }

  #useFeature(schema: UcSchema, { from, feature }: UcInstructions.UseFeature): void {
    const useId = `${ucSchemaSymbol(schema)}::${from}::${feature}`;

    if (!this.#uses.has(useId)) {
      this.#hasPendingInstructions = true;
      this.#uses.set(useId, new UcdSetup$FeatureUse(schema, from, feature));
    }
  }

  /**
   * Assigns template that generates a charge receiver code used to deserialize the given type.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   * @param type - Target type name or class.
   * @param factory - Template factory.
   *
   * @returns `this` instance.
   */
  useUcrxTemplate<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    type: TSchema['type'],
    factory: UcrxTemplate.Factory<T, TSchema>,
  ): this {
    this.#types.set(type, factory);

    return this;
  }

  /**
   * Declares `method` to charge receiver template.
   *
   * @param method - Declaration of method to add to charge receiver template.
   *
   * @returns `this` instance.
   */
  declareUcrxMethod<TArg extends string>(method: UcrxMethod<TArg>): this {
    this.#methods.add(method);

    return this;
  }

  /**
   * Configures entity handler.
   *
   * @param entity - Matching entity. Either string or array of entity tokens.
   * @param feature - Entity support feature.
   *
   * @returns `this` instance.
   */
  handleEntity(entity: string | readonly UcToken[], feature: UcdEntityFeature): this {
    this.#initEntities().push({ entity, feature });

    return this;
  }

  /**
   * Configures entity prefix handler.
   *
   * @param prefix - Matching entity prefix. Either string or array of entity tokens.
   * @param feature - Entity support feature.
   *
   * @returns `this` instance.
   */
  handleEntityPrefix(prefix: string | readonly UcToken[], feature: UcdEntityFeature): this;
  handleEntityPrefix(entity: string | readonly UcToken[], feature: UcdEntityFeature): this {
    this.#initEntities().push({ entity, feature, prefix: true });

    return this;
  }

  #initEntities(): UcdLib.EntityConfig[] {
    return (this.#entities ??= this.#defaultEntities)!;
  }

  /**
   * Bootstraps deserializer library.
   *
   * Enables configured {@link UcdFeature deserialization features}, bootstraps {@link bootstrapOptions library
   * options}, then creates library with that options.
   *
   * @returns Promise resolved to configured deserializer library.
   */
  async bootstrap(): Promise<UcdLib<TModels, TMode>> {
    return new UcdLib(await this.bootstrapOptions());
  }

  /**
   * Bootstraps deserializer library options.
   *
   * Enables configured {@link UcdFeature deserialization features}.
   *
   * @returns Promise resolved to deserializer library options.
   */
  async bootstrapOptions(): Promise<UcdLib.Options<TModels, TMode>> {
    await this.#init();

    const { mode = 'universal' as TMode } = this.#options;

    return {
      ...this.#options,
      mode,
      entities: this.#entities,
      methods: this.#methods,
      ucrxTemplateFactoryFor: this.#ucrxTemplateFactoryFor.bind(this),
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
      this.enable(ucdSupportDefaults);
    }
  }

  #collectInstructions(): void {
    const { models } = this.#options;

    Object.values(models).forEach(model => {
      this.processModel(model);
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

  #ucrxTemplateFactoryFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcrxTemplate.Factory<T, TSchema> | undefined {
    return this.#types.get(schema.type) as UcrxTemplate.Factory<T, TSchema> | undefined;
  }

}

export namespace UcdSetup {
  export type Any = UcdSetup<UcdLib.Models, UcDeserializer.Mode>;

  export interface BaseOptions<
    out TModels extends UcdLib.Models,
    out TMode extends UcDeserializer.Mode,
  > extends Omit<UcrxLib.Options, 'methods'> {
    readonly models: TModels;
    readonly mode?: TMode | undefined;
    readonly features?: UcdFeature | readonly UcdFeature[] | undefined;

    createDeserializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcdFunction.Options<T, TSchema>,
    ): UcdFunction<T, TSchema>;
  }

  export type DefaultOptions<TModels extends UcdLib.Models> = BaseOptions<TModels, 'universal'>;

  export interface Options<out TModels extends UcdLib.Models, out TMode extends UcDeserializer.Mode>
    extends BaseOptions<TModels, TMode> {
    readonly mode: TMode;
  }
}

class UcdSetup$FeatureUse {

  readonly #schema: UcSchema;
  readonly #from: string;
  readonly #name: string;
  #enabled = false;

  constructor(schema: UcSchema, from: string, name: string) {
    this.#schema = schema;
    this.#from = from;
    this.#name = name;
  }

  async enable(setup: UcdSetup.Any): Promise<void> {
    if (this.#enabled) {
      return;
    }

    this.#enabled = true;

    const { [this.#name]: feature }: { [name: string]: UcdFeature | UcdSchemaFeature } =
      await import(this.#from);

    if (mayHaveProperties(feature)) {
      let configured = false;

      if ('configureDeserializer' in feature) {
        setup.enable(feature);
        configured = true;
      }
      if ('configureSchemaDeserializer' in feature) {
        feature.configureSchemaDeserializer(setup, this.#schema);
        configured = true;
      }

      if (configured) {
        return;
      }

      if (typeof feature === 'function') {
        (feature as UcdSchemaFeature.Function)(setup, this.#schema);

        return;
      }
    }

    if (feature === undefined) {
      throw new ReferenceError(`No such deserializer feature: ${this}`);
    }

    throw new ReferenceError(`Not a deserializer feature: ${this}`);
  }

  toString(): string {
    return `import(${jsStringLiteral(this.#from)}).${quoteJsKey(this.#name)}`;
  }

}
