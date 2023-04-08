import { UcdSetup } from '../compiler/deserialization/ucd-feature.js';
import { UcrxSetter } from '../compiler/rx/ucrx-setter.js';
import { CHURI_MODULE } from '../impl/module-names.js';

export const TimestampUcrxMethod = new UcrxSetter({
  key: 'date',
  stub: ({ value }) => `return this.num(${value}.getTime());`,
  typeName: 'date',
});

export function ucdSupportTimestampEntity(setup: UcdSetup): void {
  setup.declareUcrxMethod(TimestampUcrxMethod).enable(ucdSupportTimestampEntityOnly);
}

export function ucdSupportTimestampEntityOnly(setup: UcdSetup): void {
  setup.handleEntityPrefix("!timestamp'", ({ lib, prefix, suffix }) => code => {
    const printTokens = lib.import(CHURI_MODULE, 'printUcTokens');
    const readTimestamp = lib.declarations.declare(
      'readTimestampEntity',
      (prefix, suffix) => code => {
        code
          .write(`${prefix}(reader, rx, _prefix, args) => {`)
          .indent(code => {
            code.write(
              `const date = new Date(${printTokens}(args));`,
              'return ' + TimestampUcrxMethod.toMethod(lib).call('rx', { value: 'date' }) + ';',
            );
          })
          .write(`}${suffix}`);
      },
    );

    code.write(`${prefix}${readTimestamp}${suffix}`);
  });
}
