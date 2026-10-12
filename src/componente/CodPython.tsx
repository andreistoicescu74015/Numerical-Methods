import { useMemo, useState } from 'react'
import type { Definitie } from '../intrari'
import { parseaza } from '../motor/parser'
import { emitePython } from '../motor/python'
import { usePreferinte } from '../preferinte'

interface Props {
  nume: string
  sursa: string
  definitii: Definitie[]
}

// Codul Python al programului curent, generat cand panoul e deschis.
export function CodPython({ nume, sursa, definitii }: Props) {
  const { t } = usePreferinte()
  const [deschis, setDeschis] = useState(false)
  const [copiat, setCopiat] = useState(false)

  const cod = useMemo(() => {
    if (!deschis) return ''
    try {
      return emitePython(parseaza(sursa), { nume, intrari: definitii.map((d) => ({ nume: d.nume.trim(), tip: d.tip })) })
    } catch (e) {
      return `# ${e instanceof Error ? e.message : String(e)}`
    }
  }, [deschis, sursa, nume, definitii])

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

  return (
    <details className="python" open={deschis} onToggle={(e) => setDeschis((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>{t('codPython')}</summary>
      {deschis && (
        <>
          <p className="ajutor">{t('codPythonAjutor')}</p>
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
      )}
    </details>
  )
}
