import { UcrxContext } from '../../rx/ucrx-context.js';
import { ucrxUnexpectedTypeError } from '../../rx/ucrx-errors.js';
import { ucrxItem } from '../../rx/ucrx-value.js';
import { Ucrx } from '../../rx/ucrx.js';

export class UcrxHandle {

  #rx: Ucrx;
  #isList: -1 | 0 | 1 = -1;

  constructor(rx: Ucrx) {
    this.#rx = rx;
  }

  get rx(): Ucrx {
    return this.#rx;
  }

  makeOpaque(context: UcrxContext): this {
    this.#rx = context.opaqueRx;

    return this;
  }

  nls(context: UcrxContext): UcrxHandle {
    const isList = this.quietEm();
    let itemsRx: Ucrx | undefined;

    if (isList > 0) {
      itemsRx = this.#rx.nls();
      if (!itemsRx) {
        context.error(ucrxUnexpectedTypeError('nested list', this.#rx));
      }
    } else if (!isList) {
      context.error(ucrxUnexpectedTypeError('nested list', this.#rx));
    }

    const itemHandle = new UcrxHandle(itemsRx ?? context.opaqueRx);

    itemHandle.quietEm();

    return itemHandle;
  }

  em(context: UcrxContext): 0 | 1 {
    if (this.#isList < 0) {
      return (this.#isList = ucrxItem(context, this.#rx));
    }

    return this.#isList as 0 | 1;
  }

  ls(): void {
    if (this.#isList) {
      this.#rx.ls();
    }
  }

  quietEm(): -1 | 0 | 1 {
    if (this.#isList < 0) {
      return (this.#isList = this.#rx.em());
    }

    return this.#isList ? 1 : -1;
  }

}
