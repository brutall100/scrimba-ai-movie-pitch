import { pickDemoPitch } from './demo-pitches.js'
import { setupThemeToggle, setupRipples, observeReveals, countUp, fillBulbs } from './ui.js'

const MAX_LENGTH = 300

const els = {
  form: document.getElementById('pitch-form'),
  idea: document.getElementById('idea'),
  count: document.getElementById('idea-count'),
  error: document.getElementById('idea-error'),
  pitchBtn: document.getElementById('pitch-btn'),
  bossText: document.getElementById('boss-text'),
  reel: document.getElementById('reel'),
  modeBadge: document.getElementById('mode-badge'),
  stage: document.getElementById('stage'),
  premiere: document.getElementById('premiere'),
  posterArt: document.getElementById('poster-art'),
  genre: document.getElementById('movie-genre'),
  title: document.getElementById('movie-title'),
  tagline: document.getElementById('movie-tagline'),
  logline: document.getElementById('movie-logline'),
  synopsis: document.getElementById('movie-synopsis'),
  cast: document.getElementById('movie-cast'),
  runtime: document.getElementById('stat-runtime'),
  budget: document.getElementById('stat-budget'),
  score: document.getElementById('stat-score'),
  againBtn: document.getElementById('again-btn')
}

const INTRO_TEXT = els.bossText.textContent
let liveMode = false

setupThemeToggle(document.getElementById('theme-toggle'))
setupRipples()
fillBulbs(document.querySelector('.marquee__bulbs'))
observeReveals()
detectMode()

els.idea.addEventListener('input', () => {
  els.count.textContent = `${els.idea.value.length} / ${MAX_LENGTH}`
  els.error.textContent = ''
})

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    els.idea.value = chip.dataset.idea
    els.idea.dispatchEvent(new Event('input'))
    els.idea.focus()
  })
})

els.form.addEventListener('submit', async event => {
  event.preventDefault()
  const idea = els.idea.value.trim()
  if (!idea) {
    els.error.textContent = 'Please write your movie idea first.'
    els.idea.focus()
    return
  }

  setLoading(true)
  els.bossText.textContent = 'Ok, just wait a second while my digital brain digests that…'

  try {
    const pitch = liveMode ? await fetchLivePitch(idea) : await fakeDelay(pickDemoPitch(idea))
    els.bossText.textContent = pitch.reply
    await wait(900)
    showPitch(pitch, idea)
  } catch (error) {
    console.error(error)
    els.bossText.textContent = 'Cut! Something went wrong. Please try again.'
    els.error.textContent = error.message
  } finally {
    setLoading(false)
  }
})

els.againBtn.addEventListener('click', () => {
  els.premiere.hidden = true
  els.idea.value = ''
  els.idea.dispatchEvent(new Event('input'))
  els.bossText.textContent = INTRO_TEXT
  els.stage.scrollIntoView({ behavior: 'smooth' })
  els.idea.focus({ preventScroll: true })
})

// GitHub Pages has no server, so it always uses demo mode.
// Anywhere else we ask the local server whether it has an OpenAI key.
async function detectMode() {
  const isStaticHost = location.hostname.endsWith('github.io') || location.protocol === 'file:'
  if (!isStaticHost) {
    try {
      const response = await fetch('api/health', { headers: { Accept: 'application/json' } })
      const data = response.ok ? await response.json() : null
      liveMode = Boolean(data?.live)
    } catch {
      liveMode = false
    }
  }
  els.modeBadge.dataset.mode = liveMode ? 'live' : 'demo'
  els.modeBadge.textContent = liveMode ? 'Live AI' : 'Demo mode'
  els.modeBadge.title = liveMode
    ? 'Pitches are written by OpenAI through the local server.'
    : 'Sample pitches. Run the project locally with your own OpenAI key for real AI.'
}

async function fetchLivePitch(idea) {
  const response = await fetch('api/pitch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea })
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Server error (${response.status})`)
  return data
}

function showPitch(pitch, idea) {
  els.genre.textContent = pitch.genre
  els.title.textContent = pitch.title
  els.tagline.textContent = pitch.tagline
  els.logline.textContent = `Logline: ${idea}`
  els.synopsis.textContent = pitch.synopsis

  els.posterArt.querySelector('img')?.remove()
  els.posterArt.classList.toggle('has-image', Boolean(pitch.imageUrl))
  if (pitch.imageUrl) {
    const img = new Image(1024, 1024)
    img.src = pitch.imageUrl
    img.alt = `AI-generated poster art for ${pitch.title}`
    els.posterArt.prepend(img)
  }

  els.cast.replaceChildren(...pitch.cast.map(({ role, actor }) => {
    const item = document.createElement('li')
    const name = document.createElement('strong')
    const as = document.createElement('span')
    name.textContent = actor
    as.textContent = `as ${role}`
    item.append(name, as)
    return item
  }))

  els.premiere.hidden = false
  els.premiere.querySelectorAll('.reveal').forEach(el => el.classList.remove('is-visible'))
  observeReveals(els.premiere)
  els.premiere.scrollIntoView({ behavior: 'smooth', block: 'start' })

  countUp(els.runtime, pitch.runtime)
  countUp(els.budget, pitch.budget)
  countUp(els.score, pitch.score)
}

function setLoading(isLoading) {
  els.pitchBtn.disabled = isLoading
  els.pitchBtn.setAttribute('aria-busy', String(isLoading))
  els.reel.hidden = !isLoading
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Makes demo mode feel like Movie Boss is thinking.
async function fakeDelay(value) {
  await wait(1400)
  return value
}
