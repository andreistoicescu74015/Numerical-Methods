// Contraexemple din curs: intrari care incalca o ipoteza a algoritmului (sau ating un caz limita)
// si arata ce se intampla atunci. Fiecare spune ce se vede si unde e ipoteza in curs; `final` este
// felul in care se termina rularea, verificat in tests/contraexemple.test.ts.
import type { Limba } from './motor/mesaje'

type Text = Record<Limba, string>

export interface Contraexemplu {
  titlu: Text
  explicatie: Text
  // valorile tuturor intrarilor algoritmului
  valori: Record<string, number | number[] | number[][]>
  final: 'gata' | 'stop' | 'eroare'
}

// pivotul de la pasul 1 este 0, desi matricea este nesingulara (det = -3)
const PIVOT_NUL = [
  [0, 1, 2],
  [1, 1, 1],
  [2, 1, 3],
]
// singulara: linia 2 este dublul liniei 1
const SINGULARA = [
  [1, 2, 3],
  [2, 4, 6],
  [1, 1, 1],
]
// tridiagonala, cu pivotul de la pasul 1 egal cu 0
const BANDA_PIVOT_NUL = [
  [0, 1, 0, 0],
  [1, 2, 1, 0],
  [0, 1, 2, 1],
  [0, 0, 1, 2],
]
// simetrica si pozitiv definita (valorile proprii 2.8, 0.1, 0.1), dar nu diagonal dominanta
const SPD_NEDOMINANTA = [
  [1, 0.9, 0.9],
  [0.9, 1, 0.9],
  [0.9, 0.9, 1],
]

const PIVOT_NUL_TEXT: Text = {
  ro: 'Submatricea lider A[1] = 0 este singulară, deci pivotul de la pasul 1 este 0 și algoritmul nu poate împărți la el (slide-ul "Strategii de pivotare"). A este totuși nesingulară: GPP pe aceeași matrice merge până la capăt.',
  en: 'The leading submatrix A[1] = 0 is singular, so the pivot of step 1 is 0 and the algorithm cannot divide by it (slide "Strategii de pivotare"). A is nonsingular nonetheless: GPP on the same matrix runs to the end.',
}

