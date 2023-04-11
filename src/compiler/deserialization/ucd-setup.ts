import { asArray, mayHaveProperties } from '@proc7ts/primitives';
import { jsPropertyKey, jsStringLiteral } from '../../impl/quote-property-key.js';
import { UcInstructions } from '../../schema/uc-instructions.js';
import { UcSchemaResolver } from '../../schema/uc-schema-resolver.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcToken } from '../../syntax/uc-token.js';
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
 */
export class UcdSetup<TSchemae extends UcdLib.Schemae = UcdLib.Schemae> {

  readonly #resolver: UcSchemaResolver;
  readonly #types = new Map<string | UcSchema.Class, UcrxTemplate.Factory>();
  readonly #options: UcdSetup.Options<TSchemae>;
  readonly #enabled = new Set<UcdFeature>();
  readonly #uses = new Map<UcSchema['type'], UcdSetup$FeatureUse>();
  #hasPendingInstructions = false;
  readonly #entities: UcdLib.EntityConfig[] | undefined;
  readonly #methods = new Set<UcrxMethod<any>>();

  /**
   * Constructs deserializer setup.
   *
   * @param options
   */
  constructor(options: UcdSetup.Options<TSchemae>) {
    this.#options = options;

    const { resolver = new UcSchemaResolver(), features, defaultEntities = true } = options;

    this.#resolver = resolver;

    // Ignore default entity definitions.
    // Precompiled entity handler will be used.
    this.#entities = features || !defaultEntities ? [] : undefined;
  }

  /**
   * Configured schema resolver.
   */
  get resolver(): UcSchemaResolver {
    return this.#resolver;
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
      } else {
        feature(this);
      }
    }

    return this;
  }

  /**
   * Applies schema processing instructions.
   *
   * @param spec - Target schema specifier.
   *
   * @returns `this` instance.
   */
  processSchema<T>(spec: UcSchema.Spec<T>): this {
    const schema = this.resolver.schemaOf(spec);
    const use = asArray(schema.with?.deserializer?.use);

    use.forEach(useFeature => this.#useFeature(schema, useFeature));

    return this;
  }

  #useFeature(schema: UcSchema, { from, feature }: UcInstructions.UseFeature): void {
    const { type, id = type } = schema;
    const useId = `${id}::${from}::${feature}`;

    if (!this.#uses.has(useId)) {
      this.#hasPendingInstructions = true;
      this.#uses.set(useId, new UcdSetup$FeatureUse(schema, from, feature));
    }
  }

  /**
   * Assigns template that generates a charge receiver code used to deserialize the given type.
   *
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
    this.#entities?.push({ entity, feature });

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
    this.#entities?.push({ entity, feature, prefix: true });

    return this;
  }

  /**
   * Bootstraps deserializer library.
   *
   * Enables configured {@link UcdFeature deserialization features}, bootstraps {@link bootstrapOptions library
   * options}, then creates library with that options.
   *
   * @returns Promise resolved to configured deserializer library.
   */
  async bootstrap(): Promise<UcdLib<TSchemae>> {
    return new UcdLib(await this.bootstrapOptions());
  }

  /**
   * Bootstraps deserializer library options.
   *
   * Enables configured {@link UcdFeature deserialization features}.
   *
   * @returns Promise resolved to deserializer library options.
   */
  async bootstrapOptions(): Promise<UcdLib.Options<TSchemae>> {
    await this.#init();

    return {
      ...this.#options,
      resolver: this.resolver,
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
    const { schemae } = this.#options;

    Object.values(schemae).forEach(spec => {
      this.processSchema(this.resolver.schemaOf(spec));
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
  export interface Options<TSchemae extends UcdLib.Schemae>
    extends Omit<UcrxLib.Options, 'methods'> {
    readonly schemae: TSchemae;
    readonly features?: UcdFeature | readonly UcdFeature[] | undefined;
    readonly defaultEntities?: boolean | undefined;

    createDeserializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcdFunction.Options<T, TSchema>,
    ): UcdFunction<T, TSchema>;
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

  async enable(setup: UcdSetup): Promise<void> {
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
        setup.enable(feature);

        return;
      }
    }

    if (feature === undefined) {
      throw new ReferenceError(`No such feature: ${this}`);
    }

    throw new ReferenceError(`Not a feature: ${this}`);
  }

  toString(): string {
    return `import(${jsStringLiteral(this.#from)}).${jsPropertyKey(this.#name)}`;
  }

}
