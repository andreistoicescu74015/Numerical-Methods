import { definitieNoua, type Definitie, type TipIntrare } from '../intrari'
import { usePreferinte } from '../preferinte'

interface Props {
  definitii: Definitie[]
  descrieri: Record<string, string>
  onChange: (definitii: Definitie[]) => void
}

// Valori intregi intre -5 si 5, cu dimensiunile textului curent (sau 3x3, 3, 1).
export function textAleator(tip: TipIntrare, text: string): string {
  const intreg = () => Math.floor(Math.random() * 11) - 5
  const linii = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (tip === 'scalar') return String(intreg())
  if (tip === 'vector') {
    const n = Math.max(1, linii.join(' ').split(/[\s,;]+/).filter(Boolean).length || 3)
    return Array.from({ length: n }, intreg).join(' ')
  }
  const m = linii.length || 3
  const n = linii[0]?.split(/[\s,;]+/).filter(Boolean).length || 3
  return Array.from({ length: m }, () => Array.from({ length: n }, intreg).join(' ')).join('\n')
}

export function Intrari({ definitii, descrieri, onChange }: Props) {
  const { t } = usePreferinte()
  const schimba = (k: number, schimbare: Partial<Definitie>) => onChange(definitii.map((d, i) => (i === k ? { ...d, ...schimbare } : d)))
  const adauga = (tip: TipIntrare) => onChange([...definitii, definitieNoua(definitii, tip)])

  return (
    <div className="intrari">
      {definitii.length === 0 && <p className="ajutor">{t('faraIntrari')}</p>}
      {definitii.map((d, k) => (
        <div key={k} className={`intrare ${d.tip}`}>
          <div className="antet">
            <input className="nume" value={d.nume} aria-label={t('nume')} onChange={(e) => schimba(k, { nume: e.target.value })} />
            <select value={d.tip} aria-label={t('matrice')} onChange={(e) => schimba(k, { tip: e.target.value as TipIntrare })}>
              <option value="matrice">{t('matrice')}</option>
              <option value="vector">{t('vector')}</option>
              <option value="scalar">{t('scalar')}</option>
            </select>
            {descrieri[d.nume] && <span className="descriere-intrare">{descrieri[d.nume]}</span>}
            <button type="button" className="mic" title={t('aleatorAjutor')} onClick={() => schimba(k, { text: textAleator(d.tip, d.text) })}>
              {t('aleator')}
            </button>
            <button type="button" className="mic sterge" title={t('sterge')} onClick={() => onChange(definitii.filter((_, i) => i !== k))}>
              ×
            </button>
          </div>
          {d.tip === 'scalar' ? (
            <input value={d.text} aria-label={d.nume} onChange={(e) => schimba(k, { text: e.target.value })} />
          ) : (
            <textarea
              value={d.text}
              rows={d.tip === 'vector' ? 1 : 4}
              spellCheck={false}
              aria-label={d.nume}
              title={t('valoriAjutor')}
              onChange={(e) => schimba(k, { text: e.target.value })}
            />
          )}
        </div>
      ))}
      <div className="adauga">
        <button type="button" onClick={() => adauga('matrice')}>
          {t('adaugaMatrice')}
        </button>
        <button type="button" onClick={() => adauga('vector')}>
          {t('adaugaVector')}
        </button>
        <button type="button" onClick={() => adauga('scalar')}>
          {t('adaugaScalar')}
        </button>
      </div>
    </div>
  )
}
