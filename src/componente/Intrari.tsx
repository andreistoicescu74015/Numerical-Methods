import type { CheieText } from '../i18n'
import { abatere, abatereDimensiune, aleatoare, definitieNoua, faraGarantie, forma, valoareDinText, type Definitie, type TipIntrare } from '../intrari'
import type { Intrare } from '../motor/biblioteca'
import { STRUCTURI, cerePatrata, esteMatrice, proprietati, type Aleator, type Structura } from '../natura'
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

const TIP: Record<Structura, CheieText> = {
  oarecare: 'tipOarecare',
  simetrica: 'tipSimetrica',
  spd: 'tipSpd',
  diagonala: 'tipDiagonala',
  inferior: 'tipInferior',
  superior: 'tipSuperior',
  bidiagonalaInf: 'tipBidiagonalaInf',
  bidiagonalaSup: 'tipBidiagonalaSup',
  tridiagonala: 'tipTridiagonala',
  hessenberg: 'tipHessenberg',
  dominanta: 'tipDominanta',
  ortogonala: 'tipOrtogonala',
  nesingulara: 'tipNesingulara',
  lider: 'tipLider',
  singulara: 'tipSingulara',
}

// cel mult atatea linii sau coloane din butoanele de dimensiune: grila ramane lizibila
const MAX_DIM = 8

const TITLU_ALEATOR: Record<Exclude<Aleator, 'oarecare' | 'simetrica' | 'diagonala' | 'bidiagonalaInf' | 'bidiagonalaSup' | 'tridiagonala' | 'hessenberg' | 'ortogonala' | 'singulara'>, CheieText> = {
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
        const titluAleator = d.tip === 'matrice' && d.structura ? t('aleatorTip', t(TIP[d.structura])) : t(fel ? TITLU_ALEATOR[fel as keyof typeof TITLU_ALEATOR] : 'aleatorAjutor')
        // o dimensiune gresita opreste rularea, deci se spune prima
        const gresit = abatereDimensiune(definitii, k, cerute) ?? abatere(definitii, k, cerute)
        const nota = gresit ? null : faraGarantie(definitii, k, cerute)
        let valoare: ReturnType<typeof valoareDinText> | undefined
        try {
          valoare = valoareDinText(d.tip, d.nume, d.text)
        } catch {
          valoare = undefined
        }
        const props = d.tip === 'matrice' && esteMatrice(valoare) ? proprietati(valoare, ceruta?.garantie === 'dominanta' ? 'jacobi' : ceruta?.garantie ? 'gs' : undefined) : []
        const [m, n] = forma(d)
        // un vector legat de o matrice isi ia lungimea din ea; o latime de banda sau un exemplu cu forma fixa nu se redimensioneaza
        const redimensionabil = d.tip === 'matrice' || (d.tip === 'vector' && !ceruta?.dimensiune)
        const dim = (noua: [number, number]) => onAleator(aleatoare(definitii, k, cerute, Math.random, { forma: noua }))
        // tipul ales sau natura ceruta pot impune o matrice patrata: atunci un singur control, ordinul
        const patrata = d.tip === 'matrice' && cerePatrata(d.structura ?? fel)
        const butoane = (eticheta: CheieText, valoareDim: number, schimba: (v: number) => [number, number]) => (
          <span className="dim">
            {t(eticheta)}
            <button type="button" className="mic" aria-label={t('dimMaiPutin', t(eticheta))} disabled={valoareDim <= 1} onClick={() => dim(schimba(valoareDim - 1))}>
              −
            </button>
            <span className="valoare-dim">{valoareDim}</span>
            <button type="button" className="mic" aria-label={t('dimMaiMult', t(eticheta))} disabled={valoareDim >= MAX_DIM} onClick={() => dim(schimba(valoareDim + 1))}>
              +
            </button>
          </span>
        )
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
                <button type="button" className="mic" title={titluAleator} onClick={() => onAleator(aleatoare(definitii, k, cerute))}>
                  {t('aleator')}
                </button>
                <button type="button" className="mic sterge" title={t('sterge')} aria-label={`${t('sterge')} ${d.nume}`} onClick={() => onChange(definitii.filter((_, i) => i !== k))}>
                  ×
                </button>
              </span>
              {ceruta && <span className="descriere-intrare">{ceruta.descriere[limba]}</span>}
            </div>
            {redimensionabil && (
              <div className="forma-intrare">
                {d.tip === 'matrice' && (
                  <label className="tip-matrice" title={t('tipAjutor')}>
                    {t('tipMatrice')}
                    <select
                      value={d.structura ?? ''}
                      onChange={(e) => onAleator(aleatoare(definitii, k, cerute, Math.random, { structura: (e.target.value || null) as Structura | null }))}
                    >
                      <option value="">{fel ? t('tipCerut') : t('tipOarecare')}</option>
                      {STRUCTURI.filter((s) => fel || s !== 'oarecare').map((s) => (
                        <option key={s} value={s}>
                          {t(TIP[s])}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {patrata ? (
                  butoane('dimOrdin', m, (v) => [v, v])
                ) : d.tip === 'matrice' ? (
                  <>
                    {butoane('dimLinii', m, (v) => [v, n])}
                    {butoane('dimColoane', n, (v) => [m, v])}
                  </>
                ) : (
                  butoane('dimLungime', m, (v) => [v, 1])
                )}
              </div>
            )}
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
            {props.length > 0 && (
              <p className="proprietati" title={t('proprietatiAjutor')}>
                <span className="eticheta">{t('proprietati')}</span> {props.map((p) => t(p.cheie, ...p.args)).join(' · ')}
              </p>
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
