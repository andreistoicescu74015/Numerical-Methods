import { useState } from 'react'
import { verifica, type Verdict } from '../exercitiu'
import { usePreferinte } from '../preferinte'

interface Props {
  // valorile pe care le scrie pasul sau rezultatul conditiei
  dorit: number[] | boolean
  // dupa un raspuns citit: se numara, iar rezultatul pasului se arata
  onRaspuns: (corect: boolean) => void
}

// Campul in care studentul scrie rezultatul pasului inainte sa il vada.
export function Raspuns({ dorit, onRaspuns }: Props) {
  const { t } = usePreferinte()
  const [text, setText] = useState('')
  const [necitit, setNecitit] = useState(false)
  const conditie = typeof dorit === 'boolean'
  const trimite = () => {
    const v: Verdict = verifica(text, dorit)
    setNecitit(v === 'necitit')
    if (v !== 'necitit') onRaspuns(v === 'corect')
  }
  return (
    <form
      className="raspuns"
      onSubmit={(e) => {
        e.preventDefault()
        trimite()
      }}
    >
      <label>
        {t('raspunsulTau')}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={conditie ? t('raspunsConditie') : (dorit as number[]).length > 1 ? t('raspunsValori', (dorit as number[]).length) : t('raspunsValoare')}
          aria-invalid={necitit}
          spellCheck={false}
        />
      </label>
      <button type="submit" className="mic">
        {t('verificaRaspuns')}
      </button>
      {necitit && (
        <span className="necitit" role="alert">
          {conditie ? t('raspunsNecititConditie') : (dorit as number[]).length === 1 ? t('raspunsNecititUnul') : t('raspunsNecitit', (dorit as number[]).length)}
        </span>
      )}
    </form>
  )
}
