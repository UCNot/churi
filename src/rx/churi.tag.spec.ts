import { describe, expect, it } from '@jest/globals';
import { churi } from './churi.tag.js';

describe('churi tag', () => {
  it('charges string', () => {
    const string = 'Hello, World!';

    expect(churi`${string}`).toBe('Hello%2C%20World%21');
  });
  it('trims leading an trailing whitespace', () => {
    const string = 'Hello, World!';

    expect(churi`  ${string}  `).toBe('Hello%2C%20World%21');
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
  it('escapes top-level list items', () => {
    const prefix = '11';
    const arg = '22';

    expect(churi`${prefix},${arg}`).toBe("'11,'22");
  });
  it('escapes arg', () => {
    const string = '13';

    expect(churi`/path${string}`).toBe("/path'13");
  });
  it('escapes value', () => {
    const string = '13';

    expect(churi`/path(${string})`).toBe("/path('13)");
  });
  it('escapes parameter value', () => {
    const string = '13';

    expect(churi`?p=${string}`).toBe("?p='13");
  });
  it('charges multiple values', () => {
    const first = '11';
    const second = '22';

    expect(churi`?p1=${first}&p2=${second}`).toBe("?p1='11&p2='22");
  });
  it('charges single list item', () => {
    const value = 'test';

    expect(churi`,${value}`).toBe(',test');
    expect(churi`${value},`).toBe('test,');
    expect(churi`?p=,${value}`).toBe('?p=,test');
    expect(churi`?p=${value},`).toBe('?p=test,');
  });
  it('charges list items without comma', () => {
    const first = '11';
    const second = '22';

    expect(churi`${first}${second}`).toBe("'11,'22");
    expect(churi`?p=${first}${second}`).toBe("?p='11,'22");
  });
  it('charges list', () => {
    const list = ['11', '22'];

    expect(churi`${list}`).toBe("'11,'22");
    expect(churi`?p=${list}`).toBe("?p='11,'22");
  });
  it('charges list with single item', () => {
    const list = ['11'];

    expect(churi`${list}`).toBe("'11,");
    expect(churi`?p=${list}`).toBe("?p='11,");
  });
  it('charges empty list', () => {
    expect(churi`${[]}`).toBe(',');
    expect(churi`?p=${[]}`).toBe('?p=,');
  });
  it('charges nested list', () => {
    const list = ['11', '22'];

    expect(churi`(${list})`).toBe("(('11,'22))");
    expect(churi`,${list}`).toBe(",('11,'22)");
    expect(churi`${list},`).toBe("('11,'22),");
    expect(churi`?p=${list},`).toBe("?p=('11,'22),");
  });
  it('charges many nested lists', () => {
    const first = ['a11', 'a22'];
    const second = ['b11', 'b22'];

    expect(churi`(${first}${second})`).toBe('((a11,a22)(b11,b22))');
    expect(churi`${first}${second}`).toBe('(a11,a22)(b11,b22)');
    expect(churi`,${first}${second}`).toBe(',(a11,a22)(b11,b22)');
    expect(churi`${first},${second}`).toBe('(a11,a22),(b11,b22)');
    expect(churi`,${first},${second}`).toBe(',(a11,a22),(b11,b22)');
    expect(churi`?p=${first}${second}`).toBe('?p=(a11,a22)(b11,b22)');
    expect(churi`?p=${first},${second}`).toBe('?p=(a11,a22),(b11,b22)');
  });
  it('charges nested list with single item', () => {
    const list = ['11'];

    expect(churi`(${list})`).toBe("(('11))");
    expect(churi`,${list}`).toBe(",('11)");
    expect(churi`${list},`).toBe("('11),");
    expect(churi`?p=${list},`).toBe("?p=('11),");
  });
  it('charges empty nested list', () => {
    expect(churi`(${[]})`).toBe('(())');
    expect(churi`,${[]}`).toBe(',()');
    expect(churi`${[]},`).toBe('(),');
    expect(churi`?p=${[]},`).toBe('?p=(),');
  });
  it('charges undefined value as null', () => {
    expect(churi`${undefined}`).toBe('--');
    expect(churi`?p=${undefined}`).toBe('?p=--');
  });
  it('charges undefined list item as null', () => {
    expect(churi`,${undefined}`).toBe(',--');
    expect(churi`${undefined},`).toBe('--,');
  });
});
