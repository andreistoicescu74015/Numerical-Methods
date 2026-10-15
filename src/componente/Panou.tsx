import type { ReactNode } from 'react'

interface Props {
  // clasa dupa care panoul se stileaza si se gaseste (operatii, convergenta, verificare...)
  clasa: string
  titlu: string
  // un rand scurt, vizibil si cand panoul e inchis
  rezumat?: ReactNode
  deschis: boolean
  onToggle: (deschis: boolean) => void
  children: ReactNode
}

// Un rand pliabil din sertar: titlul, rezumatul si continutul. Continutul ramane in pagina si
// cand panoul e inchis, ca graficele sa fie gata la deschidere.
export function Panou({ clasa, titlu, rezumat, deschis, onToggle, children }: Props) {
  return (
    <details className={`panou ${clasa}`} open={deschis} onToggle={(e) => onToggle((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>
        <h2>{titlu}</h2>
        {rezumat !== undefined && rezumat !== null && rezumat !== '' && <span className="rezumat">{rezumat}</span>}
      </summary>
      <div className="continut">{children}</div>
    </details>
  )
}
