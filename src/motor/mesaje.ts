// Mesajele motorului (erori de sintaxa, erori la rulare, texte din urma), in romana si engleza.
// Limba se alege o data, inainte de parsare si rulare; {0}, {1}... sunt argumentele.

export type Limba = 'ro' | 'en'

let limba: Limba = 'ro'

export function setLimba(l: Limba): void {
  limba = l
}

export function getLimba(): Limba {
  return limba
}

const CATALOG = {
  sirNeinchis: { ro: 'text între ghilimele neînchis', en: 'unterminated quoted text' },
  caracterNeasteptat: { ro: 'caracter neașteptat "{0}" la coloana {1}', en: 'unexpected character "{0}" at column {1}' },
  laColoana: { ro: '{0}, la coloana {1}', en: '{0}, at column {1}' },
  indentareNeasteptata: { ro: 'indentare neașteptată', en: 'unexpected indentation' },
  altfelFaraDaca: { ro: '"altfel" fără "dacă" pe linia de deasupra', en: '"else" without "if" on the line above' },
  textNeasteptat: { ro: 'text neașteptat', en: 'unexpected text' },
  seAsteptaText: { ro: 'se aștepta un text între ghilimele', en: 'expected quoted text' },
  seAsteptaAtribuire: { ro: 'se aștepta "←" sau "="', en: 'expected "←" or "="' },
  etichetaNume: {
    ro: 'înaintea lui "=" trebuie să stea un nume, ca în "a_ik ← μ_ik = a_ik / a_kk"',
    en: 'a name must come before "=", as in "a_ik ← μ_ik = a_ik / a_kk"',
  },
  textDupaBucla: { ro: 'text neașteptat după antetul buclei', en: 'unexpected text after the loop header' },
  corpLipsaPentru: { ro: 'corpul buclei lipsește: indentează liniile de sub "pentru"', en: 'the loop body is missing: indent the lines under "for"' },
  seAsteptaAtunci: { ro: 'se aștepta "atunci"', en: 'expected "then"' },
  lipsaDupaAtunci: { ro: 'după "atunci" lipsește instrucțiunea', en: 'a statement must follow "then"' },
  lipsaDupaAltfel: { ro: 'după "altfel" lipsește instrucțiunea', en: 'a statement must follow "else"' },
  seAsteptaTimp: { ro: 'se aștepta "cât timp"', en: 'expected "while"' },
  textDupaConditie: { ro: 'text neașteptat după condiție', en: 'unexpected text after the condition' },
  corpLipsaCatTimp: { ro: 'corpul buclei lipsește: indentează liniile de sub "cât timp"', en: 'the loop body is missing: indent the lines under "while"' },
  seAsteptaPeste: { ro: 'se aștepta "peste", ca în "L, U peste A"', en: 'expected "over", as in "L, U over A"' },
  seAstepta: { ro: 'se aștepta "{0}"', en: 'expected "{0}"' },
  seAsteptaNume: { ro: 'se aștepta un nume', en: 'expected a name' },
  seAsteptaTinta: { ro: 'se aștepta o variabilă sau un element de tablou', en: 'expected a variable or an array element' },
  tintaInvalida: { ro: 'ținta atribuirii trebuie să fie o variabilă sau un element de tablou', en: 'the assignment target must be a variable or an array element' },
  normaUnArgument: { ro: 'norma are un singur argument', en: 'norm takes a single argument' },
  normaMatrice: {
    ro: 'pentru o matrice, cursul notează cu ‖A‖ norma spectrală, care nu se calculează aici; norma Frobenius se scrie ‖A‖_F',
    en: 'for a matrix, the course writes ‖A‖ for the spectral norm, which is not computed here; the Frobenius norm is written ‖A‖_F',
  },
  indiceLipsa: { ro: 'indice lipsă după "_"', en: 'missing index after "_"' },
  seAsteptaExpresie: { ro: 'se aștepta o expresie', en: 'expected an expression' },
  liniiDiferite: { ro: 'liniile matricei au lungimi diferite', en: 'the matrix rows have different lengths' },

  pesteMaxPasi: {
    ro: 'urma s-a oprit după {0} de pași, limita vizualizatorului: fie matricea este prea mare pentru a fi urmărită pas cu pas, fie bucla nu se termină; micșorează n, maxiter sau toleranța',
    en: 'the trace stopped after {0} steps, the limit of the visualizer: either the matrix is too large to follow step by step, or the loop does not end; reduce n, maxiter or the tolerance',
  },
  linia: { ro: 'linia {0}: {1}', en: 'line {0}: {1}' },
  stop: { ro: 'stop', en: 'stop' },
  gata: { ro: 'algoritmul s-a terminat', en: 'the algorithm has finished' },
  dimNegativa: { ro: 'dimensiune negativă pentru {0}', en: 'negative size for {0}' },
  schimbElemente: { ro: 'interschimbarea se face între două elemente de tablou', en: 'a swap needs two array elements' },
  pasZero: { ro: 'pasul buclei nu poate fi 0', en: 'the loop step cannot be 0' },
  nicioIteratie: { ro: 'nicio iterație: intervalul e gol', en: 'no iteration: the range is empty' },
  conditieComparatie: { ro: 'condiția trebuie să fie o comparație', en: 'the condition must be a comparison' },
  adevarat: { ro: 'adevărat', en: 'true' },
  fals: { ro: 'fals', en: 'false' },
  seAsteptaElement: { ro: 'se aștepta un element de tablou', en: 'expected an array element' },
  vectorUnIndice: { ro: '{0}: {1} este vector și are un singur indice', en: '{0}: {1} is a vector and takes one index' },
  indiceVector: { ro: '{0}: indicele {1} iese din vectorul {2} (1..{3})', en: '{0}: index {1} is outside vector {2} (1..{3})' },
  matriceDoiIndici: { ro: '{0}: {1} este matrice și are doi indici', en: '{0}: {1} is a matrix and takes two indices' },
  pozitieMatrice: { ro: '{0}: poziția ({1}, {2}) iese din matricea {3} ({4} x {5})', en: '{0}: position ({1}, {2}) is outside matrix {3} ({4} x {5})' },
  blocDimensiuni: { ro: 'blocul din {0} are forma {1}, iar valoarea are forma {2}', en: 'the block of {0} has shape {1}, but the value has shape {2}' },
  nuEsteTablouFie: { ro: '{0} nu este un vector sau o matrice; declară-l cu "fie"', en: '{0} is not a vector or a matrix; declare it with "let"' },
  doarNumar: { ro: 'în {0} se poate scrie doar un număr', en: 'only a number can be stored in {0}' },
  indiceNumar: { ro: 'indicele trebuie să fie un număr', en: 'the index must be a number' },
  indiceIntreg: { ro: 'indicele {0} nu este întreg', en: 'index {0} is not an integer' },
  seAsteptaNumar: { ro: '{0}: se aștepta un număr, nu {1}', en: '{0}: expected a number, not {1}' },
  unNumar: { ro: 'un număr', en: 'a number' },
  unVector: { ro: 'un vector de {0}', en: 'a vector of {0}' },
  oLinie: { ro: 'o linie de {0}', en: 'a row of {0}' },
  oMatrice: { ro: 'o matrice {0} x {1}', en: 'a {0} x {1} matrix' },
  nedefinita: { ro: 'variabila {0} nu este definită', en: 'variable {0} is not defined' },
  nedefinit: { ro: '{0} nu este definit', en: '{0} is not defined' },
  modulul: { ro: 'modulul', en: 'the absolute value' },
  termenulSumei: { ro: 'termenul sumei', en: 'the sum term' },
  comparatia: { ro: 'comparația', en: 'the comparison' },
  intervalGol: { ro: '{0} pe un interval gol', en: '{0} over an empty range' },
  nuEsteTablou: { ro: '{0} nu este un vector sau o matrice', en: '{0} is not a vector or a matrix' },
  blocIese: { ro: 'blocul iese din {0}', en: 'the block is outside {0}' },
  radicalNegativ: { ro: 'radical din număr negativ: {0}', en: 'square root of a negative number: {0}' },
  functieNecunoscuta: { ro: 'funcție necunoscută: {0}', en: 'unknown function: {0}' },
  impartireZero: { ro: 'împărțire la zero', en: 'division by zero' },
  rezultatInfinit: { ro: 'rezultat infinit sau nedefinit', en: 'infinite or undefined result' },
  matvecDim: { ro: 'produs matrice-vector cu dimensiuni nepotrivite ({0} x {1} și {2})', en: 'matrix-vector product with mismatched sizes ({0} x {1} and {2})' },
  dotDim: { ro: 'produs scalar între vectori de lungimi diferite', en: 'dot product of vectors with different lengths' },
  vecmatDim: { ro: 'produs vector-matrice cu dimensiuni nepotrivite', en: 'vector-matrix product with mismatched sizes' },
  matmulDim: { ro: 'produs de matrice cu dimensiuni nepotrivite ({0} x {1} și {2} x {3})', en: 'matrix product with mismatched sizes ({0} x {1} and {2} x {3})' },
  vectorOriVector: {
    ro: 'doi vectori coloană nu se pot înmulți: scrie x^T y pentru produsul scalar sau x y^T pentru produsul exterior',
    en: 'two column vectors cannot be multiplied: write x^T y for the dot product or x y^T for the outer product',
  },
  opNesuportata: { ro: 'operație nesuportată: {0} {1} {2}', en: 'unsupported operation: {0} {1} {2}' },
  formeDiferite: { ro: '{0} între tablouri de forme diferite: {1} și {2}', en: '{0} of arrays with different shapes: {1} and {2}' },
  adunarea: { ro: 'adunare', en: 'addition' },
  scaderea: { ro: 'scădere', en: 'subtraction' },
  functieTablou: { ro: '{0} se aplică unui vector sau unei matrice, nu unui număr', en: '{0} takes a vector or a matrix, not a number' },

  rotunjitLa: { ro: 'rotunjit la {0} cifre', en: 'rounded to {0} digits' },
  nuEsteNumar: { ro: '{0}: "{1}" nu este număr', en: '{0}: "{1}" is not a number' },
  unSingurNumar: { ro: '{0}: se aștepta un singur număr', en: '{0}: expected a single number' },
  vectorGol: { ro: '{0}: vectorul este gol', en: '{0}: the vector is empty' },
  matriceGoala: { ro: '{0}: matricea este goală', en: '{0}: the matrix is empty' },
  liniiLungimi: { ro: '{0}: liniile au lungimi diferite', en: '{0}: the rows have different lengths' },
  numeInvalid: { ro: 'numele "{0}" nu este valid: litere și cifre, prima literă', en: 'the name "{0}" is not valid: letters and digits, starting with a letter' },
  numeDublat: { ro: 'numele {0} apare de două ori', en: 'the name {0} appears twice' },

  apelTinta: {
    ro: 'un apel se atribuie unui nume, ca în "x ← UTRIS(U, b)" sau "[U, p] ← GPP(A)"',
    en: 'a call is assigned to a name, as in "x ← UTRIS(U, b)" or "[U, p] ← GPP(A)"',
  },
  apelAsteptat: { ro: 'după "[a, b] ←" trebuie să urmeze un algoritm din bibliotecă, ca GPP(A)', en: 'after "[a, b] ←" a library algorithm must follow, as in GPP(A)' },
  apelNecunoscut: { ro: '{0} nu este un algoritm din bibliotecă', en: '{0} is not a library algorithm' },
  apelArgumente: { ro: '{0} cere {1} intrări ({2}), a primit {3}', en: '{0} takes {1} inputs ({2}), got {3}' },
  apelIesiri: { ro: '{0} are {1} ieșiri ({2}), dar sunt {3} ținte', en: '{0} has {1} outputs ({2}), but there are {3} targets' },
  apelTip: { ro: 'intrarea {1} a lui {0} trebuie să fie {2}, nu {3}', en: 'input {1} of {0} must be {2}, not {3}' },
  tipMatrice: { ro: 'o matrice', en: 'a matrix' },
  tipVector: { ro: 'un vector', en: 'a vector' },
  tipNumar: { ro: 'un număr', en: 'a number' },
  apelEroare: { ro: '{0} s-a oprit cu eroare: {1}', en: '{0} stopped with an error: {1}' },
  apelOprit: { ro: '{0}: {1}', en: '{0}: {1}' },
  apelFaraIesire: { ro: '{0} nu a calculat {1}', en: '{0} did not compute {1}' },
} satisfies Record<string, { ro: string; en: string }>

export type Cheie = keyof typeof CATALOG

// Numele functiilor de dimensiune in limba mesajelor; parserul le aduce pe toate la forma romaneasca.
const FUNCTII_EN: Record<string, string> = { linii: 'rows', coloane: 'cols', lungime: 'len' }
export const numeFunctie = (nume: string): string => (limba === 'en' ? (FUNCTII_EN[nume] ?? nume) : nume)

export function mesaj(cheie: Cheie, ...args: (string | number)[]): string {
  return CATALOG[cheie][limba].replace(/\{(\d+)\}/g, (_, k: string) => String(args[Number(k)] ?? ''))
}
