import { describe, expect, it } from '@jest/globals';
import { churi } from './churi.tag.js';

describe('churi tag', () => {
  it('charges string', () => {
    const string = 'Hello, World!';

    expect(churi`${string}`).toBe('Hello%2C%20World!');
  });
  it('trims leading an trailing whitespace', () => {
    const string = 'Hello, World!';

    expect(churi`  ${string}  `).toBe('Hello%2C%20World!');
  });
  it('removes new lines', () => {
    expect(churi`
    /some
    /path(

      ${13}

      )
    `).toBe('/some/path(13)');
  });
  it('removes spaces from prefix and suffix', () => {
    expect(churi`
    value( ${13} )`).toBe('value(13)');
  });
  it('does not removes spaces from templates', () => {
    expect(churi`
    some value(${13})`).toBe('some value(13)');
  });
  it('escapes top-level string', () => {
    const string = '13';

    expect(churi`${string}`).toBe("'13");
  });
  it('escapes top-level argument', () => {
    const prefix = '11';
    const arg = '22';

    expect(churi`${prefix}${arg}`).toBe("('11)('22)");
  });
  it('escapes arg', () => {
    const string = '13';

    expect(churi`/path${string}`).toBe("/path('13)");
  });
  it('escapes value', () => {
    const string = '13';

    expect(churi`/path(${string})`).toBe("/path('13)");
  });
  it('escapes parameter value', () => {
    const string = '13';

    expect(churi`?p=${string}`).toBe("?p='13");
  });
  it('escapes list item values', () => {
    const first = '11';
    const second = '22';

    expect(churi`?p=(${first})(${second})`).toBe("?p=('11)('22)");
  });
  it('escapes map entry values', () => {
    const first = '11';
    const second = '22';

    expect(churi`?p=foo(${first})(${second})`).toBe("?p=foo('11)('22)");
  });
  it('escapes map entry args', () => {
    const first = '11';
    const second = '22';

    expect(churi`?p=foo${first}${second}`).toBe("?p=foo('11)('22)");
  });
  it('escapes directive args', () => {
    const first = '11';
    const second = '22';

    expect(churi`?p=!dir${first}${second}`).toBe("?p=!dir('11)('22)");
  });
  it('escapes directive args in parentheses', () => {
    const first = '11';
    const second = '22';

    expect(churi`?p=!dir(${first})(${second})`).toBe("?p=!dir('11)('22)");
  });
  it('escapes directive arg list', () => {
    const args = ['11', '22'];

    expect(churi`?p=!dir${args}`).toBe("?p=!dir('11)('22)");
  });
  it('escapes directive list arg items', () => {
    const args = ['11', '22'];

    expect(churi`?p=!dir(${args})`).toBe("?p=!dir(('11)('22))");
  });
  it('escapes subsequent directive args in parentheses', () => {
    const first = '11';
    const second = '22';

    expect(churi`?p=!dir(${first}${second})`).toBe("?p=!dir(('11)('22))");
  });
});
