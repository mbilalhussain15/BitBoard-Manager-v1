// useIsClamped.ts
import * as React from "react"
export function useIsClamped(ref, deps = []) {
  const [clamped, setClamped] = React.useState(false)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () =>
      setClamped(
        el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth
      )
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return clamped
}
