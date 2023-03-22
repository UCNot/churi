import { Ucrx } from './ucrx.js';
import { VoidUcrx } from './void.ucrx.js';

export class OpaqueUcrx extends VoidUcrx {

  constructor() {
    super(OpaqueUcrx$set);
  }

  override get types(): readonly string[] {
    return ['any'];
  }

  override nls(): this {
    return this;
  }

  override for(_key: PropertyKey): Ucrx {
    return this;
  }

  override em(): 1 {
    return 1;
  }

  override any(_value: unknown): 1 {
    return 1;
  }

}

function OpaqueUcrx$set(_value: unknown): void {
  // Ignore assigned value
}
