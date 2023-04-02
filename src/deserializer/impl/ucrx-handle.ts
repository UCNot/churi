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

  makeOpaque(context: UcrxContext): void {
    this.#rx = context.opaqueRx;
  }

  nls(context: UcrxContext): UcrxHandle {
    const isList = this.andQuiet();
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

    itemHandle.andQuiet();

    return itemHandle;
  }

  and(context: UcrxContext): 0 | 1 {
    if (this.#isList < 0) {
      return (this.#isList = ucrxItem(context, this.#rx));
    }

    return this.#isList as 0 | 1;
  }

  andNls(context: UcrxContext): -1 | 0 | 1 {
    const isList = this.andQuiet();

    if (!isList) {
      context.error(ucrxUnexpectedTypeError('nested list', this.#rx));
    }

    return isList;
  }

  andQuiet(): -1 | 0 | 1 {
    if (this.#isList < 0) {
      return (this.#isList = this.#rx.and());
    }

    return this.#isList ? 1 : -1;
  }

  end(): void {
    if (this.#isList) {
      this.#rx.end();
    }
  }

}
