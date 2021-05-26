import { expect } from 'chai';
import * as utils from 'src/utils.js';
import { spec } from 'modules/rasBidAdapter.js';
import { newBidder } from 'src/adapters/bidderFactory.js';


const CSR_ENDPOINT = 'https://csr.onet.pl/_s/csr-006/csr.json?';

describe('rasBidAdapter', function () {
  const adapter = newBidder(spec);

  describe('inherited functions', function () {
    it('exists and is a function', function () {
      expect(adapter.callBids).to.exist.and.to.be.a('function');
    });
  });

  describe('isBidRequestValid', function () {
    it('should return true when required params found', function () {
      const bid = {
        sizes: [[300, 250], [300, 600]],
        bidder: 'ringieraxelspringer',
        params: {
          area: 'NOWASG',
          site: 'GLOWNA',
          network: '1746213'
        }
      };
      expect(spec.isBidRequestValid(bid)).to.equal(true);
    });

    it('should return false when required params not found', function () {
      const failBid = {
        sizes: [[300, 250], [300, 300]],
        bidder: 'ringieraxelspringer',
        params: {
          site: 'GLOWNA',
          network: '1746213'
        }
      };
      expect(spec.isBidRequestValid(failBid)).to.equal(false);
    });
  });

  describe('buildRequests', function () {
    const bid = {
      sizes: [[300, 250], [300, 600]],
      bidder: 'ringieraxelspringer',
      bidId: 1,
      params: {
        slot: 'test',
        area: 'NOWASG',
        site: 'GLOWNA',
        network: '1746213'
      }
    };
    const bid2 = {
      sizes: [[750, 300]],
      bidder: 'ringieraxelspringer',
      bidId: 2,
      params: {
        slot: 'test2',
        area: 'NOWASG',
        site: 'GLOWNA',
        network: '1746213'
      }
    };
    it('should parse bids to request', function () {
      sinon.stub(utils, 'deepAccess').callsFake((bidderRequest, path) => {
        if (path === 'gdprConsent.gdprApplies') {
          return true;
        } else if (path === 'gdprConsent.consentString') {
          return 'some-consent-string';
        }
        return undefined;
      });

      const requests = spec.buildRequests([bid]);
      expect(requests[0].url).to.have.string(CSR_ENDPOINT);
      expect(requests[0].url).to.have.string('slot0=test');
      expect(requests[0].url).to.have.string('id0=1');
      expect(requests[0].url).to.have.string('nid=1746213');
      expect(requests[0].url).to.have.string('site=GLOWNA');
      expect(requests[0].url).to.have.string('area=NOWASG');
      expect(requests[0].url).to.have.string('cre_format=html');
      expect(requests[0].url).to.have.string('systems=das');
      expect(requests[0].url).to.have.string('ems_url=1');
      expect(requests[0].url).to.have.string('bid_rate=1');
      expect(requests[0].url).to.have.string('gdpr_applies=true');
      expect(requests[0].url).to.have.string('euconsent=some-consent-string');
    });
    it('should parse bids to request from pageContext', function () {
      const bidCopy = { ...bid, pageContext: { 'dr': 'test.pl', keyValues: { seg_ab: 10 } } };
      const requests = spec.buildRequests([bidCopy, bid2]);
      expect(requests[0].url).to.have.string(CSR_ENDPOINT);
      expect(requests[0].url).to.have.string('slot0=test');
      expect(requests[0].url).to.have.string('id0=1');
      expect(requests[0].url).to.have.string('iusizes0=300x250,300x600');
      expect(requests[0].url).to.have.string('slot1=test2');
      expect(requests[0].url).to.have.string('id1=2');
      expect(requests[0].url).to.have.string('iusizes1=750x300');
      expect(requests[0].url).to.have.string('nid=1746213');
      expect(requests[0].url).to.have.string('site=GLOWNA');
      expect(requests[0].url).to.have.string('area=NOWASG');
      expect(requests[0].url).to.have.string('cre_format=html');
      expect(requests[0].url).to.have.string('systems=das');
      expect(requests[0].url).to.have.string('ems_url=1');
      expect(requests[0].url).to.have.string('bid_rate=1');
    });
  });
  describe('interpretResponse', function () {
    const response = {
      'adsCheck': 'ok',
      'geoloc': {},
      'ir': '92effd60-0c84-4dac-817e-763ea7b8ac65',
      'ads': [
        {
          'id': 'flat-belkagorna',
          'slot': 'flat-belkagorna',
          'prio': 10,
          'type': 'html',
          'bid_rate': 0.321123,
          'adid': 'das,50463,152276',
          'id_3': '12734',
          'html': '<script type=\"text/javascript\">test</script>'
        }
      ],
      'iv': '202003191334467636346500'
    };
    it('should get correct bid response', function () {
      const resp = spec.interpretResponse({ body: response }, { bidIds: [{ slot: 'flat-belkagorna', bidId: 1 }] });
      expect(resp[0]).to.have.all.keys('cpm', 'currency', 'netRevenue', 'requestId', 'ttl', 'width', 'height', 'creativeId', 'dealId', 'ad', 'meta');
      expect(resp.length).to.equal(1);
    });
    it('should handle empty ad', function () {
      let res = {
        'ads': [{
          type: 'empty'
        }]
      };
      const resp = spec.interpretResponse({ body: res }, {});
      expect(resp).to.deep.equal([]);
    });
  });
});
