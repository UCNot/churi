import { EsFunction, EsVarSymbol, esline } from 'esgen';
import { UcdCompiler } from '../compiler/deserialization/ucd-compiler.js';
import { UcdFeature, UcdSchemaFeature } from '../compiler/deserialization/ucd-feature.js';
import { UC_MODULE_CHURI } from '../compiler/impl/uc-modules.js';
import { UcrxCore } from '../compiler/rx/ucrx-core.js';
import { UcrxLib } from '../compiler/rx/ucrx-lib.js';
import { UcrxSetter } from '../compiler/rx/ucrx-setter.js';
import { UcrxClass } from '../compiler/rx/ucrx.class.js';
import { UcSchema } from '../schema/uc-schema.js';

export const TimestampUcrxMethod = new UcrxSetter('date', {
  stub: {
    body({
      member: {
        args: { value, reject },
      },
    }) {
      return esline`return this.num(${value}.getTime(), ${reject});`;
    },
  },
  typeName: 'date',
});

export function ucdSupportTimestampEntity(compiler: UcdCompiler): void {
  compiler.declareUcrxMethod(TimestampUcrxMethod).enable(ucdSupportTimestampEntityOnly);
}

const readTimestampEntityFn = new EsFunction(
  'readTimestampEntity',
  {
    reader: {},
    rx: {},
    prefix: {},
    args: {},
    reject: {},
  },
  {
    declare: {
      at: 'bundle',
      body({ args: { rx, args, reject } }) {
        return (code, scope) => {
          const lib = scope.get(UcrxLib);
          const date = new EsVarSymbol('date');
          const printTokens = UC_MODULE_CHURI.import('printUcTokens');
          const setDate = lib.baseUcrx.member(TimestampUcrxMethod);

          code
            .line(date.declare({ value: () => esline`new Date(${printTokens}(${args}))` }), ';')
            .line('return ', setDate.call(rx, { value: date, reject }), ';');
        };
      },
    },
  },
);

export function ucdSupportTimestampEntityOnly(compiler: UcdCompiler): void {
  compiler.handleEntityPrefix("!timestamp'", ({ register, refer }) => code => {
    refer(readTimestampEntityFn);

    code.write(register(readTimestampEntityFn.symbol));
  });
}

export const UcdSupportTimestamp: UcdFeature.Object = {
  configureDeserializer(compiler) {
    compiler
      .enable(ucdSupportTimestampEntity)
      .useUcrxClass<number>('timestamp', (lib, schema) => new TimestampUcrxClass(lib, schema));
  },
};

export const UcdSupportTimestampSchema: UcdSchemaFeature.Object = {
  configureSchemaDeserializer(compiler, _schema) {
    compiler.enable(UcdSupportTimestamp);
  },
};

export function ucdSupportTimestampSchema(compiler: UcdCompiler, _schema: UcSchema<number>): void {
  compiler.enable(UcdSupportTimestamp);
}

class TimestampUcrxClass extends UcrxClass {

  constructor(lib: UcrxLib, schema: UcSchema<number>) {
    super({
      schema,
      typeName: 'Timestamp',
      baseClass: lib.baseUcrx,
    });

    UcrxCore.num.declareIn(this, {
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
