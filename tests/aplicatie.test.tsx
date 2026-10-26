// @vitest-environment jsdom
import { EditorView } from '@codemirror/view'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../src/App'
import { text, type CheieText } from '../src/i18n'

// jsdom nu masoara text; CodeMirror cere aceste doua metode pe Range la fiecare cadru.
const dreptunghi = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON: () => ({}) } as DOMRect
Range.prototype.getBoundingClientRect = () => dreptunghi
Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as unknown as DOMRectList

async function monteaza() {
  const gazda = document.createElement('div')
  document.body.appendChild(gazda)
  await act(async () => {
    createRoot(gazda).render(<App />)
  })
  return gazda
}

// React asculta setter-ul nativ, nu proprietatea suprascrisa de el pe element.
async function scrieIn(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, valoare: string) {
  const prototip = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : el instanceof HTMLSelectElement ? HTMLSelectElement : HTMLInputElement
  Object.getOwnPropertyDescriptor(prototip.prototype, 'value')!.set!.call(el, valoare)
  await act(async () => {
    el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
  })
}

async function apasa(gazda: HTMLElement, text: string, al = 0) {
  const b = [...gazda.querySelectorAll<HTMLButtonElement>('button')].filter((x) => x.textContent === text)[al]
  if (!b) throw new Error(`nu există butonul „${text}”`)
  await act(async () => {
    b.click()
  })
}

// Un buton din bara de parcurgere, dupa eticheta lui accesibila, in oricare dintre limbi.
async function comanda(gazda: HTMLElement, cheie: CheieText) {
  const b = [...gazda.querySelectorAll<HTMLButtonElement>('.comenzi button')].find((x) => x.getAttribute('aria-label') === text('ro', cheie) || x.getAttribute('aria-label') === text('en', cheie))
  if (!b) throw new Error(`nu există comanda „${cheie}”`)
  await act(async () => {
    b.click()
  })
}

// Trece pe modul parcurgere, ca un pas inainte sa fie un pas al urmei, fara "?".
async function faraIntrebari(gazda: HTMLElement) {
  await apasa(gazda, 'Parcurgere')
}

// celulele grilelor algoritmului, fara matricele din formula (L, U, Q...) de sub ele
const celule = (gazda: HTMLElement, clasa = '') => gazda.querySelectorAll(`.grile:not(.vederi-grile) .grila .celula${clasa}`)
const formula = (gazda: HTMLElement) => gazda.querySelector('.pas .formula')?.textContent ?? ''

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
  // aplicatia isi scrie alegerile in adresa; fiecare test porneste de la una goala
  window.history.replaceState(null, '', '/')
})

