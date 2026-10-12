import katex from 'katex'

// `trust` permite \htmlClass, cu care interpretorul coloreaza tinta, pivotul si elementele
// citite; fara `strict: false`, KaTeX ar avertiza in consola la fiecare formula.
export function Formula({ tex }: { tex?: string }) {
  if (!tex) return null
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: true, trust: true, strict: false })
  return <div className="formula" dangerouslySetInnerHTML={{ __html: html }} />
}
