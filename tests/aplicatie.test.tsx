// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../src/App'

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

async function apasa(gazda: HTMLElement, text: string) {
  const b = [...gazda.querySelectorAll<HTMLButtonElement>('button')].find((x) => x.textContent === text)
  if (!b) throw new Error(`nu există butonul „${text}”`)
  await act(async () => {
    b.click()
  })
}

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('aplicația montată', () => {
  it('pornește cu eliminarea gaussiană: grila 3x3, formula primului pas, linia curentă în editor', async () => {
    const gazda = await monteaza()
    expect(gazda.querySelectorAll('.celula')).toHaveLength(9)
    expect(gazda.querySelector('.grila figcaption')?.textContent).toContain('A')
    expect(gazda.querySelector('.katex')).not.toBeNull()
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 1 din')
    expect(gazda.querySelector('.cm-editor')).not.toBeNull()
    expect(gazda.querySelector('.cm-linie-curenta')).not.toBeNull()
  })

  it('pasul înainte ajunge la prima scriere, cu formula colorată', async () => {
    const gazda = await monteaza()
    await apasa(gazda, '>')
    await apasa(gazda, '>')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 3 din 22')
    expect(gazda.querySelector('.stare')?.textContent).toContain('linia 4')
    expect(gazda.querySelector('.katex .rol-pivot')?.textContent).toContain('a')
    expect(gazda.querySelector('.cm-linie-curenta')?.textContent).toContain('a_ik ← μ_ik')
  })

  it('schimbarea algoritmului încarcă alt pseudocod și alte intrări', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'TORT')
    expect(gazda.querySelectorAll('.grila')).toHaveLength(1)
    expect(gazda.querySelectorAll('.celula')).toHaveLength(6)
    expect(gazda.querySelector('.descriere')?.textContent).toContain('Householder')
  })

  it('pseudocod propriu: șablonul rulează, iar o intrare adăugată apare în grile', async () => {
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'propriu')
    expect(gazda.querySelector('.descriere')?.textContent).toContain('pseudocodul')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 1 din')
    expect(gazda.querySelector('.cm-editor')?.textContent).toContain('s ← s + a_ii')

    await apasa(gazda, '+ vector')
    const nume = [...gazda.querySelectorAll<HTMLInputElement>('.intrare .nume')]
    expect(nume.map((x) => x.value)).toEqual(['A', 'x'])
    const valori = gazda.querySelector<HTMLTextAreaElement>('.intrare.vector textarea')!
    await scrieIn(valori, '5 6 7')
    await apasa(gazda, 'Rulează')
    expect(gazda.querySelectorAll('.grila figcaption').length).toBe(2)
    expect(gazda.querySelectorAll('.celula')).toHaveLength(12)
    expect(JSON.parse(localStorage.getItem('mn.propriu')!).definitii).toHaveLength(2)
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
    expect(gazda.querySelector('.verificare')?.textContent).toContain('apare la ultimul pas')
    for (let k = 0; k < 3; k++) await apasa(gazda, '>')
    expect(gazda.querySelectorAll('.celula.rol-mult')).toHaveLength(1)
    for (let k = 0; k < 8; k++) await apasa(gazda, '>')
    expect(gazda.querySelectorAll('.celula.rol-gata').length).toBeGreaterThan(0)
    await apasa(gazda, '>|')
    const randuri = [...gazda.querySelectorAll('.verificare tbody tr')]
    expect(randuri.length).toBeGreaterThan(0)
    expect(randuri.every((r) => r.classList.contains('ok'))).toBe(true)
    expect(gazda.querySelector('.mesaj.gata')?.textContent).toBe('algoritmul s-a terminat')
  })

  it('panoul de cod Python arată traducerea programului curent', async () => {
    const gazda = await monteaza()
    const panou = gazda.querySelector<HTMLDetailsElement>('details.python')!
    expect(panou.querySelector('pre')).toBeNull()
    await act(async () => {
      panou.open = true
      panou.dispatchEvent(new Event('toggle'))
    })
    expect(panou.querySelector('pre')?.textContent).toContain('def G(A):')
    expect(panou.querySelector('pre')?.textContent).toContain('A[i, k] = A[i, k] / A[k, k]')
  })

  it('butonul „aleator” schimbă valorile și păstrează dimensiunile', async () => {
    const gazda = await monteaza()
    await apasa(gazda, 'aleator')
    const text = gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!.value
    const linii = text.split('\n')
    expect(linii).toHaveLength(3)
    expect(linii.every((l) => l.split(' ').length === 3)).toBe(true)
  })

  it('„>>” sare la următoarea scriere, iar linia curentă are valorile indicilor', async () => {
    const gazda = await monteaza()
    await apasa(gazda, '>>')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 3 din 22')
    expect(gazda.querySelector('.cm-anotare')?.textContent).toBe('i = 2, k = 1')
    await apasa(gazda, '>>')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 5 din 22')
    await apasa(gazda, '<<')
    expect(gazda.querySelector('.stare')?.textContent).toContain('pasul 3 din 22')
    await apasa(gazda, '>|')
    expect(gazda.querySelectorAll('.celula.rol-mult')).toHaveLength(3)
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
    const gazda = await monteaza()
    await scrieIn(gazda.querySelector('header select')!, 'propriu')
    const mare = Array.from({ length: 13 }, (_, i) => Array.from({ length: 13 }, (_, j) => (i === j ? 9 : 1)).join(' ')).join('\n')
    await scrieIn(gazda.querySelector<HTMLTextAreaElement>('.intrare.matrice textarea')!, mare)
    await apasa(gazda, 'Rulează')
    expect(gazda.querySelectorAll('.celula.static')).toHaveLength(169)
    expect(gazda.querySelector('.dreapta .ajutor')?.textContent).toContain('animațiile sunt oprite')
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
    expect(localStorage.getItem('mn.limba')).toBe('en')

    await apasa(gazda, 'Dark')
    expect(document.documentElement.dataset.tema).toBe('intunecat')
    expect(localStorage.getItem('mn.tema')).toBe('intunecat')
    await apasa(gazda, 'Light')
    expect(document.documentElement.dataset.tema).toBe('luminos')
  })
})
