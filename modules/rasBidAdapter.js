import { registerBidder } from '../src/adapters/bidderFactory.js';
import { BANNER } from '../src/mediaTypes.js';
import { isEmpty } from '../src/utils.js';

const BIDDER_CODE = 'ringieraxelspringer';
const ENDPOINT_URL = 'https://csr.onet.pl/_s/csr-006/csr.json?';

function parseParams(params) {
  const newParams = {};
  const pageContext = params.pageContext;
  if (!pageContext) {
    return {};
  }
  if (pageContext.dr) {
    newParams.dr = pageContext.dr
  }
  if (pageContext.keyWords && Array.isArray(pageContext.keyWords)) {
    newParams.kwrd = pageContext.keyWords.join('+')
  }
  if (pageContext.keyValues && typeof pageContext.keyValues === 'object') {
    for (const param in pageContext.keyValues) {
      if (pageContext.keyValues.hasOwnProperty(param)) {
        const kvName = 'kv' + param;
        newParams[kvName] = pageContext.keyValues[param]
      }
    }
  }
  return newParams;
}

function buildQueryParamsFromObject(bid) {
  const { params } = bid;
  const requestParams = {
    slot0: params.slot,
    nid: params.network,
    site: params.site,
    area: params.area,
    cre_format: 'html',
    systems: 'das',
    ems_url: 1,
    bid_rate: 1,
    ...parseParams(params)
  };
  return {
    payload: Object.keys(requestParams).map((key) => key + '=' + encodeURIComponent(requestParams[key])).join('&'),
    bidId: bid.bidId
  };
}

const buildBid = (bidId) => (ad) => {
  if (ad.type === 'empty') {
    return null
  }
  return {
    requestId: bidId,
    cpm: ad.bid_rate ? ad.bid_rate.toFixed(2) : 0,
    width: ad.width || 0,
    height: ad.height || 0,
    ttl: 300,
    creativeId: ad.adid ? parseInt(ad.adid.split(',')[2], 10) : 0,
    netRevenue: true,
    currency: ad.currency || 'USD',
    dealId: ad.id_3 || 0,
    meta: {
      mediaType: BANNER
    },
    ad: ad.html || null
  };
};

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [BANNER],

  isBidRequestValid: function (bidRequest) {
    if (!bidRequest || !bidRequest.params || typeof bidRequest.params !== 'object') {
      return;
    }
    const { params } = bidRequest;
    return Boolean(params.network && params.site && params.area);
  },

  buildRequests: function (bidRequests, bidderRequest) {
    const requestsQuery = bidRequests.map(buildQueryParamsFromObject);
    return requestsQuery.map((query) => ({
      method: 'POST',
      url: ENDPOINT_URL + query.payload,
      bidId: query.bidId
    }));
  },

  interpretResponse: function (serverResponse, bidRequest) {
    const response = serverResponse.body;
    const bidId = bidRequest.bidId;
    if (!response || !response.ads || response.ads.length === 0) {
      return [];
    }
    return response.ads.map(buildBid(bidId)).filter((bid) => !isEmpty(bid));
  },

  getUserSyncs: function (syncOptions, serverResponses) {
    return [];
  },
  /**
   * Register bidder specific code, which will execute if bidder timed out after an auction
   * @param {data} Containing timeout specific data
   */
  onTimeout: function (data) {
    // onTimeout
  },

  /**
   * Register bidder specific code, which will execute if a bid from this bidder won the auction
   * @param {Bid} The bid that won the auction
   */
  onBidWon: function (bid) {
    // onBidWon
  },

  /**
   * Register bidder specific code, which will execute when the adserver targeting has been set for a bid from this bidder
   * @param {Bid} The bid of which the targeting has been set
   */
  onSetTargeting: function (bid) {
    // onSetTargeting
  }
};

registerBidder(spec);
