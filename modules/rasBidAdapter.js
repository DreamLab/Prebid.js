import * as utils from 'src/utils';
import { registerBidder } from 'src/adapters/bidderFactory';
import { BANNER } from 'src/mediaTypes';

const BIDDER_CODE = 'ringieraxelspringer';
const ENDPOINT_URL = 'https://csr.onet.pl/_s/csr-006/csr.json?';

function buildQueryParamsFromObject(bid) {
  let { params, adUnitCode, bidId } = bid;
  params = {
    'slot0': 'hb-' + adUnitCode.split('onet-ad-')[1] || params.slot,
    nid: params.network,
    site: params.site,
    area: params.area,
    kvIR: bidId
  };
  return Object.keys(params).map((key) => key + '=' + encodeURIComponent(params[key])).join('&');
}

const getAd = (ad) => {
  return `<script type="text/javascript">!function () {
    "use strict";
    var a = window.sfAPI || window.$sf, b = !a && window.inDapIF, c = document;
    if (b ? (c = parent.document, parent.onetAds || (parent.onetAds = {
        no_gemius: 1,
        mode: "l"
    }), window.onetAds = parent.onetAds) : window.onetAds = window.onetAds || {
        no_gemius: 1,
        mode: "l"
    }, (window.onetAds.cmd = window.onetAds.cmd || []).push(function (a) {
        a.renderAd(${JSON.stringify(ad.data)}, window, c)
    }), "l" === window.onetAds.mode) {
        window.onetAds.mode = "adtpl";
        var d = c.createElement("script");
        d.src = "//lib.onet.pl/s.csr/init/init.js", b && d.setAttribute("async", "true");
        var e = c.getElementsByTagName("script")[0];
        e.parentNode.insertBefore(d, e)
    }
}();</script>`
};

const buildBid = (response) => (ad) => {
  if (ad.type === 'empty') {
    return {}
  }
  let bid = {
    requestId: response.ir,
    cpm: 5.50,
    width: 300,
    height: 250,
    ttl: 300,
    creativeId: parseInt(ad.adid.split(',')[2], 10),
    netRevenue: true,
    currency: 'PLN',
    dealId: ad.id_3 || 0,
    mediaType: 'banner'
  };
  bid.ad = getAd(ad);
  return bid;
};
export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [BANNER],

  isBidRequestValid: function (bidRequest) {
    if (!bidRequest.params) {
      return;
    }
    const { params } = bidRequest;
    return params.nid && params.slot && params.area;
  },

  buildRequests: function (bidRequests, bidderRequest) {
    const requestsQuery = bidRequests.map(buildQueryParamsFromObject);
    return requestsQuery.map((query) => ({
      method: 'POST',
      url: ENDPOINT_URL + query
    }));
  },

  interpretResponse: function (serverResponse, bidRequest) {
    let response = serverResponse.body;
    if (!response.ads || !response.ads.length) {
      return [];
    }
    if (response.debug) {
      utils.logInfo(`CSR DEBUG: serverResponse -> ${serverResponse}`);
      utils.logInfo(`CSR DEBUG: bidRequest -> ${bidRequest}`);
      utils.logInfo(`CSR DEBUG: interpretResponse -> ${response.ads.map(buildBid(response))}`)
    }
    return response.ads.map(buildBid(response));
  },

  getUserSyncs: function (syncOptions, serverResponses) {
    if (syncOptions.iframeEnabled) {
      return [{
        type: 'iframe',
        url: '//acdn.adnxs.com/ib/static/usersync/v3/async_usersync.html'
      }];
    }
  },
  /**
   * Register bidder specific code, which will execute if bidder timed out after an auction
   * @param {data} Containing timeout specific data
   */
  onTimeout: function (data) {
    console.log('onTimeout: ', data)
    // Bidder specifc code
  },

  /**
   * Register bidder specific code, which will execute if a bid from this bidder won the auction
   * @param {Bid} The bid that won the auction
   */
  onBidWon: function (bid) {
    console.log('onBidWon: ', bid);
  },

  /**
   * Register bidder specific code, which will execute when the adserver targeting has been set for a bid from this bidder
   * @param {Bid} The bid of which the targeting has been set
   */
  onSetTargeting: function (bid) {
    console.log('onSetTargeting: ', bid);
  }
};

registerBidder(spec);
