// Small visual helpers: theme toggle, button ripples, scroll reveal and number count-up.

const THEME_KEY = 'movie-pitch-theme'
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

export function setupThemeToggle(button) {
  const currentTheme = () =>
    document.documentElement.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light')

  const updateLabel = () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark'
    button.setAttribute('aria-label', `Switch to ${next} theme`)
  }

  button.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem(THEME_KEY, next) } catch { /* storage blocked – theme still switches */ }
    updateLabel()
  })

  systemDark.addEventListener('change', updateLabel)
  updateLabel()
}

// Adds a ripple wherever a .btn is pressed.
export function setupRipples() {
  document.addEventListener('pointerdown', event => {
    const button = event.target.closest('.btn, .chip')
    if (!button || reducedMotion.matches) return

    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`
    button.append(ripple)
    ripple.addEventListener('animationend', () => ripple.remove())
  })
}

// Elements with .reveal fade and slide in when they scroll into view.
let observer
export function observeReveals(root = document) {
  const items = root.querySelectorAll('.reveal:not(.is-visible)')
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('is-visible'))
    return
  }
  observer ??= new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }
  }, { threshold: 0.15 })
  items.forEach(item => observer.observe(item))
}

// Counts a number up from 0 to its target.
export function countUp(element, target, duration = 1400) {
  if (reducedMotion.matches) {
    element.textContent = target
    return
  }
  const start = performance.now()
  const tick = now => {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    element.textContent = Math.round(target * eased)
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// Draws the blinking light bulbs of the marquee.
export function fillBulbs(container, count = 14) {
  for (let i = 0; i < count; i++) {
    const bulb = document.createElement('span')
    bulb.style.animationDelay = `${(i % 4) * 0.35}s`
    container.append(bulb)
  }
}
