import { esline } from 'esgen';
import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { UC_MODULE_DESERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxSetup } from '../rx/ucrx-setup.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';

export class BigIntUcrxClass extends UcrxClass<UcrxSignature.Args, UcBigInt, UcBigInt.Schema> {

  static uccProcess(setup: UcrxSetup): UccConfig {
    return {
      configure: () => {
        setup.useUcrxClass(BigInt, (lib, schema: UcBigInt.Schema) => new this(lib, schema));
      },
    };
  }

  static uccProcessSchema(setup: UcrxSetup, schema: UcBigInt.Schema): UccConfig<UcBigInt.Variant> {
    return {
      configure: variant => {
        setup.useUcrxClass(
          schema,
          (lib, schema) => new this(lib, schema as UcBigInt.Schema, variant),
        );
      },
    };
  }

  constructor(
    lib: UcrxLib,
    schema: UcBigInt.Schema,
    { string = 'parse', number = 'parse' }: UcBigInt.Variant = {},
  ) {
    super({
      lib,
      schema,
      baseClass: lib.baseUcrx,
    });

    UcrxCore.big.overrideIn(this, {
      body({
        member: {
          args: { value },
        },
      }) {
        return esline`return this.set(${value});`;
      },
    });
    if (number !== 'reject') {
      UcrxCore.raw.overrideIn(this, {
        body({
          member: {
            args: { value, cx },
          },
        }) {
          const decodeBigInt = UC_MODULE_DESERIALIZER.import('ucdDecodeBigInt');

          return esline`return ${decodeBigInt}(${cx}, this, ${value});`;
        },
      });
    }
    if (string !== 'reject') {
      UcrxCore.str.overrideIn(this, {
        body({
          member: {
            args: { value, cx },
          },
        }) {
          const parseBigInt = UC_MODULE_DESERIALIZER.import(
            number === 'reject' ? 'ucdParseBigInt' : 'ucdParseNumericAsBigInt',
          );

          return esline`return ${parseBigInt}(${cx}, this, ${value});`;
        },
      });
    }
    if (schema.nullable) {
      UcrxCore.nul.overrideIn(this, {
        body: () => `return this.set(null);`,
      });
    }
  }

  protected override discoverTypes(types: Set<string>): void {
    types.add('bigint');
    if (this.schema.nullable) {
      types.add('null');
    }
  }

}
