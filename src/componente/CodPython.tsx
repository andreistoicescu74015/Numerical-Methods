import { useMemo, useState } from 'react'
import { intrariDinDefinitii, type Definitie } from '../intrari'
import { parseaza } from '../motor/parser'
import { emitePython } from '../motor/python'
import { usePreferinte } from '../preferinte'

interface Props {
  nume: string
  sursa: string
  definitii: Definitie[]
  // ce intoarce functia, pentru algoritmii din biblioteca
  iesiri?: string[]
  // algoritmul cere o matrice patrata: n se scrie ca numarul ei de linii, ca in laborator
  patrata: boolean
  // comparatia cu NumPy a algoritmului din biblioteca, cat timp pseudocodul si intrarile sunt ale lui
  numpy?: string[]
  // precizia aleasa in vizualizator; Python calculeaza oricum in dubla precizie
  cifre: number
  // panoul e deschis: codul se genereaza doar atunci
  deschis: boolean
}

// valorile curente ale intrarilor, pentru apelul de la sfarsitul fisierului; nimic cat textul lor are greseli
function valori(definitii: Definitie[]) {
  try {
    return intrariDinDefinitii(definitii)
  } catch {
    return undefined
  }
}

// Codul Python al programului curent, generat cand panoul e deschis.
export function CodPython({ nume, sursa, definitii, iesiri, patrata, numpy, cifre, deschis }: Props) {
  const { t, limba } = usePreferinte()
  const [copiat, setCopiat] = useState(false)

  const cod = useMemo(() => {
    if (!deschis) return ''
    try {
      return emitePython(parseaza(sursa), { nume, intrari: definitii.map((d) => ({ nume: d.nume.trim(), tip: d.tip })), iesiri, patrata, limba, exemplu: valori(definitii), numpy }).cod
    } catch (e) {
      return `# ${e instanceof Error ? e.message : String(e)}`
    }
  }, [deschis, sursa, nume, definitii, iesiri, patrata, numpy, limba])

  const copiaza = async () => {
    await navigator.clipboard?.writeText(cod)
    setCopiat(true)
    setTimeout(() => setCopiat(false), 1500)
  }

  const descarca = () => {
    const url = URL.createObjectURL(new Blob([cod], { type: 'text/x-python' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${nume}.py`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!deschis) return null
  return (
    <>
      <p className="ajutor">{t('codPythonAjutor')}</p>
      {cifre > 0 && <p className="ajutor">{t('codPythonCifre', cifre)}</p>}
      <div className="actiuni">
        <button type="button" className="mic" onClick={copiaza}>
          {copiat ? t('copiat') : t('copiaza')}
        </button>
        <button type="button" className="mic" onClick={descarca}>
          {t('descarca')}
        </button>
      </div>
      <pre>{cod}</pre>
    </>
  )
}
