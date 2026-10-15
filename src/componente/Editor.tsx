import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import { Compartment, Prec, RangeSetBuilder, StateEffect, StateField } from '@codemirror/state'
import { Decoration, ViewPlugin, WidgetType, keymap, type DecorationSet, type ViewUpdate } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import type { Tema } from '../preferinte'

// Evidentiere sintactica pentru pseudocod: cuvinte cheie (romana si engleza), functii,
// numere, texte, comentarii si operatori.
const CUVINTE = new Set(['pentru', 'for', 'daca', 'if', 'atunci', 'then', 'altfel', 'else', 'cat', 'timp', 'while', 'stop', 'tipareste', 'print', 'peste', 'over', 'fie', 'let'])
const FUNCTII = new Set(['sqrt', 'sgn', 'min', 'max', 'abs', 'norm', 'norma', 'linii', 'rows', 'coloane', 'cols', 'lungime', 'len', 'argmax', 'argmin'])
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const pseudocod = StreamLanguage.define({
  token(stream) {
    if (stream.match(/^%.*/)) return 'comment'
    if (stream.match(/^('[^']*'?|"[^"]*"?)/)) return 'string'
    if (stream.match(/^\d+(\.\d+)?([eE][+-]?\d+)?/)) return 'number'
    if (stream.match(/^[\p{L}][\p{L}\p{N}]*/u)) {
      const cuvant = norm(stream.current())
      if (CUVINTE.has(cuvant)) return 'keyword'
      if (FUNCTII.has(cuvant)) return 'atom'
      return null
    }
    if (stream.match(/^(<->|<-|<=|>=|!=|\^T|[←↔≤≥≠Σ√‖+\-*/^=<>|])/)) return 'operator'
    stream.next()
    return null
  },
})

// Culorile de sintaxa nu folosesc nicio nuanta de rol (portocaliu, rosu, albastru, verde, mov),
// ca o culoare sa aiba acelasi sens in editor si in grila: cuvintele cheie au culoarea titlurilor
// si sunt ingrosate, comentariile sunt cursive si sterse, textele sterse.
const sintaxa = Prec.highest(
  syntaxHighlighting(
    HighlightStyle.define([
      { tag: tags.keyword, color: 'var(--titlu)', fontWeight: '600' },
      { tag: tags.atom, color: 'var(--titlu)' },
      { tag: tags.number, color: 'var(--text)' },
      { tag: tags.string, color: 'var(--text-sters)' },
      { tag: tags.comment, color: 'var(--text-sters)', fontStyle: 'italic' },
      { tag: tags.operator, color: 'var(--text)' },
    ]),
  ),
)

// Fondul, textul, cursorul si selectia editorului vin din variabilele temei, in ambele teme.
const temaEditor = (tema: Tema) =>
  EditorView.theme(
    {
      '&': { backgroundColor: 'var(--panou)', color: 'var(--text)' },
      '.cm-content': { caretColor: 'var(--text)' },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--text)' },
      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: tema === 'intunecat' ? '#2f4a73' : '#cfe0ff',
      },
      '.cm-activeLine': { backgroundColor: tema === 'intunecat' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' },
      '.cm-activeLineGutter': { backgroundColor: 'transparent' },
      '.cm-gutters': { backgroundColor: 'var(--panou)', color: 'var(--text-slab)', border: 'none' },
    },
    { dark: tema === 'intunecat' },
  )

// O linie lunga se rupe cu indentare atarnata: continuarea incepe la indentarea liniei plus
// doua caractere, nu la marginea din stanga.
function indentari(view: EditorView): DecorationSet {
  const b = new RangeSetBuilder<Decoration>()
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const linie = view.state.doc.lineAt(pos)
      const n = (/^\s*/.exec(linie.text)?.[0].length ?? 0) + 2
      b.add(linie.from, linie.from, Decoration.line({ attributes: { style: `padding-left: calc(6px + ${n}ch); text-indent: -${n}ch` } }))
      pos = linie.to + 1
    }
  }
  return b.finish()
}

