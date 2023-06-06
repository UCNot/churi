import { EsFunction, EsVarSymbol, esline } from 'esgen';
import { UcdFeature, UcdSchemaFeature } from '../compiler/deserialization/ucd-feature.js';
import { UcdSetup } from '../compiler/deserialization/ucd-setup.js';
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

export function ucdSupportTimestampEntity(setup: UcdSetup): void {
  setup.declareUcrxMethod(TimestampUcrxMethod).enable(ucdSupportTimestampEntityOnly);
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

export function ucdSupportTimestampEntityOnly(setup: UcdSetup): void {
  setup.handleEntityPrefix("!timestamp'", ({ register, refer }) => code => {
    refer(readTimestampEntityFn);

    code.write(register(readTimestampEntityFn.symbol));
  });
}

export const UcdSupportTimestamp: UcdFeature.Object = {
  configureDeserializer(setup) {
    setup
      .enable(ucdSupportTimestampEntity)
      .useUcrxClass<number>('timestamp', (lib, schema) => new TimestampUcrxClass(lib, schema));
  },
};

export const UcdSupportTimestampSchema: UcdSchemaFeature.Object = {
  configureSchemaDeserializer(setup, _schema) {
    setup.enable(UcdSupportTimestamp);
  },
};

export function ucdSupportTimestampSchema(setup: UcdSetup, _schema: UcSchema<number>): void {
  setup.enable(UcdSupportTimestamp);
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
