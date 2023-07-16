import { UcList } from '../../schema/list/uc-list.js';
import { UcMultiValue } from '../../schema/list/uc-multi-value.js';

export interface UccListOptions {
  readonly single: Exclude<(UcList.Variant | UcMultiValue.Variant)['single'], undefined>;
}
