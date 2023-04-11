import { asArray } from '@proc7ts/primitives';
import { UcSchemaResolver } from '../../schema/uc-schema-resolver.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcToken } from '../../syntax/uc-token.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcdEntityFeature } from './ucd-entity-feature.js';
import { UcdFeature } from './ucd-feature.js';
import { UcdFunction } from './ucd-function.js';
import { UcdLib } from './ucd-lib.js';
import { ucdSupportDefaults } from './ucd-support-defaults.js';

/**
 * Deserializer setup used to {@link UcdSetup#bootstrap bootstrap} {@link UcdLib deserializer library}.
 *
 * Passed to {@link UcdFeature deserializer feature} when the latter enabled.
 */
export class UcdSetup<TSchemae extends UcdLib.Schemae = UcdLib.Schemae> {

  readonly #types = new Map<string | UcSchema.Class, UcrxTemplate.Factory>();
  readonly #options: UcdConfig.Options<TSchemae>;
  readonly #enabled = new Set<UcdFeature>();
  readonly #entities: UcdLib.EntityConfig[] | undefined;
  readonly #methods = new Set<UcrxMethod<any>>();

  /**
   * Constructs deserializer setup.
   *
   * @param options
   */
  constructor(options: UcdConfig.Options<TSchemae>) {
    this.#options = options;

    const { features, defaultEntities = true } = options;

    // Ignore default entity definitions.
    // Precompiled entity handler will be used.
    this.#entities = features || !defaultEntities ? [] : undefined;
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
    await this.#enableFeatures();

    return {
      ...this.#options,
      entities: this.#entities,
      methods: this.#methods,
      ucrxTemplateFactoryFor: this.#ucrxTemplateFactoryFor.bind(this),
    };
  }

  async #enableFeatures(): Promise<void> {
    const { features } = this.#options;

    (features ? asArray(features) : [ucdSupportDefaults]).forEach(feature => {
      this.enable(feature);
    });

    return Promise.resolve();
  }

  #ucrxTemplateFactoryFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcrxTemplate.Factory<T, TSchema> | undefined {
    return this.#types.get(schema.type) as UcrxTemplate.Factory<T, TSchema> | undefined;
  }

}

export namespace UcdConfig {
  export interface Options<TSchemae extends UcdLib.Schemae>
    extends Omit<UcrxLib.Options, 'methods'> {
    readonly schemae: TSchemae;
    readonly resolver?: UcSchemaResolver | undefined;
    readonly features?: UcdFeature | readonly UcdFeature[] | undefined;
    readonly defaultEntities?: boolean | undefined;

    createDeserializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcdFunction.Options<T, TSchema>,
    ): UcdFunction<T, TSchema>;
  }
}