const indentareAtarnata = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) {
      this.decorations = indentari(view)
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) this.decorations = indentari(u.view)
    }
  },
  { decorations: (v) => v.decorations },
)

// Valorile variabilelor de pe linia curenta, la capatul ei: „k = 1, i = 2, j = 3”.
class Anotare extends WidgetType {
  constructor(readonly text: string) {
    super()
  }

  eq(alta: Anotare): boolean {
    return alta.text === this.text
  }

  toDOM(): HTMLElement {
    const s = document.createElement('span')
    s.className = 'cm-anotare'
    s.textContent = this.text
    return s
  }

  ignoreEvent(): boolean {
    return true
  }
}

type Marcaj = { linie: number; fel: 'curenta' | 'eroare'; anotare?: string } | null

const pune = StateEffect.define<Marcaj>()

// Linia curenta a urmei sau linia cu eroare, ca decoratie de linie, plus anotarea.
const campMarcaj = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(dec, tr) {
    dec = dec.map(tr.changes)
    for (const e of tr.effects) {
      if (!e.is(pune)) continue
      if (!e.value || e.value.linie < 1 || e.value.linie > tr.state.doc.lines) return Decoration.none
      const l = tr.state.doc.line(e.value.linie)
      const decoratii = [Decoration.line({ class: e.value.fel === 'curenta' ? 'cm-linie-curenta' : 'cm-linie-eroare' }).range(l.from)]
      if (e.value.anotare) decoratii.push(Decoration.widget({ widget: new Anotare(e.value.anotare), side: 1 }).range(l.to))
      return Decoration.set(decoratii, true)
    }
    return dec
  },
  provide: (f) => EditorView.decorations.from(f),
})

interface Props {
  text: string
  onChange: (text: string) => void
  onRun: () => void
  linie: number | null
  eroare: number | null
  anotare: string | null
  tema: Tema
}

export function Editor({ text, onChange, onRun, linie, eroare, anotare, tema }: Props) {
  const gazda = useRef<HTMLDivElement>(null)
  const vedere = useRef<EditorView | null>(null)
  const compartiment = useRef(new Compartment())
  const laSchimbare = useRef(onChange)
  laSchimbare.current = onChange
  const laRulare = useRef(onRun)
  laRulare.current = onRun

  useEffect(() => {
    const v = new EditorView({
      doc: text,
      extensions: [
        Prec.high(
          keymap.of([
            {
              key: 'Ctrl-Enter',
              mac: 'Cmd-Enter',
              run: () => {
                laRulare.current()
                return true
              },
            },
          ]),
        ),
        basicSetup,
        pseudocod,
        sintaxa,
        campMarcaj,
        indentareAtarnata,
        EditorView.lineWrapping,
        compartiment.current.of(temaEditor(tema)),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) laSchimbare.current(u.state.doc.toString())
        }),
      ],
      parent: gazda.current!,
    })
    vedere.current = v
    return () => v.destroy()
    // textul si tema initiale se citesc o singura data; schimbarile vin prin efectele de mai jos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const v = vedere.current
    if (!v) return
    const curent = v.state.doc.toString()
    if (curent !== text) v.dispatch({ changes: { from: 0, to: curent.length, insert: text } })
  }, [text])

  useEffect(() => {
    vedere.current?.dispatch({ effects: compartiment.current.reconfigure(temaEditor(tema)) })
  }, [tema])

  useEffect(() => {
    const v = vedere.current
    if (!v) return
    const marcaj: Marcaj = eroare ? { linie: eroare, fel: 'eroare' } : linie ? { linie, fel: 'curenta', anotare: anotare ?? undefined } : null
    const efecte: StateEffect<unknown>[] = [pune.of(marcaj)]
    if (marcaj && marcaj.linie >= 1 && marcaj.linie <= v.state.doc.lines) {
      efecte.push(EditorView.scrollIntoView(v.state.doc.line(marcaj.linie).from, { y: 'nearest' }))
    }
    v.dispatch({ effects: efecte })
  }, [linie, eroare, anotare])

  return <div ref={gazda} className="editor" />
}
