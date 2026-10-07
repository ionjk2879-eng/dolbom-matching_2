import { useState } from 'react'

// Shows a list in pages of `size`; the count resets whenever a new list (new filter/sort) comes in
export function usePaged<T>(list: T[], size = 30) {
  const [state, setState] = useState({ list, count: size })
  const count = state.list === list ? state.count : size

  return {
    visible: list.slice(0, count),
    hasMore: count < list.length,
    showMore: () => setState({ list, count: count + size }),
    // Make sure the item at `index` is rendered (e.g. before scrolling to it)
    reveal: (index: number) => {
      if (index >= count) setState({ list, count: Math.ceil((index + 1) / size) * size })
    },
  }
}
