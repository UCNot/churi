import { esline } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxSetter } from '../rx/ucrx-setter.js';
import { UcrxClass, UcrxClassSignature1 } from '../rx/ucrx.class.js';
import { UcdSetup } from './ucd-setup.js';

export function ucdSupportPrimitives(setup: UcdSetup.Any): void {
  setup
    .useUcrxClass<boolean>(
      Boolean,
      (lib, schema) => new PrimitiveUcrxClass(lib, schema, UcrxCore.bol),
    )
    .useUcrxClass<bigint>(
      BigInt,
      (lib, schema) => new PrimitiveUcrxClass(lib, schema, UcrxCore.big),
    )
    .useUcrxClass<number>(
      Number,
      (lib, schema) => new PrimitiveUcrxClass(lib, schema, UcrxCore.num),
    )
    .useUcrxClass<string>(
      String,
      (lib, schema) => new PrimitiveUcrxClass(lib, schema, UcrxCore.str),
    );
}

class PrimitiveUcrxClass<
  T,
  TSchema extends UcSchema<T>,
> extends UcrxClass<UcrxClassSignature1.Args> {

  constructor({ baseUcrx }: UcrxLib, schema: TSchema, setter: UcrxSetter) {
    super({
      schema,
      baseClass: baseUcrx,
    });

    setter.declareIn(this, {
      body({
        member: {
          args: { value },
        },
      }) {
        return esline`return this.set(${value});`;
      },
    });
    if (schema.nullable) {
      UcrxCore.nul.declareIn(this, {
        body: () => `return this.set(null);`,
      });
    }
  }

}
