import { useState } from 'react'

// Shows a list in pages of `size`; the count resets whenever `resetKey` changes
// (by default the list itself, i.e. a new filter/sort result)
export function usePaged<T>(list: T[], size = 30, resetKey: unknown = list) {
  const [state, setState] = useState({ key: resetKey, count: size })
  const count = state.key === resetKey ? state.count : size

  return {
    count,
    visible: list.slice(0, count),
    hasMore: count < list.length,
    showMore: () => setState({ key: resetKey, count: count + size }),
    // Make sure the item at `index` is rendered (e.g. before scrolling to it)
    reveal: (index: number) => {
      if (index >= count) setState({ key: resetKey, count: Math.ceil((index + 1) / size) * size })
    },
  }
}
