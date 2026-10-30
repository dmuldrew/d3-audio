/**
 * Matches d3's continuous-scale rule for missing input: null, undefined,
 * and anything that does not coerce to a number map to scale.unknown().
 */
export function isMissing(x) {
  return x == null || isNaN(+x);
}
