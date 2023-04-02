import { noop } from '@proc7ts/primitives';
import { URICharge } from '../../charge/uri-charge.js';
import { UcDeserializer } from '../../schema/uc-deserializer.js';

export const parseURICharge: UcDeserializer.Sync<URICharge> = noop as any;
