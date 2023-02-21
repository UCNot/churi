import { DESERIALIZER_MODULE } from '../../impl/module-names.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UccNamespace } from '../ucc-namespace.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcdDef } from './ucd-def.js';
import { UcdLib } from './ucd-lib.js';

export class UcdFunction<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>>
  implements UccCode.Fragment {

  readonly #lib: UcdLib;
  readonly #ns: UccNamespace;
  readonly #schema: TSchema;
  readonly #name: string;
  #args?: UcdFunction.Args;
  readonly #createReader: Required<UcdFunction.Options<T, TSchema>>['createReader'];

  constructor(options: UcdFunction.Options<T, TSchema>);
  constructor({
    lib,
    schema,
    name,
    createReader = UcdFunction$createReader,
  }: UcdFunction.Options<T, TSchema>) {
    this.#lib = lib;
    this.#ns = lib.ns.nest();
    this.#schema = schema;
    this.#name = name;
    this.#createReader = createReader;
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

  get ns(): UccNamespace {
    return this.#ns;
  }

  deserialize(schema: UcSchema, location: Omit<UcdDef.Location, 'fn'>): UccCode.Source {
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

  toCode(): UccCode.Source {
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

  toUcDeserializer(stream: string, options: string): UccCode.Source {
    return code => code
        .write(this.#createReader(this, this.args.reader, stream, options))
        .write('let result;')
        .write(`const ${this.args.setter} = $ => {`)
        .indent('result = $;', 'return 1;')
        .write('}')
        .write(`try {`)
        .indent(`await ${this.name}(${this.args.reader}, ${this.args.setter});`)
        .write(`} finally {`)
        .indent(`${this.args.reader}.done();`)
        .write(`}`)
        .write('return result;');
  }

}

export namespace UcdFunction {
  export interface Options<out T, out TSchema extends UcSchema<T>> {
    readonly lib: UcdLib;
    readonly schema: TSchema;
    readonly name: string;

    createReader?(
      this: void,
      deserializer: UcdFunction,
      reader: string,
      stream: string,
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
  const UcsWriter = deserializer.lib.import(DESERIALIZER_MODULE, 'UcdReader');

  return `const ${reader} = new ${UcsWriter}(${stream}, ${options});`;
}
