import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BIBLIOTECA, algoritm } from '../src/motor/biblioteca'
import { parseaza } from '../src/motor/parser'
import { emitePython } from '../src/motor/python'

const RADACINA = join(__dirname, '..')

function emite(id: string): string {
  const alg = algoritm(id)!
  return emitePython(parseaza(alg.sursa), { nume: alg.id, intrari: alg.intrari.map((i) => ({ nume: i.nume, tip: i.tip })) })
}

describe('codul Python emis din pseudocod', () => {
  it('G: buclele, multiplicatorii peste A și rezultatul', () => {
    const cod = emite('G')
    expect(cod).toContain('def G(A):')
    expect(cod).toContain('    A = pad(A)')
    expect(cod).toContain('    # μ peste A')
    expect(cod).toContain('    for k in interval(1, n - 1):')
    expect(cod).toContain('            A[i, k] = A[i, k] / A[k, k]')
    expect(cod).toContain('                A[i, j] = A[i, j] - A[i, k] * A[k, j]')
    expect(cod).toContain('    return rezultat(locals())')
  })

  it('TORT: declarații, normă pe felie, sumă și atribuirea cu interval', () => {
    const cod = emite('TORT')
    expect(cod).toContain('    U = zeros(m, p)')
    expect(cod).toContain('    β = zeros(p)')
    expect(cod).toContain('        σ = sgn(A[k, k]) * norma(A[k:m + 1, k])')
    expect(cod).toContain('        if σ == 0:')
    expect(cod).toContain('            for i in interval(k + 1, m):\n                U[i, k] = A[i, k]')
    expect(cod).toContain('                τ = sum(U[i, k] * A[i, j] for i in interval(k, m)) / β[k]')
  })

  it('MP: produs matrice-vector, produs scalar, cât timp, stop', () => {
    const cod = emite('MP')
    expect(cod).toContain('    y = y / norma(y)')
    expect(cod).toContain('    while e > tol:')
    expect(cod).toContain('        z = matvec(A, y)')
    expect(cod).toContain('        e = abs(1 - abs(dot(z, y)))')
    expect(cod).toContain('            raise Oprire("nu a convers în maxiter iterații")')
  })

  it('S_GPP: argmax, scalarul i_k, interschimbarea și indicii din vectori', () => {
    const cod = emite('S_GPP')
    expect(cod).toContain('        i_k = argmax(interval(k, n), lambda i: abs(A[i, k]))')
    expect(cod).toContain('        p[k] = i_k')
    expect(cod).toContain('            A[k, j], A[int(i_k), j] = A[int(i_k), j], A[k, j]')
    expect(cod).toContain('        b[k], b[int(p[k])] = b[int(p[k])], b[k]')
    expect(cod).toContain('    x = b.copy()')
  })

  it('CMMP: variabila r din pseudocod nu se ciocnește cu runtime-ul', () => {
    const cod = emite('CMMP')
    expect(cod).toContain('    r = norma(b[n + 1:m + 1])')
  })

  it('codul generat pentru toată biblioteca dă aceleași numere ca oracolul (cere Python cu NumPy)', () => {
    const python = spawnSync('python', ['-c', 'import numpy'], { encoding: 'utf8' })
    if (python.error || python.status !== 0) {
      console.warn('python cu numpy nu e disponibil; testul se sare')
      return
    }
    const dir = join(RADACINA, 'python', 'generat')
    mkdirSync(dir, { recursive: true })
    for (const alg of BIBLIOTECA) writeFileSync(join(dir, `${alg.id}.py`), emite(alg.id), 'utf8')
    const rez = spawnSync('python', [join(RADACINA, 'python', 'verifica_export.py')], { encoding: 'utf8', cwd: RADACINA })
    expect(rez.status, rez.stdout + rez.stderr).toBe(0)
  }, 60000)
})
