import { EsCallable, EsCode, EsFunction, EsSnippet, EsSymbol, EsVarSymbol, esline } from 'esgen';
import { ucModelName } from '../../schema/uc-model-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { UC_MODULE_CHURI, UC_MODULE_DESERIALIZER } from '../impl/uc-modules.js';
import { ucSchemaTypeSymbol } from '../impl/uc-schema-symbol.js';
import { UcrxInsetSignature } from '../rx/ucrx-inset-method.js';
import { UcrxClass } from '../rx/ucrx.class.js';
import { UcdExportSignature } from './ucd-export.signature.js';
import { UcdLib } from './ucd-lib.js';
import { UcdModels } from './ucd-models.js';

export class UcdFunction<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {
  readonly #lib: UcdLib.Any;
  readonly #schema: TSchema;
  #ucrxClass?: UcrxClass;

  constructor(options: UcdFunction.Options<T, TSchema>);
  constructor({ lib, schema }: UcdFunction.Options<T, TSchema>) {
    this.#lib = lib;
    this.#schema = schema;
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

  exportFn(
    request: UcdFunction.ExportRequest,
    entry: UcdModels.SchemaEntry<T, TSchema>,
  ): EsFunction<UcdExportSignature.Args>;

  exportFn(
    { externalName, createLexer, createInsetLexer }: UcdFunction.ExportRequest,
    { mode = 'universal' }: UcdModels.SchemaEntry<T, TSchema>,
  ): EsFunction<UcdExportSignature.Args> {
    const { opaqueUcrx, defaultEntities, defaultFormats, onMeta } = this.lib;
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
            createInsetLexer
              ? code => {
                  code.line(
                    'inset: ',
                    new EsCallable(UcrxInsetSignature).lambda(({ args }) => createInsetLexer(args)),
                    ',',
                  );
                }
              : EsCode.none,
          )
          .write('}');
      });
    };

    return new EsFunction(externalName, UcdExportSignature, {
      declare: {
        at: 'exports',
        async: mode === 'async',
        body:
          ({ args: { input: inputArg } }) =>
          code => {
            const input = mode === 'async' ? stream : inputArg;

            code.write(
              mode === 'universal'
                ? this.#universalBody(createLexer, { input, options })
                : this.#nonUniversalBody(mode, createLexer, { input, options }),
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

  #nonUniversalBody(
    mode: 'sync' | 'async',
    createLexer: UcdFunction.ExportRequest['createLexer'],
    args: UcdExportSignature.AllValues,
  ): EsSnippet {
    return code => {
      const result = new EsVarSymbol('result');
      const reader = new EsVarSymbol('reader');

      code
        .write(result.let())
        .write(
          reader.const({
            value: () =>
              mode === 'async'
                ? this.#createAsyncReader(createLexer, args)
                : this.#createSyncReader(createLexer, args),
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

  #universalBody(
    createLexer: UcdFunction.ExportRequest['createLexer'],
    args: UcdExportSignature.AllValues,
  ): EsSnippet {
    return code => {
      const result = new EsVarSymbol('result');
      const syncReader = new EsVarSymbol('syncReader');
      const reader = new EsVarSymbol('reader');
      const set = esline`$ => { ${result} = $; }`;

      code
        .write(result.let())
        .write(syncReader.const({ value: () => this.#createSyncReader(createLexer, args) }))
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
        .write(reader.const({ value: () => this.#createAsyncReader(createLexer, args) }))
        .write(
          esline`return ${reader}.read(${this.ucrxClass.instantiate({
            set,
          })})`,
        )
        .indent(esline`.then(() => ${result})`, esline`.finally(() => ${reader}.done());`);
    };
  }

  #createAsyncReader(
    createLexer: UcdFunction.ExportRequest['createLexer'],
    { input, options }: UcdExportSignature.AllValues,
  ): EsSnippet {
    let stream: EsSnippet;

    if (createLexer) {
      const UcLexerStream = UC_MODULE_CHURI.import('UcLexerStream');
      const lexerFactory = new EsCallable({ emit: {} }).lambda(({ args }) => createLexer(args));

      stream = esline`${input}.pipeThrough(new ${UcLexerStream}(${lexerFactory}))`;
    } else {
      stream = input;
    }

    const AsyncUcdReader = UC_MODULE_DESERIALIZER.import('AsyncUcdReader');

    return esline`new ${AsyncUcdReader}(${stream}, ${options})`;
  }

  #createSyncReader(
    createLexer: UcdFunction.ExportRequest['createLexer'],
    { input, options }: UcdExportSignature.AllValues,
  ): EsSnippet {
    if (createLexer) {
      const createSyncUcdLexer = UC_MODULE_DESERIALIZER.import('createSyncUcdLexer');
      const lexerFactory = new EsCallable({ emit: {} }).lambda(({ args }) => createLexer(args));

      return esline`${createSyncUcdLexer}(${input}, ${lexerFactory}, ${options})`;
    }

    const createSyncUcdReader = UC_MODULE_DESERIALIZER.import('createSyncUcdReader');

    return esline`${createSyncUcdReader}(${input}, ${options})`;
  }
}

export namespace UcdFunction {
  export interface Options<out T, out TSchema extends UcSchema<T>> {
    readonly lib: UcdLib.Any;
    readonly schema: TSchema;
  }

  export interface ExportRequest {
    readonly externalName: string;
    readonly createLexer?: ((this: void, args: { emit: EsSnippet }) => EsSnippet) | undefined;
    readonly createInsetLexer?:
      | ((this: void, args: UcrxInsetSignature.Values) => EsSnippet)
      | undefined;
  }
}
