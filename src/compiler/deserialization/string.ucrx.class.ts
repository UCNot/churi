import { esline } from 'esgen';
import { UcString } from '../../schema/string/uc-string.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxSetup } from '../rx/ucrx-setup.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';

export class StringUcrxClass extends UcrxClass<UcrxSignature.Args, UcString, UcString.Schema> {

  static uccProcess(setup: UcrxSetup): UccConfig<UcString.Variant | void> {
    return {
      configure: () => {
        setup.useUcrxClass(String, (lib, schema: UcString.Schema) => new this(lib, schema));
      },
      configureSchema: (schema, variant) => {
        setup.useUcrxClass(
          schema,
          (lib, schema: UcString.Schema) => new this(lib, schema, variant),
        );
      },
    };
  }

  constructor(
    lib: UcrxLib,
    schema: UcString.Schema,
    { raw = 'escape' }: UcString.Variant | void = {},
  ) {
    super({
      lib,
      schema,
      baseClass: lib.baseUcrx,
    });
    if (raw !== 'parse') {
      UcrxCore.raw.overrideIn(this, {
        body({
          member: {
            args: { value, cx },
          },
        }) {
          return code => {
            if (schema.nullable) {
              code
                .write(esline`if (${value} === '--') {`)
                .indent(esline`return this.nul(${cx});`)
                .write('}');
            }

            code.write(esline`return this.str(${value}, ${cx});`);
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
