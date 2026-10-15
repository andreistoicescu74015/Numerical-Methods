// Operatiile dintre tablouri pe care le stie interpretorul: numele si definitia pe elemente.
// Panoul "Operații pe matrice" le arata langa sub-expresia care le-a produs.
import type { FelOperatie, Forma } from './motor/interpretor'
import type { Limba } from './motor/mesaje'

type Text = Record<Limba, string>

export const OPERATII: Record<FelOperatie, { nume: Text; definitie: string }> = {
  matvec: {
    nume: { ro: 'produs matrice-vector', en: 'matrix-vector product' },
    definitie: '(Ax)_i = \\sum_{j} a_{ij}\\, x_j',
  },
  matmul: {
    nume: { ro: 'produs matrice-matrice', en: 'matrix-matrix product' },
    definitie: '(AB)_{ij} = \\sum_{k} a_{ik}\\, b_{kj}',
  },
  vecmat: {
    nume: { ro: 'produs vector linie-matrice', en: 'row vector times matrix' },
    definitie: '(x^T A)_j = \\sum_{i} x_i\\, a_{ij}',
  },
  dot: {
    nume: { ro: 'produs scalar', en: 'dot product' },
    definitie: 'x^T y = \\sum_{i} x_i\\, y_i',
  },
  exterior: {
    nume: { ro: 'produs exterior', en: 'outer product' },
    definitie: '(x y^T)_{ij} = x_i\\, y_j',
  },
  scalare: {
    nume: { ro: 'înmulțire cu un scalar', en: 'multiplication by a scalar' },
    definitie: '(\\alpha x)_i = \\alpha\\, x_i',
  },
  impartire: {
    nume: { ro: 'împărțire la un scalar', en: 'division by a scalar' },
    definitie: '(x / \\alpha)_i = x_i / \\alpha',
  },
  adunare: {
    nume: { ro: 'adunare element cu element', en: 'elementwise addition' },
    definitie: '(x + y)_i = x_i + y_i',
  },
  scadere: {
    nume: { ro: 'scădere element cu element', en: 'elementwise subtraction' },
    definitie: '(x - y)_i = x_i - y_i',
  },
  norma: {
    nume: { ro: 'norma euclidiană', en: 'Euclidean norm' },
    definitie: '\\|x\\| = \\sqrt{\\sum_{i} x_i^2}',
  },
  frobenius: {
    nume: { ro: 'norma Frobenius', en: 'Frobenius norm' },
    definitie: '\\|A\\|_F = \\sqrt{\\sum_{i,j} a_{ij}^2}',
  },
  transpusa: {
    nume: { ro: 'transpusă', en: 'transpose' },
    definitie: '(A^T)_{ij} = a_{ji}',
  },
}

// "3 × 2" pentru o matrice, "vector de 3" pentru un vector coloana, "1 × 3" pentru unul linie.
export function textForma(f: Forma, limba: Limba): string {
  if (f.tip === 'scalar') return 'scalar'
  if (f.tip === 'vector') return limba === 'ro' ? `vector de ${f.m}` : `vector of ${f.m}`
  return `${f.m} × ${f.n}`
}

// Ce se poate scrie in pseudocod intre tablouri, pentru lista de referinta din panou.
export const SCRIERI: { scriere: string; fel: FelOperatie }[] = [
  { scriere: 'A x', fel: 'matvec' },
  { scriere: 'A B', fel: 'matmul' },
  { scriere: 'x^T y', fel: 'dot' },
  { scriere: 'x y^T', fel: 'exterior' },
  { scriere: 'x^T A', fel: 'vecmat' },
  { scriere: 'c x,  c A', fel: 'scalare' },
  { scriere: 'x / c', fel: 'impartire' },
  { scriere: 'x + y,  A + B', fel: 'adunare' },
  { scriere: 'x - y,  A - B', fel: 'scadere' },
  { scriere: '‖x‖,  norm(x)', fel: 'norma' },
  { scriere: '‖A‖_F', fel: 'frobenius' },
  { scriere: 'A^T', fel: 'transpusa' },
]
