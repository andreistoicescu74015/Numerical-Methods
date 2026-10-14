import katex from 'katex'

// `trust` permite \htmlClass, cu care interpretorul coloreaza tinta, pivotul si elementele
// citite; fara `strict: false`, KaTeX ar avertiza in consola la fiecare formula.
export function Formula({ tex, inline = false }: { tex?: string; inline?: boolean }) {
  if (!tex) return null
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: !inline, trust: true, strict: false })
  if (inline) return <span className="formula-mica" dangerouslySetInnerHTML={{ __html: html }} />
  return <div className="formula" dangerouslySetInnerHTML={{ __html: html }} />
}
