import { usePreferinte } from '../preferinte'

export const VITEZE = [0.5, 1, 2, 4, 8, 16]

// o crestatura pe urma: mica la o scriere intr-un tablou, mare la inceputul unei iteratii,
// rosie la pasul in care rularea se opreste
export interface Marcaj {
  k: number
  fel: 'mic' | 'mare' | 'capat'
}

interface Props {
  k: number
  total: number
  // un pas inapoi sau inainte mai are unde merge (si ascunderea sau dezvaluirea rezultatului e un pas)
  poateInapoi: boolean
  poateInainte: boolean
  // rezultatul pasului curent e ascuns: pasul urmator il arata
  ascuns: boolean
  redare: boolean
  viteza: number
  marcaje: Marcaj[]
  onK: (k: number) => void
  onInainte: () => void
  onInapoi: () => void
  onScriere: (directie: 1 | -1) => void
  onRedare: (r: boolean) => void
  onViteza: (v: number) => void
}

const Icon = ({ d, scriere }: { d: string; scriere?: boolean }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    {scriere && <rect className="scriere-semn" x={scriere ? 1 : 0} y="5" width="4" height="6" rx="1" />}
    <path d={d} />
  </svg>
)

// Bara de parcurgere: butoanele cu pictograma si eticheta, cursorul pe urma cu crestaturi,
// redarea si viteza. Pasul inainte e singurul buton plin.
export function Comenzi({ k, total, poateInapoi, poateInainte, ascuns, redare, viteza, marcaje, onK, onInainte, onInapoi, onScriere, onRedare, onViteza }: Props) {
  const { t } = usePreferinte()
  const ultimul = Math.max(total - 1, 0)
  const oprit = (f: () => void) => () => {
    onRedare(false)
    f()
  }
  const laCapat = !poateInainte && total > 0
  const procent = (x: number) => (ultimul === 0 ? 0 : (x / ultimul) * 100)
  return (
    <div className="comenzi" role="group" aria-label={t('comenzi')}>
      <button type="button" className="tasta" onClick={oprit(() => onK(0))} disabled={k === 0} title={t('laInceput')} aria-label={t('laInceput')}>
        <Icon d="M2 2h2v12H2zM14 2 6 8l8 6z" />
        <span>{t('inceput')}</span>
      </button>
      <button type="button" className="tasta" onClick={oprit(() => onScriere(-1))} disabled={k === 0} title={t('scriereaAnterioara')} aria-label={t('scriereaAnterioara')}>
        <Icon d="M14 2 6 8l8 6z" scriere />
        <span>{t('scriereInapoi')}</span>
      </button>
      <button type="button" className="tasta" onClick={oprit(onInapoi)} disabled={!poateInapoi} title={t('pasInapoi')} aria-label={t('pasInapoi')}>
        <Icon d="M12 2 4 8l8 6z" />
        <span>{t('inapoi')}</span>
      </button>
      <button
        type="button"
        className="tasta principal"
        onClick={oprit(() => (laCapat ? onK(0) : onInainte()))}
        disabled={total === 0}
        title={t('pasInainte')}
        aria-label={t('pasInainte')}
      >
        <Icon d={laCapat ? 'M8 2a6 6 0 1 1-5.2 3H5L2 8 0 5h1.3A7 7 0 1 0 8 1z' : 'M4 2l8 6-8 6z'} />
        <span>{laCapat ? t('deLaInceput') : ascuns ? t('arata') : t('pas')}</span>
      </button>
      <button type="button" className="tasta" onClick={oprit(() => onScriere(1))} disabled={k >= ultimul} title={t('urmatoareaScriere')} aria-label={t('urmatoareaScriere')}>
        <Icon d="M7 2l8 6-8 6z" scriere />
        <span>{t('scriereInainte')}</span>
      </button>
      <button type="button" className="tasta" onClick={oprit(() => onK(ultimul))} disabled={!poateInainte} title={t('laSfarsit')} aria-label={t('laSfarsit')}>
        <Icon d="M2 2l8 6-8 6zM12 2h2v12h-2z" />
        <span>{t('sfarsit')}</span>
      </button>
      <div className="urma">
        <div className="pista">
          <div className="crestaturi" aria-hidden="true" title={t('urmaLegenda')}>
            {marcaje.map((m) => (
              <span key={`${m.fel}${m.k}`} className={`crestatura ${m.fel}`} style={{ left: `${procent(m.k)}%` }} />
            ))}
          </div>
          <input type="range" min={0} max={ultimul} value={k} onChange={(e) => oprit(() => onK(Number(e.target.value)))()} aria-label={t('pasulCurent')} title={t('urmaLegenda')} />
        </div>
        <div className="pozitie">
          {total > 0 ? k + 1 : 0} / {total}
        </div>
      </div>
      <button type="button" className="tasta" onClick={() => onRedare(!redare)} disabled={total === 0} title={t('redaPauza')} aria-label={t('redaPauza')}>
        <Icon d={redare ? 'M3 2h4v12H3zM9 2h4v12H9z' : 'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zM6.5 5v6l5-3z'} />
        <span>{redare ? t('pauza') : t('reda')}</span>
      </button>
      <label>
        {t('viteza')}
        <select value={viteza} onChange={(e) => onViteza(Number(e.target.value))}>
          {VITEZE.map((v) => (
            <option key={v} value={v}>
              {t('pasiPeSecunda', v)}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
