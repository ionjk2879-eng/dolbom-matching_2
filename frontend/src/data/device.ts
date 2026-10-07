// Phones/tablets: no hover, finger-sized pointer. Mouse-only UI (drag, right-click, Ctrl)
// needs a touch alternative when this is true
export const isTouchDevice =
  typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches
