import { UcSchema } from '../../schema/uc-schema.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccSource } from '../codegen/ucc-code.js';
import { CustomUcrxTemplate } from '../rx/custom.ucrx-template.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcdSetup } from './ucd-setup.js';

export function ucdConfigurePrimitive(setup: UcdSetup): void {
  setup
    .useUcrxTemplate<boolean>(
      Boolean,
      (lib, schema) => new PrimitiveUcrxTemplate(lib, schema, 'bol'),
    )
    .useUcrxTemplate<bigint>(BigInt, (lib, schema) => new PrimitiveUcrxTemplate(lib, schema, 'big'))
    .useUcrxTemplate<number>(Number, (lib, schema) => new PrimitiveUcrxTemplate(lib, schema, 'num'))
    .useUcrxTemplate<string>(
      String,
      (lib, schema) => new PrimitiveUcrxTemplate(lib, schema, 'str'),
    );
}

class PrimitiveUcrxTemplate<T, TSchema extends UcSchema<T>> extends CustomUcrxTemplate<T, TSchema> {

  readonly #key: 'bol' | 'big' | 'num' | 'str';

  constructor(lib: UcrxLib, schema: TSchema, key: 'bol' | 'big' | 'num' | 'str') {
    super({ lib, schema });

    this.#key = key;
  }

  protected override overrideMethods(): UcrxTemplate.MethodDecls {
    return {
      [this.#key]({ value }: UccArgs.ByName<'value'>): UccSource {
        return `return this.set(${value});`;
      },
      nul: this.schema.nullable ? () => `return this.set(null);` : undefined,
    };
  }

}
