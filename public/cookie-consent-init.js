(function () {
  try {
    var stored = window.localStorage.getItem('fne.cookie-preferences.v1');
    if (!stored) return;

    var parsed = JSON.parse(stored);
    if (
      parsed &&
      parsed.version === 1 &&
      parsed.necessary === true &&
      typeof parsed.analytics === 'boolean'
    ) {
      document.documentElement.dataset.fneCookieConsent = 'saved';
    }
  } catch {
    delete document.documentElement.dataset.fneCookieConsent;
  }
})();
