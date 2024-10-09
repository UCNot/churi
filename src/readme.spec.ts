import { describe, expect, it } from '@jest/globals';
import { chargeURI } from './rx/charge-uri.js';
import { churi } from './rx/churi.tag.js';
import { UcEntity } from './schema/entity/uc-entity.js';
import { UcFormatted } from './schema/entity/uc-formatted.js';
import { UcMeta } from './schema/meta/uc-meta.js';

const DOC_EXAMPLE =
  'https://example.com/!v(3)api/user;id=0n302875106592253' +
  "/article;slug=hello-world/comments?date=since(!date'1970-01-01)till(!now)&range=from(10)to(20)";

describe('README.md', () => {
  describe('churi tag example', () => {
    it('is correct', () => {
      expect(churi`
        https://example.com
          /${new UcMeta().add('v', 3)}api
          /user;id=${302875106592253n}
          /article;slug=${'hello-world'}
          /comments
            ?date=${{
              since: new UcFormatted('date', '1970-01-01'),
              till: new UcEntity('now'),
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
        `https://example.com` +
          `/${chargeURI(new UcMeta().add('v', 3))}api` +
          `/user;id=${chargeURI(302875106592253n)}` +
          `/article;slug=${chargeURI('hello-world')}` +
          `/comments` +
          `?date=${chargeURI({
            since: new UcFormatted('date', '1970-01-01'),
            till: new UcEntity('now'),
          })}` +
          `&range=${chargeURI({
            from: 10,
            to: 20,
          })}`,
      ).toBe(DOC_EXAMPLE);
    });
  });
});
