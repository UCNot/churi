import { UcsMemory } from '../serializer/ucs-memory.js';
import { UcsWriter } from '../serializer/ucs-writer.js';

export class SmallChunkUcsWriter extends UcsWriter {
  readonly #memory = new UcsMemory(4);

  override get memory(): UcsMemory {
    return this.#memory;
  }
}
