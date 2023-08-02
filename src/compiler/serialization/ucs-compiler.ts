import { asArray } from '@proc7ts/primitives';
import {
  EsBundle,
  EsEvaluationOptions,
  EsGenerationOptions,
  EsScopeSetup,
  esEvaluate,
  esGenerate,
} from 'esgen';
import { UcFormatName, UcInsetName, UcPresentationName } from '../../schema/uc-presentations.js';
import { UcDataType, UcSchema } from '../../schema/uc-schema.js';
import { UccCapability } from '../processor/ucc-capability.js';
import { UccFeature } from '../processor/ucc-feature.js';
import { UccProcessor } from '../processor/ucc-processor.js';
import { UccSchemaIndex } from '../processor/ucc-schema-index.js';
import { UcsFormatter } from './ucs-formatter.js';
import { UcsFunction } from './ucs-function.js';
import { UcsInsetFormatter, UcsInsetWrapper } from './ucs-inset-formatter.js';
import { UcsLib } from './ucs-lib.js';
import { UcsExports, UcsModels } from './ucs-models.js';
import { ucsProcessDefaults } from './ucs-process-defaults.js';
import { UcsSetup } from './ucs-setup.js';

/**
 * Compiler of schema {@link churi!UcSerializer serializers}.
 *
 * @typeParam TModels - Compiled models record type.
 */
export class UcsCompiler<TModels extends UcsModels = UcsModels>
  extends UccProcessor<UcsSetup>
  implements UcsSetup {

  readonly #options: UcsCompiler.Options<TModels>;
  readonly #presentations = new Map<
    UcsPresentationId,
    Map<string | UcDataType, UcsPresentationEntry>
  >();

  readonly #insetWrappers = new Map<UcFormatName, UcsInsetWrapper>();

  #bootstrapped = false;

  /**
   * Starts serializer setup.
   *
   * @param options - Setup options.
   */
  constructor(options: UcsCompiler.Options<TModels>) {
    super({
      ...options,
      processors: 'serializer',
    });

    this.#options = options;
  }

  protected override createSetup(): UcsSetup {
    return this;
  }

  formatWith<T>(
    format: UcFormatName,
    target: UcSchema<T>['type'] | UcSchema<T>,
    formatter?: UcsFormatter<T>,
  ): this {
    const inset = this.currentPresentation as UcInsetName | undefined;
    const id: UcsPresentationId = inset ? `inset:${inset}` : `format:${format}`;

    if (typeof target === 'object') {
      this.#presentationFor(id, format, target.type).formatSchemaWith(target, formatter);
    } else {
      this.#presentationFor(id, format, target).formatTypeWith(formatter);
    }

    return this;
  }

  modifyInsets(hostFormat: UcFormatName, wrapper: UcsInsetWrapper): this;
  modifyInsets<T>(
    hostFormat: UcFormatName,
    host: UcSchema<T>['type'] | UcSchema<T>,
    wrapper: UcsInsetWrapper,
  ): this;

  modifyInsets<T>(
    hostFormat: UcFormatName,
    hostOrWrapper: UcSchema<T>['type'] | UcSchema<T> | UcsInsetWrapper,
    wrapper?: UcsInsetWrapper,
  ): this {
    if (wrapper) {
      const target = hostOrWrapper as UcSchema<T>['type'] | UcSchema<T>;
      const inset = this.currentPresentation as UcInsetName | undefined;
      const id: UcsPresentationId = inset ? `inset:${inset}` : `format:${hostFormat}`;

      if (typeof target === 'object') {
        this.#presentationFor(id, hostFormat, target.type).modifySchemaInsets(target, wrapper);
      } else {
        this.#presentationFor(id, hostFormat, target).modifyTypeInsets(wrapper);
      }
    } else {
      this.#insetWrappers.set(hostFormat, hostOrWrapper as UcsInsetWrapper);
    }

    return this;
  }

  #presentationFor<T, TSchema extends UcSchema<T>>(
    id: UcsPresentationId,
    format: UcFormatName,
    type: TSchema['type'],
  ): UcsPresentationEntry<T, TSchema> {
    let perType = this.#presentations.get(id);

    if (!perType) {
      perType = new Map();
      this.#presentations.set(id, perType);
    }

    let typeEntry = perType.get(type) as UcsPresentationEntry<T, TSchema> | undefined;

    if (!typeEntry) {
      typeEntry = new UcsPresentationEntry(this.schemaIndex, format);
      perType.set(type, typeEntry);
    }

    return typeEntry;
  }

  #findPresentationFor<T, TSchema extends UcSchema<T>>(
    id: UcsPresentationId,
    type: TSchema['type'],
  ): UcsPresentationEntry<T, TSchema> | undefined {
    return this.#presentations.get(id)?.get(type) as UcsPresentationEntry<T, TSchema> | undefined;
  }

  /**
   * Generates serialization code.
   *
   * @param options - Code generation options.
   *
   * @returns Promise resolved to serializer module text.
   */
  async generate(options: EsGenerationOptions = {}): Promise<string> {
    return await esGenerate({
      ...options,
      setup: [...asArray(options.setup), await this.bootstrap()],
    });
  }

  /**
   * Generates serialization code and evaluates it.
   *
   * @param options - Code evaluation options.
   *
   * @returns Promise resolved to deserializers exported from generated module.
   */
  async evaluate(options: EsEvaluationOptions = {}): Promise<UcsExports<TModels>> {
    return (await esEvaluate({
      ...options,
      setup: [...asArray(options.setup), await this.bootstrap()],
    })) as UcsExports<TModels>;
  }

  /**
   * Bootstraps serializer library.
   *
   * Enables configured {@link enable serialization features}, bootstraps {@link bootstrapOptions library options},
   * then creates library with that options.
   *
   * @returns Promise resolved to code bundle initialization setup.
   */
  async bootstrap(): Promise<EsScopeSetup<EsBundle>> {
    const options = await this.bootstrapOptions();

    return {
      esSetupScope(context) {
        context.set(UcsLib, new UcsLib(context.scope, options));
      },
    };
  }

  /**
   * Bootstraps serializer library options.
   *
   * Enables configured {@link enable serialization features}.
   *
   * @returns Promise resolved to serializer library options.
   */
  async bootstrapOptions(): Promise<UcsLib.Options<TModels>> {
    await this.#bootstrap();

    const { createSerializer = options => new UcsFunction(options) } = this.#options;

    return {
      ...this.#options,
      schemaIndex: this.schemaIndex,
      formatterFor: this.#formatterFor.bind(this),
      insetFormatterFor: this.#insetFormatterFor.bind(this),
      createSerializer,
    };
  }

  async #bootstrap(): Promise<void> {
    if (this.#bootstrapped) {
      return;
    }

    this.#bootstrapped = true;
    this.#enableDefaultFeatures();
    await this.processInstructions();
  }

  #enableDefaultFeatures(): void {
    const { features } = this.#options;

    if (!features) {
      this.enable(ucsProcessDefaults);
    }
  }

  #formatterFor<T, TSchema extends UcSchema<T>>(
    format: UcFormatName,
    schema: TSchema,
  ): UcsFormatter<T, TSchema> | undefined {
    return this.#findPresentationFor<T, TSchema>(`format:${format}`, schema.type)?.formatterFor(
      schema,
    );
  }

  #insetFormatterFor<T, TSchema extends UcSchema<T>>(
    hostFormat: UcFormatName,
    hostSchema: UcSchema,
    insetName: UcInsetName,
    schema: TSchema,
  ): UcsInsetFormatter<T, TSchema> | undefined {
    const insetPresentationEntry = this.#findPresentationFor<T, TSchema>(
      `inset:${insetName}`,
      schema.type,
    );
    let insetFormatter: UcsFormatter<T, TSchema> | undefined;

    if (insetPresentationEntry) {
      insetFormatter =
        insetPresentationEntry.formatterFor(schema)
        ?? this.#formatterFor(insetPresentationEntry.format, schema);
    }

    const insetWrapper =
      this.#findPresentationFor(`format:${hostFormat}`, hostSchema.type)?.insetWrapperFor(
        hostSchema,
      ) ?? this.#insetWrappers.get(hostFormat);

    if (insetWrapper) {
      return insetWrapper<T, TSchema>({
        hostFormat,
        hostSchema,
        insetName,
        schema,
        formatter: insetFormatter && {
          insetFormat: insetPresentationEntry!.format,
          format: insetFormatter,
        },
      });
    }

    return (
      insetFormatter && { insetFormat: insetPresentationEntry!.format, format: insetFormatter }
    );
  }

}