export const CONTRAEXEMPLE: Record<string, Contraexemplu[]> = {
  LTRIS: [
    {
      titlu: { ro: 'element nul pe diagonală', en: 'zero diagonal entry' },
      explicatie: {
        ro: 'l_22 = 0: L este singulară, iar a doua ecuație nu mai conține necunoscuta x_2, deci împărțirea la l_22 nu se poate face.',
        en: 'l_22 = 0: L is singular, and the second equation no longer contains the unknown x_2, so the division by l_22 cannot be done.',
      },
      valori: { L: [[2, 0, 0], [1, 0, 0], [1, 2, 3]], b: [2, 1, 6] },
      final: 'eroare',
    },
  ],
  UTRIS: [
    {
      titlu: { ro: 'element nul pe diagonală', en: 'zero diagonal entry' },
      explicatie: {
        ro: 'u_22 = 0: U este singulară, iar împărțirea la u_22 nu se poate face.',
        en: 'u_22 = 0: U is singular, and the division by u_22 cannot be done.',
      },
      valori: { U: [[1, 2, 3], [0, 0, 1], [0, 0, 2]], b: [6, 1, 2] },
      final: 'eroare',
    },
  ],
  G: [{ titlu: { ro: 'pivot nul, deși A este nesingulară', en: 'zero pivot, although A is nonsingular' }, explicatie: PIVOT_NUL_TEXT, valori: { A: PIVOT_NUL }, final: 'eroare' }],
  GPP: [
    {
      titlu: { ro: 'matricea care oprește G', en: 'the matrix that stops G' },
      explicatie: {
        ro: 'Aceeași matrice pe care G nu o poate triangulariza (pivotul de la pasul 1 este 0). GPP aduce în locul lui cel mai mare element din coloană și merge până la capăt, cum spune teorema de pe slide-ul GPP: dacă A este nesingulară, GPP se execută complet.',
        en: 'The same matrix that G cannot triangularize (the pivot of step 1 is 0). GPP brings the largest entry of the column in its place and runs to the end, as the theorem on the GPP slide says: if A is nonsingular, GPP runs to completion.',
      },
      valori: { A: PIVOT_NUL },
      final: 'gata',
    },
    {
      titlu: { ro: 'matrice singulară', en: 'singular matrix' },
      explicatie: {
        ro: 'A este singulară (linia 2 este dublul liniei 1). GPP merge până la capăt, dar U iese cu u_33 = 0: teorema cere A nesingulară ca U să fie nesingulară, iar sistemul Ax = b nu are soluție unică.',
        en: 'A is singular (row 2 is twice row 1). GPP runs to the end, but U comes out with u_33 = 0: the theorem needs A nonsingular for U to be nonsingular, and the system Ax = b has no unique solution.',
      },
      valori: { A: SINGULARA },
      final: 'gata',
    },
  ],
  S_GPP: [
    {
      titlu: { ro: 'matrice singulară', en: 'singular matrix' },
      explicatie: {
        ro: 'A este singulară, deci U iese cu u_33 = 0 și substituția înapoi nu poate împărți la el. Algoritmul S_GPP cere A nesingulară.',
        en: 'A is singular, so U comes out with u_33 = 0 and back substitution cannot divide by it. Algorithm S_GPP needs A nonsingular.',
      },
      valori: { A: SINGULARA, b: [1, 2, 3] },
      final: 'eroare',
    },
  ],
  S_G: [
    {
      titlu: { ro: 'pivot nul', en: 'zero pivot' },
      explicatie: {
        ro: 'a_11 = 0: fără pivotare, algoritmul nu poate împărți la primul pivot, deși sistemul are soluție unică. Cu S_GPP pe aceleași date, ecuațiile se schimbă între ele și rezolvarea merge.',
        en: 'a_11 = 0: without pivoting, the algorithm cannot divide by the first pivot, although the system has a unique solution. With S_GPP on the same data, the equations are swapped and the solve works.',
      },
      valori: { A: [[0, 1], [1, 1]], b: [1, 2] },
      final: 'eroare',
    },
    {
      titlu: { ro: 'matrice singulară', en: 'singular matrix' },
      explicatie: {
        ro: 'A[1] = 1 este nesingulară, deci G merge până la capăt, dar A este singulară (linia 2 este dublul liniei 1) și u_22 iese 0: substituția înapoi nu poate împărți la el. Slide-ul "Rezolvarea sistemelor liniare utilizand G" observă că pentru G matricea poate fi singulară; rezolvarea sistemului are nevoie și de A nesingulară.',
        en: 'A[1] = 1 is nonsingular, so G runs to the end, but A is singular (row 2 is twice row 1) and u_22 comes out 0: back substitution cannot divide by it. The slide "Rezolvarea sistemelor liniare utilizand G" remarks that for G the matrix may be singular; solving the system also needs A nonsingular.',
      },
      valori: { A: [[1, 2], [2, 4]], b: [3, 6] },
      final: 'eroare',
    },
  ],
  LU: [{ titlu: { ro: 'pivot nul, deși A este nesingulară', en: 'zero pivot, although A is nonsingular' }, explicatie: PIVOT_NUL_TEXT, valori: { A: PIVOT_NUL }, final: 'eroare' }],
  CHOL: [
    {
      titlu: { ro: 'simetrică, dar nu pozitiv definită', en: 'symmetric, but not positive definite' },
      explicatie: {
        ro: 'La pasul 2, α = 1 − 2² = −3 ≤ 0: A nu este pozitiv definită și algoritmul se oprește (slide-ul "Algoritm factorizare Cholesky").',
        en: 'At step 2, α = 1 − 2² = −3 ≤ 0: A is not positive definite and the algorithm stops (slide "Algoritm factorizare Cholesky").',
      },
      valori: { A: [[1, 2], [2, 1]] },
      final: 'stop',
    },
  ],
  JACOBI: [
    {
      titlu: { ro: 'ρ(D⁻¹N) > 1: diverge', en: 'ρ(D⁻¹N) > 1: diverges' },
      explicatie: {
        ro: 'A nu este diagonal dominantă, iar ρ(D⁻¹N) = √6 ≈ 2.45 > 1: niciuna dintre condițiile de pe slide-ul "Metoda Jacobi" nu e îndeplinită, aproximările se depărtează de soluție și bucla se oprește la maxiter.',
        en: 'A is not diagonally dominant and ρ(D⁻¹N) = √6 ≈ 2.45 > 1: neither condition on the slide "Metoda Jacobi" holds, the approximations move away from the solution and the loop stops at maxiter.',
      },
      valori: { A: [[1, 2], [3, 1]], b: [3, 4], x: [0, 0], tol: 1e-6, maxiter: 30 },
      final: 'stop',
    },
    {
      titlu: { ro: 'nu e dominantă, dar converge', en: 'not dominant, but converges' },
      explicatie: {
        ro: 'A nu este diagonal dominantă, dar ρ(D⁻¹N) = √0.1 ≈ 0.32 < 1, cealaltă condiție de pe slide, deci metoda converge. Prima aproximare iese departe de soluție și revine: depărtarea de la un pas nu arată singură divergența.',
        en: 'A is not diagonally dominant, but ρ(D⁻¹N) = √0.1 ≈ 0.32 < 1, the other condition on the slide, so the method converges. The first approximation lands far from the solution and comes back: moving away at one step does not by itself show divergence.',
      },
      valori: { A: [[1, 10], [0.01, 1]], b: [11, 1.01], x: [0, 0], tol: 1e-6, maxiter: 100 },
      final: 'gata',
    },
    {
      titlu: { ro: 'pozitiv definită: Jacobi diverge', en: 'positive definite: Jacobi diverges' },
      explicatie: {
        ro: 'A este simetrică și pozitiv definită, dar pentru Jacobi slide-ul nu dă condiția aceasta: ρ(D⁻¹N) = 1.8 > 1 și metoda diverge. Gauss-Seidel pe aceeași matrice converge (slide-ul "Metoda Gauss-Seidel").',
        en: 'A is symmetric positive definite, but for Jacobi the slide does not give this condition: ρ(D⁻¹N) = 1.8 > 1 and the method diverges. Gauss-Seidel on the same matrix converges (slide "Metoda Gauss-Seidel").',
      },
      valori: { A: SPD_NEDOMINANTA, b: [1, 1, 1], x: [0, 0, 0], tol: 1e-6, maxiter: 40 },
      final: 'stop',
    },
  ],
  GS: [
    {
      titlu: { ro: 'ρ(L⁻¹U) > 1: diverge', en: 'ρ(L⁻¹U) > 1: diverges' },
      explicatie: {
        ro: 'A nu este diagonal dominantă și nici pozitiv definită, iar ρ(L⁻¹U) = 6 > 1: metoda diverge și bucla se oprește la maxiter.',
        en: 'A is neither diagonally dominant nor positive definite, and ρ(L⁻¹U) = 6 > 1: the method diverges and the loop stops at maxiter.',
      },
      valori: { A: [[1, 2], [3, 1]], b: [3, 4], x: [0, 0], tol: 1e-6, maxiter: 30 },
      final: 'stop',
    },
    {
      titlu: { ro: 'pozitiv definită, nu dominantă: converge', en: 'positive definite, not dominant: converges' },
      explicatie: {
        ro: 'A este simetrică și pozitiv definită, una dintre condițiile de pe slide-ul "Metoda Gauss-Seidel", deși nu e diagonal dominantă: metoda converge. Jacobi pe aceeași matrice diverge.',
        en: 'A is symmetric positive definite, one of the conditions on the slide "Metoda Gauss-Seidel", although it is not diagonally dominant: the method converges. Jacobi on the same matrix diverges.',
      },
      valori: { A: SPD_NEDOMINANTA, b: [1, 1, 1], x: [0, 0, 0], tol: 1e-6, maxiter: 500 },
      final: 'gata',
    },
  ],
  KACZMARZ: [
    {
      titlu: { ro: 'sistem fără soluție', en: 'system without a solution' },
      explicatie: {
        ro: 'Cele două ecuații spun x_1 + x_2 = 1 și x_1 + x_2 = 3: dreptele sunt paralele și sistemul nu are soluție. Slide-ul "Metoda Kaczmarz" presupune o soluție x*; aici x sare între cele două drepte, reziduul nu ajunge la zero și bucla se oprește la maxiter.',
        en: 'The two equations say x_1 + x_2 = 1 and x_1 + x_2 = 3: the lines are parallel and the system has no solution. The slide "Metoda Kaczmarz" assumes a solution x*; here x jumps between the two lines, the residual does not reach zero and the loop stops at maxiter.',
      },
      valori: { A: [[1, 1], [1, 1]], b: [1, 3], x: [0, 0], tol: 1e-6, maxiter: 30 },
      final: 'stop',
    },
    {
      titlu: { ro: 'pași care nu micșorează eroarea', en: 'steps that do not reduce the error' },
      explicatie: {
        ro: 'Soluția este x* = (1, 2, 3), iar eroarea de pornire x − x* = (0, 0, 1) este perpendiculară pe primele două linii: primii doi pași nu schimbă x. Abia linia a treia o micșorează, apoi metoda converge.',
        en: 'The solution is x* = (1, 2, 3), and the starting error x − x* = (0, 0, 1) is perpendicular to the first two rows: the first two steps do not change x. Only the third row reduces it, then the method converges.',
      },
      valori: { A: [[1, 0, 0], [0, 1, 0], [1, 1, 1]], b: [1, 2, 6], x: [1, 2, 4], tol: 1e-9, maxiter: 200 },
      final: 'gata',
    },
  ],
  RFG: [
    {
      titlu: { ro: 'x_k = 0: sgn(0) = 1', en: 'x_k = 0: sgn(0) = 1' },
      explicatie: {
        ro: 'Cu sgn(0) = 1, cum o definește cartea cursului, σ = 5, u = (1, 0.6, 0.8), β = 1 și U₁x = (−5, 0, 0). Cu un sgn(0) = 0, σ ar deveni 0 și împărțirea la σ nu s-ar putea face.',
        en: 'With sgn(0) = 1, as the book of the course defines it, σ = 5, u = (1, 0.6, 0.8), β = 1 and U₁x = (−5, 0, 0). With sgn(0) = 0, σ would become 0 and the division by σ could not be done.',
      },
      valori: { x: [0, 3, 4], k: 1 },
      final: 'gata',
    },
    {
      titlu: { ro: 'nimic de anulat: β = 0', en: 'nothing to annihilate: β = 0' },
      explicatie: {
        ro: 'x(2:3) = 0, deci reflectorul nu are ce anula: este matricea unitate, semnalată prin β = 0 (convenția cărții cursului), iar x rămâne neschimbat.',
        en: 'x(2:3) = 0, so the reflector has nothing to annihilate: it is the identity matrix, signalled by β = 0 (the convention of the book of the course), and x stays unchanged.',
      },
      valori: { x: [2, 0, 0], k: 2 },
      final: 'gata',
    },
  ],
  SQR: [
    {
      titlu: { ro: 'coloane dependente', en: 'dependent columns' },
      explicatie: {
        ro: 'A doua coloană este zero, deci coloanele nu sunt liniar independente și soluția CMMP nu este unică (teorema de pe slide-ul "Rezolvarea problemei CMMP: m > n": soluție unică exact când A este monică). R iese cu r_22 = 0, iar substituția înapoi nu poate împărți la el.',
        en: 'The second column is zero, so the columns are not linearly independent and the least squares solution is not unique (the theorem on the slide "Rezolvarea problemei CMMP: m > n": a unique solution exactly when A has independent columns). R comes out with r_22 = 0, and back substitution cannot divide by it.',
      },
      valori: { A: [[1, 0], [2, 0], [2, 0]], b: [1, 2, 3] },
      final: 'eroare',
    },
  ],
  MP: [
    {
      titlu: { ro: 'fără valoare proprie dominantă', en: 'no dominant eigenvalue' },
      explicatie: {
        ro: 'Valorile proprii 1 și −1 au același modul, deci ipoteza de pe slide-ul "Metoda puterii" nu este îndeplinită. y sare între (1, 0) și (0, 1), e rămâne 1 și bucla se oprește la maxiter: în lipsa unei valori proprii dominante, șirul nu converge.',
        en: 'The eigenvalues 1 and −1 have the same absolute value, so the hypothesis on the slide "Metoda puterii" does not hold. y jumps between (1, 0) and (0, 1), e stays 1 and the loop stops at maxiter: without a dominant eigenvalue, the sequence does not converge.',
      },
      valori: { A: [[0, 1], [1, 0]], y: [1, 0], tol: 1e-6, maxiter: 20 },
      final: 'stop',
    },
    {
      titlu: { ro: 'pornire fără componentă dominantă', en: 'start with no dominant component' },
      explicatie: {
        ro: 'y = (1, −1) este chiar vectorul propriu al valorii proprii 1, deci γ₁ = 0 și ipoteza de pe slide nu este îndeplinită. Ay = y, iar metoda se oprește imediat pe un vector propriu care nu este cel al valorii dominante 2.',
        en: 'y = (1, −1) is the eigenvector of the eigenvalue 1 itself, so γ₁ = 0 and the hypothesis on the slide does not hold. Ay = y, and the method stops at once on an eigenvector that is not the one of the dominant eigenvalue 2.',
      },
      valori: { A: [[2, 1], [0, 1]], y: [1, -1], tol: 1e-6, maxiter: 20 },
      final: 'gata',
    },
  ],
  Gb: [
    {
      titlu: { ro: 'pivot nul', en: 'zero pivot' },
      explicatie: {
        ro: 'a_11 = 0: fără pivotare, eliminarea nu poate împărți la primul pivot (cartea, teorema 2.9, cere A[k] nesingulare). GPPb pe aceeași matrice merge, cu banda lărgită.',
        en: 'a_11 = 0: without pivoting, elimination cannot divide by the first pivot (the book, theorem 2.9, needs nonsingular A[k]). GPPb on the same matrix works, with a wider band.',
      },
      valori: { A: BANDA_PIVOT_NUL, r: 1, q: 1 },
      final: 'eroare',
    },
  ],
  GPPb: [
    {
      titlu: { ro: 'matricea care oprește Gb', en: 'the matrix that stops Gb' },
      explicatie: {
        ro: 'Gb se oprește la pivotul nul de la pasul 1. GPPb aduce linia 2 în locul liniei 1, iar banda de deasupra diagonalei se lărgește de la q = 1 la q + r = 2 (cartea, teorema 2.10).',
        en: 'Gb stops at the zero pivot of step 1. GPPb brings row 2 in place of row 1, and the band above the diagonal widens from q = 1 to q + r = 2 (the book, theorem 2.10).',
      },
      valori: { A: BANDA_PIVOT_NUL, r: 1, q: 1 },
      final: 'gata',
    },
  ],
  UTRISb: [
    {
      titlu: { ro: 'element nul pe diagonală', en: 'zero diagonal entry' },
      explicatie: {
        ro: 'u_22 = 0: U este singulară, iar împărțirea la u_22 nu se poate face.',
        en: 'u_22 = 0: U is singular, and the division by u_22 cannot be done.',
      },
      valori: { U: [[1, 1, 0], [0, 0, 1], [0, 0, 1]], b: [2, 1, 1], q: 1 },
      final: 'eroare',
    },
  ],
}
