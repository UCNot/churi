import { lazyValue } from '@proc7ts/primitives';
import { DESERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UccNamespace } from '../ucc-namespace.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcdLib } from './ucd-lib.js';
import { UcdTypeDef } from './ucd-type-def.js';

export class UcdFunction<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #lib: UcdLib;
  readonly #ns: UccNamespace;
  readonly #schema: TSchema;
  readonly #name: string;
  #syncName?: string;
  #args?: UcdFunction.Args;
  readonly #createReader: Required<UcdFunction.Options<T, TSchema>>['createReader'];
  readonly #createSyncReader: Required<UcdFunction.Options<T, TSchema>>['createSyncReader'];
  readonly #syncReaderVar = lazyValue(() => this.ns.name('syncReader'));

  constructor(options: UcdFunction.Options<T, TSchema>);
  constructor({
    lib,
    schema,
    name,
    syncName,
    createReader = UcdFunction$createReader,
    createSyncReader = UcdFunction$createSyncReader,
  }: UcdFunction.Options<T, TSchema>) {
    this.#lib = lib;
    this.#ns = lib.ns.nest();
    this.#schema = schema;
    this.#name = name;
    this.#syncName = syncName;
    this.#createReader = createReader;
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

  get ns(): UccNamespace {
    return this.#ns;
  }

  deserialize(schema: UcSchema, location: Omit<UcdTypeDef.Location, 'fn'>): UccCode.Source {
    const deserializer = this.lib
      .definitionFor(schema)
      ?.deserialize(schema, { ...location, fn: this as UcdFunction });

    if (deserializer == null) {
      throw new UnsupportedUcSchemaError(
        schema,
        `${this.name}: Can not deserialize type "${ucSchemaName(schema)}"`,
      );
    }

    return deserializer;
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
          this.deserialize(this.schema, {
            setter: this.args.setter,
            prefix: `await ${this.args.reader}.read(`,
            suffix: ');',
          }),
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
          this.deserialize(this.schema, {
            setter: this.args.setter,
            prefix: `${this.args.reader}.read(`,
            suffix: ');',
          }),
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
              ? this.#createReader(this, this.args.reader, input, options)
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
        .write(this.#createReader(this, this.args.reader, input, options))
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

    createReader?(
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
}

function UcdFunction$createReader(
  deserializer: UcdFunction,
  reader: string,
  stream: string,
  options: string,
): string {
  const UcdReader = deserializer.lib.import(DESERIALIZER_MODULE, 'UcdReader');

  return `const ${reader} = new ${UcdReader}(${stream}, ${options});`;
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
