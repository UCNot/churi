import { esline } from 'esgen';
import { UcBoolean } from '../../schema/boolean/uc-boolean.js';
import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { UcNumber } from '../../schema/numeric/uc-number.js';
import { UcString } from '../../schema/string/uc-string.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxSetter } from '../rx/ucrx-setter.js';
import { UcrxClass, UcrxSignature1 } from '../rx/ucrx.class.js';
import { BigIntUcrxClass } from './bigint.ucrx.class.js';
import { NumberUcrxClass } from './number.ucrx.class.js';
import { StringUcrxClass } from './string.ucrx.class.js';
import { UcdCompiler } from './ucd-compiler.js';

export function ucdSupportPrimitives(compiler: UcdCompiler.Any): UccConfig {
  return {
    configure() {
      compiler
        .useUcrxClass<UcBoolean, UcBoolean.Schema>(
          Boolean,
          (lib, schema) => new PrimitiveUcrxClass(lib, schema, UcrxCore.bol),
        )
        .useUcrxClass<UcBigInt, UcBigInt.Schema>(
          BigInt,
          (lib, schema) => new BigIntUcrxClass(lib, schema),
        )
        .useUcrxClass<UcNumber, UcNumber.Schema>(
          Number,
          (lib, schema) => new NumberUcrxClass(lib, schema),
        )
        .useUcrxClass<UcString, UcString.Schema>(
          String,
          (lib, schema) => new StringUcrxClass(lib, schema),
        );
    },
  };
}

class PrimitiveUcrxClass<T, TSchema extends UcSchema<T>> extends UcrxClass<UcrxSignature1.Args> {

  constructor({ baseUcrx }: UcrxLib, schema: TSchema, setter: UcrxSetter) {
    super({
      schema,
      baseClass: baseUcrx,
    });

    setter.overrideIn(this, {
      body({
        member: {
          args: { value },
        },
      }) {
        return esline`return this.set(${value});`;
      },
    });
    if (schema.nullable) {
      UcrxCore.nul.overrideIn(this, {
        body: () => `return this.set(null);`,
      });
    }
  }

}
