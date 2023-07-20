import { EsCode, EsFunction, EsSnippet, EsSymbol, EsVarKind, EsVarSymbol, esline } from 'esgen';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { UC_MODULE_DESERIALIZER } from '../impl/uc-modules.js';
import { ucSchemaTypeSymbol } from '../impl/uc-schema-symbol.js';
import { UcrxClass } from '../rx/ucrx.class.js';
import { UcdExportSignature } from './ucd-export.signature.js';
import { UcdLib } from './ucd-lib.js';

export class UcdFunction<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #lib: UcdLib.Any;
  readonly #schema: TSchema;
  #ucrxClass?: UcrxClass;
  readonly #createAsyncReader: Exclude<
    UcdFunction.Options<T, TSchema>['createAsyncReader'],
    undefined
  >;

  readonly #createSyncReader: Exclude<
    UcdFunction.Options<T, TSchema>['createSyncReader'],
    undefined
  >;

  constructor(options: UcdFunction.Options<T, TSchema>);
  constructor({
    lib,
    schema,
    createAsyncReader: createReader = UcdFunction$createReader,
    createSyncReader = UcdFunction$createSyncReader,
  }: UcdFunction.Options<T, TSchema>) {
    this.#lib = lib;
    this.#schema = schema;
    this.#createAsyncReader = createReader;
    this.#createSyncReader = createSyncReader;
  }

  get lib(): UcdLib.Any {
    return this.#lib;
  }

  get schema(): TSchema {
    return this.#schema;
  }

  get ucrxClass(): UcrxClass {
    if (!this.#ucrxClass) {
      const ucrxClass = this.lib.ucrxProtoFor<T, TSchema>(this.schema)?.(this.lib, this.schema);

      if (!ucrxClass) {
        throw new UnsupportedUcSchemaError(
          this.schema,
          `${ucSchemaTypeSymbol(this.schema)}: Can not deserialize type "${ucModelName(
            this.schema,
          )}"`,
        );
      }

      this.#ucrxClass = ucrxClass as UcrxClass;
    }

    return this.#ucrxClass;
  }

  exportFn(externalName: string, mode: UcDeserializer.Mode): EsFunction<UcdExportSignature.Args> {
    const { opaqueUcrx, defaultEntities, defaultFormats, onMeta, inset } = this.lib;
    const stream = new EsSymbol('stream');
    const options = (code: EsCode): void => {
      code.multiLine(code => {
        code
          .write('{')
          .indent(
            'data,',
            'onError,',
            'entities,',
            'formats,',
            'onMeta,',
            opaqueUcrx ? esline`opaqueRx: ${opaqueUcrx.instantiate()},` : EsCode.none,
            inset ? esline`inset: ${inset},` : EsCode.none,
          )
          .write('}');
      });
    };

    return new EsFunction(externalName, UcdExportSignature, {
      declare: {
        at: 'exports',
        async: mode === 'async',
        body:
          ({ args: { input: inputArg } }) => code => {
            const input = mode === 'async' ? stream : inputArg;

            code.write(
              mode === 'universal'
                ? this.#universalBody({ input, options })
                : this.#nonUniversalBody(mode, { input, options }),
            );
          },
        args: {
          input:
            mode === 'async'
              ? { declare: () => stream.declareSymbol({ as: ({ naming }) => [naming, naming] }) }
              : undefined,
          options: {
            declare: () => code => {
              code.multiLine(code => {
                code
                  .write('{')
                  .indent(
                    'data,',
                    'onError,',
                    defaultEntities !== 'undefined'
                      ? esline`entities = ${defaultEntities},`
                      : `entities,`,
                    defaultFormats !== 'undefined'
                      ? esline`formats = ${defaultFormats},`
                      : `formats,`,
                    esline`onMeta = ${onMeta},`,
                  )
                  .write('} = {}');
              });
            },
          },
        },
      },
    });
  }

  #nonUniversalBody(mode: 'sync' | 'async', args: UcdExportSignature.AllValues): EsSnippet {
    return code => {
      const result = new EsVarSymbol('result');
      const reader = new EsVarSymbol('reader');

      code
        .write(result.declare({ as: EsVarKind.Let }))
        .write(
          reader.declare({
            value: () => mode === 'async'
                ? this.#createAsyncReader(args, this)
                : this.#createSyncReader(args, this),
          }),
        )
        .write(`try {`)
        .indent(
          esline`${mode === 'async' ? 'await ' : ''}${reader}.read(${this.ucrxClass.instantiate({
            set: esline`$ => { ${result} = $; }`,
          })});`,
        )
        .write(`} finally {`)
        .indent(esline`${reader}.done();`)
        .write(`}`)
        .write(esline`return ${result};`);
    };
  }

  #universalBody(args: UcdExportSignature.AllValues): EsSnippet {
    return code => {
      const result = new EsVarSymbol('result');
      const syncReader = new EsVarSymbol('syncReader');
      const reader = new EsVarSymbol('reader');
      const set = esline`$ => { ${result} = $; }`;

      code
        .write(result.declare({ as: EsVarKind.Let }))
        .write(syncReader.declare({ value: () => this.#createSyncReader(args, this) }))
        .write(esline`if (${syncReader}) {`)
        .indent(code => {
          code
            .write(`try {`)
            .indent(
              esline`${syncReader}.read(${this.ucrxClass.instantiate({
                set,
              })});`,
            )
            .write(`} finally {`)
            .indent(esline`${syncReader}.done();`)
            .write(`}`)
            .write('return result;');
        })
        .write(`}`)
        .write(reader.declare({ value: () => this.#createAsyncReader(args, this) }))
        .write(
          esline`return ${reader}.read(${this.ucrxClass.instantiate({
            set,
          })})`,
        )
        .indent(esline`.then(() => ${result})`, esline`.finally(() => ${reader}.done());`);
    };
  }

}

export namespace UcdFunction {
  export interface Options<out T, out TSchema extends UcSchema<T>> {
    readonly lib: UcdLib.Any;
    readonly schema: TSchema;

    createAsyncReader?(
      this: void,
      args: UcdExportSignature.AllValues,
      deserializer: UcdFunction,
    ): EsSnippet;

    createSyncReader?(
      this: void,
      args: UcdExportSignature.AllValues,
      deserializer: UcdFunction,
    ): EsSnippet;
  }

  export interface Args {
    readonly reader: string;
    readonly setter: string;
  }

  export interface Vars {
    readonly input: string;
    readonly stream: string;
    readonly options: string;
    readonly result: string;
  }

  /**
   * A location inside deserializer function to insert {@link churi!Ucrx charge receiver} initialization code
   * into.
   *
   * @typeParam T - Deserialized value type.
   * @typeParam TSchema - Supported schema type.
   */
  export interface RxLocation<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {
    /**
     * Schema to deserialize.
     */
    readonly schema: TSchema;

    /**
     * An expression resolved to deserialized value setter function.
     */
    readonly setter: string;

    /**
     * Generated code prefix.
     *
     * Generated {@link churi!Ucrx receiver} expression expected to be placed right after this
     * prefix.
     *
     * This may be e.g. a {@link churi/deserializer.js!UcdReader#read function call}.
     */
    readonly prefix: string;

    /**
     * Generated code suffix.
     *
     * Generated {@link churi!Ucrx receiver} expression expected to be placed right before this
     * suffix.
     *
     * This may be e.g. a closing parenthesis for function call.
     */
    readonly suffix: string;
  }
}

function UcdFunction$createReader({ input, options }: UcdExportSignature.AllValues): EsSnippet {
  const AsyncUcdReader = UC_MODULE_DESERIALIZER.import('AsyncUcdReader');

  return esline`new ${AsyncUcdReader}(${input}, ${options})`;
}

function UcdFunction$createSyncReader({ input, options }: UcdExportSignature.AllValues): EsSnippet {
  const createSyncUcdReader = UC_MODULE_DESERIALIZER.import('createSyncUcdReader');

  return esline`${createSyncUcdReader}(${input}, ${options})`;
}
