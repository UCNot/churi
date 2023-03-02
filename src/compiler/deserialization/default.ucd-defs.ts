import { BasicUcdDefs } from './basic.ucd-defs.js';
import { NonFiniteUcdDefs } from './non-finite.ucd-defs.js';
import { UcdDef } from './ucd-def.js';

export const DefaultUcdDefs: readonly UcdDef[] = [...BasicUcdDefs, ...NonFiniteUcdDefs];
