# Cercetare: vizualizator de algoritmi pentru Metode numerice

Scris pe 12 octombrie 2026. Sursele pentru cerințe, algoritmi și notație sunt materialele din
`D:\GitHub\CV\docs\UPB\Anul 2\Sem I\Metode numerice`: `Cursuri/Cursuri.pdf` (499 de slide-uri,
cursurile I-VI), `Laboratoare/Laborator 1` (notebook) și `Laborator 2.pdf`, și anexa
`Anexe/algoritmi-algebra-liniara.tex`. Faptele despre biblioteci vin din paginile oficiale citate
în secțiunea 14 și au fost verificate pe 12 octombrie 2026. Secțiunile 8-11 sunt din 13 octombrie
2026 și folosesc în plus laboratoarele și subiectele din anii trecuți, din
`D:\GitHub\CV\docs\UPB\Anul 2\Anii trecuți\Semestrul_1\MN_Metode_numerice`. Secțiunea 12, tot din
13 octombrie 2026, verifică biblioteca și noțiunile doar față de materialele din anul curent și
înlocuiește ce venea din anii trecuți. Din 14 octombrie 2026 (secțiunea 13) teoria din aplicație
vine numai din folderul `Cursuri`: slide-urile și cartea cursului, fără anexă și fără laboratoare
sau articole din afara lui. Laboratoarele rămân doar modelul de stil pentru codul Python.

## 1. Ce cere cursul

Slide-ul de examinare din cursul I spune că la colocviu (săptămânile 13-14, 10 puncte din cele 50
ale semestrului) 1-2 studenți fac o temă la alegere, descrisă ca "aplicație și programe Python".
Temele exemplu sunt "program Matlab/Python cu interfață friendly" pentru: eliminare gaussiană,
factorizare LU, factorizare Cholesky, factorizare QR, CMMP, o aplicație CMMP, forma Schur, metoda
puterii (inverse), o aplicație cu valori proprii (stabilitate, PCA, recunoaștere de fețe), DVS
pentru matrice de rang 1 și o aplicație DVS (compresie de imagini).

Cursul IV o repetă pe slide-ul "Teme colocviu - cerința" (pagina 256 a PDF-ului), iar cursul VI
pe slide-ul "Tema - colocviu" (pagina 468), cu șase puncte de evaluare:

1. descrierea în detaliu a aplicației alese;
2. formularea matematică și legătura cu o problemă din curs (sistem liniar, valori și vectori
   proprii, DVS);
3. adaptarea a 1-2 algoritmi dați la curs pentru rezolvarea ei;
4. codul Python/Matlab pentru algoritmii implementați;
5. compararea rezultatelor cu funcția standard din Python/Matlab (eig, svd, A\b);
6. comentarea rezultatelor: grafice, tabele, număr de iterații, număr de operații, timp de calcul.

Vizualizatorul acoperă direct primele patru teme exemplu și punctul 3: algoritmii se rulează în
notația cursului, pe matrice alese de student. Punctele 4-6 nu ies din animații. Proiectul are
nevoie și de implementările Python ale algoritmilor, de un panou care compară rezultatul cu NumPy
(`numpy.linalg.solve`, `cholesky`, `qr`, `eig`) și de un contor de flopi pus lângă formula de cost
din curs. Cuvintele "programe Python" sunt singurul loc unde o aplicație web intră în conflict cu
textul slide-ului; secțiunea 4 spune cum se acoperă și ce rămâne de întrebat.

## 2. Algoritmii și notația din materiale

Cursul are șase părți: introducere, algoritmi elementari, sisteme liniare, CMMP, valori și
vectori proprii, DVS. Pseudocod apare în slide-uri pentru normele vectoriale, produsul C = AB,
LTRIS, UTRIS, LINV și TRV (cursul II); G, GPP, GPC, Crout, S_GPP, S_GPC, INV_GPP, DET_GPP, G
pentru sisteme simetrice și CHOL (cursul III); RFG și RF (reflectori), ROTG și ROT (rotații), QR
Householder, GQR și SQR (cursul IV); MP, MPI, HQr, pasul QR cu deplasare explicită, VD2, IT_QR2,
TRID2 și QR2 (cursul V); DVS prin bidiagonalizare (cursul VI). Pentru Jacobi, Gauss-Seidel și
Kaczmarz (cursul III) slide-urile dau doar formula iterației, iar produsul matrice-vector nu are
pseudocod în slide-uri. Lista de examen, pe care anexa o preia de pe ultimul slide al cursului 1
din 2026: matvec, UTRIS, LTRIS, G, LU, Cholesky, TORT, MP; PDF-ul din 2022 nu are acest slide.

Notația are două stiluri în același curs. Cursul II scrie fără numerotare, cu indentare, `pentru`
și `=` ca atribuire:

```
x = b
pentru i = 1 : n
    pentru j = 1 : i - 1
        x_i = x_i - L_ij x_j
    x_i = x_i / L_ii
```

