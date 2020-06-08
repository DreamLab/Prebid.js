import * as utils from 'src/utils.js';
import adapterManager from 'src/adapterManager';
import rasAnalyticsAdapter from 'modules/rasAnalyticsAdapter';
import events from 'src/events';
import constants from 'src/constants';

const {
  EVENTS: { AUCTION_INIT, BID_REQUESTED, BID_RESPONSE, BID_TIMEOUT, BID_WON, NO_BID }
} = constants;

describe('rasAnalyticsAdapter', function () {
  const scope = utils.getWindowSelf();
  let queue = [];

  beforeEach(() => {
    scope.RasPrebidAnalytics = (handler, eventType, args) => {
      queue.push(args);
    };
    adapterManager.enableAnalytics({
      provider: 'ringieraxelspringer'
    });
    queue = []
  });

  afterEach(() => {
    rasAnalyticsAdapter.disableAnalytics();
  });

  it('should forward all events to the queue', () => {
    // Given
    const args = 'my-args';

    // When
    events.emit(BID_REQUESTED, args);
    events.emit(BID_RESPONSE, args);
    events.emit(BID_TIMEOUT, args);
    events.emit(BID_WON, args);
    events.emit(NO_BID, args);

    // Then
    expect(queue.length).to.eql(5);
    queue.forEach(function (msg) {
      expect(msg).to.equal('my-args');
    })
  });
});
