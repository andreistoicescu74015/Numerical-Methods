import katex from 'katex'

// KaTeX rupe randul (in modul inline) dupa orice relatie sau operator de pe primul nivel, deci si
// in mijlocul unui interval: "k+1 : n" ar ajunge "k+1 :" pe un rand si "n" pe urmatorul. \nobreak
// dupa ":" si dupa "+" sau "-" urmate de o cifra (k+1, n-1) tine intervalele si indicii intregi;
// \allowbreak dupa \quad si \qquad lasa doua formule alaturate sa treaca una sub alta. Rupturile
// raman si dupa =, ←, ⟺ si intre termeni. Argumentele de text si de clasa raman neatinse.
export const rupturi = (tex: string): string =>
  tex.replace(/(\\(?:text|htmlClass|operatorname|mathrm)\{[^}]*\})|\\q?quad\b|:|(?<=[\w}])\s*[+-](?=\s*\d)/g, (m, arg?: string) => arg ?? (m.endsWith('quad') ? `${m}\\allowbreak ` : `${m}\\nobreak `))

// `trust` permite \htmlClass, cu care interpretorul coloreaza tinta, pivotul si elementele
// citite; fara `strict: false`, KaTeX ar avertiza in consola la fiecare formula.
// `rupt`: o formula pe randul ei care, intr-un panou ingust, trece pe randul urmator dupa =, ⟺
// sau +; KaTeX rupe randul doar in modul inline, iar \displaystyle pastreaza aspectul afisat.
export function Formula({ tex, inline = false, rupt = false }: { tex?: string; inline?: boolean; rupt?: boolean }) {
  if (!tex) return null
  const sursa = rupt ? `\\displaystyle ${rupturi(tex)}` : inline ? rupturi(tex) : tex
  const html = katex.renderToString(sursa, { throwOnError: false, displayMode: !inline && !rupt, trust: true, strict: false })
  if (inline) return <span className="formula-mica" dangerouslySetInnerHTML={{ __html: html }} />
  return <div className={rupt ? 'formula formula-rupta' : 'formula'} dangerouslySetInnerHTML={{ __html: html }} />
}
