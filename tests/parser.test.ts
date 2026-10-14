import { describe, expect, it } from 'vitest'
import { EroareSintaxa, type Instr } from '../src/motor/ast'
import { parseaza } from '../src/motor/parser'

function faraLinii(instr: Instr[]): unknown {
  return JSON.parse(JSON.stringify(instr, (k, v) => (k === 'linie' ? undefined : v)))
}

const gAnexa = `μ peste A
pentru k = 1 : n-1
    pentru i = k+1 : n
        a_ik ← μ_ik = a_ik / a_kk
    pentru j = k+1 : n
        pentru i = k+1 : n
            a_ij ← a_ij - μ_ik a_kj`

const gSlide = `μ peste A
1. Pentru k = 1 : n - 1
      1. Pentru i = k + 1 : n
             1. a_ik <- μ_ik = a_ik / a_kk
      2. Pentru j = k + 1 : n
             1. Pentru i = k + 1 : n
                 1. a_ij <- a_ij - μ_ik a_kj`

describe('parserul acceptă ambele stiluri din curs', () => {
  it('pașii numerotați din slide-uri dau același arbore ca forma din anexă', () => {
    expect(faraLinii(parseaza(gSlide).instr)).toEqual(faraLinii(parseaza(gAnexa).instr))
  })

  it('cuvintele cheie în engleză dau același arbore', () => {
    const en = `μ over A
for k = 1 : n-1
    for i = k+1 : n
        a_ik <- μ_ik = a_ik / a_kk
    for j = k+1 : n
        for i = k+1 : n
            a_ij <- a_ij - μ_ik a_kj`
    expect(faraLinii(parseaza(en).instr)).toEqual(faraLinii(parseaza(gAnexa).instr))
    const ro = parseaza(`let y[n]\ncât timp e > tol\n    dacă i > 3 atunci stop 'gata'\n    altfel tipărește 'mai'\n    i ← i + 1`)
    const enb = parseaza(`fie y[n]\nwhile e > tol\n    if i > 3 then stop 'gata'\n    else print 'mai'\n    i <- i + 1`)
    expect(faraLinii(enb.instr)).toEqual(faraLinii(ro.instr))
  })

  it('cursul II: „=” ca atribuire, fără numerotare', () => {
    const p = parseaza(`x = b
pentru i = 1 : n
    pentru j = 1 : i - 1
        x_i = x_i - L_ij x_j
    x_i = x_i / L_ii`)
    expect(p.instr).toHaveLength(2)
    const bucla = p.instr[1]
    expect(bucla.tip).toBe('pentru')
    if (bucla.tip === 'pentru') expect(bucla.corp).toHaveLength(2)
  })

  it('indicii în acolade, cu expresii și nume cu indice', () => {
    const p = parseaza('a_{i,i-1} ← a_{i_k, j}')
    const s = p.instr[0]
    expect(s.tip).toBe('atrib')
    if (s.tip !== 'atrib' || s.tinta.tip !== 'elem' || s.expr.tip !== 'elem') throw new Error()
    expect(s.tinta.idx).toHaveLength(2)
    expect(s.expr.idx[0]).toEqual({ tip: 'elem', nume: 'i', idx: [{ tip: 'var', nume: 'k' }], sursa: 'i_k' })
  })

  it('modulul în modul și norma după o funcție', () => {
    const e = parseaza('e ← |1 - |z^T y||').instr[0]
    expect(e.tip === 'atrib' && e.expr.tip === 'abs').toBe(true)
    const s = parseaza('σ ← sgn(a_kk) ‖A(k:m, k)‖').instr[0]
    if (s.tip !== 'atrib' || s.expr.tip !== 'bin') throw new Error()
    expect(s.expr.b.tip).toBe('norma')
  })

  it('sumă cu limite, pas de buclă, mai multe instrucțiuni pe linie', () => {
    const p = parseaza(`y ← y / ‖y‖; i ← 0; e ← 1
pentru i = n : -1 : 1
    s ← Σ_{j=1}^{i-1} l_ij x_j`)
    expect(p.instr).toHaveLength(4)
    const bucla = p.instr[3]
    if (bucla.tip !== 'pentru') throw new Error()
    expect(bucla.pas).toEqual({ tip: 'neg', a: { tip: 'num', v: 1 } })
    const s = bucla.corp[0]
    if (s.tip !== 'atrib') throw new Error()
    expect(s.expr.tip).toBe('suma')
  })
})

describe('erorile de sintaxă spun linia și cauza', () => {
  it('buclă fără corp', () => {
    expect(() => parseaza('pentru i = 1 : n\nx ← 1')).toThrow(EroareSintaxa)
    expect(() => parseaza('pentru i = 1 : n\nx ← 1')).toThrow(/corpul buclei lipsește/)
  })

  it('altfel fără dacă', () => {
    expect(() => parseaza('altfel\n    x ← 1')).toThrow(/"altfel" fără "dacă"/)
  })

  it('caracter necunoscut, cu linia', () => {
    try {
      parseaza('x ← 1\ny ← 2 # 3')
      throw new Error('nu a aruncat')
    } catch (e) {
      expect(e).toBeInstanceOf(EroareSintaxa)
      expect((e as EroareSintaxa).linie).toBe(2)
    }
  })
})
