import { noop } from '@proc7ts/primitives';
import { UcDeserializer } from '../../../schema/uc-deserializer.js';
import { URICharge } from '../../../schema/uri-charge/uri-charge.js';

// istanbul ignore next
export const parseURICharge: UcDeserializer.Sync<URICharge> = noop as any;
