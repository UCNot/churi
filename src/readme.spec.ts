import { describe, expect, it } from '@jest/globals';
import { chargeURI } from './charge/charge-uri.js';
import { churi } from './charge/churi.tag.js';
import { UcEntity } from './schema/entity/uc-entity.js';

const DOC_EXAMPLE =
  'https://example.com/api(!v:3.0)/user;id=0n302875106592253'
  + '/article;slug=hello-world/comments?date=since(!date:1970-01-01)till(!now)&range=from(10)to(20)';

describe('README.md', () => {
  describe('churi tag example', () => {
    it('is correct', () => {
      expect(churi`
        https://example.com
          /api(${new UcEntity('!v:3.0')})
          /user;id=${302875106592253n}
          /article;slug=${'hello-world'}
          /comments
            ?date=${{
              since: new UcEntity('!date:1970-01-01'),
              till: new UcEntity('!now'),
            }}
            &range=${{
              from: 10,
              to: 20,
            }}
      `).toBe(DOC_EXAMPLE);
    });
  });

  describe('chargeURI example', () => {
    it('is correct', () => {
      expect(
        'https://example.com'
          + `/api(${chargeURI(new UcEntity('!v:3.0'))})`
          + `/user;id=${chargeURI(302875106592253n)}`
          + `/article;slug=${chargeURI('hello-world')}`
          + '/comments'
          + `?date=${chargeURI({
            since: new UcEntity('!date:1970-01-01'),
            till: new UcEntity('!now'),
          })}`
          + `&range=${chargeURI({
            from: 10,
            to: 20,
          })}`,
      ).toBe(DOC_EXAMPLE);
    });
  });
});
