// Arborele sintactic al pseudocodului din curs. Indicii sunt de la 1, ca in slide-uri.

export interface Interval {
  tip: 'interval'
  de: Expr
  la: Expr
}

export type Expr =
  | { tip: 'num'; v: number }
  | { tip: 'var'; nume: string }
  // a_ij, x_i, a_{i,j-1}, A(i,j); `sursa` e textul exact, folosit si ca nume de scalar (i_k)
  | { tip: 'elem'; nume: string; idx: Expr[]; sursa: string }
  // A(k:m, k), x(1:n), A(i, :); null inseamna toata axa
  | { tip: 'felie'; nume: string; idx: (Expr | Interval | null)[] }
  // juxta: produs scris prin alaturare (a_ij x_j), randat cu spatiu, nu cu punct
  | { tip: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Expr; b: Expr; juxta?: boolean }
  | { tip: 'neg'; a: Expr }
  | { tip: 'abs'; a: Expr }
  // F: norma Frobenius, ‖A‖_F; fara F, norma 2 a unui vector
  | { tip: 'norma'; a: Expr; F?: boolean }
  | { tip: 'transp'; a: Expr }
  | { tip: 'apel'; nume: string; args: Expr[] }
  | { tip: 'suma'; var: string; de: Expr; la: Expr; corp: Expr }
  | { tip: 'extrem'; fel: 'argmax' | 'argmin' | 'max' | 'min'; var: string; de: Expr; la: Expr; corp: Expr }
  | { tip: 'cmp'; op: '<' | '>' | '≤' | '≥' | '=' | '≠'; a: Expr; b: Expr }

export type Tinta = Extract<Expr, { tip: 'var' | 'elem' | 'felie' }>

export type Instr =
  // a_ik <- mu_ik = a_ik / a_kk ; eticheta e numele din mijloc; bucla e forma "u_ik <- a_ik, i = k+1 : m"
  | { tip: 'atrib'; linie: number; tinta: Tinta; eticheta?: Tinta; expr: Expr; bucla?: { var: string; de: Expr; la: Expr } }
  | { tip: 'schimb'; linie: number; a: Tinta; b: Tinta }
  | { tip: 'pentru'; linie: number; var: string; de: Expr; pas?: Expr; la: Expr; corp: Instr[] }
  | { tip: 'daca'; linie: number; cond: Expr; atunci: Instr[]; altfel?: Instr[] }
  | { tip: 'cattimp'; linie: number; cond: Expr; corp: Instr[] }
  | { tip: 'stop'; linie: number; mesaj?: string }
  | { tip: 'tipareste'; linie: number; mesaj: string }
  // "L, U peste A": elementele l_ij si u_ij se citesc si se scriu in A
  | { tip: 'peste'; linie: number; nume: string[]; tinta: string }
  // "fie U[m,p], beta[p]": tablouri noi, pline cu zero
  | { tip: 'fie'; linie: number; decl: { nume: string; dims: Expr[] }[] }
  // "x ← UTRIS(U, d)", "[U, p] ← GPP(A)": apelul unui algoritm din biblioteca, cu intrarile lui in
  // ordine; tintele primesc iesirile lui, in ordinea lor
  | { tip: 'apel'; linie: number; tinte: string[]; nume: string; args: Expr[] }

export interface Program {
  instr: Instr[]
}

export class EroareSintaxa extends Error {
  constructor(
    public linie: number,
    mesaj: string,
  ) {
    super(mesaj)
    this.name = 'EroareSintaxa'
  }
}
