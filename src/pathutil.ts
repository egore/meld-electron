export function getCommonPathLength(left: string, right: string): number {
  let i
  for (i = 0; i < Math.min(left.lastIndexOf('/') + 1, right.lastIndexOf('/') + 1); i++) {
    const leftChar = left[i]
    const rightChar = right[i]
    if (leftChar !== rightChar) {
      break
    }
  }
  return i
}
