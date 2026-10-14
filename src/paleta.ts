import type { Rol } from './motor/interpretor'
import type { Tema } from './preferinte'

export type RolGrila = Rol | 'gata' | 'mult' | 'neatins'

// Fondurile celulelor, pe roluri: rosu, portocaliu, albastru, verde si mov, cu luminozitatea
// aleasa ca rolurile sa ramana distincte si sub protanopie si
// deuteranopie simulate; tests/culori.test.ts masoara separarea si contrastul. Textul celulei
// are mereu culoarea textului temei, iar conturul (grosime si stil, in index.css) spune rolul
// si fara culoare.
export const PALETA: Record<Tema, Record<RolGrila, string>> = {
  luminos: { pivot: '#e4b6ad', scris: '#fcaa46', citit: '#9cbeff', gata: '#baf5b4', mult: '#ecd9ff', neatins: '#ffffff' },
  intunecat: { pivot: '#724d4e', scris: '#8a5601', citit: '#3d648d', gata: '#1d4519', mult: '#4d3b65', neatins: '#262b33' },
}
