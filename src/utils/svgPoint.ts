/**
 * Convert a pointer position on screen into the SVG's own viewBox coordinates.
 * Works however large the SVG is drawn (and even if it is letter-boxed by a max-height),
 * so the big responsive pictures stay accurate to drag.
 */
export function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number): [number, number] {
  const ctm = svg.getScreenCTM()
  if (!ctm) return [0, 0]
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
  return [p.x, p.y]
}
