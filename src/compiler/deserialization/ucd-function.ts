import { lazyValue } from '@proc7ts/primitives';
import { DESERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UccNamespace } from '../ucc-namespace.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcdLib } from './ucd-lib.js';
import { ucdCreateUcrx, UcdUcrx, UcdUcrxLocation } from './ucd-ucrx.js';

export class UcdFunction<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #lib: UcdLib;
  readonly #ns: UccNamespace;
  readonly #schema: TSchema;
  readonly #name: string;
  #syncName?: string;
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
    syncName,
    createAsyncReader: createReader = UcdFunction$createReader,
    createSyncReader = UcdFunction$createSyncReader,
  }: UcdFunction.Options<T, TSchema>) {
    this.#lib = lib;
    this.#ns = lib.ns.nest();
    this.#schema = schema;
    this.#name = name;
    this.#syncName = syncName;
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

  get syncName(): string {
    return (this.#syncName ??= this.ns.name(`${this.name}$sync`));
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
    });
  }

  get ns(): UccNamespace {
    return this.#ns;
  }

  /**
   * Generates initialization code of {@link @hatsy/churi!Ucrx charge receiver}.
   *
   * Generated code expected to contain an {@link @hatsy/churi!Ucrx deserialized value receiver} placed
   * between the given {@link UcdUcrxLocation#prefix prefix} and {@link UcdUcrxLocation#suffix suffix}.
   *
   * @param location - A location inside deserializer function to insert generated code into.
   *
   * @returns Initializer code.
   */
  initRx(location: Omit<UcdUcrxLocation, 'fn'>): UcdUcrx;
  initRx({ schema, setter }: Omit<UcdUcrxLocation, 'fn'>): UcdUcrx {
    const rxInit = this.lib.typeDefFor(schema)?.initRx({ fn: this, schema, setter });

    if (rxInit == null) {
      throw new UnsupportedUcSchemaError(
        schema,
        `${this.name}: Can not deserialize type "${ucSchemaName(schema)}"`,
      );
    }

    return rxInit;
  }

  asAsync(): UccCode.Fragment {
    return {
      toCode: this.#toAsyncCode.bind(this),
    };
  }

  #toAsyncCode(): UccCode.Source {
    return code => code
        .write(`async function ${this.name}(${this.args.reader}, ${this.args.setter}) {`)
        .indent(
          ucdCreateUcrx(
            this.initRx({
              schema: this.schema,
              setter: this.args.setter,
            }),
            {
              prefix: `await ${this.args.reader}.read(`,
              suffix: ');',
            },
          ),
        )
        .write('}');
  }

  asSync(): UccCode.Fragment {
    return {
      toCode: this.#toSyncCode.bind(this),
    };
  }

  #toSyncCode(): UccCode.Source {
    return code => code
        .write(`function ${this.syncName}(${this.args.reader}, ${this.args.setter}) {`)
        .indent(
          ucdCreateUcrx(
            this.initRx({
              schema: this.schema,
              setter: this.args.setter,
            }),
            {
              prefix: `${this.args.reader}.read(`,
              suffix: ');',
            },
          ),
        )
        .write('}');
  }

  toUcDeserializer(mode: UcDeserializer.Mode, input: string, options: string): UccCode.Source {
    if (mode !== 'all') {
      return code => {
        code
          .write('let result;')
          .write(`const ${this.args.setter} = $ => {`)
          .indent('result = $;', 'return 1;')
          .write('}')
          .write(
            mode === 'async'
              ? this.#createAsyncReader(this, this.args.reader, input, options)
              : this.#createSyncReader(this, this.args.reader, input, options),
          )
          .write(`try {`);

        if (mode === 'async') {
          code.indent(`await ${this.name}(${this.args.reader}, ${this.args.setter});`);
        } else {
          code.indent(`${this.syncName}(${this.args.reader}, ${this.args.setter});`);
        }

        code
          .write(`} finally {`)
          .indent(`${this.args.reader}.done();`)
          .write(`}`)
          .write('return result;');
      };
    }

    return code => {
      const syncReader = this.#syncReaderVar();

      code
        .write('let result;')
        .write(`const ${this.args.setter} = $ => {`)
        .indent('result = $;', 'return 1;')
        .write('}')
        .write(this.#createSyncReader(this, syncReader, input, options));

      code
        .write(`if (${syncReader}) {`)
        .indent(code => code
            .write(`try {`)
            .indent(`${this.syncName}(${syncReader}, ${this.args.setter});`)
            .write(`} finally {`)
            .indent(`${syncReader}.done();`)
            .write(`}`)
            .write('return result;'))
        .write(`}`);

      code
        .write(this.#createAsyncReader(this, this.args.reader, input, options))
        .write(`return ${this.name}(${this.args.reader}, ${this.args.setter})`)
        .indent(`.then(() => result)`, `.finally(() => ${this.args.reader}.done())`);
    };
  }

}

export namespace UcdFunction {
  export interface Options<out T, out TSchema extends UcSchema<T>> {
    readonly lib: UcdLib;
    readonly schema: TSchema;
    readonly name: string;
    readonly syncName?: string | undefined;

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
