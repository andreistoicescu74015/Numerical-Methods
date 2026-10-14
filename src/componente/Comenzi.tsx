import { usePreferinte } from '../preferinte'

export const VITEZE = [0.5, 1, 2, 4, 8, 16]

interface Props {
  k: number
  total: number
  // un pas inapoi sau inainte mai are unde merge (si ascunderea sau dezvaluirea rezultatului e un pas)
  poateInapoi: boolean
  poateInainte: boolean
  redare: boolean
  viteza: number
  intrebari: boolean
  onK: (k: number) => void
  onInainte: () => void
  onInapoi: () => void
  onScriere: (directie: 1 | -1) => void
  onRedare: (r: boolean) => void
  onViteza: (v: number) => void
  onIntrebari: (v: boolean) => void
}

export function Comenzi({ k, total, poateInapoi, poateInainte, redare, viteza, intrebari, onK, onInainte, onInapoi, onScriere, onRedare, onViteza, onIntrebari }: Props) {
  const { t } = usePreferinte()
  const ultimul = Math.max(total - 1, 0)
  const oprit = (f: () => void) => () => {
    onRedare(false)
    f()
  }
  return (
    <div className="comenzi" role="group" aria-label={t('comenzi')}>
      <button type="button" onClick={oprit(() => onK(0))} disabled={k === 0} title={t('laInceput')} aria-label={t('laInceput')}>
        |&lt;
      </button>
      <button type="button" onClick={oprit(() => onScriere(-1))} disabled={k === 0} title={t('scriereaAnterioara')} aria-label={t('scriereaAnterioara')}>
        &lt;&lt;
      </button>
      <button type="button" onClick={oprit(onInapoi)} disabled={!poateInapoi} title={t('pasInapoi')} aria-label={t('pasInapoi')}>
        &lt;
      </button>
      <button type="button" className="principal" onClick={() => onRedare(!redare)} disabled={total === 0} title={t('redaPauza')}>
        {redare ? t('pauza') : poateInainte ? t('reda') : t('deLaInceput')}
      </button>
      <button type="button" onClick={oprit(onInainte)} disabled={!poateInainte} title={t('pasInainte')} aria-label={t('pasInainte')}>
        &gt;
      </button>
      <button type="button" onClick={oprit(() => onScriere(1))} disabled={k >= ultimul} title={t('urmatoareaScriere')} aria-label={t('urmatoareaScriere')}>
        &gt;&gt;
      </button>
      <button type="button" onClick={oprit(() => onK(ultimul))} disabled={!poateInainte} title={t('laSfarsit')} aria-label={t('laSfarsit')}>
        &gt;|
      </button>
      <input type="range" min={0} max={ultimul} value={k} onChange={(e) => oprit(() => onK(Number(e.target.value)))()} aria-label={t('pasulCurent')} />
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
      <label className="bifa" title={t('intrebariAjutor')}>
        <input type="checkbox" checked={intrebari} onChange={(e) => onIntrebari(e.target.checked)} />
        {t('intrebari')}
      </label>
    </div>
  )
}
