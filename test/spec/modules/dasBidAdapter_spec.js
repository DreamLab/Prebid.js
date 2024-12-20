import { expect } from 'chai';
import { spec } from 'modules/dasBidAdapter.js';
import { newBidder } from 'src/adapters/bidderFactory.js';

describe('ringieraxelspringerBidAdapter', function () {
  const adapter = newBidder(spec);
  describe('inherited functions', function () {
    it('exists and is a function', function () {
      expect(adapter.callBids).to.exist.and.to.be.a('function');
    });
  });
});
