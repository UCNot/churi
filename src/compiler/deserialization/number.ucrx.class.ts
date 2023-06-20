import { EsVarSymbol, esline } from 'esgen';
import { UcNumber } from '../../schema/numeric/uc-number.js';
import { UC_MODULE_CHURI } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxProcessor } from '../rx/ucrx-processor.js';
import { UcrxClass, UcrxSignature1 } from '../rx/ucrx.class.js';
import { UcdCompiler } from './ucd-compiler.js';

export class NumberUcrxClass extends UcrxClass<UcrxSignature1.Args, UcNumber, UcNumber.Schema> {

  static uccProcess(compiler: UcdCompiler.Any): UccConfig {
    return {
      configure: () => {
        compiler.useUcrxClass<UcNumber, UcNumber.Schema>(
          Number,
          (lib, schema) => new this(lib, schema),
        );
      },
    };
  }

  static uccProcessSchema(
    processor: UcrxProcessor.Any,
    schema: UcNumber.Schema,
  ): UccConfig<UcNumber.Variant> {
    return {
      configure: variant => {
        processor.useUcrxClass(schema, (lib, schema) => new this(lib, schema, variant));
      },
    };
  }

  constructor(
    { baseUcrx }: UcrxLib,
    schema: UcNumber.Schema,
    { string = 'parse' }: UcNumber.Variant = {},
  ) {
    super({
      schema,
      baseClass: baseUcrx,
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
            args: { value, reject },
          },
        }) {
          return code => {
            const number = new EsVarSymbol('number');
            const ucrxRejectType = UC_MODULE_CHURI.import('ucrxRejectType');

            code
              .write(number.declare({ value: () => esline`Number(${value})` }))
              .write(esline`if (Number.isNaN(${number}) && ${value} !== 'NaN') {`)
              .indent(esline`return ${reject}(${ucrxRejectType}('string', this));`)
              .write('}');

            code.write(esline`return this.num(${number}, ${reject});`);
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
