import { EsVarSymbol, esline } from 'esgen';
import { UcNumber } from '../../schema/numeric/uc-number.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { UC_MODULE_CHURI } from '../impl/uc-modules.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxSetup } from '../rx/ucrx-setup.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';

export class NumberUcrxClass extends UcrxClass<UcrxSignature.Args, UcNumber, UcNumber.Schema> {

  static uccProcess(setup: UcrxSetup): UccConfig<UcNumber.Variant | void> {
    return {
      configure: () => {
        setup.useUcrxClass(Number, (lib, schema: UcNumber.Schema) => new this(lib, schema));
      },
      configureSchema: (schema, variant) => {
        setup.useUcrxClass(
          schema,
          (lib, schema: UcNumber.Schema) => new this(lib, schema, variant),
        );
      },
    };
  }

  constructor(
    lib: UcrxLib,
    schema: UcNumber.Schema,
    { string = 'parse' }: UcNumber.Variant | void = {},
  ) {
    super({
      lib,
      schema,
      baseClass: lib.baseUcrx,
    });

    UcrxCore.num.overrideIn(this, {
      body({
        member: {
          args: { value },
        },
      }) {
        return esline`return this.set(${value});`;
      },
    });
    if (string !== 'reject') {
      UcrxCore.str.overrideIn(this, {
        body({
          member: {
            args: { value, cx },
          },
        }) {
          return code => {
            const number = new EsVarSymbol('number');
            const ucrxRejectType = UC_MODULE_CHURI.import('ucrxRejectType');

            code
              .write(number.declare({ value: () => esline`Number(${value})` }))
              .write(esline`if (Number.isNaN(${number}) && ${value} !== 'NaN') {`)
              .indent(esline`return ${cx}.reject(${ucrxRejectType}('string', this));`)
              .write('}');

            code.write(esline`return this.num(${number}, ${cx});`);
          };
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
    types.add('number');
    if (this.schema.nullable) {
      types.add('null');
    }
  }

}
