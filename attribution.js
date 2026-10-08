/* Novi Docs — ad attribution
   Captures UTMs, ad click IDs, referrer and landing page. Keeps a first touch
   (never overwritten) and a last touch (refreshed whenever a visit carries
   campaign data or an external referrer) for 90 days.
   window.NDAttribution.get() returns a flat object that is sent with the lead. */
(function () {
  var KEY = 'nd_attr_v1', TTL = 90 * 864e5;
  var PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
    'gclid', 'gbraid', 'wbraid', 'gad_source', 'gad_campaignid', 'fbclid', 'msclkid', 'ttclid',
    'campaign_id', 'adset_id', 'adgroup_id', 'ad_id', 'keyword', 'matchtype', 'network', 'device', 'placement', 'hl'
  ];
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY)); return v && v.exp > Date.now() ? v : null; } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
  function cookie(n) { var m = document.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : ''; }

  var q = new URLSearchParams(location.search), touch = {}, hasCampaign = false;
  PARAMS.forEach(function (k) { var v = q.get(k); if (v) { touch[k] = v.slice(0, 200); hasCampaign = true; } });
  var ref = document.referrer, refHost = host(ref), external = refHost && refHost !== host(location.href);

  if (!touch.utm_source) {
    if (touch.gclid || touch.gbraid || touch.wbraid) { touch.utm_source = 'google'; touch.utm_medium = 'cpc'; }
    else if (touch.fbclid) { touch.utm_source = 'facebook'; touch.utm_medium = touch.utm_medium || 'paid_social'; }
    else if (touch.msclkid) { touch.utm_source = 'bing'; touch.utm_medium = 'cpc'; }
    else if (touch.ttclid) { touch.utm_source = 'tiktok'; touch.utm_medium = 'paid_social'; }
    else if (external) { touch.utm_source = refHost; touch.utm_medium = /google|bing|yahoo|duckduckgo/.test(refHost) ? 'organic' : 'referral'; }
    else { touch.utm_source = '(direct)'; touch.utm_medium = '(none)'; }
  }
  touch.landing_page = location.href.split('#')[0].slice(0, 500);
  touch.referrer = ref.slice(0, 500);
  touch.ts = new Date().toISOString();

  var st = load() || { first: touch, last: touch, visits: 0 };
  if (hasCampaign || external) st.last = touch;
  st.visits = (st.visits || 0) + 1;
  st.exp = Date.now() + TTL;
  save(st);

  window.NDAttribution = {
    get: function () {
      var out = {}, f = st.first || {}, l = st.last || {};
      Object.keys(l).forEach(function (k) { out[k] = l[k]; });
      Object.keys(f).forEach(function (k) { out['first_' + k] = f[k]; });
      out.visit_count = st.visits;
      out.fbp = cookie('_fbp'); out.fbc = cookie('_fbc') || (l.fbclid ? 'fb.1.' + Date.now() + '.' + l.fbclid : '');
      out.ga_client_id = (cookie('_ga').match(/\d+\.\d+$/) || [''])[0];
      out.user_agent = navigator.userAgent;
      return out;
    }
  };
})();
