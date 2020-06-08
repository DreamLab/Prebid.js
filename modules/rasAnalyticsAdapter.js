import adapter from '../src/AnalyticsAdapter.js';
import adapterManager from '../src/adapterManager.js';

var rasAdapter = adapter({
  global: 'RasPrebidAnalytics',
  handler: 'on',
  analyticsType: 'bundle'
});

adapterManager.registerAnalyticsAdapter({
  adapter: rasAdapter,
  code: 'ringieraxelspringer'
});

export default rasAdapter;
