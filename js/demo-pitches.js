// Ready-made pitches for demo mode (GitHub Pages has no server, so no AI).
// All actors are made up.

export const demoPitches = [
  {
    keywords: ['love', 'romance', 'date', 'wedding', 'food', 'cook', 'heart', 'kiss'],
    reply: 'A love story with a twist? The studios are going to fight over this one!',
    title: 'Second Helping',
    tagline: 'Some rivals are made for each other.',
    genre: 'Romantic comedy',
    synopsis: 'Every summer, the harbour festival crowns one champion. This year, stubborn grill master Nora Vale and smooth pastry chef Theo Marsh park their trucks side by side, and the war begins. Stolen customers, sabotaged ovens and one very public argument about pancakes turn the whole town into their audience. But when a storm knocks out the festival and both of them must feed three hundred stranded guests, they learn that the best recipes need two cooks. A warm, funny story about pride, second chances and the joy of sharing a table.',
    cast: [
      { role: 'Nora Vale', actor: 'Maya Linwood' },
      { role: 'Theo Marsh', actor: 'Julian Pace' },
      { role: 'Grandma Ines', actor: 'Rosa Delmar' }
    ],
    runtime: 104,
    budget: 28,
    score: 88
  },
  {
    keywords: ['space', 'planet', 'astronaut', 'alien', 'star', 'moon', 'galaxy', 'rocket', 'mars'],
    reply: 'Space! Mystery! Popcorn sales through the roof! Give me a moment…',
    title: 'The Quiet Orbit',
    tagline: 'She was never alone up there.',
    genre: 'Sci-fi thriller',
    synopsis: 'Engineer Ada Crane has spent eleven months alone on the research station Halcyon, fixing things and talking to her plants. Then the coffee starts disappearing. Doors she locked are open. And the station logs show a second person on board, one who has been there longer than she has. As a solar storm cuts her off from Earth, Ada must decide whether her mysterious crewmate is a threat or the only friend she has left. A tense, beautiful story about trust at the edge of space.',
    cast: [
      { role: 'Ada Crane', actor: 'Elise Moreau' },
      { role: 'The Stranger', actor: 'Kenji Arlo' },
      { role: 'Mission Control', actor: 'Samuel Oduya' }
    ],
    runtime: 126,
    budget: 145,
    score: 93
  },
  {
    keywords: ['detective', 'crime', 'murder', 'police', 'case', 'heist', 'thief', 'lawyer', 'mystery'],
    reply: 'A mystery? I already have goosebumps. Let me call my writers!',
    title: 'One Last Clue',
    tagline: 'Retired from the force. Not from the truth.',
    genre: 'Family mystery',
    synopsis: 'Former detective Walter Brook swore he was done with crime. But when the town museum’s famous golden clock vanishes the night before its anniversary, the police are stuck, and Walter’s three grandchildren are sure they have spotted a clue. With a bad knee, a notebook full of old tricks and three very eager assistants, Walter takes on his final case. Between secret tunnels, suspicious neighbours and a lot of ice cream, the family discovers the real treasure was hiding in plain sight.',
    cast: [
      { role: 'Walter Brook', actor: 'Harold Finch-Grey' },
      { role: 'Lily Brook', actor: 'Poppy Adair' },
      { role: 'Inspector Ruiz', actor: 'Camila Soto' },
      { role: 'Mr. Pendle', actor: 'Otto Kramm' }
    ],
    runtime: 98,
    budget: 35,
    score: 81
  },
  {
    keywords: ['dog', 'cat', 'animal', 'pet', 'horse', 'bird', 'dragon', 'monster'],
    reply: 'Animals? Audiences LOVE animals. I can already hear the box office!',
    title: 'Paws of Thunder',
    tagline: 'Small paws. Big storm.',
    genre: 'Adventure',
    synopsis: 'When a hurricane sweeps through Pelican Bay, a scrappy shelter dog named Biscuit is carried out to a tiny island along with a grumpy parrot and a very confused goat. To get home, the unlikely trio must cross wild marshes, outsmart a hungry alligator and learn to work as a team. Meanwhile, ten-year-old Sam refuses to stop searching for the dog nobody else wanted. A big-hearted adventure about loyalty, courage and finding your way back home.',
    cast: [
      { role: 'Sam', actor: 'Noah Bright' },
      { role: 'Biscuit (voice)', actor: 'Frankie Dunn' },
      { role: 'Captain the Parrot (voice)', actor: 'Iris Kaye' }
    ],
    runtime: 92,
    budget: 60,
    score: 86
  },
  {
    // Default pitch when no keyword matches.
    keywords: [],
    reply: 'Wow, that is bold! Give me a few moments to think… I smell an award.',
    title: 'The Grand Idea',
    tagline: 'One idea can change everything.',
    genre: 'Drama',
    synopsis: 'Nobody believed in Mira Stone, a small-town inventor with a garage full of half-finished machines. When her boldest idea attracts the attention of a powerful company, she is offered fame, money and everything she ever dreamed of, but only if she gives up control of her work. With the help of her loyal best friend and a very old notebook left by her father, Mira must decide what success really means. An inspiring story about big dreams, hard choices and staying true to yourself.',
    cast: [
      { role: 'Mira Stone', actor: 'Clara Wynn' },
      { role: 'Jonah Reed', actor: 'Marcus Hale' },
      { role: 'Victor Crane', actor: 'Edmund Rourke' }
    ],
    runtime: 118,
    budget: 42,
    score: 79
  }
]

// Picks the demo pitch whose keywords best match the user's idea.
export function pickDemoPitch(idea) {
  const text = idea.toLowerCase()
  let best = demoPitches[demoPitches.length - 1]
  let bestHits = 0
  for (const pitch of demoPitches) {
    const hits = pitch.keywords.filter(word => text.includes(word)).length
    if (hits > bestHits) {
      best = pitch
      bestHits = hits
    }
  }
  return { ...best, imageUrl: null }
}
