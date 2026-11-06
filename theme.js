/* Theme toggle: initial theme is set by the inline head script (no flash);
   this wires the header button, persists the choice in localStorage, and
   follows live system changes while the user has no saved choice. */
(function () {
  var KEY = 'itf-theme';
  function current() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function label() {
    var b = document.getElementById('theme-toggle');
    if (!b) return;
    var key = current() === 'dark' ? 'themeToLight' : 'themeToDark';
    b.textContent = window.i18nT ? window.i18nT(key) : (current() === 'dark' ? '☀ Light' : '☾ Dark');
  }
  function setTheme(next, save) {
    document.documentElement.setAttribute('data-theme', next);
    if (save) { try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ } }
    label();
  }
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('theme-toggle');
    if (b) {
      b.addEventListener('click', function () {
        setTheme(current() === 'dark' ? 'light' : 'dark', true);
      });
    }
    label();
  });
  document.addEventListener('i18n:changed', label);
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) {
      var s = saved();
      if (s !== 'dark' && s !== 'light') setTheme(e.matches ? 'dark' : 'light', false);
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
})();
