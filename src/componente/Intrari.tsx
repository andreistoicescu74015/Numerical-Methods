import type { CheieText } from '../i18n'
import { abatere, abatereDimensiune, aleatoare, definitieNoua, faraGarantie, type Definitie, type TipIntrare } from '../intrari'
import type { Intrare } from '../motor/biblioteca'
import type { Aleator } from '../natura'
import { usePreferinte } from '../preferinte'

interface Props {
  definitii: Definitie[]
  // intrarile algoritmului din biblioteca, cu descrierea si natura fiecareia; gol in modul propriu
  cerute: Intrare[]
  onChange: (definitii: Definitie[]) => void
  // valori noi, cerute anume: se si ruleaza
  onAleator: (definitii: Definitie[]) => void
  // pune la loc exemplul algoritmului
  onExemplu?: () => void
}

const TITLU_ALEATOR: Record<Aleator, CheieText> = {
  inferior: 'aleatorInferior',
  superior: 'aleatorSuperior',
  lider: 'aleatorLider',
  nesingulara: 'aleatorNesingulara',
  spd: 'aleatorSpd',
  diagonalaNenula: 'aleatorDiagonala',
  dominanta: 'aleatorDominanta',
  liniiNenule: 'aleatorLiniiNenule',
  liniiDominante: 'aleatorLiniiDominante',
  coloaneIndependente: 'aleatorColoane',
  asemenea: 'aleatorAsemenea',
  pornire: 'aleatorPornire',
  bandaLider: 'aleatorBandaLider',
  bandaNesingulara: 'aleatorBandaNesingulara',
  superiorBanda: 'aleatorSuperiorBanda',
  latime: 'aleatorLatime',
  nenul: 'aleatorNenul',
  compatibil: 'aleatorCompatibil',
  toleranta: 'aleatorToleranta',
  iteratii: 'aleatorIteratii',
  indice: 'aleatorIndice',
}

export function Intrari({ definitii, cerute, onChange, onAleator, onExemplu }: Props) {
  const { t, limba } = usePreferinte()
  const schimba = (k: number, schimbare: Partial<Definitie>) => onChange(definitii.map((d, i) => (i === k ? { ...d, ...schimbare } : d)))
  const adauga = (tip: TipIntrare) => onChange([...definitii, definitieNoua(definitii, tip)])

  return (
    <div className="intrari">
      {definitii.length === 0 && <p className="ajutor">{t('faraIntrari')}</p>}
      {definitii.map((d, k) => {
        const ceruta = cerute.find((i) => i.nume === d.nume.trim() && i.tip === d.tip)
        const fel = ceruta?.aleator ?? ceruta?.natura
        const titlu = fel ? TITLU_ALEATOR[fel] : 'aleatorAjutor'
        // o dimensiune gresita opreste rularea, deci se spune prima
        const gresit = abatereDimensiune(definitii, k, cerute) ?? abatere(definitii, k, cerute)
        const nota = gresit ? null : faraGarantie(definitii, k, cerute)
        return (
          <div key={k} className={`intrare ${d.tip}${gresit ? ' gresita' : ''}`}>
            <div className="antet">
              <input className="nume" value={d.nume} aria-label={t('nume')} onChange={(e) => schimba(k, { nume: e.target.value })} />
              <select value={d.tip} aria-label={t('matrice')} onChange={(e) => schimba(k, { tip: e.target.value as TipIntrare })}>
                <option value="matrice">{t('matrice')}</option>
                <option value="vector">{t('vector')}</option>
                <option value="scalar">{t('scalar')}</option>
              </select>
              <span className="actiuni">
                <button type="button" className="mic" title={t(titlu)} onClick={() => onAleator(aleatoare(definitii, k, cerute))}>
                  {t('aleator')}
                </button>
                <button type="button" className="mic sterge" title={t('sterge')} aria-label={`${t('sterge')} ${d.nume}`} onClick={() => onChange(definitii.filter((_, i) => i !== k))}>
                  ×
                </button>
              </span>
              {ceruta && <span className="descriere-intrare">{ceruta.descriere[limba]}</span>}
            </div>
            {d.tip === 'scalar' ? (
              <input value={d.text} aria-label={d.nume} onChange={(e) => schimba(k, { text: e.target.value })} />
            ) : (
              <textarea
                value={d.text}
                // o matrice isi arata toate liniile, pana la 10
                rows={d.tip === 'vector' ? 1 : Math.min(10, Math.max(3, d.text.split('\n').length))}
                spellCheck={false}
                aria-label={d.nume}
                title={t('valoriAjutor')}
                onChange={(e) => schimba(k, { text: e.target.value })}
              />
            )}
            {gresit && (
              <p className="avertisment" role="status">
                {t(gresit.cheie, d.nume.trim(), ...gresit.args)}
              </p>
            )}
            {nota && (
              <p className="avertisment usor" role="status">
                {t(nota.cheie, d.nume.trim(), String(Number(nota.rho.toPrecision(3))))}
                {t(nota.rho < 1 ? 'garantieSub' : 'garantiePeste')}
              </p>
            )}
          </div>
        )
      })}
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
        {onExemplu && (
          <button type="button" title={t('exempluInitialAjutor')} onClick={onExemplu}>
            {t('exempluInitial')}
          </button>
        )}
      </div>
    </div>
  )
}
