import { expect } from 'chai';
import { spec } from 'modules/rasBidAdapter.js';
import { newBidder } from 'src/adapters/bidderFactory.js';

const CSR_ENDPOINT = 'https://csr.onet.pl/_s/csr-006/csr.json?';

describe('rasBidAdapter', function () {
  const adapter = newBidder(spec);

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
      params: {
        slot: 'test',
        area: 'NOWASG',
        site: 'GLOWNA',
        network: '1746213'
      }
    };
    it('should parse bids to request', function () {
      const requests = spec.buildRequests([bid]);
      expect(requests[0].url).to.have.string(CSR_ENDPOINT);
      expect(requests[0].url).to.have.string('slot0=test');
      expect(requests[0].url).to.have.string('nid=1746213');
      expect(requests[0].url).to.have.string('site=GLOWNA');
      expect(requests[0].url).to.have.string('area=NOWASG');
      expect(requests[0].url).to.have.string('cre_format=html');
      expect(requests[0].url).to.have.string('systems=das');
      expect(requests[0].url).to.have.string('ems_url=1');
      expect(requests[0].url).to.have.string('bid_rate=1');
    });
    it('should parse bids to request from pageContext', function () {
      const bidCopy = { ...bid, pageContext: { 'dr': 'test.pl', keyValues: { seg_ab: 10 } } };
      const requests = spec.buildRequests([bidCopy]);
      expect(requests[0].url).to.have.string(CSR_ENDPOINT);
      expect(requests[0].url).to.have.string('slot0=test');
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
      const resp = spec.interpretResponse({ body: response }, {});
      expect(resp[0]).to.have.all.keys('cpm', 'currency', 'netRevenue', 'requestId', 'ttl', 'width', 'height', 'creativeId', 'dealId', 'ad', 'meta');
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
