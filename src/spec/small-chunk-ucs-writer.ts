import { UrtMemory } from '../runtime/urt-memory.js';
import { UcsWriter } from '../serializer/ucs-writer.js';

export class SmallChunkUcsWriter extends UcsWriter {

  readonly #memory = new UrtMemory(4);

  override get memory(): UrtMemory {
    return this.#memory;
  }

}
