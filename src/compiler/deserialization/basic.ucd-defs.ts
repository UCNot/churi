import { ListUcdDef } from './list.ucd-def.js';
import { MapUcdDef } from './map.ucd-def.js';
import { PrimitiveUcdDefs } from './primitive.ucd-defs.js';
import { UcdDef } from './ucd-def.js';

export const BasicUcdDefs: readonly UcdDef[] = [...PrimitiveUcdDefs, ListUcdDef, MapUcdDef];
