import { esline } from 'esgen';
import { UcInteger } from '../../schema/numeric/uc-integer.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { UC_MODULE_CHURI, UC_MODULE_DESERIALIZER } from '../impl/uc-modules.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxSetup } from '../rx/ucrx-setup.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';

export class IntegerUcrxClass extends UcrxClass<UcrxSignature.Args, UcInteger, UcInteger.Schema> {

  static uccProcess(setup: UcrxSetup): UccConfig<UcInteger.Variant | undefined> {
    return {
      configureSchema: (schema, variant) => {
        setup.useUcrxClass(
          schema,
          (lib, schema: UcInteger.Schema) => new this(lib, schema, variant),
        );
      },
    };
  }

  constructor(
    lib: UcrxLib,
    schema: UcInteger.Schema,
    { string = 'parse' }: UcInteger.Variant = {},
  ) {
    super({
      lib,
      schema,
      baseClass: lib.baseUcrx,
    });

    UcrxCore.num.overrideIn(this, {
      body({
        member: {
          args: { value, cx },
        },
      }) {
        return code => {
          const ucrxRejectType = UC_MODULE_CHURI.import('ucrxRejectType');

          code
            .write(esline`if (!Number.isFinite(${value})) {`)
            .indent(esline`return ${cx}.reject(${ucrxRejectType}('float', this));`)
            .write('}')
            .write(esline`return this.set(Math.floor(${value}), ${cx});`);
        };
      },
    });
    UcrxCore.raw.overrideIn(this, {
      body({
        member: {
          args: { value, cx },
        },
      }) {
        return code => {
          const ucdDecodeInteger = UC_MODULE_DESERIALIZER.import(
            schema.nullable ? 'ucdDecodeIntegerOrNull' : 'ucdDecodeInteger',
          );

          code.write(esline`return ${ucdDecodeInteger}(${cx}, this, ${value});`);
        };
      },
    });
    if (string !== 'reject') {
      UcrxCore.str.overrideIn(this, {
        body({
          member: {
            args: { value, cx },
          },
        }) {
          return esline`return this.raw(${value}, ${cx});`;
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
    types.add('integer');
    if (this.schema.nullable) {
      types.add('null');
    }
  }

}
