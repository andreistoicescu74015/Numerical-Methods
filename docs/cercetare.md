# Cercetare: vizualizator de algoritmi pentru Metode numerice

Scris pe 12 octombrie 2026. Sursele pentru cerințe, algoritmi și notație sunt materialele din
`D:\GitHub\CV\docs\UPB\Anul 2\Sem I\Metode numerice`: `Cursuri/Cursuri.pdf` (499 de slide-uri,
cursurile I-VI), `Laboratoare/Laborator 1` (notebook) și `Laborator 2.pdf`, și anexa
`Anexe/algoritmi-algebra-liniara.tex`. Faptele despre biblioteci vin din paginile oficiale citate
în secțiunea 8 și au fost verificate pe 12 octombrie 2026.

## 1. Ce cere cursul

Slide-ul de examinare din cursul I spune că la colocviu (săptămânile 13-14, 10 puncte din cele 50
ale semestrului) 1-2 studenți fac o temă la alegere, descrisă ca "aplicație și programe Python".
Temele exemplu sunt "program Matlab/Python cu interfață friendly" pentru: eliminare gaussiană,
factorizare LU, factorizare Cholesky, factorizare QR, CMMP, o aplicație CMMP, forma Schur, metoda
puterii (inverse), o aplicație cu valori proprii (stabilitate, PCA, recunoaștere de fețe), DVS
pentru matrice de rang 1 și o aplicație DVS (compresie de imagini).

Cursurile IV și V repetă cerința sub titlul "Tema colocviu", cu șase puncte de evaluare:

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
vectori proprii, DVS. Pseudocod apare în slide-uri pentru LTRIS, UTRIS și TRV (cursul II); G, GPP,
GPC, Crout, S_GPP, S_GPC, INV_GPP, DET_GPP, G pentru sisteme simetrice și CHOL (cursul III); QR
Householder, GQR și SQR (cursul IV); MP, MPI, HQr, QR iterativ cu deplasare explicită și implicită,
VD2 și IT_QR2 (cursul V); DVS prin bidiagonalizare (cursul VI). Lista de examen, pe care anexa o preia de pe ultimul
slide al cursului 1 din 2026: matvec, UTRIS, LTRIS, G, LU, Cholesky, TORT, MP.

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

## 8. Surse

Materiale de curs:

- `Cursuri/Cursuri.pdf`: slide-urile de examinare și temele exemplu (cursul I), "Teme colocviu"
  (cursul IV) și "Tema colocviu" (cursul V), algoritmii G, GPP, Crout, CHOL (cursul III), QR
  (cursul IV), MP și MPI (cursul V).
- `Laboratoare/Laborator 2.pdf`: algoritmii S_INF_TR, S_SUP_TR, G în notația cărții.
- `Laboratoare/Laborator 1/Lab1_MN.ipynb`: Python cu NumPy în Jupyter.
- `Anexe/algoritmi-algebra-liniara.tex`: pseudocodul celor opt algoritmi de examen și culorile.

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
