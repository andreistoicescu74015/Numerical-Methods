import { usePreferinte } from '../preferinte'

export const VITEZE = [0.5, 1, 2, 4, 8, 16]

interface Props {
  k: number
  total: number
  redare: boolean
  viteza: number
  onK: (k: number) => void
  onScriere: (directie: 1 | -1) => void
  onRedare: (r: boolean) => void
  onViteza: (v: number) => void
}

export function Comenzi({ k, total, redare, viteza, onK, onScriere, onRedare, onViteza }: Props) {
  const { t } = usePreferinte()
  const ultimul = Math.max(total - 1, 0)
  const sari = (nou: number) => {
    onRedare(false)
    onK(Math.min(Math.max(nou, 0), ultimul))
  }
  const scriere = (d: 1 | -1) => {
    onRedare(false)
    onScriere(d)
  }
  return (
    <div className="comenzi">
      <button type="button" onClick={() => sari(0)} disabled={k === 0} title={t('laInceput')}>
        |&lt;
      </button>
      <button type="button" onClick={() => scriere(-1)} disabled={k === 0} title={t('scriereaAnterioara')}>
        &lt;&lt;
      </button>
      <button type="button" onClick={() => sari(k - 1)} disabled={k === 0} title={t('pasInapoi')}>
        &lt;
      </button>
      <button type="button" className="principal" onClick={() => onRedare(!redare)} disabled={total === 0} title={t('redaPauza')}>
        {redare ? t('pauza') : k >= ultimul ? t('deLaInceput') : t('reda')}
      </button>
      <button type="button" onClick={() => sari(k + 1)} disabled={k >= ultimul} title={t('pasInainte')}>
        &gt;
      </button>
      <button type="button" onClick={() => scriere(1)} disabled={k >= ultimul} title={t('urmatoareaScriere')}>
        &gt;&gt;
      </button>
      <button type="button" onClick={() => sari(ultimul)} disabled={k >= ultimul} title={t('laSfarsit')}>
        &gt;|
      </button>
      <input type="range" min={0} max={ultimul} value={k} onChange={(e) => sari(Number(e.target.value))} aria-label={t('pasulCurent')} />
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
