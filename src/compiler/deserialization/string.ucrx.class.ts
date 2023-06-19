import { esline } from 'esgen';
import { UcString } from '../../schema/string/uc-string.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxClass, UcrxSignature1 } from '../rx/ucrx.class.js';
import { UcdCompiler } from './ucd-compiler.js';

export class StringUcrxClass extends UcrxClass<UcrxSignature1.Args, UcString, UcString.Schema> {

  static uccProcessSchema(
    compiler: UcdCompiler.Any,
    schema: UcString.Schema,
  ): UccConfig<UcString.Variant> {
    return {
      configure: variant => {
        compiler.useUcrxClass(schema, (lib, schema) => new this(lib, schema, variant));
      },
    };
  }

  constructor(
    { baseUcrx }: UcrxLib,
    schema: UcString.Schema,
    { raw = 'escape' }: UcString.Variant = {},
  ) {
    super({
      schema,
      baseClass: baseUcrx,
    });
    if (raw !== 'prohibit') {
      UcrxCore.raw.overrideIn(this, {
        body({
          member: {
            args: { value, reject },
          },
        }) {
          return code => {
            if (schema.nullable) {
              code
                .write(esline`if (${value} === '--') {`)
                .indent(esline`return this.nul(${reject});`)
                .write('}');
            }

            code.write(esline`return this.str(${value}, ${reject});`);
          };
        },
      });
    }

    UcrxCore.str.overrideIn(this, {
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