export namespace UcsCompiler {
  export interface Options<TModels extends UcsModels> {
    readonly presentations?: UcPresentationName | readonly UcPresentationName[] | undefined;
    readonly capabilities?:
      | UccCapability<UcsSetup>
      | readonly UccCapability<UcsSetup>[]
      | undefined;
    readonly models: TModels;
    readonly features?: UccFeature<UcsSetup> | readonly UccFeature<UcsSetup>[] | undefined;

    createSerializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcsFunction.Options<T, TSchema>,
    ): UcsFunction<T, TSchema>;
  }
}

type UcsPresentationId = `format:${UcFormatName}` | `inset:${UcInsetName}`;

class UcsPresentationEntry<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #schemaIndex: UccSchemaIndex;
  readonly #schemaFormatters = new Map<string, UcsFormatter<T, TSchema>>();
  readonly #schemaInsetWrappers = new Map<string, UcsInsetWrapper>();
  #typeFormatter: UcsFormatter<T, TSchema> | undefined;
  #typeInsetWrapper?: UcsInsetWrapper | undefined;

  constructor(schemaIndex: UccSchemaIndex, readonly format: UcFormatName) {
    this.#schemaIndex = schemaIndex;
  }

  formatTypeWith(formatter: UcsFormatter<T, TSchema> | undefined): void {
    if (formatter) {
      this.#typeFormatter = formatter;
    }
  }

  modifyTypeInsets(wrapper: UcsInsetWrapper): void {
    this.#typeInsetWrapper = wrapper;
  }

  formatSchemaWith(schema: TSchema, formatter: UcsFormatter<T, TSchema> | undefined): void {
    if (formatter) {
      const schemaId = this.#schemaIndex.schemaId(schema);

      this.#schemaFormatters.set(schemaId, formatter);
    }
  }

  modifySchemaInsets(schema: TSchema, wrapper: UcsInsetWrapper): void {
    const schemaId = this.#schemaIndex.schemaId(schema);

    this.#schemaInsetWrappers.set(schemaId, wrapper);
  }

  formatterFor(schema: TSchema): UcsFormatter<T, TSchema> | undefined {
    const schemaId = this.#schemaIndex.schemaId(schema);

    return this.#schemaFormatters.get(schemaId) ?? this.#typeFormatter;
  }

  insetWrapperFor(schema: TSchema): UcsInsetWrapper | undefined {
    const schemaId = this.#schemaIndex.schemaId(schema);

    return this.#schemaInsetWrappers.get(schemaId) ?? this.#typeInsetWrapper;
  }

}
