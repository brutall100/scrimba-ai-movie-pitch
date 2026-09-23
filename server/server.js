// Tiny local server for Movie Pitch.
// - Serves the static site (index.html, css/, js/, images/).
// - Adds /api/health and /api/pitch, which talk to OpenAI.
// The API key lives only here, read from the environment or a local .env file,
// so it never reaches the browser.

import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

loadDotEnv(path.join(ROOT, '.env'))

const PORT = Number(process.env.PORT) || 5173
const HOST = process.env.HOST || '127.0.0.1'
const API_KEY = process.env.OPENAI_API_KEY || ''
const BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
const TEXT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'
const MAX_IDEA_LENGTH = 300

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8'
}

// Only these top-level folders/files are public. Everything else (.env, server/, package.json) stays private.
const PUBLIC_PATHS = ['index.html', 'css', 'js', 'images', 'docs']

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)

    if (url.pathname === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, live: Boolean(API_KEY) })
    }

    if (url.pathname === '/api/pitch' && req.method === 'POST') {
      return await handlePitch(req, res)
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      return await serveStatic(url.pathname, res)
    }

    sendJson(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    console.error(error)
    sendJson(res, 500, { error: 'Something went wrong on the server.' })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`🎬 Movie Pitch running at http://${HOST}:${PORT}`)
  console.log(API_KEY ? '   Live AI mode: OpenAI key found.' : '   Demo mode: no OPENAI_API_KEY set.')
})

async function handlePitch(req, res) {
  if (!API_KEY) {
    return sendJson(res, 503, { error: 'No OPENAI_API_KEY on the server. The site will use demo mode.' })
  }

  let body
  try {
    body = JSON.parse(await readBody(req, 10_000))
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON.' })
  }

  const idea = typeof body.idea === 'string' ? body.idea.trim() : ''
  if (!idea || idea.length > MAX_IDEA_LENGTH) {
    return sendJson(res, 400, { error: `Your idea must be 1–${MAX_IDEA_LENGTH} characters long.` })
  }

  const pitch = await createPitch(idea)
  pitch.imageUrl = await createPoster(pitch.imagePrompt).catch(error => {
    console.warn('Poster generation failed:', error.message)
    return null
  })
  delete pitch.imagePrompt

  sendJson(res, 200, pitch)
}

async function createPitch(idea) {
  const data = await openai('/chat/completions', {
    model: TEXT_MODEL,
    temperature: 0.9,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are "Movie Boss", a flamboyant Hollywood producer. Turn a one-sentence movie idea into a pitch.
Reply with JSON only, using exactly these keys:
{
  "reply": "one enthusiastic sentence reacting to the idea",
  "title": "a catchy movie title",
  "tagline": "a short poster tagline",
  "genre": "one or two words",
  "synopsis": "an engaging, marketable synopsis of about 120 words",
  "cast": [{ "role": "character name", "actor": "a real actor who fits the role" }],
  "runtime": number of minutes between 80 and 180,
  "budget": estimated budget in millions of US dollars (number),
  "score": how excited the studio is, 0-100 (number),
  "imagePrompt": "a visual description of a movie poster, rich in detail, with no names and no text"
}
Give 3 or 4 cast members.`
      },
      { role: 'user', content: idea }
    ]
  })

  const pitch = JSON.parse(data.choices[0].message.content)
  return {
    reply: String(pitch.reply || 'I love it!'),
    title: String(pitch.title || 'Untitled'),
    tagline: String(pitch.tagline || ''),
    genre: String(pitch.genre || 'Drama'),
    synopsis: String(pitch.synopsis || ''),
    cast: Array.isArray(pitch.cast)
      ? pitch.cast.slice(0, 4).map(c => ({ role: String(c.role || ''), actor: String(c.actor || '') }))
      : [],
    runtime: clampNumber(pitch.runtime, 80, 180, 110),
    budget: clampNumber(pitch.budget, 1, 400, 40),
    score: clampNumber(pitch.score, 0, 100, 80),
    imagePrompt: String(pitch.imagePrompt || pitch.title)
  }
}

async function createPoster(imagePrompt) {
  const request = {
    model: IMAGE_MODEL,
    prompt: `${imagePrompt}. Vintage cinema poster style. There should be no text in this image.`,
    n: 1,
    size: '1024x1024'
  }
  // DALL·E models return a short-lived URL unless we ask for base64.
  if (IMAGE_MODEL.startsWith('dall-e')) request.response_format = 'b64_json'

  const data = await openai('/images/generations', request)
  const image = data.data[0]
  return image.b64_json ? `data:image/png;base64,${image.b64_json}` : image.url
}

async function openai(endpoint, payload) {
  const response = await fetch(BASE_URL + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    const details = await response.text()
    throw new Error(`OpenAI ${endpoint} failed (${response.status}): ${details.slice(0, 300)}`)
  }
  return response.json()
}

async function serveStatic(pathname, res) {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html'
  const filePath = path.resolve(ROOT, relative)
  // Check the *resolved* path, so tricks like "images/../.env" are blocked too.
  const topLevel = path.relative(ROOT, filePath).split(path.sep)[0]

  const isInsideRoot = filePath.startsWith(ROOT + path.sep)
  if (!isInsideRoot || !PUBLIC_PATHS.includes(topLevel)) {
    return sendText(res, 404, 'Not found')
  }

  try {
    const info = await stat(filePath)
    if (!info.isFile()) return sendText(res, 404, 'Not found')
    const type = MIME_TYPES[path.extname(filePath)] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': type })
    res.end(await readFile(filePath))
  } catch {
    sendText(res, 404, 'Not found')
  }
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', chunk => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('Body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': MIME_TYPES['.json'] })
  res.end(JSON.stringify(data))
}

function sendText(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end(text)
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.round(Math.min(max, Math.max(min, number)))
}

// Minimal .env reader, so the project needs no extra packages.
function loadDotEnv(file) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (!match || line.trim().startsWith('#')) continue
    const [, key, raw] = match
    if (process.env[key] === undefined) process.env[key] = raw.replace(/^(['"])(.*)\1$/, '$2')
  }
}
