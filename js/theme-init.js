// Loaded in <head> without defer: sets the theme before the first paint (no flash).
(function () {
  var saved = null
  try { saved = localStorage.getItem('movie-pitch-theme') } catch (e) {}
  if (saved === 'light' || saved === 'dark') {
    document.documentElement.setAttribute('data-theme', saved)
  }
})()