Cursurile III-V scriu pași numerotați pe niveluri ("1. Pentru k = 1 : n - 1", "1. Pentru i = k + 1
: n", "1. a_ik ← μ_ik = a_ik / a_kk"), cu săgeata `←`, cu forma `a_ik ← μ_ik = expresie` care
numește valoarea nouă, cu `Daca ... atunci ... altfel`, `Cat timp`, `Tipareste '...'`, `STOP`,
comentarii după `%`, sume cu Σ, radical, modul, normă, `sgn`, `min`, blocuri `A(k : m, k)` și
apeluri de alți algoritmi (`x = UTRIS(U, b)`, `[M, U, p] = GPP(A)`). Un pas din GPP este text liber
("Se determină cel mai mic i_k ∈ k : n a.î. |a_{i_k k}| = max |a_ik|"), deci limbajul are nevoie
de o funcție predefinită pentru el, de exemplu `argmax`.

Laboratorul 2 folosește varianta din cartea Dumitrescu, Popeea, Jora (pași numerotați, variabila
auxiliară `s`), iar laboratoarele rulează Python cu NumPy în Jupyter. Anexa lui Andrei rescrie cei
opt algoritmi de examen în notația cursului, cu linii numerotate și linii de ghidaj pentru bucle,
și fixează culorile celulelor: roșu pentru pivot, portocaliu pentru ce se scrie acum, galben pentru
al doilea scris din același pas, albastru pentru ce se citește, verde pentru ce e gata, mov pentru
multiplicatori și vectori Householder, gri pentru zero. Scripturile `verifica*.py` din
`CV/docs/facultate/build/scratch/mn-anexe` traduc pseudocodul literal în Python cu indici de la 1
și îl compară cu NumPy; ele sunt oracolul pentru testele interpretorului.

Consecință pentru parser: limbajul acceptat este reuniunea celor două stiluri. Numerotarea pașilor
e opțională, `=` și `←` sunt ambele atribuire, `pentru` și `Pentru` sunt același cuvânt, iar
blocurile sunt date de indentare, ca în slide-uri.

## 3. Natura proiectului

Unealta este un interpretor pentru pseudocodul cursului care înregistrează o urmă de execuție
(ce linie rulează, ce celulă se citește, ce celulă se scrie și cu ce formulă), plus o vedere care
redă urma pas cu pas. Nu este o bibliotecă de algebră liniară și nu este un film: studentul ține
ritmul.

### Ce există deja

| Unealtă | Tehnologie | Linia de cod | Animație pe celulă | Pas înapoi | Ce lipsește pentru noi |
|---|---|---|---|---|---|
| VisuAlgo (visualgo.net) | JS, D3 pe SVG, sursă închisă | da, panou "codetrace" | nu are modul de matrice | da, cu viteză și salt la orice pas | matrice |
| algorithm-visualizer.org | React, tracers.js în Web Worker | da, prin `Tracer.delay(linie)` | da, `Array2DTracer.select/patch` | da, reia comenzile de la pasul 0 | utilizatorul scrie JavaScript și adaugă apelurile de trasare de mână; fără formule |
| Python Tutor | Python sub `bdb`, instantaneu după fiecare linie, D3 | da, săgeată pentru linia curentă și cea trecută | nu, starea se redesenează, fără citit/scris | da, urma e în browser | semantica de celulă |
| JSAV (OpenDSA) | bibliotecă JS, MIT | da, `setCurrentLine` | da, `jsav.ds.matrix` cu `highlight`, `swap` | da, slideshow din `jsav.step()` | e bibliotecă de autor, nu rulează codul utilizatorului |
| Visu (GTK4, Python) | limbaj propriu de pseudocod, instantaneu pe instrucțiune | da | doar structuri 1D | da, cu cursor pe timp | matrice; rulează doar pe GNOME |
| Heath, Interactive Educational Modules (UIUC) | applet-uri Java | nu | parțial: săgeată pe coloana curentă, afișează v, α, β | neverificat | are G, Gauss-Jordan, Cholesky, Householder, metoda puterii, dar doar un buton NEXT |
| basic-mathematics.com, înmulțire de matrice | pagină web | nu | da, linie roșie, coloană verde, rezultat auriu | nu | un singur algoritm |
| LUTool (MathWorks, 2025) | MATLAB, GIF-uri | nu | da, L albastru, U lavandă, cu pivotare | nu | nu e interactiv |
| Mornar, Granić, Mladenović 2014 | prototip de cercetare | da | neverificat | neverificat | interpretează pseudocod nemodificat și detectează singur evenimentele; fără implementare publică |
| NumericalMethodsVisualizerPython (GitHub) | PyQt6 și matplotlib | nu | matricea după fiecare pas | nedocumentat | cel mai apropiat ca temă, fără pseudocod |

Niciuna dintre uneltele cu matrice nu pune laolaltă animația pe celulă, linia de pseudocod
curentă și formula cu valorile substituite. Acesta este locul proiectului.

Legătura dintre cod și animație se face în practică în trei feluri: apeluri explicite de trasare
puse de utilizator în cod (algorithm-visualizer, JSAV), un cârlig de depanator care fotografiază
starea după fiecare linie (Python Tutor), sau un interpretor pentru un limbaj propriu care emite
evenimente din accesorii (Visu, Mornar 2014). Doar al treilea dă semantica de celulă (citit, scris,
pivot, schimb de linii) fără ca studentul să adnoteze codul, și este cel ales în secțiunea 5.

### Ce spune literatura despre animațiile care ajută

- Hundhausen, Douglas și Stasko (2002), 24 de experimente: felul în care studenții folosesc
  vizualizarea contează mai mult decât ce văd; peste 40% dintre ele nu au găsit un efect
  semnificativ.
- Naps și colaboratorii (2002) definesc taxonomia implicării: vizionare, răspuns, schimbare a
  datelor, construire, prezentare. Vizionarea singură diferă puțin de lipsa vizualizării.
  Pseudocodul introdus manual și matricea aleasă de student pun unealta la nivelurile "schimbare"
  și "construire"; o întrebare de tipul "care va fi pivotul?" ar adăuga nivelul "răspuns".
- Saraiya, Shaffer, McCrickard și North (2004): trăsătura cu cel mai mare efect este controlul
  ritmului de către student; grafica minimă, concentrată pe pașii logici, a mers cel mai bine.
- Tversky, Morrison și Bétrancourt (2002): animațiile sunt adesea prea complexe sau prea rapide ca
  să fie percepute; evenimentele continue sunt înțelese ca secvențe de pași discreți; oprirea,
  repornirea și reluarea permit reinspectarea.
- Heer și Robertson (2007), pentru tranziții: corespondențe semantice consecvente, tranziții
  simple, etapizare pentru cele complexe, durată "cât e nevoie, nu mai mult" (în experimentele
  lor, 1,25 secunde).

Regulile care rezultă pentru unealtă:

1. Un singur eveniment semantic pe pas, cum fac toate uneltele funcționale (algorithm-visualizer
   închide pasul la fiecare `delay()`, Python Tutor și Visu fac un instantaneu pe instrucțiune).
2. Studentul controlează ritmul: pas, pas înapoi, cursor pe urmă, viteză. Redarea automată e
   secundară.
3. Culorile au același sens peste tot, cele din anexă, și apar identic în grilă, în formulă și în
   legendă.
4. Formula pasului, cu valorile substituite, stă lângă grilă și lângă linia de cod, nu într-un
   panou separat.
5. Tranzițiile sunt scurte (sub o secundă la viteza normală) și fără mișcare decorativă; o
   actualizare de coloană se etapizează celulă cu celulă la viteză mică și se grupează la viteză
   mare.

## 4. Platforma: web, executabil sau Python

Mașina de dezvoltare: Windows 11 pe ARM64, Node 24, Python 3.14 cu NumPy, .NET SDK 9, MATLAB
R2025b, fără Rust. Demonstrația se face pe un laptop Windows, probabil fără internet.

| Opțiune | Animație și control | Linia de cod curentă | Formule | Livrare offline | Executabil pe Windows ARM64 | Efort pentru Andrei |
|---|---|---|---|---|---|---|
| Web TypeScript: Vite 8, React 19, Motion 14, CodeMirror 6, KaTeX 0.19 | tranziții pe celulă, schimb de linii prin `layout`, derulare înainte și înapoi trivială dacă UI-ul e o funcție de indicele pasului | `Decoration.line` în CodeMirror | KaTeX, cu valorile substituite în șir | da, un singur `index.html` prin vite-plugin-singlefile 2.3.3, se deschide din `file://` | nu e nevoie; opțional Electron 44 (arm64) sau o gazdă .NET cu WebView2 | TypeScript mediu, React e drumul cel mai documentat |
| Svelte 5 în locul lui React | `animate:flip` pe blocuri `each` cu cheie dă schimbul de linii gratuit | la fel | la fel | la fel | la fel | API mai mic, mai puține exemple |
| Pyodide 314 (Python și NumPy în browser) | animația tot în JS; Python produce doar urma | `sys.monitoring` dă evenimente pe linie | KaTeX | slab: wasm 9,6 MB, stdlib 2,5 MB, NumPy 3 MB de împachetat; încărcarea din `file://` neverificată | doar browser | Python e confortabil, dar UI-ul se scrie tot în TypeScript |
| Streamlit, Dash, Panel | fiecare pas e o rerulare pe server; fără tranziții pe celulă | parțial, manual | MathJax | nu, cere un proces server | nativ | cel mai ușor de pornit, unealta greșită |
| PySide6 6.12 (QGraphicsScene, QPropertyAnimation) | fin, control total; schimbul de linii e un `setPos` animat | `setExtraSelections` pe QPlainTextEdit | fără LaTeX; matplotlib mathtext în pixmap sau QWebEngineView cu KaTeX | PyInstaller 6.22, zeci de MB, nu un fișier unic | roată `win_arm64` pentru PySide6 și PyInstaller; build-ul nu se face cruciș pentru x64 | Python, dar modelul Qt e mare |
| .NET Avalonia 12 / WPF | storyboard-uri, control fin | AvaloniaEdit | nicio bibliotecă LaTeX verificată pentru Avalonia 12 | un `.exe` self-contained de zeci de MB | `dotnet publish -r win-arm64` | limbaj și framework noi |
| Manim 0.22, Godot 4.7, pygame-ce, matplotlib FuncAnimation | Manim randează video, nu e interactiv; celelalte cer scris de mână fiecare tranziție și editorul | manual sau deloc | Manim da (cere TeX), restul nu | video sau exe de zeci de MB | diverse | mult de construit de la zero |

Decizia: aplicație web în TypeScript, cu Vite 8, React 19, Motion 14, CodeMirror 6 și KaTeX, livrată
ca un singur fișier HTML. Motivele, în ordinea greutății:

1. Riscul la demonstrație e cel mai mic. Un fișier HTML deschis în Edge pe orice laptop Windows
   este tot livrabilul: nimic de instalat, nicio versiune de interpretor, nicio roată ARM64.
2. Formulele cu valorile substituite au o soluție gata doar pe web. KaTeX randează
   `a_{32} - 0.5 \cdot a_{12} = 1.5` sub o milisecundă; fiecare opțiune desktop ori nu are motor
   LaTeX, ori are un port vechi.
3. Scara nu cere Canvas. O matrice 8x8 cu text e câteva sute de noduri DOM. Grila se randează ca
   HTML (grid CSS, un `motion.div` pe celulă cu cheie după linia logică), ca proprietatea `layout`
   să animeze schimbul de linii când cheile își schimbă poziția. Documentația Motion spune că
   elementele SVG nu au animații de layout, deci SVG rămâne pentru săgeți și acolade desenate
   în jurul grilei.
4. Orice drum prin Python se termină tot cu UI scris în TypeScript (Pyodide, componente Streamlit)
   sau fără LaTeX (Qt, pygame). Drumul TypeScript e un singur limbaj și un singur build.

Cum se acoperă "programe Python" din cerință. Algoritmii există și în Python, în scripturile
`verifica*.py`, cu indici de la 1, rând cu rând după pseudocod. Ele devin pachetul Python al
proiectului: produc fixture-urile pe care le verifică interpretorul TypeScript și tabelele de
comparație cu NumPy cerute la punctele 5 și 6. A doua cale, dacă laborantul vrea cod Python pentru
orice pseudocod introdus, este un emițător Python din același arbore sintactic: odată ce
parserul există, traducerea `pentru i = 1 : n` în `for i in range(1, n + 1)` e mecanică.
Pyodide rămâne rezerva pentru cazul în care se cere explicit ca Python să ruleze în unealtă.

Aplicația rulează local pe `localhost:5173`, nativ cu `npm run dev` sau în Docker cu
`docker compose up` (același server Vite, sursele montate prin volum), cum descrie `README.md`.
Nu există server de producție: fișierul HTML unic din `npm run build` rămâne livrabilul pentru
examen și nu are nevoie de Docker.

Dacă examinatorul insistă pe un executabil: Tauri 2 cere Rust și unelte MSVC, iar Pake e Tauri pe
dedesubt (cere Rust 1.85 sau mai nou). Fără Rust rămân Electron 44 (arhiva arm64 are 156 MB) sau o
aplicație .NET WinForms de 30 de rânduri care găzduiește controlul WebView2 (runtime-ul vine cu
Windows 11, inclusiv pe ARM64). Neutralinojs publică binar doar pentru x64. O PWA nu ajută, fiindcă
instalarea cere https sau localhost, nu `file://`. MATLAB App Designer ar bifa "interfață
friendly", dar nu evidențiază linia de cod, nu are tranziții pe celulă și nu există pe laptopul de
la examen.

## 5. Arhitectura propusă

Trei straturi; fiecare depinde doar de cel de sub el:

1. Limbajul: parser de mână (coborâre recursivă) pentru pseudocodul din secțiunea 2, cu blocuri
   date de indentare. Arborele sintactic păstrează pentru fiecare instrucțiune linia din editor
   și, pentru atribuiri, eticheta din mijloc (`μ_ik` din `a_ik ← μ_ik = ...`).
2. Interpretorul: un generator care parcurge arborele și emite evenimente: `enterLine(linie,
   mediu)`, `read(celulă)`, `write(celulă, vechi, nou, formulă)`, `swap(celule sau linii)`,
   `pivot(celulă)`, `mark(celulă, rol)`, `call` și `return` pentru UTRIS, GPP, TORT apelate din alt
   algoritm, `message` pentru `Tipareste`, `stop`. Formula cu valorile substituite se construiește
   din același arbore de expresie pe care tocmai l-a evaluat, ca șir KaTeX. Urma se generează toată
   înainte de redare; o matrice 8x8 înseamnă 64 de numere pe instantaneu, deci zece mii de pași
   încap în 5 MB și derularea înapoi e o indexare.
3. Vederea: editorul CodeMirror cu linia curentă decorată, grila de celule cu culorile din anexă,
   panoul cu formula pasului, comenzile redare, pauză, pas, pas înapoi, viteză și cursor pe urmă.
   Randarea este o funcție pură de `urmă[i]`, deci viteza e doar un cronometru.

Alături: biblioteca de algoritmi (programe în același limbaj, întâi cei opt de examen, apoi GPP,
S_GPP, CMMP, MPI), contorul de flopi (numărat în interpretor la fiecare operație aritmetică),
panoul de verificare (rezultatul urmei lângă rezultatul NumPy din fixture-uri sau din Pyodide) și
cel puțin o aplicație pentru punctul 1 din cerință, de exemplu CMMP pe un set de date mic.

Testele interpretorului se scriu pe fixture-urile produse de `verifica.py`: aceeași matrice de
intrare, aceeași matrice de ieșire, toleranță 1e-12. Aritmetica e în dublă precizie în ambele
părți, deci rezultatele coincid.

## 6. Plan de lucru

1. Parser și interpretor cu teste pe cei opt algoritmi de examen, fără UI. Gata când fixture-urile
   din `verifica.py` trec.
2. Vederea minimă: un singur fișier HTML care încarcă eliminarea gaussiană din bibliotecă, o
   redă, permite derularea înapoi și arată linia curentă cu formula substituită.
3. Editorul: pseudocod introdus manual, erori de sintaxă arătate pe linie, rulare.
4. Restul bibliotecii, contorul de flopi, panoul de verificare cu NumPy, exportul Python.
5. Aplicația pentru cerința de colocviu și materialul de prezentare.

Pasul 1 nu depinde de răspunsul la întrebările de mai jos.

## 7. Riscuri și întrebări deschise

1. Este acceptată o aplicație web la colocviu, dat fiind textul "programe Python"? De întrebat
   laborantul la primul laborator. Răspunsul schimbă doar ce se adaugă (export Python sau Pyodide),
   nu motorul.
2. Slide-urile din PDF sunt versiunea din 2022; notația cursurilor ținute în 2026 se compară cu
   ele pe măsură ce apar.
3. Pseudocodul cu text liber (alegerea pivotului, "se rezolvă sistemul") cere funcții predefinite
   în limbaj; lista lor se închide pe măsură ce intră algoritmii în bibliotecă.
4. Verificat la primul build: vite-plugin-singlefile include fonturile woff2 ale KaTeX în fișierul
   unic (20 de fonturi ca `data:`, nicio cerere externă). Neverificat: dacă Pyodide se încarcă
   din `file://`; nu mai e nevoie, fiindcă cerința de cod Python s-a acoperit cu emițătorul din
   arborele sintactic.

## 8. Metodele iterative din curs

Cursul III împarte metodele de rezolvare a sistemelor liniare în două (pagina 97): cele directe
sunt "recomandate pentru sisteme de dim. medii n < 500", iar cele iterative, "bazate pe
construirea recursivă a unui șir de vectori care converge către soluția sistemului liniar", sunt
"recomandate pentru sisteme de dimensiuni foarte mari". Cartea adaugă, la pagina 69, că limita de
500 depinde de calculator și că metodele iterative se folosesc și când matricea are o structură
specială, eventual rară.

Ce conțin slide-urile 163-172:

- Cadrul comun (163): iterația x^(k+1) = B x^(k) + c, cu descompunerea A = M - N, B = M⁻¹N și
  c = M⁻¹b; "convergența acestor metode este asigurată dacă raza spectrală ρ(B) < 1".
- Jacobi (164-165): A = D - N cu D diagonala lui A; x_i^(k+1) = (b_i - Σ_{j≠i} a_ij x_j^(k)) / a_ii;
  converge dacă ρ(D⁻¹N) < 1 sau dacă A este strict diagonal dominantă. Exemplu: A = [2 1; 5 7],
  b = (11, 13), x⁰ = (1, 1).
- Gauss-Seidel (166-167): A = L - U cu L triunghiul inferior al lui A; în formula pe componente,
  pentru j < i se folosesc valorile noi. Exemplu: A = [16 3; 7 -11], b = (11, 13), x⁰ = (1, 1).
- Kaczmarz (168): x^(k+1) = x^(k) - ((a_iᵀx^(k) - b_i) / ‖a_i‖²) a_i, cu linia i aleasă ciclic sau
  aleator.
- O aplicație cu 10 necunoscute (170-172) în care Gauss-Seidel ajunge la soluție în 18 iterații,
  "datorită rarității A, G-S este mai avantajoasă decât GPP".

Slide-urile nu au pseudocod pentru aceste metode, nu numesc o toleranță și nu pun o limită de
iterații; criteriul de oprire este propoziția "continuă până la convergență, i.e. norma
‖Ax^k - b‖ mică". În bibliotecă, bucla este scrisă după modelul algoritmului MP din cursul V
(`cât timp e > tol`, cu `maxiter`), iar reziduul se raportează la ‖b‖, cum recomandă Templates
(pagina 52), ca toleranța să nu depindă de unitățile datelor. Descrierile spun care parte vine
din slide și care e scrisă aici.

Trei formulări din slide-uri sunt precizate în unealtă, cu sursa:

- La Gauss-Seidel slide-ul scrie "A este pozitiv definită". Cursul definește noțiunea doar pentru
  matrice simetrice (paginile 13 și 63), iar teorema cere într-adevăr simetria (Saad, teorema 4.10
  pentru SOR cu ω = 1; notele Cambridge, corolarul 4.13), așa că unealta scrie "simetrică și
  pozitiv definită".
- ρ(B) < 1 este și necesară, nu doar suficientă, pentru convergența din orice punct de pornire
  (Saad, teorema 4.1).
- Marginea de la Kaczmarz, cu factorul 1 - λ_min(AᵀA)/‖A‖_F², este rezultatul lui Strohmer și
  Vershynin: valabilă în medie, pentru linii alese aleator cu probabilitate proporțională cu
  ‖a_i‖², pe un sistem compatibil.

Costul, numărat de interpretor: o trecere Jacobi sau Gauss-Seidel pe o matrice densă costă cât
un produs matrice-vector, aproximativ 2n² flopi, iar testul pe reziduu încă 2n². Eliminarea
gaussiană cu cele două substituții costă aproximativ 2n³/3 + 2n², deci pe o matrice densă metoda
iterativă e mai ieftină doar dacă se oprește în mai puțin de n/6 iterații; pe exemplul Jacobi din
curs sunt 329 de flopi față de 13. Pe o matrice rară o trecere atinge doar elementele nenule și
costă aproximativ 2·nnz flopi, deci pragul urcă. În aplicația de pe slide-ul 172 (n = 10, mai puțin de
jumătate din elemente nenule, 18 iterații) numărătoarea încă favorizează
GPP: aproximativ 1500 de flopi față de 870. Panoul "Convergență" arată comparația lângă graficul
reziduului.

Un reziduu mic nu înseamnă o eroare mică: ‖x - x̂‖/‖x‖ ≤ κ(A) ‖r‖/‖b‖ (cartea, pagina 99, "testul
«r este mic» e valid doar dacă matricea A este bine condiționată"). Panoul de verificare arată,
pentru metodele iterative, reziduul la oprire și eroarea față de soluția eliminării gaussiene.

Dintre celelalte algoritmi iterativi ai cursului, în bibliotecă este doar metoda puterii. MPI
(slide-ul 318) rezolvă un sistem la fiecare iterație, iar iterațiile QR (slide-urile 357-391) sunt
scrise cu apeluri la alți algoritmi; limbajul de pseudocod de aici nu are apeluri.

## 9. Python în laboratoare

Laboratoarele din 2026 (`Laborator 1`, `Laborator 2`) și șabloanele din 2023 scriu la fel:

- `import numpy as np`; Laboratorul 1 spune explicit că "în Python indexarea începe de la 0".
- Bucle `for i in range(...)` pe elemente, cu `A[i, k]` sau `U[i][j]`; nicio actualizare
  vectorizată de linie în algoritmi.
- Dimensiunea se ia din tablou (`n = U.shape[0]`, `m, n = np.shape(A)`), nu se dă ca parametru.
- Funcțiile întorc rezultatele: `return x`, `return A, p`, `return U, A, beta`.
- Sumele se adună într-o variabilă (`s = s + A[i, k]**2`), numele sunt fără litere grecești
  (`sigma`, `beta`, `tau`), iar rezolvările din 2026 copiază intrarea cu `A.astype(float)`, ca o
  matrice de întregi să nu trunchieze împărțirile.

Emițătorul din `src/motor/python.ts` produce acest stil din arborele sintactic. Diferența de
fond față de pseudocod este numărarea de la 0: variabilele de buclă și mărimile care țin poziții
(`i_k` din `argmax`, vectorul `p` de la GPP) se mută cu 1 în jos, iar capetele buclelor se
rescriu (`i = n : -1 : 1` devine `range(n - 1, -1, -1)`). Testul `tests/python.test.ts` rulează
codul generat și îl compară cu interpretorul și cu oracolul, pe bibliotecă și pe programe scrise
de mână.

Un detaliu de corectitudine: șablonul de laborator pentru TORT calculează
`sigma = np.sign(A[k,k])*np.sqrt(s)`. `np.sign(0)` este 0, deci pentru o coloană cu a_kk = 0 și
elemente nenule dedesubt reflectorul ar fi sărit. Cartea avertizează în nota de la pagina 129 că
funcțiile `sgn` predefinite, cu sgn(0) = 0, "pot conduce la rezultate eronate". Codul generat
definește `sgn` cu sgn(0) = 1.

## 10. Biblioteca față de slide-uri și ce a rămas neacoperit

Compararea linie cu linie a pseudocodului din bibliotecă cu slide-urile:

- Identice ca bucle, memorare și termen dominant al costului: C = AB (pagina 67), LTRIS și UTRIS
  (83-85), G (113), GPP (121-122), Crout (137), S_GPP (140), CHOL (160), MP (314).
- Până la verificarea din secțiunea 12, biblioteca avea TORT și CMMP în varianta nescalată, cu
  vectorii Householder într-o matrice U separată (propoziția de pe slide-ul 196, șablonul de
  laborator din 2023, algoritmul 3.2 din carte). Acum are Algoritmul QR și Algoritmul SQR de pe
  slide-urile 211 și 224, cu vectorul împărțit la σ (u_kk = 1 + a_kk/σ = β_k) și păstrat în A.
  Pe exemplul din curs iese ce tipărește slide-ul 212: u_1 = (5/3, -1/3, 2/3), β_1 = 5/3.
  Algoritmul RFG este aceeași formă scalată, pe un singur vector.
- Pe exemplul de pe slide-ul 225 soluția exactă este x = (2/3, 0), cu reziduul √10; slide-ul
  tipărește (0.65, 0.003), pentru că lucrează cu Qᵀ scris cu două zecimale.
- Slide-ul 314 scrie "tol > 1" la MP; cu e = 1 la pornire bucla nu s-ar executa. Laboratorul 5
  din 2018 scrie tol < 1.

Biletele din anii trecuți (`MN_examene_alti_ani`) cer aproape numai adaptări și calcule de mână.
Biletul nr. 1, de exemplu: matricea elementară M_k pe un vector, o transformare ortogonală cu
Qx = ‖x‖e_1, adaptarea eliminării gaussiene la o matrice cu structură și complexitatea ei, un
produs bᵀA eficient, metoda puterii cu rata de convergență, forma Schur reală a unei matrice 3x3,
DVS pentru o matrice de rang 1 și un sistem (diag(a) + baᵀ)x = c. Slide-ul 493 spune că la examen
se cer cel mult două transformări Householder.

Algoritmi din curs care nu sunt în bibliotecă, în ordinea în care ar merita adăugați:

1. Variantele adaptate la structură (G, Crout și QR pe matrice Hessenberg, sisteme bidiagonale
   și tridiagonale), cerute de bilete. Se pot scrie de pe acum în modul "pseudocod propriu",
   schimbând capetele buclelor.
2. DVS pentru o matrice de rang 1 și un pas de deflație spre forma Schur; se pot scrie cu
   reflectori și bucle pe elemente, dar sunt lungi.
3. Rotațiile Givens (ROTG, ROT) și GQR.
4. GPC și S_GPC (maximul pe doi indici se scrie cu două bucle), LINV, INV_GPP, DET_GPP, LDLᵀ.
5. MPI, care are nevoie de o rezolvare de sistem în interiorul buclei.
6. HQr, iterațiile QR și DVS completă, construite pe apeluri între algoritmi.

## 11. Culori și accesibilitate

Culorile din anexă (aceleași nuanțe pastelate pentru fond și un ton închis pentru text) au fost
măsurate cu raportul de contrast WCAG 2 și cu distanța în OKLab (înmulțită cu 100) sub
protanopie și deuteranopie simulate după Machado, Oliveira și Fernandes (2009):

- Textul din celule nu ajungea la 4.5:1 pe portocaliu (3.60) și pe roșu (4.44), iar textul
  secundar al interfeței avea 2.66:1.
- Fondurile rolurilor nu se deosebeau sub daltonism: albastru și mov la 0.65 sub deuteranopie,
  roșu și verde la 2.25, față de un prag de 8.

Paleta actuală păstrează nuanțele (roșu pivot, portocaliu scris, albastru citit, verde gata, mov
multiplicator) și schimbă luminozitatea și saturația: orice două fonduri sunt la cel puțin 9.9
(tema luminoasă) și 9.2 (tema întunecată) sub protanopie și deuteranopie, iar numărul din celulă,
scris cu culoarea textului temei, are cel puțin 8.9:1 și 5.0:1. Culorile din formulă (țintă,
pivot, citit) sunt la cel puțin 10 între ele. `tests/culori.test.ts` recalculează aceste praguri
din `src/index.css` și `src/paleta.ts`.

Culoarea nu este singurul semn. Fiecare rol are un contur al lui (dublu pentru pivot, gros
pentru scris, întrerupt pentru citit, colț marcat pentru gata, litera μ pentru multiplicator),
care rămâne vizibil și în modul de contrast ridicat al sistemului, unde fondurile dispar. În
formulă ținta este îngroșată, pivotul încadrat și elementele citite subliniate punctat. Linia
curentă din editor are o bară în stânga. Grila se citește ca tabel de către cititoarele de ecran,
cu rolul în eticheta celulei, butoanele au nume, panoul pasului este anunțat când se schimbă,
iar cu "reducere a mișcării" cerută în sistem celulele își schimbă doar culoarea.

## 12. Verificarea față de materialele din anul curent

Referința era folderul `Sem I/Metode numerice`: slide-urile (`Cursuri/Cursuri.pdf`), cartea
cursului și laboratoarele 1 și 2; secțiunea 13 o restrânge la folderul `Cursuri`. Un audit
independent, făcut fără materialele din anii trecuți, a
căutat sursa fiecărui enunț din `src/motor/biblioteca.ts` și `src/notiuni.ts` și a comparat
pseudocodul cu imaginea fiecărui slide. Ce s-a schimbat în urma lui:

- TORT și CMMP au fost înlocuite cu Algoritmul QR (slide-ul 211) și Algoritmul SQR (slide-ul
  224). Două lucruri diferă de slide și sunt spuse în aplicație: linia `a_kk ← u_kk = β_k`, pusă
  ca sumele pe i = k : m să citească vectorul Householder din A, așa cum face slide-ul SQR, și
  prima linie din bucla SQR, tipărită pe slide ca "t = a_kk = 0" și scrisă aici `t ← a_kk`.
  Linia `r ← ‖b(n+1:m)‖` vine din slide-ul 223. Oracolul Python, fixture-urile și verificările
  au fost refăcute pentru noua memorare.
- Fiecare algoritm are câmpul `curs`: cursul și titlul slide-ului, apoi ce diferă aici.
  Produsul matrice-vector nu are algoritm pe slide-uri; vine din cartea cursului (Algoritmul
  1.5, Gaxpy). Pentru Jacobi, Gauss-Seidel și Kaczmarz slide-urile dau doar formula iterației.
- Enunțuri scoase, pentru că nu au sursă în materiale: Jacobi "se poate face în paralel",
  Gauss-Seidel "de regulă are nevoie de mai puține iterații", comparația de flopi dintre
  Gauss-Seidel și GPP la n = 10 (un calcul propriu care contrazicea observația de pe slide-ul
  172), numele rutinei LAPACK, remarca despre DVS la examen.
- Enunțuri reformulate ca pe slide: convergența metodelor iterative "dacă ρ < 1" (slide-urile
  163-166 dau condiții suficiente, nu o echivalență), teorema de condiționare cu perturbațiile
  datelor (slide-ul 152) în locul formei cu reziduul, soluția din exemplul cu pivotul 10⁻⁴.
- Enunțuri păstrate din afara slide-urilor, cu sursa numită în text: din carte, factorul de
  creștere și "practic stabil" (pagina 103), testul reziduului (pagina 99), sgn(0) = 1 (pagina
  129); din documentația NumPy și SciPy, ce fac funcțiile echivalente.

Intrările au acum o natură (`src/natura.ts`): proprietatea pe care algoritmul o cere de la ele.
Butonul "aleator" o respectă, iar pentru Jacobi și Gauss-Seidel generează matrice strict diagonal
dominante, condiția suficientă de pe slide-urile 164 și 166.

## 13. Doar folderul Cursuri și funcțiile din 14 octombrie

Ce s-a scos ca să rămână doar slide-urile și cartea: numele TORT din titlul algoritmului QR și
lista de examen, care veneau din anexă; trimiterea la Strohmer și Vershynin de la Kaczmarz (rămâne
ce spune slide-ul 168: convergență liniară, cu factorul de pe slide); trimiterile la laborator din
texte; regula lui Cramer, care nu apare în curs; ghilimelele tipografice din mesaje. Liniile de
pseudocod care nu sunt pe slide au acum un comentariu `%` chiar în cod. Pentru metoda puterii,
"aleator" generează A = T D T⁻¹ cu T întreagă și det T = 1: A și D sunt asemenea, deci au aceleași
valori proprii (slide-ul 280), alese cu una dominantă; vectorul de pornire primește o componentă pe
vectorul propriu dominant (ipoteza de pe slide-ul 310, γ₁ ≠ 0), iar un vector scris de mână fără
această componentă este semnalat.

Funcții noi, cu sursa lor:

- Matrice bandă: Gb și GPPb sunt algoritmii 2.14 și 2.15 din carte (secțiunea 2.9), iar UTRISb
  este substituția înapoi cu limita min(i + q, n) din aceeași secțiune; slide-urile 14-15
  definesc matricele bandă, tridiagonale și Hessenberg. Teoremele 2.9 și 2.10 din carte spun cum
  se păstrează banda: U are q diagonale deasupra la G și cel mult q + r la GPP. În grilă,
  zerourile din afara benzii sunt hașurate, iar descrierea arată flopii lui G, GPP sau UTRIS pe
  aceleași intrări. Formula de cost, lăsată de carte ca exercițiu, este numărată pe pseudocod.
- Aritmetica cu t cifre: interpretorul rotunjește fiecare intrare și rezultatul fiecărei
  operații la t cifre semnificative. S_G (rezolvarea cu G fără pivotare, descrisă pe slide-ul
  138 fără pseudocod) pornește pe exemplul de pe slide-ul 114 cu 3 cifre și dă x₁ = 0, soluția
  falsă de pe slide; S_GPP pe aceleași date dă x₁ = 1. Slide-ul spune "precizia 10⁻³"; calculul
  lui de pe slide (9998/9999 rotunjit la 1) corespunde rotunjirii la 3 cifre semnificative.
- Modul exercițiu: cât rezultatul unui pas e ascuns, studentul îl scrie și îl verifică (0.5%
  toleranță, fracții acceptate, adevărat/fals la condiții).
- Vederea geometrică pentru două necunoscute: ecuațiile ca drepte și drumul aproximărilor la
  Jacobi, Gauss-Seidel și Kaczmarz, vectorul metodei puterii pe cercul unitate, reflexia lui RFG.
- Comparația cu NumPy în fișierul Python generat: aceeași problemă rezolvată de funcția standard
  și cea mai mare diferență, verificate pe toate cazurile testului de export.

O recenzie UI/UX independentă, făcută în browser ca un student la prima folosire, a găsit între
altele: metoda puterii putea raporta ca "ok" o valoare proprie nedominantă când vectorul de
pornire nu avea componentă pe vectorul propriu dominant; dimensiuni incompatibile (B cu alt număr
de linii decât coloanele lui A) rulau până la capăt pe altă problemă; săgețile pe meniul de
algoritmi schimbau algoritmul; flopii erau numărați diferit de curs (radicali, sume goale,
contoare), așa că LU număra 18 flopi unde G numără 13. Toate sunt corectate și acoperite de teste;
lista e în istoricul sesiunii, nu aici.

## 14. Surse

## 13. Surse

Materiale de curs:

- `Cursuri/Cursuri.pdf`: slide-urile de examinare și temele exemplu (cursul I), "Teme colocviu"
  (cursul IV, pagina 256) și "Tema colocviu" (cursul VI, pagina 468), algoritmii G, GPP, Crout,
  CHOL și metodele iterative (cursul III), reflectorii, QR și SQR (cursul IV), MP și MPI
  (cursul V). Numerele de pagină din acest document sunt ale PDF-ului din 2022.
- `Cursuri/METODE DE CALCUL NUMERIC MATRICEAL. ALGORITMI FUNDAMENTALI.pdf` (Dumitrescu, Popeea,
  Jora): paginile 31, 69, 99, 103, 116 și 129, citate în secțiunile 8-10 și 12, și secțiunea
  2.9 "Sisteme bandă" (algoritmii 2.14 și 2.15, teoremele 2.9 și 2.10), citată în secțiunea 13.
- `Laboratoare/Laborator 2.pdf`: algoritmii S_INF_TR, S_SUP_TR, G în notația cărții.
- `Laboratoare/Laborator 1/Lab1_MN.ipynb`, `Laborator 2/Lab2_rezolvare.ipynb`: Python cu NumPy
  în Jupyter.
- `Anii trecuți/.../Laboratoare`: șabloanele din 2023 (`Lab2_321_322.py`, `lab4_321.py` pentru
  TORT) și îndrumarele din 2018; `MN_examene_alti_ani`: biletele de examen.
- `Anexe/algoritmi-algebra-liniara.tex`: pseudocodul celor opt algoritmi de examen și culorile.

Metode iterative (consultate pe 13 octombrie 2026) și culori:

- Saad, Iterative Methods for Sparse Linear Systems, ediția a 2-a, teoremele 4.1, 4.9 și 4.10:
  https://www-users.cse.umn.edu/~saad/IterMethBook_2ndEd.pdf
- Barrett și colaboratorii, Templates for the Solution of Linear Systems, secțiunea 4.2
  (criterii de oprire): https://www.netlib.org/templates/templates.pdf
- Fawzi, Cambridge Part II Numerical Analysis, cursul 16:
  https://www.damtp.cam.ac.uk/user/hf323/M21-II-NA/Lect16.pdf
- Strohmer și Vershynin, A randomized Kaczmarz algorithm with exponential convergence:
  https://arxiv.org/abs/math/0702226
- numpy.linalg.solve folosește rutina LAPACK gesv (eliminare cu pivotare parțială):
  https://numpy.org/doc/1.26/reference/generated/numpy.linalg.solve.html
- Machado, Oliveira, Fernandes 2009, A physiologically-based model for simulation of color
  vision deficiency, IEEE TVCG 15(6): DOI 10.1109/TVCG.2009.113
- WCAG 2.2, criteriile 1.4.1 (folosirea culorii), 1.4.3 (contrast minim) și 1.4.11 (contrast
  pentru elemente netextuale): https://www.w3.org/TR/WCAG22/

Biblioteci (pagini oficiale, consultate pe 12 octombrie 2026):

- Motion 14.1.0, import din `motion/react`: https://motion.dev/docs/react-quick-start; fără
  animații de layout pe SVG: https://motion.dev/docs/react-layout-animations
- Vite 8.3.4, React 19.3.0, @codemirror/view 6.43.14, KaTeX 0.19.0, Svelte 5.57.2, GSAP 3.15.0,
  anime.js 4.5.0, Electron 44.7.0: `https://registry.npmjs.org/<nume>/latest`
- vite-plugin-singlefile 2.3.3, compatibil cu Vite 8: https://registry.npmjs.org/vite-plugin-singlefile/latest
- Decorarea liniilor în CodeMirror: https://codemirror.net/examples/zebra/
- Tauri 2 cere Rust: https://v2.tauri.app/start/prerequisites/; Pake cere Rust 1.85:
  https://github.com/tw93/Pake/blob/main/docs/cli-usage.md
- Electron pe Windows ARM: https://www.electronjs.org/docs/latest/tutorial/windows-arm
- WebView2 runtime pentru x86, x64, ARM64: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
- Pyodide 314.0.7 cu Python 3.14.2 și NumPy 2.4.6: https://pyodide.org/en/stable/project/changelog.html,
  https://pyodide.org/en/stable/usage/packages-in-pyodide.html
- `sys.monitoring` din Python 3.12: https://docs.python.org/3/library/sys.monitoring.html
- PySide6 6.12.0 cu roată `win_arm64`: https://pypi.org/project/PySide6/; PyInstaller 6.22.3:
  https://pypi.org/project/pyinstaller/
- Manim 0.22.0: https://pypi.org/project/manim/; Godot 4.7.2: https://godotengine.org/download/windows/
- Avalonia 12.1.4: https://www.nuget.org/packages/Avalonia
- algorithm-visualizer, înregistrarea comenzilor: https://github.com/algorithm-visualizer/tracers.js

Unelte existente și literatură:

- VisuAlgo și raportul de proiect al lui Tan (NUS): https://visualgo.net, https://visualgo.net/fyp/rose-report.pdf
- Python Tutor, Guo, SIGCSE 2013: https://pythontutor.com,
  https://pg.ucsd.edu/publications/Online-Python-Tutor-web-based-program-visualization_SIGCSE-2013.pdf
- JSAV, Karavirta și Shaffer, ITiCSE 2013: https://github.com/vkaravir/JSAV
- Visu: https://github.com/iionel/Visu
- Heath, Interactive Educational Modules: https://heath.web.engr.illinois.edu/iem/
- basic-mathematics.com: https://www.basic-mathematics.com/matrix-multiplication-visualizer.html
- LUTool, blogul lui Cleve Moler: https://blogs.mathworks.com/cleve/2025/02/08/lutool-animation-of-gaussian-elimination/
- Mornar, Granić, Mladenović 2014: DOI 10.1145/2591708.2591743
- NumericalMethodsVisualizerPython: https://github.com/AnduBade02/NumericalMethodsVisualizerPython
- Hundhausen, Douglas, Stasko 2002, JVLC 13(3): DOI 10.1006/jvlc.2002.0237
- Naps și colaboratorii 2002, ITiCSE: DOI 10.1145/960568.782998
- Saraiya, Shaffer, McCrickard, North 2004, SIGCSE: DOI 10.1145/971300.971432
- Tversky, Morrison, Bétrancourt 2002, IJHCS 57:
  https://hci.stanford.edu/courses/cs448b/papers/Tversky_AnimationFacilitate_IJHCS02.pdf
- Heer și Robertson 2007, IEEE TVCG 13(6):
  https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf
