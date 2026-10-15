import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { aleatoare, definitiiDin, intrariDinDefinitii } from '../src/intrari'
import { BIBLIOTECA, algoritm } from '../src/motor/biblioteca'
import { urma, type Intrari } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'
import { emitePython, type OptiuniPython } from '../src/motor/python'
import { linii } from '../src/motor/valori'
import { estePatrata } from '../src/natura'
import { generator } from './ajutor'
import fixturi from './fixtures/algoritmi.json'

const RADACINA = join(__dirname, '..')

type Valoare = number | number[] | number[][]

const tipDin = (v: Valoare): 'matrice' | 'vector' | 'scalar' => (typeof v === 'number' ? 'scalar' : Array.isArray(v[0]) ? 'matrice' : 'vector')

// ca in aplicatie: n este numarul de linii doar cand algoritmul din biblioteca cere o matrice patrata
function optiuni(nume: string, intrari: Intrari, iesiri?: string[]): OptiuniPython {
  const alg = algoritm(nume)
  const patrata = estePatrata(alg?.intrari.find((i) => i.tip === 'matrice')?.natura)
  return { nume, intrari: Object.entries(intrari).map(([n, v]) => ({ nume: n, tip: tipDin(v) })), iesiri, patrata, exemplu: intrari, numpy: alg?.numpy }
}

function emite(id: string): string {
  const alg = algoritm(id)!
  return emitePython(parseaza(alg.sursa), optiuni(alg.id, Object.fromEntries(alg.intrari.map((i) => [i.nume, i.exemplu])), alg.iesiri)).cod
}

// Programe scrise de mana, ca traducerea sa fie incercata si in afara bibliotecii: atribuiri pe
// blocuri, argmax oarecare, pozitii pastrate in scalari si in tablouri, sume in conditii, bucle
// cu pas, produse intre tablouri.
const PROPRII: { nume: string; sursa: string; intrari: Intrari; iesiri?: string[] }[] = [
  {
    nume: 'eliminare_pe_linii',
    sursa: `pentru k = 1 : n-1
    pentru i = k+1 : n
        c ← a_ik / a_kk
        A(i, k:n) ← A(i, k:n) - c A(k, k:n)`,
    intrari: { A: [[2, 1, 1], [4, 3, 3], [8, 7, 9]] },
  },
  {
    nume: 'pozitii',
    sursa: `fie q[n]
pentru k = 1 : n
    j ← argmax_{i=1:n} (x_i - k)^2
    q_k ← j
s ← 0
pentru k = 1 : n
    s ← s + k q_k`,
    intrari: { x: [3, 1, 4, 1.5] },
    iesiri: ['q', 's', 'j'],
  },
  {
    nume: 'conditie_cu_suma',
    sursa: `t ← 0; k ← 0
cât timp Σ_{i=1}^{n} x_i^2 > 1
    x ← x / 2
    k ← k + 1
v ← max_{i=1:n} |x_i|
pentru i = n : -2 : 1
    t ← t + x_i`,
    intrari: { x: [3, -4, 1, 2, 5] },
    iesiri: ['x', 'k', 'v', 't'],
  },
  {
    nume: 'produse',
    sursa: `C ← A B
D ← A^T A
w ← A^T y
P ← y y^T
s ← y^T A x
G ← A B - 2 P`,
    intrari: { A: [[1, 2], [0, 1], [3, -1]], B: [[1, 0, 2], [2, 1, 0]], x: [1, -2], y: [2, 0.5, -1] },
    iesiri: ['C', 'D', 'w', 'P', 's', 'G'],
  },
  {
    nume: 'permutare_data',
    sursa: `pentru k = 1 : n
    b_k ↔ b_{p_k}
z ← b(2:n)`,
    intrari: { b: [10, 20, 30, 40], p: [2, 3, 4, 4] },
    iesiri: ['b', 'z'],
  },
  {
    // un tablou de pozitii copiat, folosit ca indice si apoi ca valoare
    nume: 'tablou_de_pozitii',
    sursa: `fie p[n]
pentru k = 1 : n
    p_k ← argmax_{i=k:n} x_i
q ← p
s ← 0
pentru k = 1 : n
    s ← s + x_{q_k}
w ← 2 p
fie t[n]
t ← x
q(1:2) ← t(3:4)
dacă p_1 = 3 atunci v ← p_2 + 0.5
altfel v ← 0`,
    intrari: { x: [1, 3, 4, 2] },
    iesiri: ['p', 'q', 's', 'w', 'v'],
  },
  // Cazurile de mai jos au dat candva rezultate gresite in Python fara nicio eroare.
  {
    // un contor de bucla scris intr-un tablou nu il face tablou de pozitii: valorile lui se impart apoi
    nume: 'contor_in_tablou',
    sursa: `fie b[n]
pentru i = 1 : n
    b_i ← i
pentru i = 1 : n
    b_i ← b_i / a_ii
fie t[n]
pentru i = 1 : n
    t_i ← i
t ← h t
pentru i = 1 : n
    a_ii ← i
y ← A b`,
    intrari: { A: [[2, 1], [1, 4]], h: 0.5 },
    iesiri: ['b', 't', 'A', 'y'],
  },
  {
    // un scalar care primeste o pozitie si apoi o valoare oarecare; o variabila de bucla atribuita dupa bucla
    nume: 'pozitie_apoi_valoare',
    sursa: `j ← argmax_{i=1:n} |x_i|
j ← x_j / 3
t ← 0
pentru k = 1 : n
    t ← t + x_k
k ← t / 4`,
    intrari: { x: [1, 4, 5] },
    iesiri: ['j', 't', 'k'],
  },
  {
    // x(1:i-2) este gol la i = 1 si la i = 2; in NumPy un capat negativ ar numara de la sfarsit
    nume: 'felie_goala',
    sursa: `pentru i = 1 : n
    A(i, 1:i-2) ← 0
s ← 0
pentru i = 1 : n
    s ← s + ‖x(1:i-2)‖`,
    intrari: { A: [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]], x: [3, 4, 12, 1] },
    iesiri: ['A', 's'],
  },
  {
    // in Python * si @ au aceeasi prioritate: parantezele din pseudocod trebuie pastrate
    nume: 'produse_cu_paranteze',
    sursa: `β ← (u^T u) / 2
x ← x - u * (u^T x) / β
w ← y * (y^T x)
d ← 1 - (2 - (3 - β))`,
    intrari: { u: [1, 2, 2], x: [3, 1, 2], y: [1, 2, 0.5] },
    iesiri: ['x', 'w', 'β', 'd'],
  },
  {
    nume: 'forma_schimbata',
    sursa: `A ← A^T
fie C[3,2]
C ← B D`,
    intrari: { A: [[1, 2], [3, 4], [5, 6]], B: [[1, 0, 2], [0, 1, 1]], D: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
    iesiri: ['A', 'C'],
  },
  {
    // variabila sumei poarta numele unui scalar al programului, al buclei in care sta sau al unei bucle citite dupa
    nume: 'suma_cu_nume_luat',
    sursa: `s ← 0
pentru i = 1 : n
    s ← s + x_i
t ← Σ_{s=1}^{n} x_s x_s
fie c[n]
pentru i = 1 : n
    c_i ← Σ_{i=i}^{n} x_i
u ← Σ_{i=1}^{2} x_i
v ← i
p ← Σ_{i=1}^{n} (x_i > 2)`,
    intrari: { x: [1, 2, 3, 4] },
    iesiri: ['s', 't', 'c', 'u', 'v', 'p'],
  },
  {
    // o comparatie folosita ca valoare da 1 sau 0: se aduna, se scade si se neaga ca un numar
    nume: 'comparatii_ca_valori',
    sursa: `c ← (x_1 > 0) + (x_2 > 0)
d ← (x_1 > 0) - (x_2 > 0)
e ← -(x_1 > 0)`,
    intrari: { x: [1, 1] },
    iesiri: ['c', 'd', 'e'],
  },
  {
    // scalari cu expresii in nume: p_{k-1} si p_{k+1} sunt nume diferite
    nume: 'nume_cu_expresii',
    sursa: `p_{k-1} ← 1
p_k ← 3
p_{k+1} ← 3 p_k - p_{k-1}
t ← p_{k+1} + p_{k-1}
class ← 2
lambda ← class + t`,
    intrari: {},
    iesiri: ['t', 'class', 'lambda'],
  },
  {
    // al doilea indice al interschimbarii se citeste inainte de prima scriere
    nume: 'schimb_prin_el_insusi',
    sursa: `pentru k = 1 : n
    p_k ↔ p_{p_k}`,
    intrari: { p: [2, 3, 1] },
    iesiri: ['p'],
  },
  {
    nume: 'transpusa_de_pozitii',
    sursa: `fie p[n]
pentru k = 1 : n
    p_k ← argmax_{i=k:n} x_i
q ← 2 p^T
t ← p^T x
z ← p^T
fie r[n]
pentru k = 1 : n-1
    r_k ← argmax_{i=k:n} x_i`,
    intrari: { x: [1, 3, 4, 2] },
    iesiri: ['p', 'q', 't', 'z', 'r'],
  },
  {
    // un scalar dat care e si variabila de bucla; capete de bucla si indici care nu sunt sigur intregi
    nume: 'capete_si_scalari_dati',
    sursa: `t ← 2 k
pentru k = 1 : n
    t ← t + x_k
h ← n / 2
pentru i = 1 : h
    t ← t + x_i
mij ← (2 + n) / 2
t ← t + x_{mij}
r ← √n
pentru i = 1 : r
    t ← t + 1`,
    intrari: { x: [1, 2, 3, 4], k: 3 },
    iesiri: ['t'],
  },
  {
    // litera mica a unui scalar (i, m, k) nu se confunda cu matricea cu litera mare, iar m_11 ramane M(1, 1)
    nume: 'litere_mari',
    sursa: `fie I[n,n]
I(i, i) ← 1, i = 1 : n
fie d[n]
d_k ← K(k, k), k = 1 : n
t ← m_11 + m_22
pentru i = 1 : m
    t ← t + M(i, 1)
dacă n > 0 atunci
    L peste M
t ← t + l_12
la ← linii(M(1, :)); ca ← coloane(M(1, :)); cd ← coloane(d); ld ← linii(d)`,
    intrari: { M: [[1, 2], [3, 4]], K: [[5, 6], [7, 8]] },
    iesiri: ['I', 'd', 't', 'la', 'ca', 'cd', 'ld'],
  },
  {
    // z se citeste in bucla inainte de locul unde i se da o valoare
    nume: 'tablou_folosit_inainte',
    sursa: `s ← 0
pentru k = 1 : 3
    dacă k > 1 atunci s ← s + z^T y
    z ← A y`,
    intrari: { A: [[2, 1], [1, 3]], y: [1, -1] },
    iesiri: ['s', 'z'],
  },
  {
    nume: 'numar_folosit_ca_indice',
    sursa: `q ← min(m, n) - 1
fie d[q + 1]
pentru i = 1 : q + 1
    d_i ← a_ii
t ← d_q + a_{q, q+1}
A(:, 1) ← 0
A(1, 2:n) ← d`,
    intrari: { A: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]] },
    iesiri: ['d', 't', 'q', 'A'],
  },
]

describe('codul Python emis din pseudocod', () => {
  it('G: NumPy, indici de la 0, copia de lucru și rezultatul', () => {
    const cod = emite('G')
    expect(cod).toContain('import numpy as np')
    expect(cod).toContain('def G(A):')
    expect(cod).toContain('    A = np.array(A, dtype=float)')
    expect(cod).toContain('    n = A.shape[0]')
    expect(cod).toContain('    for k in range(n - 1):')
    expect(cod).toContain('        for i in range(k + 1, n):\n            A[i, k] = A[i, k] / A[k, k]')
    expect(cod).toContain('                A[i, j] = A[i, j] - A[i, k] * A[k, j]')
    expect(cod).toContain('    return A\n')
    expect(cod).not.toContain('mn.runtime')
  })

  it('QR: declarații, normă pe felie, sgn din curs, vectorul Householder citit din A, suma scoasă în buclă și nume fără litere grecești', () => {
    const cod = emite('QR')
    expect(cod).toContain('    m, n = A.shape')
    expect(cod).toContain('    # U peste A: se citesc si se scriu in A')
    expect(cod).toContain('    s = min(m - 1, n)')
    expect(cod).toContain('    beta = np.zeros(s)')
    expect(cod).toContain('        sigma = np.linalg.norm(A[k:m, k])')
    expect(cod).toContain('def sgn(x):')
    expect(cod).toContain('    return 1.0 if x >= 0 else -1.0')
    expect(cod).toContain('        if sigma != 0:\n            sigma = sgn(A[k, k]) * sigma')
    expect(cod).toContain('            for i in range(k, m):\n                A[i, k] = A[i, k] / sigma\n            beta[k] = 1 + A[k, k]\n            A[k, k] = beta[k]')
    expect(cod).toContain('                suma = 0\n                for i in range(k, m):\n                    suma = suma + A[i, k] * A[i, j]\n                nu = suma / beta[k]')
    expect(cod).toContain('            A[k, k] = -sigma')
    expect(cod).toContain('    return A, beta\n')
  })

  it('MP: produs matrice-vector, produs scalar, cât timp, stop', () => {
    const cod = emite('MP')
    expect(cod).toContain('    y = y / np.linalg.norm(y)')
    expect(cod).toContain('    while e > tol:')
    expect(cod).toContain('        z = A @ y')
    expect(cod).toContain('        e = abs(1 - abs(z @ y))')
    expect(cod).toContain('            raise RuntimeError("nu a convers în maxiter iterații")')
    expect(cod).toContain('    return y, i\n')
  })

  it('S_GPP: argmax pe felie, pozițiile de la 0 în p, interschimbarea și bucla descrescătoare', () => {
    const cod = emite('S_GPP')
    expect(cod).toContain('    p = np.zeros(n - 1, dtype=int)')
    expect(cod).toContain('        i_k = k + np.argmax(np.abs(A[k:n, k]))')
    expect(cod).toContain('        p[k] = i_k')
    expect(cod).toContain('            A[k, j], A[i_k, j] = A[i_k, j], A[k, j]')
    expect(cod).toContain('        b[k], b[p[k]] = b[p[k]], b[k]')
    expect(cod).toContain('    x = b.copy()')
    expect(cod).toContain('    for i in range(n - 1, -1, -1):')
    expect(cod).toContain('    return x\n')
  })

  it('GPP spune în antet că p ține poziții de la 0', () => {
    const alg = algoritm('GPP')!
    const r = emitePython(parseaza(alg.sursa), optiuni(alg.id, { A: [[1, 2], [3, 4]] }, alg.iesiri))
    expect(r.indici).toEqual(['p'])
    expect(r.cod).toContain('# p: pozitii numarate de la 0')
  })

  it('SQR: a_kk ținut deoparte cât se aplică reflectorul, felia b(n+1:m) și cele două rezultate', () => {
    const cod = emite('SQR')
    expect(cod).toContain('        t = A[k, k]\n        A[k, k] = beta[k]')
    expect(cod).toContain('        A[k, k] = t\n    x = np.zeros(n)')
    expect(cod).toContain('        x[k] = (b[k] - suma) / A[k, k]')
    expect(cod).toContain('    r = np.linalg.norm(b[n:m])')
    expect(cod).toContain('    return x, r\n')
  })

  it('Kaczmarz: linia matricei ca vector și proiecția', () => {
    const cod = emite('KACZMARZ')
    expect(cod).toContain('            alpha = (A[i, :] @ x - b[i]) / np.linalg.norm(A[i, :]) ** 2')
    expect(cod).toContain('            x = x - alpha * A[i, :]')
  })

  it('fișierul se încheie cu exemplul din vizualizator: datele, apelul și câte un print pe rezultat', () => {
    expect(emite('G')).toContain('\n\nif __name__ == "__main__":\n    # exemplul din vizualizator\n    A = np.array([[1, 2, 1], [2, 1, 2], [1, 1, 2]])\n    A_rez = G(A)\n    print("A_rez =", A_rez, sep="\\n")\n')
    expect(emite('JACOBI')).toContain('    A = np.array([[2, 1], [5, 7]])\n    b = np.array([11, 13])\n    x = np.array([1, 1])\n    tol = 0.001\n    maxiter = 100\n    x_rez, k = JACOBI(A, b, x, tol, maxiter)\n    print("x_rez =", x_rez)\n    print("k =", k)\n')
    // comparatia cu NumPy: aceeasi problema rezolvata de functia standard, pe intrarile ramase neschimbate
    expect(emite('JACOBI')).toContain('    # comparatia cu NumPy\n    x_np = np.linalg.solve(A, b)\n    print("np.linalg.solve =", x_np)\n    print("diferenta maxima fata de NumPy:", np.max(np.abs(x_rez - x_np)))\n')
    expect(emite('QR')).toContain('    R = np.triu(A_rez)[: min(A.shape)]\n')
    expect(emite('RFG')).toContain('    x_rez, beta = RFG(x, k)\n    print("x_rez =", x_rez)\n    print("beta =", beta)\n')
    // fara valori (textul intrarilor are greseli), fisierul are doar functia
    const alg = algoritm('G')!
    expect(emitePython(parseaza(alg.sursa), { nume: 'G', intrari: [{ nume: 'A', tip: 'matrice' }], iesiri: alg.iesiri }).cod).not.toContain('__main__')
    expect(emitePython(parseaza('t ← 2 c'), { nume: 'dublu', intrari: [{ nume: 'c', tip: 'scalar' }], exemplu: { c: 1e-7 } }).cod).toContain('    c = 1e-7\n    t = dublu(c)\n    print("t =", t)\n')
  })

  it('n este numărul de linii doar când algoritmul cere o matrice pătrată; altfel numărul de coloane, ca în interpretor', () => {
    expect(emite('UTRIS')).toContain('    n = U.shape[0]')
    expect(emite('KACZMARZ')).toContain('    m = A.shape[0]')
    // un program propriu rulat pe un exemplu patrat trebuie sa ramana corect pe o matrice dreptunghiulara
    const r = emitePython(parseaza('s ← 0\npentru j = 1 : n\n    s ← s + a_1j'), { nume: 'prima_linie', intrari: [{ nume: 'A', tip: 'matrice' }], exemplu: { A: [[1, 2], [3, 4]] } })
    expect(r.cod).toContain('    n = A.shape[1]')
  })

  it('suma din Crout are acumulatorul "suma", nu un nume apropiat de indicele s; RFG spune că k se dă numărat de la 1', () => {
    expect(emite('LU')).toContain('            suma = 0\n            for s in range(k):\n                suma = suma + A[i, s] * A[s, k]\n            A[i, k] = A[i, k] - suma')
    expect(emite('JACOBI')).toContain('            y[i] = (b[i] - suma - suma1) / A[i, i]')
    expect(emite('RFG')).toContain('    # k este un indice numarat de la 1, ca in pseudocod; in NumPy: k - 1\n    k = int(k)\n')
  })

  it('nicio linie din codul generat pentru bibliotecă nu trece de 79 de coloane, în afară de datele exemplului', () => {
    for (const alg of BIBLIOTECA) {
      const functia = emite(alg.id).split('if __name__')[0]
      for (const linie of functia.split('\n')) expect(linie.length, `${alg.id}: ${linie}`).toBeLessThanOrEqual(79)
    }
  })

  it('un program fără lista de ieșiri întoarce tablourile scrise; comentariile urmează limba', () => {
    const r = emitePython(parseaza('fie y[n]\npentru i = 1 : n\n    y_i ← 2 x_i'), { nume: 'dublu', intrari: [{ nume: 'x', tip: 'vector' }], limba: 'en' })
    expect(r.iesiri).toEqual(['y'])
    expect(r.cod).toContain('# Indices start at 0')
    expect(r.cod).toContain('    n = x.shape[0]')
    expect(r.cod).toContain('        y[i] = 2 * x[i]')
  })

  it('codul generat dă aceleași numere ca interpretorul și ca oracolul (cere Python cu NumPy)', () => {
    const python = spawnSync('python', ['-c', 'import numpy'], { encoding: 'utf8' })
    if (python.error || python.status !== 0) {
      console.warn('python cu numpy nu e disponibil; testul se sare')
      return
    }
    const dir = join(RADACINA, 'python', 'generat')
    mkdirSync(dir, { recursive: true })
    const cazuri: unknown[] = []
    const adauga = (modul: string, functie: string, descriere: string, sursa: string, intrari: Intrari, iesiri: string[] | undefined, asteptatDat?: Record<string, unknown>) => {
      const program = parseaza(sursa)
      const r = emitePython(program, optiuni(functie, intrari, iesiri))
      writeFileSync(join(dir, `${modul}.py`), r.cod, 'utf8')
      const rez = urma(program, intrari)
      expect(rez.final, `${modul}: ${rez.eroare ?? ''}`).not.toBe('eroare')
      const asteptat: Record<string, unknown> = {}
      for (const n of r.iesiri) {
        if (asteptatDat) {
          if (n in asteptatDat) asteptat[n] = asteptatDat[n]
          continue
        }
        const t = rez.stare[n]
        asteptat[n] = t ? (t.tip === 'matrice' ? linii(t) : t.d) : rez.scalari[n]
        expect(asteptat[n], `${modul}: ${n} lipsește din starea interpretorului`).toBeDefined()
      }
      // diferenta fata de NumPy: la rotunjiri pentru metodele directe, de ordinul tolerantei pentru cele iterative
      const pragNumpy = ['JACOBI', 'GS', 'KACZMARZ', 'MP'].includes(functie) ? 1 : 1e-8
      cazuri.push({ modul, functie, descriere, intrari, iesiri: r.iesiri, rezultateExemplu: r.rezultateExemplu, indici: r.indici, asteptat, stop: asteptatDat ? asteptatDat.final === 'stop' : rez.final === 'stop', pragNumpy, cuNumpy: !!algoritm(functie)?.numpy })
    }
    for (const alg of BIBLIOTECA) adauga(alg.id, alg.id, 'exemplul din bibliotecă, față de interpretor', alg.sursa, Object.fromEntries(alg.intrari.map((i) => [i.nume, i.exemplu])), alg.iesiri)
    ;(fixturi as unknown as { cazuri: { algoritm: string; descriere: string; intrari: Intrari; iesiri: Record<string, unknown> }[] }).cazuri.forEach((caz, k) => {
      const alg = algoritm(caz.algoritm)!
      adauga(`${alg.id}_f${k}`, alg.id, `oracol: ${caz.descriere}`, alg.sursa, caz.intrari, alg.iesiri, caz.iesiri)
    })
    for (const p of PROPRII) adauga(p.nume, p.nume, 'program scris de mână, față de interpretor', p.sursa, p.intrari, p.iesiri)
    // valori generate de "aleator", cu natura ceruta de fiecare algoritm, la marimea exemplului si cu o linie si o coloana in plus
    const rnd = generator(404)
    for (const alg of BIBLIOTECA) {
      for (let runda = 0; runda < 4; runda++) {
        let defs = definitiiDin(alg)
        if (runda >= 2) defs = defs.map((d) => (d.tip === 'matrice' ? { ...d, text: d.text.split('\n').map((l) => `${l} 0`).concat(`${d.text.split('\n')[0]} 0`).join('\n') } : d.tip === 'vector' ? { ...d, text: `${d.text} 0` } : d))
        alg.intrari.forEach((_, k) => {
          defs = aleatoare(defs, k, alg.intrari, rnd)
        })
        adauga(`${alg.id}_a${runda}`, alg.id, 'valori aleatoare cu natura cerută, față de interpretor', alg.sursa, intrariDinDefinitii(defs), alg.iesiri)
      }
    }
    writeFileSync(join(dir, 'cazuri.json'), JSON.stringify(cazuri, null, 1), 'utf8')
    const rez = spawnSync('python', [join(RADACINA, 'python', 'verifica_export.py')], { encoding: 'utf8', cwd: RADACINA })
    expect(rez.status, rez.stdout + rez.stderr).toBe(0)
  }, 60000)
})
