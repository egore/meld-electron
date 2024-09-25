export type ComparisonStarterFunction = (
  equivalents: Equivalent[],
  left?: string,
  right?: string,
  addToHistory?: boolean
) => void
