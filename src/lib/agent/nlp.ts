// ============================================
// GazeFocus Agent — NLP task parsing (Module C)
// ============================================
// Rules-based, offline date extraction via chrono-node.
// No network calls, no LLM keys required. Runs server-side
// in /api/agent/parse to keep the client bundle lean.

import * as chrono from 'chrono-node'

export interface ParsedTaskDraft {
  /** Cleaned task title with the date expression stripped. */
  title: string
  /** ISO timestamp chrono inferred for the deadline. */
  deadlineAt: string
  /** The raw date phrase chrono matched (for UI highlighting). */
  matchedText: string
}

/** Filler words commonly left dangling after removing the date phrase. */
const TRAILING_FILLER = [
  'by', 'before', 'on', 'at', 'for', 'due', 'until', 'till',
  'this', 'next', 'last', 'the', 'a', 'an', 'in', 'around',
  'from', 'to', 'of', 'is', 'my',
]

function cleanTitle(raw: string, matched: string): string {
  let title = raw

  // Remove every occurrence of the matched date phrase.
  if (matched) {
    try {
      title = title.replace(new RegExp(escaped(matched), 'gi'), ' ')
    } catch {
      title = title.split(matched).join(' ')
    }
  }

  // Strip common scheduling prefixes ("i have", "remind me", "submit" stays).
  title = title.replace(/^\s*(i\s+have|remind\s+me\s+(about|to)?|remember\s+to)\s+/i, ' ')

  // Normalize whitespace, then drop dangling prepositions/fillers repeatedly.
  title = title.replace(/\s+/g, ' ').trim()
  let words = title.split(' ')
  while (words.length > 1) {
    const last = words[words.length - 1].toLowerCase().replace(/[^\w]/g, '')
    if (TRAILING_FILLER.includes(last)) {
      words = words.slice(0, -1)
    } else {
      break
    }
  }

  title = words.join(' ').replace(/\s+/g, ' ').trim()

  // Trim leading filler too ("for the exam" -> "the exam")
  const first = words[0]?.toLowerCase().replace(/[^\w]/g, '')
  if (words.length > 1 && TRAILING_FILLER.includes(first)) {
    words = words.slice(1)
    title = words.join(' ').trim()
  }

  return title
}

function escaped(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Parse freeform text like "I have an exam on Friday at 4 PM"
 * into { title, deadlineAt }. Uses forwardDate so bare weekday
 * names ("Friday") always resolve to the *upcoming* occurrence.
 * Returns null when no date expression is found.
 */
export function parseTaskPrompt(input: string, referenceDate = new Date()): ParsedTaskDraft | null {
  const trimmed = (input || '').trim()
  if (!trimmed) return null

  const results = chrono.parse(trimmed, referenceDate, { forwardDate: true })
  if (!results || results.length === 0) return null

  const primary = results[0]
  const inferred = primary.start.date()

  // Reject dates that are already in the past (chrono forwardDate
  // should prevent this, but guard anyway).
  if (inferred.getTime() <= referenceDate.getTime() - 60_000) return null

  const matchedText = primary.text.trim()
  const title = cleanTitle(trimmed, matchedText)

  return {
    title: title || 'New Agent Task',
    deadlineAt: inferred.toISOString(),
    matchedText,
  }
}
