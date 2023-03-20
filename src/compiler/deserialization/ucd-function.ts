import { lazyValue } from '@proc7ts/primitives';
import { DESERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UccCode } from '../ucc-code.js';
import { UccNamespace } from '../ucc-namespace.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcdLib } from './ucd-lib.js';

export class UcdFunction<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #lib: UcdLib;
  readonly #ns: UccNamespace;
  readonly #schema: TSchema;
  readonly #name: string;
  #template?: UcrxTemplate<T, TSchema>;
  #args?: UcdFunction.Args;
  #vars?: UcdFunction.Vars;
  readonly #createAsyncReader: Required<UcdFunction.Options<T, TSchema>>['createAsyncReader'];
  readonly #createSyncReader: Required<UcdFunction.Options<T, TSchema>>['createSyncReader'];
  readonly #syncReaderVar = lazyValue(() => this.ns.name('syncReader'));

  constructor(options: UcdFunction.Options<T, TSchema>);
  constructor({
    lib,
    schema,
    name,
    createAsyncReader: createReader = UcdFunction$createReader,
    createSyncReader = UcdFunction$createSyncReader,
  }: UcdFunction.Options<T, TSchema>) {
    this.#lib = lib;
    this.#ns = lib.ns.nest();
    this.#schema = schema;
    this.#name = name;
    this.#createAsyncReader = createReader;
    this.#createSyncReader = createSyncReader;
  }

  get lib(): UcdLib {
    return this.#lib;
  }

  get schema(): TSchema {
    return this.#schema;
  }

  get name(): string {
    return this.#name;
  }

  get args(): UcdFunction.Args {
    return (this.#args ??= {
      reader: this.ns.name('reader'),
      setter: this.ns.name('set'),
    });
  }

  get vars(): UcdFunction.Vars {
    return (this.#vars ??= {
      input: this.ns.name('input'),
      stream: this.ns.name('stream'),
      options: this.ns.name('options'),
      result: this.ns.name('result'),
    });
  }

  get ns(): UccNamespace {
    return this.#ns;
  }

  get template(): UcrxTemplate<T, TSchema> {
    if (!this.#template) {
      const template = this.#lib
        .typeDefFor<T, TSchema>(this.schema)
        ?.createTemplate(this.lib, this.schema);

      if (!template) {
        throw new UnsupportedUcSchemaError(
          this.schema,
          `${this.name}: Can not deserialize type "${ucSchemaName(this.schema)}"`,
        );
      }

      this.#template = template;
    }

    return this.#template;
  }

  toUcDeserializer(mode: UcDeserializer.Mode, input: string, options: string): UccCode.Source {
    const { result } = this.vars;

    if (mode !== 'all') {
      return code => {
        code
          .write(`let ${result};`)
          .write(`const ${this.args.setter} = $ => ${result} = $;`)
          .write(
            mode === 'async'
              ? this.#createAsyncReader(this, this.args.reader, input, options)
              : this.#createSyncReader(this, this.args.reader, input, options),
          )
          .write(`try {`)
          .indent(
            this.template.newInstance({
              args: {
                set: this.args.setter,
                context: this.args.reader,
              },
              prefix: `${mode === 'async' ? 'await ' : ''}${this.args.reader}.read(`,
              suffix: ');',
            }),
          )
          .write(`} finally {`)
          .indent(`${this.args.reader}.done();`)
          .write(`}`)
          .write('return result;');
      };
    }

    return code => {
      const syncReader = this.#syncReaderVar();

      code
        .write(`let ${result};`)
        .write(`const ${this.args.setter} = $ => ${result} = $;`)
        .write(this.#createSyncReader(this, syncReader, input, options));

      code
        .write(`if (${syncReader}) {`)
        .indent(code => code
            .write(`try {`)
            .indent(
              this.template.newInstance({
                args: {
                  set: this.args.setter,
                  context: syncReader,
                },
                prefix: `${syncReader}.read(`,
                suffix: ');',
              }),
            )
            .write(`} finally {`)
            .indent(`${syncReader}.done();`)
            .write(`}`)
            .write('return result;'))
        .write(`}`);

      code
        .write(this.#createAsyncReader(this, this.args.reader, input, options))
        .write(
          this.template.newInstance({
            args: {
              set: this.args.setter,
              context: this.args.reader,
            },
            prefix: `return ${this.args.reader}.read(`,
            suffix: ')',
          }),
        )
        .indent(`.then(() => result)`, `.finally(() => ${this.args.reader}.done())`);
    };
  }

}

export namespace UcdFunction {
  export interface Options<out T, out TSchema extends UcSchema<T>> {
    readonly lib: UcdLib;
    readonly schema: TSchema;
    readonly name: string;

    createAsyncReader?(
      this: void,
      deserializer: UcdFunction,
      reader: string,
      stream: string,
      options: string,
    ): UccCode.Source;

    createSyncReader?(
      this: void,
      deserializer: UcdFunction,
      reader: string,
      input: string,
      options: string,
    ): UccCode.Source;
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
   * A location inside deserializer function to insert {@link @hatsy/churi!Ucrx charge receiver} initialization code
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
     * Generated {@link @hatsy/churi!Ucrx receiver} expression expected to be placed right after this
     * prefix.
     *
     * This may be e.g. a {@link @hatsy/churi/deserializer!UcdReader#read function call}.
     */
    readonly prefix: string;

    /**
     * Generated code suffix.
     *
     * Generated {@link @hatsy/churi!Ucrx receiver} expression expected to be placed right before this
     * suffix.
     *
     * This may be e.g. a closing parenthesis for function call.
     */
    readonly suffix: string;
  }
}

function UcdFunction$createReader(
  deserializer: UcdFunction,
  reader: string,
  stream: string,
  options: string,
): string {
  const AsyncUcdReader = deserializer.lib.import(DESERIALIZER_MODULE, 'AsyncUcdReader');

  return `const ${reader} = new ${AsyncUcdReader}(${stream}, ${options});`;
}

function UcdFunction$createSyncReader(
  deserializer: UcdFunction,
  reader: string,
  input: string,
  options: string,
): string {
  const createSyncUcdReader = deserializer.lib.import(DESERIALIZER_MODULE, 'createSyncUcdReader');

  return `const ${reader} = ${createSyncUcdReader}(${input}, ${options});`;
}
