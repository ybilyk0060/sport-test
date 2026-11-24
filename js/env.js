// Определение браузера и платформы. Одна функция — используется в событиях, камере и на ?debug=1.

export function detectEnv(ua = navigator.userAgent, nav = navigator) {
  const isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && (nav.maxTouchPoints || 0) > 1);
  const isIOS = /iPhone|iPod/.test(ua) || isIPad;
  const isAndroid = /Android/.test(ua);
  const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';

  let browser = 'other';
  let inApp = false;
  if (/Instagram/i.test(ua)) { browser = 'instagram'; inApp = true; }
  else if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(ua)) { browser = 'facebook'; inApp = true; }
  else if (/Messenger/i.test(ua)) { browser = 'facebook'; inApp = true; }
  else if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) { browser = 'other-inapp'; inApp = true; }
  else if (/Telegram/i.test(ua)) { browser = 'other-inapp'; inApp = true; }
  else if (/Viber/i.test(ua)) { browser = 'other-inapp'; inApp = true; }
  else if (isIOS && /CriOS/.test(ua)) browser = 'chrome';
  else if (isIOS && /FxiOS|EdgiOS|OPiOS/.test(ua)) browser = 'other';
  else if (isIOS && /Safari/.test(ua) && /Version\//.test(ua)) browser = 'safari';
  else if (isIOS) { browser = 'other-inapp'; inApp = true; } // WKWebView без признаков Safari
  else if (isAndroid && /; wv\)/.test(ua)) { browser = 'other-inapp'; inApp = true; }
  else if (/SamsungBrowser|EdgA?\/|OPR\/|Firefox|YaBrowser/i.test(ua)) browser = 'other';
  else if (/Chrome\//.test(ua)) browser = 'chrome';
  else if (/Safari\//.test(ua)) browser = 'safari';

  let osVersion = '';
  const mi = ua.match(/OS (\d+[_\d]*) like Mac/); if (mi) osVersion = mi[1].replace(/_/g, '.');
  const ma = ua.match(/Android (\d+(\.\d+)?)/); if (ma) osVersion = ma[1];

  return {
    browser, platform, inApp, osVersion,
    hasMediaDevices: !!(nav.mediaDevices && nav.mediaDevices.getUserMedia),
    secure: typeof window !== 'undefined' ? window.isSecureContext : true,
    ua,
  };
}

// Ссылка «открыть в Chrome» для Android: intent-схема, с запасным адресом.
export function chromeIntentUrl(httpsUrl) {
  const u = new URL(httpsUrl);
  return `intent://${u.host}${u.pathname}${u.search}${u.hash}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(httpsUrl)};end`;
}

// iOS: схема x-safari-https открывает ссылку в Safari (iOS 17+). На старых версиях не сработает — рядом показываем инструкцию.
export function safariUrl(httpsUrl) {
  return httpsUrl.replace(/^https:\/\//, 'x-safari-https://');
}
