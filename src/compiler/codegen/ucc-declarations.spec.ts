import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccCode } from './ucc-code.js';
import { UccDeclarations } from './ucc-declarations.js';
import { UccNamespace } from './ucc-namespace.js';

describe('UccDeclarations', () => {
  let declarations: UccDeclarations;

  beforeEach(() => {
    declarations = new UccDeclarations(new UccNamespace());
  });

  describe('declare', () => {
    it('declares constant', () => {
      expect(declarations.declare('name', 'test')).toBe('name');

      expect(new UccCode().write(declarations).toString()).toBe('const name = test;\n');
    });
    it('reuses existing snippet', () => {
      expect(declarations.declare('name', 'test1')).toBe('name');
      expect(declarations.declare('name', 'test2')).toBe('name');

      expect(new UccCode().write(declarations).toString()).toBe('const name = test1;\n');
    });
    it('resolves naming conflict', () => {
      expect(declarations.declare('name', 'test1')).toBe('name');
      expect(declarations.declare('name', 'test2', { key: 'other' })).toBe('name$0');

      expect(new UccCode().write(declarations).toString()).toBe(
        'const name = test1;\nconst name$0 = test2;\n',
      );
    });
  });
});
