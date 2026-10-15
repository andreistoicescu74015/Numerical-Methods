import katex from 'katex'

// KaTeX rupe randul (in modul inline) dupa orice relatie sau operator de pe primul nivel, deci si
// in mijlocul unui interval: "k+1 : n" ar ajunge "k+1 :" pe un rand si "n" pe urmatorul. \nobreak
// dupa ":" si dupa "+" sau "-" urmate de o cifra (k+1, n-1) tine intervalele si indicii intregi;
// \allowbreak dupa \quad si \qquad lasa doua formule alaturate sa treaca una sub alta. Rupturile
// raman si dupa =, ←, ⟺ si intre termeni. Argumentele de text si de clasa raman neatinse.
export const rupturi = (tex: string): string =>
  tex.replace(/(\\(?:text|htmlClass|operatorname|mathrm)\{[^}]*\})|\\q?quad\b|:|(?<=[\w}])\s*[+-](?=\s*\d)/g, (m, arg?: string) => arg ?? (m.endsWith('quad') ? `${m}\\allowbreak ` : `${m}\\nobreak `))

// Taie o formula la separatorul de pe primul nivel: in afara acoladelor si a parantezelor, nu in
// interiorul unei comenzi. Intoarce bucatile si separatorii dintre ele; spatiile din jurul
// separatorului nu intra in bucati.
export function taie(tex: string, separator: RegExp): { bucati: string[]; separatori: string[] } {
  const bucati: string[] = []
  const separatori: string[] = []
  const re = new RegExp(separator.source, 'y')
  let adancime = 0
  let inceput = 0
  for (let i = 0; i < tex.length; i++) {
    const c = tex[i]
    if (c === '\\') {
      // o comanda (\left, \sum) sau un simbol protejat (\{, \,)
      const m = /^\\([a-zA-Z]+|.)/.exec(tex.slice(i))
      i += (m?.[0].length ?? 1) - 1
      continue
    }
    if (c === '{' || c === '(' || c === '[') adancime++
    else if (c === '}' || c === ')' || c === ']') adancime--
    else if (adancime === 0 && i > inceput) {
      re.lastIndex = i
      const m = re.exec(tex)
      if (m && m[0].length > 0) {
        bucati.push(tex.slice(inceput, i).trim())
        separatori.push(m[0].trim())
        inceput = i + m[0].length
        i = inceput - 1
      }
    }
  }
  bucati.push(tex.slice(inceput).trim())
  return { bucati, separatori }
}

// Formula pasului, in bucati care incep cu "=": o formula lata trece pe randul urmator la un "=",
// in loc sa fie taiata la marginea cardului.
export const bucatiFormula = (tex: string): string[] => {
  const { bucati } = taie(tex, /\s+=\s+/)
  return bucati.map((b, k) => (k === 0 ? b : `= ${b}`))
}

// O formula din sertar cu mai multe relatii despartite prin \quad sau \qquad: fiecare relatie
// sta intr-un grup, ca randul sa se rupa doar intre relatii, nu in mijlocul uneia ("A = D −" pe
// un rand si "N" pe urmatorul).
export const grupuriRupt = (tex: string): string => {
  const { bucati, separatori } = taie(tex, /\s*\\q?quad\b\s*/)
  if (bucati.length === 1) return tex
  return bucati.map((b, k) => `{${b}}${k < separatori.length ? ` ${separatori[k]} ` : ''}`).join('')
}

const OPTIUNI = { throwOnError: false, trust: true, strict: false }

// `trust` permite \htmlClass, cu care interpretorul coloreaza tinta, pivotul si elementele
// citite; fara `strict: false`, KaTeX ar avertiza in consola la fiecare formula.
// `rupt`: o formula pe randul ei care, intr-un panou ingust, trece pe randul urmator dupa \quad
// sau \qquad; KaTeX rupe randul doar in modul inline, iar \displaystyle pastreaza aspectul afisat.
export function Formula({ tex, inline = false, rupt = false }: { tex?: string; inline?: boolean; rupt?: boolean }) {
  if (!tex) return null
  if (inline) return <span className="formula-mica" dangerouslySetInnerHTML={{ __html: katex.renderToString(rupturi(tex), { ...OPTIUNI, displayMode: false }) }} />
  if (rupt)
    return <div className="formula formula-rupta" dangerouslySetInnerHTML={{ __html: katex.renderToString(`\\displaystyle ${rupturi(grupuriRupt(tex))}`, { ...OPTIUNI, displayMode: false }) }} />
  return (
    <div className="formula">
      {bucatiFormula(tex).map((b, k) => (
        <div key={k} className="bucata" dangerouslySetInnerHTML={{ __html: katex.renderToString(b, { ...OPTIUNI, displayMode: true }) }} />
      ))}
    </div>
  )
}
