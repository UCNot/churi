import { DESERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcdEntityFeature, UcdEntitySetup } from './ucd-entity-feature.js';
import { UcdSetup } from './ucd-feature.js';

export function ucdSupportNonFinite(setup: UcdSetup): void {
  setup
    .handleEntity('!Infinity', handleUcdNonFinite('ucrxInfinity'))
    .handleEntity('!-Infinity', handleUcdNonFinite('ucrxNegativeInfinity'))
    .handleEntity('!NaN', handleUcdNonFinite('ucrxNaN'));
}

function handleUcdNonFinite(reader: string): UcdEntityFeature {
  return ({ lib, register, handleWith }: UcdEntitySetup) => {
    const readEntity = lib.import(DESERIALIZER_MODULE, reader);

    handleWith(readEntity);

    return register(readEntity);
  };
}