describe('aplicația montată', () => {
  it('pornește cu eliminarea gaussiană: grila 3x3, formula primului pas, linia curentă în editor', async () => {
    const gazda = await monteaza()
    expect(celule(gazda)).toHaveLength(9)
    expect(gazda.querySelector('.grila figcaption')?.textContent).toContain('A')
    expect(gazda.querySelector('.katex')).not.toBeNull()
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 1 din')
    expect(gazda.querySelector('.cm-editor')).not.toBeNull()
    expect(gazda.querySelector('.cm-linie-curenta')).not.toBeNull()
  })

  it('un calcul apare întâi cu "?" în formulă și în celulă, iar pasul următor îl arată', async () => {
    const gazda = await monteaza()
    await comanda(gazda, 'pasInainte')
    await comanda(gazda, 'pasInainte')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 3 din 22')
    expect(gazda.querySelector('.stare')?.textContent).toContain('linia 4')
    expect(gazda.querySelector('.katex .rol-pivot')?.textContent).toContain('a')
    expect(gazda.querySelector('.cm-linie-curenta')?.textContent).toContain('a_ik ← μ_ik')
    expect(formula(gazda)).toContain('?')
    expect(celule(gazda, '.rol-scris')[0].textContent).toBe('?')
    expect(celule(gazda, '.rol-scris')[0].getAttribute('aria-label')).toBe('A(2,1) = ?, se scrie acum')

    await comanda(gazda, 'pasInainte')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 3 din 22')
    expect(formula(gazda)).not.toContain('?')
    expect(celule(gazda, '.rol-scris')[0].textContent).toBe('2')

    // un pas inapoi ascunde din nou rezultatul, inca unul trece la pasul dinainte
    await comanda(gazda, 'pasInapoi')
    expect(formula(gazda)).toContain('?')
    await comanda(gazda, 'pasInapoi')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 2 din 22')
  })

  it('butonul "Arată rezultatul" și bifa scot semnul întrebării', async () => {
    const gazda = await monteaza()
    await comanda(gazda, 'urmatoareaScriere')
    expect(formula(gazda)).toContain('?')
    await apasa(gazda, 'Arată rezultatul')
    expect(formula(gazda)).not.toContain('?')
    await comanda(gazda, 'urmatoareaScriere')
    expect(formula(gazda)).toContain('?')
    await faraIntrebari(gazda)
    expect(formula(gazda)).not.toContain('?')
    expect(localStorage.getItem('mn.intrebari')).toBe('0')
    await comanda(gazda, 'urmatoareaScriere')
    expect(formula(gazda)).not.toContain('?')
  })

  it('schimbarea algoritmului încarcă alt pseudocod și alte intrări', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'QR')
    // A si, dupa "fie", vectorul β
    expect(gazda.querySelectorAll('.grile:not(.vederi-grile) .grila')).toHaveLength(1)
    expect(celule(gazda)).toHaveLength(6)
    expect(gazda.querySelector('.descriere')?.textContent).toContain('Householder')
    // locul din curs sta pe un rand; ce difera fata de slide se deschide la cerere
    expect(gazda.querySelector('.in-curs summary')?.textContent).toBe('În curs: Curs IV, slide-ul "Triangularizare ortogonala", Algoritmul QR.')
    expect(gazda.querySelector('.in-curs p')?.textContent).toContain('O singură linie este în plus')
    expect(gazda.querySelector('.practic')?.textContent).toContain('numpy.linalg.qr')
  })

  it('pseudocod propriu: șablonul scrie o operație între tablouri, iar o intrare adăugată apare în grile', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'propriu')
    expect(gazda.querySelector('.descriere')?.textContent).toContain('pseudocodul')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 1 din')
    expect(gazda.querySelector('.cm-editor')?.textContent).toContain('r ← b - A x')
    // primul pas: produs matrice-vector si scadere, cu matricele scrise intregi in formula
    expect(gazda.querySelectorAll('.pas .formula .mtable').length).toBeGreaterThanOrEqual(3)
    expect(gazda.querySelector('.operatii-pas')?.textContent).toContain('produs matrice-vector')
    expect(gazda.querySelector('.operatii-pas')?.textContent).toContain('3 × 3, vector de 3 → vector de 3')
    expect(gazda.querySelector('.operatii-pas')?.textContent).toContain('scădere element cu element')
    // lista programului se deduce din urma: liniile cu operatii intre tablouri
    expect([...gazda.querySelectorAll('.operatii ol li')].map((li) => li.querySelector('.linii')?.textContent)).toEqual(['linia 3', 'linia 4'])
    expect(gazda.querySelector('.operatii ol li.curenta .text')?.textContent).toBe('produs matrice-vector, scădere element cu element')

    await apasa(gazda, '+ vector')
    const nume = [...gazda.querySelectorAll<HTMLInputElement>('.intrare .nume')]
    expect(nume.map((x) => x.value)).toEqual(['A', 'x', 'b', 'y'])
    const valori = [...gazda.querySelectorAll<HTMLTextAreaElement>('.intrare.vector textarea')].at(-1)!
    await scrieIn(valori, '5 6 7')
    await apasa(gazda, 'Rulează')
    expect(gazda.querySelectorAll('.grile:not(.vederi-grile) .grila figcaption').length).toBe(5)
    expect(celule(gazda)).toHaveLength(21)
    expect(JSON.parse(localStorage.getItem('mn.propriu')!).definitii).toHaveLength(4)
  })

  it('pseudocod propriu cu eroare de sintaxă: mesajul spune linia', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'propriu')
    localStorage.setItem('mn.propriu', JSON.stringify({ sursa: 'pentru i = 1 : n\nx ← 1', definitii: [] }))
    await scrieIn(gazda.querySelector('header select')!, 'G')
    await scrieIn(gazda.querySelector('header select')!, 'propriu')
    expect(gazda.querySelector('.eroare')?.textContent).toContain('linia 1')
    expect(gazda.querySelector('.cm-linie-eroare')).not.toBeNull()
  })

  it('celulele scrise mai demult devin „gata”, iar la sfârșit apare verificarea cu reziduuri ok', async () => {
    const gazda = await monteaza()
    await faraIntrebari(gazda)
    expect(gazda.querySelector('.verificare')?.textContent).toContain('apare la ultimul pas')
    for (let k = 0; k < 3; k++) await comanda(gazda, 'pasInainte')
    expect(celule(gazda, '.rol-mult')).toHaveLength(1)
    for (let k = 0; k < 8; k++) await comanda(gazda, 'pasInainte')
    expect(celule(gazda, '.rol-gata').length).toBeGreaterThan(0)
    await comanda(gazda, 'laSfarsit')
    // prima linie a lui U nu e scrisa niciodata, dar e folosita: e si ea "gata", ca restul lui U
    expect(celule(gazda, '.rol-gata')).toHaveLength(6)
    expect(celule(gazda, '.rol-mult')).toHaveLength(3)
    const randuri = [...gazda.querySelectorAll('.verificare tbody tr')]
    expect(randuri.length).toBeGreaterThan(0)
    expect(randuri.every((r) => r.classList.contains('ok'))).toBe(true)
    expect(gazda.querySelector('.mesaj.gata')?.textContent).toBe('algoritmul s-a terminat')
  })

  it('un tablou doar citit nu devine "gata": la LTRIS, L și b rămân neatinse, iar x se termină', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'LTRIS')
    await comanda(gazda, 'laSfarsit')
    const grila = (nume: string) => [...gazda.querySelectorAll('.grile:not(.vederi-grile) .grila .celule')].find((g) => g.getAttribute('aria-label')?.startsWith(`${nume},`))!
    expect(grila('L').querySelectorAll('.rol-gata')).toHaveLength(0)
    expect(grila('b').querySelectorAll('.rol-gata')).toHaveLength(0)
    expect(grila('x').querySelectorAll('.rol-gata')).toHaveLength(3)
  })

  it('panoul de cod Python arată traducerea NumPy a programului curent', async () => {
    const gazda = await monteaza()
    const panou = gazda.querySelector<HTMLDetailsElement>('details.python')!
    expect(panou.querySelector('pre')).toBeNull()
    await act(async () => {
      panou.open = true
      panou.dispatchEvent(new Event('toggle'))
    })
    expect(panou.querySelector('pre')?.textContent).toContain('import numpy as np')
    expect(panou.querySelector('pre')?.textContent).toContain('def G(A):')
    expect(panou.querySelector('pre')?.textContent).toContain('    for k in range(n - 1):')
    expect(panou.querySelector('pre')?.textContent).toContain('A[i, k] = A[i, k] / A[k, k]')
    expect(panou.querySelector('pre')?.textContent).toContain('    return A')
  })

  it('butonul „aleator” păstrează dimensiunile și rulează: grila arată valorile noi, de la primul pas', async () => {
    const gazda = await monteaza()
    await comanda(gazda, 'urmatoareaScriere')
    await apasa(gazda, 'aleator')
    const text = gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!.value
    const linii = text.split('\n')
    expect(linii).toHaveLength(3)
    expect(linii.every((l) => l.split(' ').length === 3)).toBe(true)
    expect([...celule(gazda)].map((c) => c.textContent).join(' ')).toBe(linii.join(' '))
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 1 din')
    expect(gazda.querySelector('.invechit')).toBeNull()
    expect(gazda.querySelector('.avertisment')).toBeNull()
    await apasa(gazda, 'exemplul inițial')
    expect(gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!.value).toBe('1 2 1\n2 1 2\n1 1 2')
    expect(celule(gazda)[1].textContent).toBe('2')
  })

  it('„aleator” respectă natura intrării: U rămâne superior triunghiulară, cu diagonala nenulă', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'UTRIS')
    for (let k = 0; k < 5; k++) {
      await apasa(gazda, 'aleator')
      const U = gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!.value.split('\n').map((l) => l.split(' ').map(Number))
      expect(U).toHaveLength(3)
      U.forEach((l, i) => l.forEach((x, j) => (j < i ? expect(x).toBe(0) : j === i ? expect(x).not.toBe(0) : undefined)))
      await comanda(gazda, 'laSfarsit')
      expect(gazda.querySelector('.verificare tbody tr')?.classList.contains('ok')).toBe(true)
    }
  })

  it('o intrare scrisă de mână care nu are natura cerută primește un avertisment, iar grilele rămase în urmă sunt semnalate', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'UTRIS')
    expect(gazda.querySelector('.avertisment')).toBeNull()
    expect(gazda.querySelector('.invechit')).toBeNull()
    await scrieIn(gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!, '2 1 -1\n5 3 2\n0 0 4')
    expect(gazda.querySelector('.avertisment')?.textContent).toBe(
      'U nu este superior triunghiulară: elementul (2, 1), de sub diagonală, este 5. Algoritmul nu îl citește, deci rezolvă alt sistem decât cel scris.',
    )
    // grila arata inca rularea dinainte
    expect(celule(gazda)[3].textContent).toBe('0')
    expect(gazda.querySelector('.invechit')?.textContent).toContain('rularea dinainte')
    await apasa(gazda, 'Rulează din nou')
    expect(celule(gazda)[3].textContent).toBe('5')
    expect(gazda.querySelector('.invechit')).toBeNull()
    await apasa(gazda, 'EN')
    expect(gazda.querySelector('.avertisment')?.textContent).toContain('U is not upper triangular: entry (2, 1), below the diagonal, is 5.')
  })

  it('„>>” sare la următoarea scriere, iar linia curentă are valorile indicilor', async () => {
    const gazda = await monteaza()
    await comanda(gazda, 'urmatoareaScriere')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 3 din 22')
    expect(gazda.querySelector('.cm-anotare')?.textContent).toBe('k = 1, i = 2')
    await comanda(gazda, 'urmatoareaScriere')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 5 din 22')
    await comanda(gazda, 'scriereaAnterioara')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 3 din 22')
    await comanda(gazda, 'laSfarsit')
    expect(celule(gazda, '.rol-mult')).toHaveLength(3)
  })

  it('lista operațiilor pe matrice marchează etapa pasului curent', async () => {
    const gazda = await monteaza()
    const etape = () => [...gazda.querySelectorAll('.operatii ol li')]
    expect(gazda.querySelector('.operatii')?.textContent).toContain('Operații pe matrice')
    expect(etape()).toHaveLength(2)
    expect(etape().some((li) => li.classList.contains('curenta'))).toBe(false)
    await comanda(gazda, 'urmatoareaScriere')
    expect(etape()[0].classList.contains('curenta')).toBe(true)
    expect(etape()[0].querySelector('.linii')?.textContent).toBe('liniile 3-4')
    expect(etape()[0].querySelector('.text')?.textContent).toContain('multiplicatorii pasului k')
    expect(etape()[1].classList.contains('curenta')).toBe(false)
    // lista de referinta cu ce se poate scrie intre tablouri
    expect(gazda.querySelector('.operatii details')?.textContent).toContain('produs exterior')
  })

  it('metodele iterative: panoul de convergență crește cu urma și compară costul cu metoda directă', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'JACOBI')
    expect(gazda.querySelector('header select optgroup[label="Sisteme liniare, metode iterative"]')).not.toBeNull()
    expect(gazda.querySelector('.convergenta')?.textContent).toContain('Convergență')
    expect(gazda.querySelectorAll('.convergenta circle')).toHaveLength(0)
    // rezumatul spune relatia adevarata: ">" cat timp bucla continua, "≤" la evaluarea care o opreste
    await faraIntrebari(gazda)
    const rezumat = () => gazda.querySelector('.convergenta summary .rezumat')?.textContent
    for (let k = 0; k < 10 && !rezumat(); k++) await comanda(gazda, 'pasInainte')
    expect(rezumat()).toBe('0.4734 > 0.001')
    await comanda(gazda, 'laSfarsit')
    expect(gazda.querySelector('.convergenta summary .rezumat')?.textContent).toBe('9.82e-4 ≤ 0.001')
    // 12 iteratii: conditia buclei se evalueaza de 13 ori
    expect(gazda.querySelectorAll('.convergenta circle')).toHaveLength(13)
    expect(gazda.querySelectorAll('.convergenta tbody tr')).toHaveLength(13)
    expect(gazda.querySelector('.convergenta')?.textContent).toContain('costă ≈ 13 flopi')
    const randuri = [...gazda.querySelectorAll('.verificare tbody tr')]
    expect(randuri[0].classList.contains('ok')).toBe(true)
    expect(randuri[1].textContent).toContain('12')
    expect(randuri[2].textContent).toContain('eroarea față de soluția eliminării gaussiene')
  })

  it('cu toleranța zero, un reziduu exact nul trece verificarea', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'JACOBI')
    const camp = (nume: string) => [...gazda.querySelectorAll<HTMLElement>('.intrare')].find((x) => x.querySelector<HTMLInputElement>('.nume')?.value === nume)!
    await scrieIn(camp('A').querySelector('textarea')!, '2 0\n0 4')
    await scrieIn(camp('b').querySelector('textarea')!, '2 4')
    await scrieIn(camp('x').querySelector('textarea')!, '0 0')
    await scrieIn(camp('tol').querySelector<HTMLInputElement>('input:not(.nume)')!, '0')
    await apasa(gazda, 'Rulează')
    await comanda(gazda, 'laSfarsit')
    expect(gazda.querySelector('.mesaj.gata')).not.toBeNull()
    expect(gazda.querySelector('.verificare tbody tr')?.classList.contains('ok')).toBe(true)
    // zero are treapta lui pe scara logaritmica
    expect([...gazda.querySelectorAll('.convergenta .gradatie')].some((x) => x.textContent === '0')).toBe(true)
  })

  it('schimbarea limbii după ce textul din editor s-a schimbat nu lasă un semn de întrebare fără pas', async () => {
    const gazda = await monteaza()
    await comanda(gazda, 'urmatoareaScriere')
    expect(formula(gazda)).toContain('?')
    await scrieIn(gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!, '5')
    await apasa(gazda, 'EN')
    expect(gazda.querySelector('.stare')?.textContent).toContain('step 2 of 2')
    expect([...gazda.querySelectorAll('button')].some((b) => b.textContent === 'Show the result')).toBe(false)
  })

  it('un pivot nul: avertisment la intrare, apoi pasul de eroare arată împărțirea care nu s-a putut face', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!, '0 1\n1 0')
    expect(gazda.querySelector('.avertisment')?.textContent).toContain('Submatricea lider principală A[1] (colțul din stânga sus, de 1 x 1) este singulară')
    await apasa(gazda, 'Rulează')
    await comanda(gazda, 'laSfarsit')
    expect(gazda.querySelector('.mesaj.eroare')?.textContent).toBe('linia 4: împărțire la zero')
    expect(formula(gazda)).toContain('1/0')
  })

  it('Jacobi pe o matrice fără dominanță: notă la intrare, iar un reziduu uriaș se scrie scurt și despărțit de ceilalți scalari', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'JACOBI')
    expect(gazda.querySelector('.avertisment')).toBeNull()
    await scrieIn(gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!, '1 2\n3 1')
    expect(gazda.querySelector('.avertisment.usor')?.textContent).toContain('A nu este strict diagonal dominantă')
    await apasa(gazda, 'Rulează')
    await comanda(gazda, 'laSfarsit')
    expect(gazda.querySelector('.mesaj.stop')?.textContent).toBe('nu a convers în maxiter iterații')
    expect(gazda.querySelector('.pas .valori')?.textContent).toBe('e = 5.7e+38, k = 100, i = 2')
  })

  it('modul exercițiu: răspunsul scris la un pas ascuns se verifică, iar rezultatul apare cu verdictul și scorul', async () => {
    const gazda = await monteaza()
    await comanda(gazda, 'urmatoareaScriere')
    // a_21 ← μ_21 = a_21 / a_11 = 2 / 1 = ?
    expect(formula(gazda)).toContain('?')
    await scrieIn(gazda.querySelector<HTMLInputElement>('.raspuns input')!, '2')
    await apasa(gazda, 'Verifică')
    expect(gazda.querySelector('.verdict')?.textContent).toBe('Corect. Corecte: 1 din 1.')
    expect(formula(gazda)).not.toContain('?')
    await comanda(gazda, 'urmatoareaScriere')
    await scrieIn(gazda.querySelector<HTMLInputElement>('.raspuns input')!, '5')
    await apasa(gazda, 'Verifică')
    expect(gazda.querySelector('.verdict.gresit')?.textContent).toContain('Corecte: 1 din 2.')
    // un text care nu e numar nu se numara
    await comanda(gazda, 'urmatoareaScriere')
    await scrieIn(gazda.querySelector<HTMLInputElement>('.raspuns input')!, 'doi')
    await apasa(gazda, 'Verifică')
    expect(gazda.querySelector('.raspuns .necitit')?.textContent).toBe('scrie un număr, de exemplu 0.5 sau 1/2')
    expect(formula(gazda)).toContain('?')
  })

  it('modul exercițiu pe o condiție: adevărat sau fals', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'JACOBI')
    while (!gazda.querySelector('.cm-linie-curenta')?.textContent?.includes('cât timp')) await comanda(gazda, 'pasInainte')
    expect(gazda.querySelector<HTMLInputElement>('.raspuns input')?.placeholder).toBe('adevărat sau fals')
    await scrieIn(gazda.querySelector<HTMLInputElement>('.raspuns input')!, 'da')
    await apasa(gazda, 'Verifică')
    expect(gazda.querySelector('.verdict.corect')).not.toBeNull()
  })

  it('aritmetica cu 3 cifre: S_G pe exemplul din curs dă x = (0, 1), soluția falsă de pe slide; în dublă precizie, soluția corectă', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'S_G')
    const precizie = gazda.querySelector<HTMLSelectElement>('.precizie select')!
    expect(precizie.value).toBe('3')
    await comanda(gazda, 'laSfarsit')
    expect(gazda.querySelector('.stare')?.textContent).toContain('cu 3 cifre')
    const x = () => [...gazda.querySelectorAll('.grila')].find((g) => g.querySelector('figcaption')?.textContent?.startsWith('x'))!
    expect([...x().querySelectorAll('.celula')].map((c) => c.textContent)).toEqual(['0', '1'])
    expect(gazda.querySelector('.verificare tbody tr')?.classList.contains('ok')).toBe(false)
    await scrieIn(precizie, '0')
    await comanda(gazda, 'laSfarsit')
    expect([...x().querySelectorAll('.celula')].map((c) => c.textContent)).toEqual(['1', '0.9999'])
    expect(gazda.querySelector('.verificare tbody tr')?.classList.contains('ok')).toBe(true)
    // alt algoritm revine la dubla precizie
    await scrieIn(gazda.querySelector('header select')!, 'G')
    expect(gazda.querySelector<HTMLSelectElement>('.precizie select')!.value).toBe('0')
  })

  it('Gb: zerourile din afara benzii sunt hașurate și explicate în legendă, iar costul se compară cu G pe aceeași matrice', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'Gb')
    // 5 x 5 tridiagonala: 25 - 13 = 12 zerouri stiute
    expect(gazda.querySelectorAll('.celula.zero-stiut:not([aria-hidden])')).toHaveLength(12)
    expect(gazda.querySelector('.legenda')?.textContent).toContain('zero știut dinainte')
    expect(gazda.querySelector('.cost')?.textContent).toContain('Pe aceleași intrări, algoritmul G (eliminare gaussiană) numără 70 de flopi.')
    // pe tot parcursul, nicio celula hasurata nu e citita sau scrisa
    await faraIntrebari(gazda)
    while (!gazda.querySelector('.mesaj.gata')) {
      await comanda(gazda, 'pasInainte')
      expect(gazda.querySelectorAll('.celula.zero-stiut.rol-citit, .celula.zero-stiut.rol-scris')).toHaveLength(0)
    }
  }, 30000)

  it('vederea geometrică apare pentru un sistem cu două necunoscute și urmează pașii', async () => {
    const gazda = await monteaza()
    expect(gazda.querySelector('.geometrie')).toBeNull()
    await scrieIn(gazda.querySelector('header select')!, 'KACZMARZ')
    expect(gazda.querySelector('.geometrie')).not.toBeNull()
    expect(gazda.querySelectorAll('.geometrie svg .dreapta')).toHaveLength(2)
    expect(gazda.querySelector('.geometrie svg .solutie')).not.toBeNull()
    await comanda(gazda, 'laSfarsit')
    expect(gazda.querySelectorAll('.geometrie svg .punct').length).toBeGreaterThan(3)
    expect(gazda.querySelector('.geometrie svg')?.getAttribute('aria-label')).toContain('aproximarea curentă este (')
    await scrieIn(gazda.querySelector('header select')!, 'MP')
    // exemplul din curs este 4 x 4, fara desen; pe o matrice 2 x 2 apare cercul unitate
    expect(gazda.querySelector('.geometrie')).toBeNull()
    const intrare = (nume: string) => [...gazda.querySelectorAll<HTMLElement>('.intrare')].find((x) => x.querySelector<HTMLInputElement>('.nume')?.value === nume)!
    await scrieIn(intrare('A').querySelector('textarea')!, '2 1\n1 2')
    await scrieIn(intrare('y').querySelector('textarea')!, '1 0')
    await apasa(gazda, 'Rulează')
    expect(gazda.querySelector('.geometrie .cerc')).not.toBeNull()
    // o matrice 3 x 3 nu se poate desena in plan
    await scrieIn(gazda.querySelector('header select')!, 'G')
    expect(gazda.querySelector('.geometrie')).toBeNull()
  })

  it('dimensiuni care nu se potrivesc: avertisment la intrare și rularea refuzată, cu motivul', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'matmul')
    const B = [...gazda.querySelectorAll<HTMLElement>('.intrare')].find((x) => x.querySelector<HTMLInputElement>('.nume')?.value === 'B')!
    await scrieIn(B.querySelector('textarea')!, '1 0 2\n2 1 0\n1 1 1')
    expect(B.querySelector('.avertisment')?.textContent).toBe('B trebuie să aibă 2 linii, câte coloane are A; are 3.')
    await apasa(gazda, 'Rulează')
    expect(gazda.querySelector('p.eroare')?.textContent).toBe('Nu pot rula: B trebuie să aibă 2 linii, câte coloane are A; are 3.')
    expect(gazda.querySelector('.grila')).toBeNull()
    // "aleator" pe B ii da numarul de linii cerut
    await apasa(gazda, 'aleator', 1)
    expect(B.querySelector('textarea')!.value.split('\n')).toHaveLength(2)
    expect(gazda.querySelector('p.eroare')).toBeNull()
  })

  it('o rulare care se oprește cu o eroare sau cu stop o anunță de la primul pas, cu un buton spre locul ei', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!, '0 1\n1 0')
    await apasa(gazda, 'Rulează')
    expect(gazda.querySelector('.oprire')?.textContent).toContain('Rularea se oprește cu o eroare la pasul 3: linia 4: împărțire la zero')
    await apasa(gazda, 'du-mă acolo')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 3 din 3')
    expect(gazda.querySelector('.oprire')).toBeNull()
  })

  it('săgețile pe meniul de algoritmi merg prin pași, nu schimbă algoritmul; spațiul pe un buton nu pornește redarea', async () => {
    const gazda = await monteaza()
    const meniu = gazda.querySelector<HTMLSelectElement>('header select')!
    meniu.focus()
    await act(async () => {
      meniu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    })
    expect(meniu.value).toBe('G')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 2 din 22')
    const buton = [...gazda.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'aleator')!
    buton.focus()
    await act(async () => {
      buton.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    })
    expect([...gazda.querySelectorAll('button')].some((b) => b.textContent === 'Pauză')).toBe(false)
  })

  it('„păstrează la alt algoritm”: de la S_G la S_GPP rămân intrările și precizia, ca rezultatele să se compare', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'S_G')
    const bifa = [...gazda.querySelectorAll<HTMLLabelElement>('.titlu-intrari label')][0].querySelector('input')!
    await act(async () => {
      bifa.click()
    })
    await scrieIn(gazda.querySelector('header select')!, 'S_GPP')
    expect(gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!.value).toBe('0.0001 1\n1 1')
    expect(gazda.querySelector<HTMLSelectElement>('.precizie select')!.value).toBe('3')
    await comanda(gazda, 'laSfarsit')
    const x = [...gazda.querySelectorAll('.grila')].find((g) => g.querySelector('figcaption')?.textContent?.startsWith('x'))!
    expect([...x.querySelectorAll('.celula')].map((c) => c.textContent)).toEqual(['1', '1'])
  })

  it('cu 3 cifre, formula arată și valoarea dinainte de rotunjire', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'S_G')
    await faraIntrebari(gazda)
    while (!formula(gazda).includes('rotunjit')) await comanda(gazda, 'pasInainte')
    expect(formula(gazda)).toContain('−9999')
    expect(formula(gazda)).toContain('rotunjit la 3 cifre')
  })

  it('un zero ratat de rotunjiri apare ca ≈0, cu valoarea exactă în titlul celulei', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'SQR')
    await comanda(gazda, 'laSfarsit')
    const x = [...gazda.querySelectorAll('.grila')].find((g) => g.querySelector('figcaption')?.textContent?.startsWith('x'))!
    const celule = [...x.querySelectorAll<HTMLElement>('.celula')]
    expect(celule[1].textContent).toBe('≈0')
    expect(Math.abs(Number(celule[1].title.split('= ')[1]))).toBeLessThan(1e-14)
  })

  it('grila se citește ca tabel, iar legenda are contururile rolurilor', async () => {
    const gazda = await monteaza()
    const tabel = gazda.querySelector('.grila [role="table"]')!
    expect(tabel.getAttribute('aria-label')).toBe('A, 3 × 3')
    expect(tabel.querySelectorAll('[role="row"]')).toHaveLength(4)
    expect(tabel.querySelectorAll('[role="cell"]')).toHaveLength(9)
    expect(tabel.querySelector('[role="cell"]')?.getAttribute('aria-label')).toBe('A(1,1) = 1')
    expect([...gazda.querySelectorAll('.legenda .celula')].map((c) => c.className)).toEqual(['celula rol-pivot', 'celula rol-scris', 'celula rol-citit', 'celula rol-gata', 'celula rol-mult'])
    expect(gazda.querySelector('.comenzi button[aria-label="un pas înainte (săgeată dreapta)"]')).not.toBeNull()
  })

  it('eticheta unei noțiuni deschide panoul și o marchează', async () => {
    const gazda = await monteaza()
    expect(gazda.querySelector<HTMLDetailsElement>('details.notiuni')?.open).toBe(false)
    await apasa(gazda, 'Pivotul și pivotarea parțială')
    expect(gazda.querySelector<HTMLDetailsElement>('details.notiuni')?.open).toBe(true)
    expect(gazda.querySelector('#notiune-pivot')?.classList.contains('aleasa')).toBe(true)
    expect(gazda.querySelector('#notiune-pivot h4')?.textContent).toBe('Pivotul și pivotarea parțială')
  })

  it('o matrice mare oprește animațiile, dar pașii rămân', async () => {
    const mare = Array.from({ length: 13 }, (_, i) => Array.from({ length: 13 }, (_, j) => (i === j ? 9 : 1)).join(' ')).join('\n')
    localStorage.setItem('mn.propriu', JSON.stringify({ sursa: 's ← 0\npentru i = 1 : n\n    s ← s + a_ii', definitii: [{ nume: 'A', tip: 'matrice', text: mare }] }))
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'propriu')
    expect(celule(gazda, '.static')).toHaveLength(169)
    expect(gazda.querySelector('.scena .matrice-mare')?.textContent).toContain('animațiile sunt oprite')
    // un program doar pe elemente nu are operatii intre tablouri de aratat
    expect(gazda.querySelector('.operatii')?.textContent).toContain('lucrează doar pe elemente')
  })

  it('parametrii din adresă aleg algoritmul și pasul', async () => {
    window.history.pushState({}, '', '/?algoritm=S_GPP&pas=5')
    try {
      const gazda = await monteaza()
      expect(gazda.querySelector('header select')?.closest('label')?.querySelector('select')?.value).toBe('S_GPP')
      expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 5 din')
    } finally {
      window.history.pushState({}, '', '/')
    }
  })

  it('butonul EN traduce interfața și mesajele urmei, butonul de temă schimbă atributul', async () => {
    const gazda = await monteaza()
    await apasa(gazda, 'EN')
    expect(gazda.querySelector('h1')?.textContent).toBe('Algorithm visualizer for Numerical Methods')
    expect(gazda.querySelector('.stare')?.textContent).toContain('step 1 of 22')
    expect(gazda.querySelector('header select option')?.textContent).toContain('Matrix-vector')
    expect(gazda.querySelector('.operatii h2')?.textContent).toBe('Matrix operations')
    expect(localStorage.getItem('mn.limba')).toBe('en')

    // pseudocodul din biblioteca trece si el in engleza, cu aceleasi linii
    expect(gazda.querySelector('.cm-content')?.textContent).toContain('for k = 1 : n-1')
    expect(gazda.querySelector('.cm-content')?.textContent).toContain('μ over A')
    // adresa tine limba aleasa, pentru o reincarcare
    expect(window.location.search).toContain('limba=en')

    await apasa(gazda, 'Dark theme')
    expect(document.documentElement.dataset.tema).toBe('intunecat')
    expect(localStorage.getItem('mn.tema')).toBe('intunecat')
    await apasa(gazda, 'Light theme')
    expect(document.documentElement.dataset.tema).toBe('luminos')
  })

  it('meniul de tip și butoanele de dimensiune generează matricea cerută, iar rândul de proprietăți o descrie', async () => {
    const gazda = await monteaza()
    // exemplul de la G: proprietatile lui apar sub matrice
    expect(gazda.querySelector('.intrare .proprietati')?.textContent).toContain('submatricele lider principale nesingulare')
    await scrieIn(gazda.querySelector<HTMLSelectElement>('.tip-matrice select')!, 'tridiagonala')
    const A = () => gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!.value.split('\n').map((l) => l.trim().split(/\s+/).map(Number))
    expect(A()).toHaveLength(3)
    expect(A()[0][2]).toBe(0)
    expect(A()[2][0]).toBe(0)
    expect(gazda.querySelector('.intrare .proprietati')?.textContent).toContain('tridiagonală')
    // G cere o matrice patrata: un singur control, ordinul
    const plus = gazda.querySelector<HTMLButtonElement>('.forma-intrare button[aria-label="ordinul: cu unu mai mult"]')!
    await act(async () => {
      plus.click()
    })
    expect(A()).toHaveLength(4)
    expect(A().every((l) => l.length === 4)).toBe(true)
    // tipul ales ramane: matricea noua e tot tridiagonala, iar rularea a pornit pe ea
    expect(A()[0][3]).toBe(0)
    expect(gazda.querySelectorAll('.grila')[0].querySelectorAll('.celula').length).toBe(16)
  })

  it('un contraexemplu din curs încarcă valorile lui și rulează: G se oprește la pivotul nul', async () => {
    const gazda = await monteaza()
    expect(gazda.querySelector('.contraexemple summary')?.textContent).toBe('Contraexemple din curs (1)')
    await apasa(gazda, 'pivot nul, deși A este nesingulară')
    expect(gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!.value).toBe('0 1 2\n1 1 1\n2 1 3')
    // rularea se opreste la impartirea la pivotul nul, iar scena anunta oprirea
    expect(gazda.querySelector('.oprire')?.textContent).toContain('împărțire la zero')
  })

  // montarea si drumul pana la ultimul pas dureaza peste o secunda: sub incarcare, limita implicita de 5 s nu ajunge
  it('panoul "Ce rămâne adevărat" verifică invariantul lui G pe valorile din grilă', { timeout: 20000 }, async () => {
    const gazda = await monteaza()
    const panou = () => gazda.querySelector('.panou.invariant')!
    expect(panou().textContent).toContain('Încă niciun pas complet')
    await act(async () => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    })
    expect(panou().textContent).toContain('La ieșirea din buclă, după 2 pași:')
    expect(panou().querySelector('.verificat')?.className).toBe('verificat ok')
    expect(panou().querySelector('summary .rezumat')?.textContent).toBe('2 pași compleți · ok')
  })

  it('invariantul numește pasul prin variabila buclei, cu singularul la un singur pas', async () => {
    // pasul 16 al urmei este antetul buclei exterioare pentru k = 2
    window.history.pushState({}, '', '/?algoritm=G&pas=16')
    try {
      const gazda = await monteaza()
      const panou = gazda.querySelector('.panou.invariant')!
      expect(panou.textContent).toContain('La începutul pasului k = 2, după 1 pas complet:')
      expect(panou.querySelector('summary .rezumat')?.textContent).toBe('1 pas complet · ok')
    } finally {
      window.history.pushState({}, '', '/')
    }
  })

  it('panoul de condiționare încarcă matricea Hilbert din carte și arată κ∞ ≈ 748', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector<HTMLSelectElement>('header select')!, 'S_GPP')
    const panou = () => gazda.querySelector<HTMLDetailsElement>('.panou.conditionare')!
    // inchis, experimentul nu ruleaza
    expect(panou().querySelector('table')).toBeNull()
    await act(async () => {
      panou().open = true
      panou().dispatchEvent(new Event('toggle'))
    })
    expect(panou().textContent).toContain('κ∞(A) = ‖A⁻¹‖∞ ‖A‖∞')
    await apasa(gazda, 'matricea Hilbert H₃ (h_ij = 1/(i + j − 1)): κ∞ ≈ 748')
    expect(gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!.value.split('\n')[0]).toBe('1 0.5 0.3333333333333333')
    const randuri = [...panou().querySelectorAll('tbody tr')].map((r) => [...r.querySelectorAll('td')].map((c) => c.textContent))
    expect(Number(randuri[2][1])).toBeCloseTo(748, 0)
    // b este ales ca marginea sa fie atinsa: x se schimba de κ∞ ori mai mult decat b
    expect(panou().textContent).toContain('de 748 ori cea a lui b')
  })

  it('un exercițiu de adaptare pornește de la G, iar soluția lui trece toate cerințele', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector<HTMLSelectElement>('header select')!, 'adaptare:G-tridiagonala')
    const panou = () => gazda.querySelector('.panou.adaptare')!
    expect(panou().textContent).toContain('A este tridiagonală')
    // "aleator" si dimensiunile pastreaza structura exercitiului
    expect(gazda.querySelector<HTMLSelectElement>('.tip-matrice select')!.value).toBe('tridiagonala')
    // pseudocodul de pornire este G nemodificat: rezultat corect, dar atinge zerourile
    expect(gazda.querySelector('.cm-content')?.textContent).toContain('pentru j = k+1 : n')
    const cerinte = () => [...panou().querySelectorAll('.cerinte li')].map((li) => li.className)
    expect(cerinte()).toEqual(['ok', 'rau', 'rau'])
    await apasa(gazda, 'pune soluția în editor și rulează')
    expect(cerinte()).toEqual(['ok', 'ok', 'ok'])
    expect(panou().textContent).toContain('Adaptare reușită')
    expect(window.location.search).toContain('algoritm=adaptare%3AG-tridiagonala')
    // in modul exercitiu se arata si invariantul algoritmului de pornire
    expect(gazda.querySelector('.panou.invariant')).not.toBeNull()
  })

  it('în exercițiul LTRIS, butonul de dimensiune mărește L și vectorul b împreună', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector<HTMLSelectElement>('header select')!, 'adaptare:LTRIS-bidiagonala')
    const plus = gazda.querySelector<HTMLButtonElement>('.forma-intrare button[aria-label="ordinul: cu unu mai mult"]')!
    await act(async () => {
      plus.click()
    })
    const L = gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!.value.split('\n')
    const b = gazda.querySelector<HTMLTextAreaElement>('.intrare.vector textarea')!.value.trim().split(/\s+/)
    expect(L).toHaveLength(6)
    expect(b).toHaveLength(6)
    expect(gazda.querySelector('.oprire')).toBeNull()
  })

  it('panoul de cost în funcție de n desenează flopii numărați lângă formulă, doar când e deschis', async () => {
    const gazda = await monteaza()
    const panou = gazda.querySelector<HTMLDetailsElement>('.panou.cost-n')!
    // inchis, nu ruleaza nimic
    expect(panou.querySelector('.grafic')).toBeNull()
    await act(async () => {
      panou.open = true
      panou.dispatchEvent(new Event('toggle'))
    })
    expect(panou.querySelectorAll('.grafic svg .punct')).toHaveLength(7)
    expect(panou.querySelector('.legenda-cost')?.textContent).toContain('formula: ≈ 2n³/3 flopi')
    const randuri = [...panou.querySelectorAll('tbody tr')].map((r) => [...r.querySelectorAll('td')].map((c) => c.textContent))
    // n = 3: G numara 13 flopi, iar formula da 2·27/3 = 18
    expect(randuri[1].slice(0, 3)).toEqual(['3', '13', '18'])
  })

  it('comparația arată matricele rezultat mici una lângă alta, în locul formei lor', async () => {
    const gazda = await monteaza()
    const panou = gazda.querySelector('.panou.comparatie')!
    expect([...panou.querySelectorAll('.matrice-comparate figcaption')].map((f) => f.textContent)).toEqual(['G', 'GPP'])
    expect(panou.querySelectorAll('.matrice-comparate .katex')).toHaveLength(2)
    expect([...panou.querySelectorAll('tbody tr')].some((r) => r.textContent?.startsWith('rezultat'))).toBe(false)
  })

  it('panoul de comparație rulează aceleași intrări cu GPP și trece la el păstrând intrările', async () => {
    const gazda = await monteaza()
    await apasa(gazda, 'pivot nul, deși A este nesingulară')
    const panou = gazda.querySelector('.panou.comparatie')!
    expect(panou.querySelector('select')?.value).toBe('GPP')
    const randuri = [...panou.querySelectorAll('tbody tr')].map((r) => [...r.querySelectorAll('td')].map((c) => c.textContent))
    expect(randuri[0][1]).toContain('eroare')
    expect(randuri[0][2]).toBe('până la capăt')
    await apasa(gazda, 'Treci la GPP, cu aceleași intrări')
    expect(gazda.querySelector<HTMLSelectElement>('header select')!.value).toBe('GPP')
    expect(gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!.value).toBe('0 1 2\n1 1 1\n2 1 3')
    expect(gazda.querySelector('.oprire')).toBeNull()
  })

  it('precizia din adresă: doar valorile din meniu, iar dubla precizie aleasă la S_G rămâne în adresă', async () => {
    const precizie = (gazda: HTMLElement) => gazda.querySelector<HTMLSelectElement>('.precizie select')!
    window.history.pushState({}, '', '/?algoritm=G&cifre=7')
    try {
      const gazda = await monteaza()
      expect(precizie(gazda).value).toBe('0')
      expect(gazda.querySelector('.stare')?.textContent).not.toContain('7 cifre')
      await scrieIn(gazda.querySelector('header select')!, 'S_G')
      expect(precizie(gazda).value).toBe('3')
      await scrieIn(precizie(gazda), '0')
      expect(new URLSearchParams(window.location.search).get('cifre')).toBe('0')
    } finally {
      window.history.pushState({}, '', '/')
    }
    window.history.pushState({}, '', '/?algoritm=S_G&cifre=0')
    try {
      expect(precizie(await monteaza()).value).toBe('0')
    } finally {
      window.history.pushState({}, '', '/')
    }
  })

  it('?notiune=pivot deschide panoul de noțiuni la acea noțiune', async () => {
    window.history.pushState({}, '', '/?notiune=pivot')
    try {
      const gazda = await monteaza()
      expect(gazda.querySelector<HTMLDetailsElement>('details.panou.notiuni')!.open).toBe(true)
      expect(gazda.querySelector('#notiune-pivot')?.className).toBe('aleasa')
    } finally {
      window.history.pushState({}, '', '/')
    }
  })

  it('scorul exercițiului: un pas se numără o singură dată, iar schimbarea limbii nu îl șterge', async () => {
    const gazda = await monteaza()
    const raspunde = async (valoare: string) => {
      await scrieIn(gazda.querySelector<HTMLInputElement>('.raspuns input')!, valoare)
      await apasa(gazda, 'Verifică')
    }
    await comanda(gazda, 'urmatoareaScriere')
    await raspunde('2')
    expect(gazda.querySelector('.verdict')?.textContent).toBe('Corect. Corecte: 1 din 1.')
    // un pas înapoi ascunde din nou rezultatul aceluiași pas; al doilea răspuns nu se mai numără
    await comanda(gazda, 'pasInapoi')
    expect(gazda.querySelector('.raspuns input')).not.toBeNull()
    await raspunde('2')
    expect(gazda.querySelector('.verdict')?.textContent).toBe('Corect. Corecte: 1 din 1.')
    await apasa(gazda, 'EN')
    expect(gazda.querySelector('.verdict')?.textContent).toBe('Correct. Correct: 1 of 1.')
  })

  it('pseudocodul propriu: șablonul urmează limba, iar precizia pornește dublă și după S_G', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'S_G')
    await scrieIn(gazda.querySelector('header select')!, 'propriu')
    expect(gazda.querySelector<HTMLSelectElement>('.precizie select')!.value).toBe('0')
    expect(gazda.querySelector('.cm-content')?.textContent).toContain('Scrie aici pseudocodul')
    await apasa(gazda, 'EN')
    expect(gazda.querySelector('.cm-content')?.textContent).toContain('Write your pseudocode here')
  })

  it('pasul din adresă se folosește o dată, chiar dacă prima rulare nu reușește', async () => {
    localStorage.setItem('mn.propriu', JSON.stringify({ sursa: 'pentru i = 1 : n\nx ← 1', definitii: [] }))
    window.history.pushState({}, '', '/?algoritm=propriu&pas=6')
    try {
      const gazda = await monteaza()
      expect(gazda.querySelector('.eroare')).not.toBeNull()
      await scrieIn(gazda.querySelector('header select')!, 'G')
      expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 1 din')
    } finally {
      window.history.pushState({}, '', '/')
    }
  })

  it('în exercițiul de adaptare, mesajul unei erori de rulare urmează limba', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector<HTMLSelectElement>('header select')!, 'adaptare:G-tridiagonala')
    const editor = EditorView.findFromDOM(gazda.querySelector<HTMLElement>('.cm-editor')!)!
    await act(async () => {
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: 'x ← 1 / 0' } })
    })
    await apasa(gazda, 'Rulează')
    const panou = () => gazda.querySelector('.panou.adaptare')!.textContent
    expect(panou()).toContain('împărțire la zero')
    await apasa(gazda, 'EN')
    expect(panou()).toContain('division by zero')
  })

  it('comparația MP cu MPI suprapune curbele e_k ale celor două rulări, pe iterații sau pe flopi, cu tabel', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'MP')
    const panou = gazda.querySelector('.panou.comparatie')!
    expect(panou.querySelector('select')?.value).toBe('MPI')
    const curbe = panou.querySelector('.curbe')!
    expect(curbe).not.toBeNull()
    expect(curbe.querySelectorAll('svg polyline.serie')).toHaveLength(2)
    // 24 de evaluari la MP, 6 la MPI, ca in tabelul 4.1 din carte
    expect(curbe.querySelectorAll('.grafic circle.punct')).toHaveLength(24)
    expect(curbe.querySelectorAll('.grafic rect.punct.a-doua')).toHaveLength(6)
    expect([...curbe.querySelectorAll('.grafic text.eticheta')].map((e) => e.textContent)).toEqual(['MP', 'MPI'])
    expect(curbe.querySelector('.grafic svg')?.getAttribute('aria-label')).toBe('curbele de convergență: MP cu 23 de iterații, MPI cu 5 iterații')
    expect(curbe.querySelectorAll('tbody tr')).toHaveLength(24)
    const randuri = [...curbe.querySelectorAll('tbody tr')].map((r) => [...r.querySelectorAll('td')].map((c) => c.textContent))
    expect(randuri[0][0]).toBe('0')
    expect(randuri[23][3]).toBe('–')
    expect(curbe.textContent).toContain('pragul, 1e-15')
    // pe axa flopilor, eticheta axei se schimba
    const texte = () => [...curbe.querySelectorAll('.grafic text.gradatie')].map((e) => e.textContent)
    expect(texte()).toContain('iterația')
    await scrieIn(curbe.querySelector('select')!, 'flopi')
    expect(texte()).toContain('flopi')
    expect(texte()).not.toContain('iterația')
    // G nu are iteratii: fara curbe
    await scrieIn(gazda.querySelector('header select')!, 'G')
    expect(gazda.querySelector('.panou.comparatie .curbe')).toBeNull()
  })

  it('costul în funcție de n pune a doua serie pentru perechile din curs: Cholesky lângă G, cu raportul în tabel', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'CHOL')
    const panou = gazda.querySelector<HTMLDetailsElement>('.panou.cost-n')!
    await act(async () => {
      panou.open = true
      panou.dispatchEvent(new Event('toggle'))
    })
    expect(panou.querySelectorAll('.grafic svg circle.punct')).toHaveLength(7)
    expect(panou.querySelectorAll('.grafic svg rect.punct.a-doua')).toHaveLength(7)
    expect(panou.querySelector('.legenda-cost')?.textContent).toContain('flopi numărați de G, pe aceleași intrări')
    expect([...panou.querySelectorAll('.grafic text.eticheta')].map((e) => e.textContent)).toEqual(['G', 'CHOL', 'formula'])
    expect([...panou.querySelectorAll('thead th')].map((e) => e.textContent)).toEqual(['n', 'CHOL', 'formula', 'numărați / formulă', 'G', 'CHOL / G'])
    const randuri = [...panou.querySelectorAll('tbody tr')].map((r) => [...r.querySelectorAll('td')].map((c) => c.textContent))
    // n = 8: G numara 308 flopi, raportul ≈ 0.5
    expect(randuri[6][4]).toBe('308')
    expect(Number(randuri[6][5])).toBeGreaterThan(0.4)
    expect(Number(randuri[6][5])).toBeLessThan(0.7)
    expect(panou.textContent).toContain('de două ori mai puține decât eliminarea gaussiană')
    // G nu are pereche: graficul ramane cu o serie si patru coloane
    await scrieIn(gazda.querySelector('header select')!, 'G')
    expect(gazda.querySelectorAll('.panou.cost-n .grafic svg rect.punct.a-doua')).toHaveLength(0)
    expect(gazda.querySelectorAll('.panou.cost-n thead th')).toHaveLength(4)
  })

  it('sistemul Ax = b stă în scenă ca ecuație: grilele L · x = b, linia i încadrată și ecuația i scrisă în card', async () => {
    const gazda = await monteaza()
    expect(gazda.querySelector('.ecuatie')).toBeNull()
    await scrieIn(gazda.querySelector('header select')!, 'LTRIS')
    const ecuatie = gazda.querySelector('.ecuatie')!
    expect([...ecuatie.querySelectorAll('.grila figcaption')].map((f) => f.firstChild?.textContent?.trim())).toEqual(['L', 'x', 'b'])
    expect([...ecuatie.querySelectorAll('.op')].map((o) => o.textContent)).toEqual(['·', '='])
    // x ← b nu lucreaza pe o ecuatie anume
    expect(gazda.querySelector('.rand.ec')).toBeNull()
    expect(gazda.querySelector('.ecuatie-card')).toBeNull()
    await faraIntrebari(gazda)
    await comanda(gazda, 'pasInainte')
    // antetul "pentru i = 1 : n": ecuatia 1 in cele trei grile si in card
    expect(gazda.querySelectorAll('.ecuatie .rand.ec')).toHaveLength(3)
    expect(gazda.querySelector('.grila .indice.ec')?.textContent).toBe('1')
    expect(gazda.querySelector('.ecuatie-card .nr')?.textContent).toBe('ec. 1')
    expect(gazda.querySelector('.ecuatie-card annotation')?.textContent).toBe('2\\,x_{1} = 2')
    await comanda(gazda, 'laSfarsit')
    // pasul final nu are linie de cod, deci nici ecuatie marcata; cu un pas inapoi, x_3 ← x_3 / l_33 cu ecuatia 3 satisfacuta de x
    expect(gazda.querySelector('.ecuatie-card')).toBeNull()
    expect(gazda.querySelector('.rand.ec')).toBeNull()
    await comanda(gazda, 'pasInapoi')
    expect(gazda.querySelector('.ecuatie-card .nr')?.textContent).toBe('ec. 3')
    expect(gazda.querySelector('.ecuatie-card .cu-valori.satisfacuta')).not.toBeNull()
    expect(gazda.querySelector('.ecuatie-card .cu-valori')?.textContent).toContain('cu x curent:')
    // MPI: titlul (μI − A) z = y peste grilele B, z, y, de cand exista B (fie B[n,n], linia 2)
    await scrieIn(gazda.querySelector('header select')!, 'MPI')
    expect(gazda.querySelector('.ecuatie')).toBeNull()
    await comanda(gazda, 'laSfarsit')
    expect(gazda.querySelector('.ecuatie .titlu-ecuatie annotation')?.textContent).toBe('(\\mu I - A)\\, z = y')
    expect([...gazda.querySelectorAll('.ecuatie .grila figcaption')].map((f) => f.firstChild?.textContent?.trim())).toEqual(['B', 'z', 'y'])
    // S_G: x nu exista pana la x ← b, deci locul lui este gol; la sfarsit grila e acolo
    await scrieIn(gazda.querySelector('header select')!, 'S_G')
    expect(gazda.querySelector('.ecuatie .grila.fantoma')).not.toBeNull()
    expect(gazda.querySelectorAll('.ecuatie .grila')).toHaveLength(3)
    await comanda(gazda, 'laSfarsit')
    expect(gazda.querySelector('.ecuatie .grila.fantoma')).toBeNull()
    expect(gazda.querySelectorAll('.ecuatie .grila')).toHaveLength(3)
  })

  it('SQR: titlul fazei deasupra grilelor și vederea geometrică pentru două necunoscute', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'SQR')
    expect(gazda.querySelector('.faza .nr')?.textContent).toBe('faza 1 din 3')
    expect(gazda.querySelector('.faza annotation')?.textContent).toBe('Q^T A = R')
    // trei ecuatii ca drepte, solutia CMMP, fara x pana nu e calculat
    expect(gazda.querySelectorAll('.geometrie svg .dreapta')).toHaveLength(3)
    expect(gazda.querySelector('.geometrie svg .solutie')).not.toBeNull()
    expect(gazda.querySelector('.geometrie svg .punct.curent')).toBeNull()
    expect(gazda.querySelector('.geometrie')?.textContent).toContain('soluția CMMP x*, (0.667, 0)')
    await comanda(gazda, 'laSfarsit')
    // pasul final nu are linie, deci nici faza; x calculat ramane in desen
    expect(gazda.querySelector('.faza')).toBeNull()
    expect(gazda.querySelectorAll('.geometrie svg .punct.curent')).toHaveLength(1)
    expect(gazda.querySelector('.geometrie svg')?.getAttribute('aria-label')).toContain('x calculat de algoritm: (0.667,')
    await comanda(gazda, 'pasInapoi')
    expect(gazda.querySelector('.faza .nr')?.textContent).toBe('faza 3 din 3')
    expect(gazda.querySelector('.faza annotation')?.textContent).toBe("R' x = d'")
    // QR singur nu are faze
    await scrieIn(gazda.querySelector('header select')!, 'QR')
    expect(gazda.querySelector('.faza')).toBeNull()
  })

  it('pseudocodul propriu apelează un algoritm din bibliotecă ca un pas, iar cardul îl deschide cu aceste intrări', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'propriu')
    await faraIntrebari(gazda)
    await comanda(gazda, 'laSfarsit')
    // sablonul se incheie cu y ← S_GPP(A, b): pasul dinaintea celui final este apelul
    await comanda(gazda, 'pasInapoi')
    expect(gazda.querySelector('.stare')?.textContent).toContain('linia 8')
    expect(gazda.querySelector('.apel-card')?.textContent).toContain('apel S_GPP:')
    expect(gazda.querySelector('.pas .formula annotation')?.textContent).toBe('y \\leftarrow \\mathrm{S\\_GPP}(A, b)')
    expect(celule(gazda, '.rol-scris')).toHaveLength(3)
    expect(celule(gazda, '.rol-citit')).toHaveLength(12)
    await apasa(gazda, 'deschide S_GPP cu aceste intrări')
    expect(gazda.querySelector<HTMLSelectElement>('header select')!.value).toBe('S_GPP')
    expect([...gazda.querySelectorAll<HTMLInputElement>('.intrare .nume')].map((x) => x.value)).toEqual(['A', 'b'])
    expect(gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!.value).toBe('4 1 0\n1 3 1\n0 1 2')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 1 din')
  })

  it('grilele din formulă primesc lățimea coloanelor după valorile lor, ca textul să nu fie tăiat', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'QR')
    await comanda(gazda, 'laSfarsit')
    const vedere = (nume: string) => [...gazda.querySelectorAll<HTMLElement>('.vederi-grile .grila .celule')].find((g) => g.getAttribute('aria-label')?.startsWith(`${nume},`))!
    // Q are elemente ca -0.6667, de 7 caractere: fiecare coloana a ei cere macar atat
    const Q = vedere('Q')
    expect([...Q.querySelectorAll('.celula')].some((c) => c.textContent?.length === 7)).toBe(true)
    expect(Q.style.gridTemplateColumns).toBe('var(--indice) max(var(--cel-min), 7ch + 1.1rem) max(var(--cel-min), 7ch + 1.1rem) max(var(--cel-min), 7ch + 1.1rem)')
    // R are -3 si -1 pe prima linie si -3.162 pe a doua: coloanele au latimi diferite
    expect(vedere('R').style.gridTemplateColumns).toBe('var(--indice) max(var(--cel-min), 2ch + 1.1rem) max(var(--cel-min), 6ch + 1.1rem)')
  })
})
