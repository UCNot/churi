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
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UccProcessor } from '../bootstrap/ucc-processor.js';
import { UcsPresentationConfig } from './impl/ucs-presentation-config.js';
import { UcsBootstrap } from './ucs-bootstrap.js';
import { UcsFormatter } from './ucs-formatter.js';
import { UcsFunction } from './ucs-function.js';
import { UcsInsetFormatter, UcsInsetRequest, UcsInsetWrapper } from './ucs-inset-formatter.js';
import { UcsLib } from './ucs-lib.js';
import { UcsExports, UcsModels } from './ucs-models.js';
import { ucsProcessDefaults } from './ucs-process-defaults.js';
import { CreateUcsWriterExpr } from './ucs-writer.class.js';

/**
 * Compiler of schema {@link churi!UcSerializer serializers}.
 *
 * @typeParam TModels - Compiled models record type.
 */
export class UcsCompiler<TModels extends UcsModels = UcsModels>
  extends UccProcessor<UcsBootstrap>
  implements UcsBootstrap
{
  readonly #options: UcsCompiler.Options<TModels>;
  readonly #exportRequests = new Map<string, UcsFunction$ExportRequest>();
  readonly #presentations = new Map<
    UcsPresentationId,
    Map<string | UcDataType, UcsPresentationConfig>
  >();

  readonly #formatConfigs = new Map<UcFormatName, UcsFormatConfig>();

  #bootstrapped = false;

  /**
   * Construct serializer compiler.
   *
   * @param options - Complier options.
   */
  constructor(options: UcsCompiler.Options<TModels>) {
    super({
      ...options,
      processors: 'serializer',
    });

    this.#options = options;
  }

  protected override startBootstrap(): UcsBootstrap {
    return this;
  }

  formatWith<T>(
    format: UcFormatName,
    target: UcSchema<T>['type'] | UcSchema<T>,
    formatter?: UcsFormatter<T>,
  ): this {
    const id = this.#presentationId(format);

    if (typeof target === 'object') {
      this.#presentationFor(id, format, target.type).formatSchemaWith(target, formatter);
    } else {
      this.#presentationFor(id, format, target).formatTypeWith(formatter);
    }

    const { currentEntry } = this;

    if (currentEntry) {
      this.#exportRequestFor(currentEntry).format = format;
    }

    return this;
  }

  #exportRequestFor(externalName: string): UcsFunction$ExportRequest {
    let request = this.#exportRequests.get(externalName);

    if (!request) {
      request = { externalName };
      this.#exportRequests.set(externalName, request);
    }

    return request;
  }

  #presentationId(format: UcFormatName): UcsPresentationId {
    const inset = this.currentPresentation as UcInsetName | undefined;

    return inset ? `inset:${inset}` : `format:${format}`;
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
      const id = this.#presentationId(hostFormat);

      if (typeof target === 'object') {
        this.#presentationFor(id, hostFormat, target.type).modifySchemaInsets(target, wrapper);
      } else {
        this.#presentationFor(id, hostFormat, target).modifyTypeInsets(wrapper);
      }
    } else {
      this.#formatConfigFor(hostFormat).insetWrapper = hostOrWrapper as UcsInsetWrapper;
    }

    return this;
  }

  #formatConfigFor(format: UcFormatName): UcsFormatConfig {
    let config = this.#formatConfigs.get(format);

    if (!config) {
      config = {};
      this.#formatConfigs.set(format, config);
    }

    return config;
  }

  #presentationFor<T, TSchema extends UcSchema<T>>(
    id: UcsPresentationId,
    format: UcFormatName,
    type: TSchema['type'],
  ): UcsPresentationConfig<T, TSchema> {
    let perType = this.#presentations.get(id);

    if (!perType) {
      perType = new Map();
      this.#presentations.set(id, perType);
    }

    let typeConfig = perType.get(type);

    if (!typeConfig) {
      typeConfig = new UcsPresentationConfig(this.schemaIndex, format);
      perType.set(type, typeConfig);
    }

    return typeConfig as UcsPresentationConfig<T, TSchema>;
  }

  #findPresentationFor<T, TSchema extends UcSchema<T>>(
    id: UcsPresentationId,
    type: TSchema['type'],
  ): UcsPresentationConfig<T, TSchema> | undefined {
    return this.#presentations.get(id)?.get(type) as UcsPresentationConfig<T, TSchema> | undefined;
  }

  writeWith(format: UcFormatName, createWriter: CreateUcsWriterExpr): this {
    this.#formatConfigFor(format).createWriter = createWriter;

    return this;
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

    return {
      ...this.#options,
      schemaIndex: this.schemaIndex,
      findFormatter: this.#findFormatter.bind(this),
      findInsetFormatter: this.#findInsetFormatter.bind(this),
      createWriter: format => this.#formatConfigs.get(format)?.createWriter,
      createSerializer(options) {
        return new UcsFunction(options);
      },
      requestExport: this.#exportRequestFor.bind(this),
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

  #findFormatter<T, TSchema extends UcSchema<T>>(
    format: UcFormatName,
    schema: TSchema,
  ): UcsFormatter<T, TSchema> | undefined {
    return this.#findPresentationFor<T, TSchema>(`format:${format}`, schema.type)?.formatterFor(
      schema,
    );
  }

  #findInsetFormatter<T, TSchema extends UcSchema<T>>(
    lib: UcsLib,
    request: UcsInsetRequest<T, TSchema>,
  ): UcsInsetFormatter<T, TSchema> | undefined {
    const { hostFormat, hostSchema, insetName, insetSchema } = request;

    const insetPresentationConfig = this.#findPresentationFor<T, TSchema>(
      `inset:${insetName}`,
      insetSchema.type,
    );
    let insetFormatter: UcsFormatter<T, TSchema> | undefined;

    if (insetPresentationConfig) {
      insetFormatter =
        insetPresentationConfig.formatterFor(insetSchema) ??
        this.#findFormatter(insetPresentationConfig.format, insetSchema);
    }

    const formatter: UcsInsetFormatter<T, TSchema> | undefined = insetFormatter && {
      insetFormat: insetPresentationConfig!.format,
      format: insetFormatter,
    };

    const insetWrapper =
      this.#findPresentationFor(`format:${hostFormat}`, hostSchema.type)?.insetWrapperFor(
        hostSchema,
      ) ?? this.#formatConfigs.get(hostFormat)?.insetWrapper;

    return insetWrapper
      ? insetWrapper<T, TSchema>({
          lib,
          ...request,
          formatter,
        })
      : formatter;
  }
}

export namespace UcsCompiler {
  export interface Options<TModels extends UcsModels> {
    readonly presentations?: UcPresentationName | readonly UcPresentationName[] | undefined;
    readonly models: TModels;
    readonly features?: UccFeature<UcsBootstrap> | readonly UccFeature<UcsBootstrap>[] | undefined;
  }
}

type UcsPresentationId = `format:${UcFormatName}` | `inset:${UcInsetName}`;

interface UcsFormatConfig {
  insetWrapper?: UcsInsetWrapper | undefined;
  createWriter?: CreateUcsWriterExpr | undefined;
}

type UcsFunction$ExportRequest = {
  -readonly [key in keyof UcsFunction.ExportRequest]: UcsFunction.ExportRequest[key];
};
