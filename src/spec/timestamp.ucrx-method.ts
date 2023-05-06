import { UccArgs } from '../compiler/codegen/ucc-args.js';
import { UccSource } from '../compiler/codegen/ucc-code.js';
import { UcdFeature, UcdSchemaFeature } from '../compiler/deserialization/ucd-feature.js';
import { UcdSetup } from '../compiler/deserialization/ucd-setup.js';
import { CustomUcrxTemplate } from '../compiler/rx/custom.ucrx-template.js';
import { UcrxLib } from '../compiler/rx/ucrx-lib.js';
import { UcrxSetter } from '../compiler/rx/ucrx-setter.js';
import { UcrxTemplate } from '../compiler/rx/ucrx-template.js';
import { CHURI_MODULE } from '../impl/module-names.js';
import { UcSchema } from '../schema/uc-schema.js';

export const TimestampUcrxMethod = new UcrxSetter({
  key: 'date',
  stub:
    ({ value, reject }) => code => {
      code.write(`return this.num(${value}.getTime(), ${reject});`);
    },
  typeName: 'date',
});

export function ucdSupportTimestampEntity(setup: UcdSetup): void {
  setup.declareUcrxMethod(TimestampUcrxMethod).enable(ucdSupportTimestampEntityOnly);
}

export function ucdSupportTimestampEntityOnly(setup: UcdSetup): void {
  setup.handleEntityPrefix("!timestamp'", ({ lib, register, refer }) => code => {
    const readTimestamp = lib.declarations.declareFunction(
      'readTimestampEntity',
      ['_reader', 'rx', '_prefix', 'args', 'reject'],
      ({ args: { rx, args, reject }, ns }) => code => {
          const date = ns.name('date');
          const printTokens = lib.import(CHURI_MODULE, 'printUcTokens');

          code.write(
            `const ${date} = new Date(${printTokens}(${args}));`,
            'return ' + TimestampUcrxMethod.toMethod(lib).call(rx, { value: date, reject }) + ';',
          );
        },
    );

    refer(readTimestamp);

    code.write(register(readTimestamp));
  });
}

export const UcdSupportTimestamp: UcdFeature.Object = {
  configureDeserializer(setup) {
    setup
      .enable(ucdSupportTimestampEntity)
      .useUcrxTemplate<number>(
        'timestamp',
        (lib, schema) => new TimestampUcrxTemplate(lib, schema),
      );
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

class TimestampUcrxTemplate extends CustomUcrxTemplate<number> {

  constructor(lib: UcrxLib, schema: UcSchema<number>) {
    super({ lib, schema });
  }

  protected override overrideMethods(): UcrxTemplate.MethodDecls {
    return {
      num({ value }: UccArgs.ByName<'value'>): UccSource {
        return `return this.set(${value});`;
      },
      nul: this.schema.nullable ? () => `return this.set(null);` : undefined,
    };
  }

}
