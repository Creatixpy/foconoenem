(function () {
  try {
    var stored = localStorage.getItem('theme');
    var resolved;

    if (stored === 'light') {
      resolved = 'light';
    } else if (stored === 'dark') {
      resolved = 'dark';
    } else {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    document.documentElement.setAttribute('data-theme', resolved);
  } catch (error) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
