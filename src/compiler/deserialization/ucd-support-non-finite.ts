import { UC_MODULE_DESERIALIZER } from '../impl/uc-modules.js';
import { UcdEntityFeature, UcdEntitySetup } from './ucd-entity-feature.js';
import { UcdSetup } from './ucd-setup.js';

export function ucdSupportNonFinite(setup: UcdSetup.Any): void {
  setup
    .handleEntity('!Infinity', handleUcdNonFinite('ucrxInfinity'))
    .handleEntity('!-Infinity', handleUcdNonFinite('ucrxNegativeInfinity'))
    .handleEntity('!NaN', handleUcdNonFinite('ucrxNaN'));
}

function handleUcdNonFinite(reader: string): UcdEntityFeature {
  return ({ register, refer }: UcdEntitySetup) => {
    const readEntity = UC_MODULE_DESERIALIZER.import(reader);

    refer(readEntity);

    return register(readEntity);
  };
}
