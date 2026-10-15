# Cercetare: vizualizator de algoritmi pentru Metode numerice

Documentul strânge cercetarea din spatele vizualizatorului: ce cere cursul, cum scrie cursul
algoritmii, ce unelte asemănătoare există, platforma, arhitectura și verificarea conținutului.

Teoria din aplicație vine numai din materialele cursului de Metode numerice: slide-urile cursului
(cursurile I-VI) și cartea cursului, B. Dumitrescu, C. Popeea, B. Jora, "Metode de calcul numeric
matriceal. Algoritmi fundamentali". Un enunț care nu este în ele trebuie să decurgă direct din
definițiile algebrei liniare; altfel nu intră în aplicație. Laboratoarele cursului sunt doar
modelul de stil pentru codul Python generat. Faptele despre NumPy, SciPy și LAPACK vin din
documentația lor oficială (secțiunea 13) și nu sunt teorie.

Numerele de slide sunt paginile din PDF-ul slide-urilor. Paginile din carte sunt cele tipărite.

## 1. Ce cere cursul

Slide-ul de examinare din cursul I spune că la colocviu (săptămânile 13-14, 10 puncte din cele 50
ale semestrului) 1-2 studenți fac o temă la alegere, descrisă ca "aplicație și programe Python".
Temele exemplu sunt "program Matlab/Python cu interfață friendly" pentru: eliminare gaussiană,
factorizare LU, factorizare Cholesky, factorizare QR, CMMP, o aplicație CMMP, forma Schur, metoda
puterii (inverse), o aplicație cu valori proprii (stabilitate, PCA, recunoaștere de fețe), DVS
pentru matrice de rang 1 și o aplicație DVS (compresie de imagini).

Slide-ul "Tema - colocviu" din cursul VI (468) dă șase puncte de evaluare:

1. descrierea în detaliu a aplicației alese;
2. formularea matematică și legătura cu o problemă din curs (sistem liniar, valori și vectori
   proprii, DVS);
3. adaptarea a 1-2 algoritmi dați la curs pentru rezolvarea ei;
4. codul Python/Matlab pentru algoritmii implementați;
5. compararea rezultatelor cu funcția standard din Python/Matlab (de exemplu eig, svd);
6. comentarea rezultatelor: grafice, tabele, număr de iterații, număr de operații, timp de calcul.

Slide-ul "Teme colocviu - cerința" din cursul IV (256) cere cel puțin un algoritm și dă ca
exemplu, pentru CMMP, operația A\b din Matlab.

Vizualizatorul acoperă direct punctul 3: algoritmii se rulează în notația cursului, pe matrice
alese de student. Pentru punctele 4-6 are emițătorul de cod Python, comparația cu NumPy de la
sfârșitul fișierului generat, contorul de flopi pus lângă formula de cost și panoul de
convergență. Cuvintele "programe Python" sunt singurul loc unde o aplicație web intră în conflict
cu textul slide-ului; secțiunea 4 spune cum se acoperă.

## 2. Algoritmii și notația din curs

Cursul are șase părți: introducere, algoritmi elementari, sisteme liniare, CMMP, valori și
vectori proprii, DVS. Pseudocod apare în slide-uri pentru normele vectoriale, produsul C = AB,
LTRIS, UTRIS, LINV și TRV (cursul II); G, GPP, GPC, Crout, S_GPP, S_GPC, INV_GPP, DET_GPP, G
pentru sisteme simetrice și CHOL (cursul III); RFG și RF (reflectori), ROTG și ROT (rotații), QR
Householder, GQR și SQR (cursul IV); MP, MPI, HQr, pasul QR cu deplasare explicită, VD2, IT_QR2,
TRID2 și QR2 (cursul V); DVS prin bidiagonalizare (cursul VI). Pentru Jacobi, Gauss-Seidel și
Kaczmarz (cursul III) slide-urile dau doar formula iterației, iar produsul matrice-vector are
algoritm doar în carte (Algoritmul 1.5, Gaxpy, pagina 31).

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
de o funcție predefinită pentru el, `argmax`.

Consecință pentru parser: limbajul acceptat este reuniunea celor două stiluri. Numerotarea pașilor
e opțională, `=` și `←` sunt ambele atribuire, `pentru` și `Pentru` sunt același cuvânt, iar
blocurile sunt date de indentare, ca în slide-uri. Pentru o matrice, cursul notează cu ‖A‖ norma
spectrală și cu ‖A‖_F norma Frobenius (slide-ul 12); limbajul acceptă ‖A‖_F, iar ‖A‖ pe o matrice
este o eroare, pentru că norma spectrală nu se calculează aici.

Fiecare rol al unei celule are o culoare și un contur fix: roșu pentru pivot sau împărțitor,
portocaliu pentru ce se scrie acum, galben pentru al doilea scris din același pas, albastru pentru
ce se citește, verde pentru ce e gata, mov pentru multiplicatori și vectori Householder, gri
pentru zero. `python/mn/algoritmi.py` traduce pseudocodul din bibliotecă literal în Python, cu
indici de la 1, și este oracolul numeric al testelor: `python/genereaza_fixturi.py` scrie
intrările și ieșirile lui în `tests/fixtures`.

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
  și "construire"; modul exercițiu adaugă nivelul "răspuns".
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
3. Culorile au același sens peste tot și apar identic în grilă, în formulă și în legendă.
4. Formula pasului, cu valorile substituite, stă lângă grilă și lângă linia de cod, nu într-un
   panou separat.
5. Tranzițiile sunt scurte (sub o secundă la viteza normală) și fără mișcare decorativă; o
   actualizare de coloană se etapizează celulă cu celulă la viteză mică și se grupează la viteză
   mare.

## 4. Platforma: web, executabil sau Python

Demonstrația se face pe un laptop Windows, posibil fără internet, pe care nu se poate presupune
nimic instalat.

| Opțiune | Animație și control | Linia de cod curentă | Formule | Livrare offline | Executabil pe Windows ARM64 | Efort de dezvoltare |
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

Cum se acoperă "programe Python" din cerință: emițătorul din `src/motor/python.ts` scrie, din
același arbore sintactic, un fișier Python cu NumPy pentru orice pseudocod, terminat cu apelul pe
intrările curente și cu comparația cu funcția standard din NumPy. `python/mn/algoritmi.py` are
algoritmii bibliotecii în Python, iar `python/compara.py` scoate tabelul cu eroarea față de NumPy,
flopii și timpul, pentru punctele 5 și 6. Pyodide rămâne rezerva pentru cazul în care se cere
explicit ca Python să ruleze în unealtă.

Aplicația rulează local pe `localhost:5173`, nativ cu `npm run dev` sau în Docker cu
`docker compose up` (același server Vite, sursele montate prin volum), cum descrie `README.md`.
Nu există server de producție: fișierul HTML unic din `npm run build` rămâne livrabilul pentru
examen și nu are nevoie de Docker.

Dacă examinatorul cere un executabil: Tauri 2 cere Rust și unelte MSVC, iar Pake e Tauri pe
dedesubt (cere Rust 1.85 sau mai nou). Fără Rust rămân Electron 44 (arhiva arm64 are 156 MB) sau o
aplicație .NET WinForms de 30 de rânduri care găzduiește controlul WebView2 (runtime-ul vine cu
Windows 11, inclusiv pe ARM64). Neutralinojs publică binar doar pentru x64. O PWA nu ajută, fiindcă
instalarea cere https sau localhost, nu `file://`. MATLAB App Designer ar bifa "interfață
friendly", dar nu evidențiază linia de cod, nu are tranziții pe celulă și nu se poate presupune
instalat la examen.

## 5. Arhitectura

Trei straturi; fiecare depinde doar de cel de sub el:

1. Limbajul: parser de mână (coborâre recursivă) pentru pseudocodul din secțiunea 2, cu blocuri
   date de indentare. Arborele sintactic păstrează pentru fiecare instrucțiune linia din editor
   și, pentru atribuiri, eticheta din mijloc (`μ_ik` din `a_ik ← μ_ik = ...`). Limbajul nu are
   apeluri între algoritmi: S_GPP, S_G și SQR au pașii algoritmilor apelați scriși desfășurat.
2. Interpretorul: un generator care parcurge arborele și emite evenimente: linia curentă, celulele
   citite, celulele scrise cu valoarea veche, cea nouă și formula, schimburile de elemente,
   pivotul, mesajele și oprirea. Formula cu valorile substituite se construiește din același
   arbore de expresie pe care tocmai l-a evaluat, ca șir KaTeX. Urma se generează toată înainte
   de redare, cu un instantaneu la intervale fixe, deci derularea înapoi e o indexare.
   Interpretorul numără flopii la fiecare operație aritmetică și, la cerere, rotunjește fiecare
   rezultat la t cifre semnificative.
3. Vederea: editorul CodeMirror cu linia curentă decorată, grila de celule colorate după rol,
   cardul cu formula pasului, comenzile de parcurgere și panourile din dreapta. Randarea este o
   funcție pură de `urmă[i]`, deci viteza e doar un cronometru.

Alături: biblioteca de algoritmi din curs (secțiunea 9), natura intrărilor (`src/natura.ts`:
proprietatea cerută de algoritm, respectată de butonul "aleator" și verificată la valorile scrise
de mână), panoul de verificare (identitățile pe care le promite algoritmul, recalculate
independent de urmă) și emițătorul Python.

Trei funcții ajută la înțelegerea ipotezelor. Meniul de tip de lângă o matrice generează
structurile definite în curs (simetrică, pozitiv definită, triunghiulară, tridiagonală,
Hessenberg, strict diagonal dominantă, ortogonală, singulară), cu butoane pentru dimensiuni, iar
rândul de sub matrice spune ce proprietăți are matricea scrisă (rangul, submatricea lider la care
eliminarea ar da pivot nul, pasul la care Cholesky s-ar opri, raza spectrală a matricei de
iterație). Contraexemplele din curs (`src/contraexemple.ts`) încarcă intrări care încalcă o
ipoteză și spun unde e ipoteza în curs; fiecare are un rezultat așteptat, verificat în teste.
Panoul de comparație rulează aceleași intrări cu alt algoritm (G și GPP, S_G și S_GPP pe 3 cifre,
Cholesky sau QR și G, metodele iterative între ele), comparațiile pe care le face cursul.

Patru funcții leagă algoritmul de teoria din curs:

- "Ce rămâne adevărat" (`src/invarianti.ts`) verifică, la începutul fiecărui pas al buclei
  exterioare, proprietatea pe care se sprijină demonstrația: A_(k+1) = M_k ⋯ M_1 A superior
  triunghiulară în primele k coloane (slide-urile 107-108 și 132; cu pivotare, slide-ul 121),
  coloanele lui L din A = LU și A = LLᵀ (135-136, 158), A_(k+1) = U_k A_k la QR (207-208),
  ecuațiile deja rezolvate la substituții (83-85). Verificarea reconstruiește, din valorile din
  grilă, ce spune cursul și măsoară abaterea.
- Experimentul de condiționare (`src/conditionare.ts`) folosește teorema de pe slide-ul 152 cu Δb
  singur, unde marginea ‖Δx‖/‖x‖ ≤ κ(A)‖Δb‖/‖b‖ decurge direct din definiția normei induse, și
  norma ∞, pe care cartea o alege pentru κ (paginile 98-99). Exemplele D, T și H₃ sunt cele din
  carte (pagina 99). La LTRIS și UTRIS se ia doar triunghiul pe care îl citește algoritmul.
- Costul în funcție de n (`src/costuri.ts`) rulează algoritmul pentru n de la 2 la 8 și pune
  flopii numărați lângă formula de cost a algoritmului.
- Exercițiile de adaptare (`src/adaptari.ts`) sunt problemele din carte: P 1.24 a și c (pagina
  68), P 2.29 a (pagina 122) cu secțiunea 2.9 și partea de triangularizare din P 2.13 a (pagina
  120). Țintele de flopi (3n − 2, 3(n − 1), n² − 1) sunt numărate pe soluții, iar testele verifică
  că soluțiile le ating exact.

Testele interpretorului rulează algoritmii pe fixture-urile produse de oracolul Python: aceeași
matrice de intrare, aceeași matrice de ieșire, toleranță 1e-12. Aritmetica e în dublă precizie în
ambele părți, deci rezultatele coincid.

## 6. Întrebări deschise

1. Este acceptată o aplicație web la colocviu, dat fiind textul "programe Python"? Răspunsul
   schimbă doar ce se adaugă (export Python sau Pyodide), nu motorul.
2. Slide-urile folosite sunt cele din PDF-ul cursului; dacă slide-urile prezentate la curs diferă,
   biblioteca se compară din nou cu ele.

## 7. Metodele iterative din curs

Cursul III împarte metodele de rezolvare a sistemelor liniare în două (slide-ul 97): cele directe
sunt "recomandate pentru sisteme de dim. medii n < 500", iar cele iterative, "bazate pe
construirea recursivă a unui șir de vectori care converge către soluția sistemului liniar", sunt
"recomandate pentru sisteme de dimensiuni foarte mari". Cartea adaugă, la pagina 69, că limita de
500 depinde de calculator și că metodele iterative se folosesc și când matricea are o structură
specială, eventual rară.

Ce conțin slide-urile 163-172:

- Cadrul comun (163): iterația x^(k+1) = B x^(k) + c, cu descompunerea A = M - N, B = M⁻¹N și
  c = M⁻¹b; "convergența acestor metode este asigurată dacă raza spectrală ρ(B) < 1", o condiție
  suficientă.
- Jacobi (164-165): A = D - N cu D diagonala lui A; x_i^(k+1) = (b_i - Σ_{j≠i} a_ij x_j^(k)) / a_ii;
  metoda e bine definită dacă diagonala e nenulă și converge dacă ρ(D⁻¹N) < 1 sau dacă A este
  strict diagonal dominantă. Exemplu: A = [2 1; 5 7], b = (11, 13), x⁰ = (1, 1).
- Gauss-Seidel (166-167): A = L - U cu L triunghiul inferior al lui A; în formula pe componente,
  pentru j < i se folosesc valorile noi. Converge dacă ρ(L⁻¹U) < 1, dacă A este pozitiv definită
  (cursul definește noțiunea doar pentru matrice simetrice, slide-ul 13) sau dacă A este strict
  diagonal dominantă. Exemplu: A = [16 3; 7 -11], b = (11, 13), x⁰ = (1, 1), cu valorile
  tipărite cu două zecimale, trunchiate.
- Kaczmarz (168): x^(k+1) = x^(k) - ((a_iᵀx^(k) - b_i) / ‖a_i‖²) a_i, cu linia i aleasă ciclic sau
  aleator; "nu cere condiții asupra matricii A"; marginea ‖x^k - x*‖² ≤ (1 - λ_min(AᵀA)/‖A‖_F²)^k
  ‖x⁰ - x*‖², în care k numără actualizările pe câte o linie.
- O aplicație cu 10 necunoscute (170-172) în care Gauss-Seidel pornit din zero ajunge la soluție
  în 18 iterații, "datorită rarității A, G-S este mai avantajoasă decât GPP".

Slide-urile nu au pseudocod pentru aceste metode, nu numesc o toleranță și nu pun o limită de
iterații; criteriul de oprire este propoziția "continuă până la convergență (A matrice diagonal
dominantă), i.e. norma ‖Ax^k - b‖ mică". În bibliotecă, bucla este scrisă după modelul
algoritmului MP din cursul V (`cât timp e > tol`, cu `maxiter`), iar reziduul se raportează la
‖b‖, ca toleranța să nu depindă de mărimea datelor; cartea folosește același raport în marginea
‖x - x̂‖/‖x‖ ≤ κ(A) ‖r‖/‖b‖ (pagina 99, "testul «r este mic» e valid doar dacă matricea A este
bine condiționată"). Descrierile spun care parte vine din slide și care e scrisă aici, iar liniile
care nu sunt pe slide au un comentariu `%` în pseudocod.

La Kaczmarz, aplicația folosește ordinea ciclică și numără ca iterație o trecere prin toate
liniile. Din formula actualizării, pentru un sistem compatibil, ‖x_nou - x*‖² = ‖x - x*‖² -
(a_iᵀ(x - x*))²/‖a_i‖²: un pas nu mărește niciodată eroarea, dar pe o linie perpendiculară pe
x - x* o lasă neschimbată. Descrierea algoritmului spune asta lângă marginea de pe slide, iar
`tests/algebra.test.ts` verifică identitatea la fiecare pas.

Costul, numărat de interpretor: o trecere Jacobi sau Gauss-Seidel pe o matrice densă costă cât
un produs matrice-vector, aproximativ 2n² flopi, iar testul pe reziduu încă 2n². Eliminarea
gaussiană cu cele două substituții costă aproximativ 2n³/3 + 2n², deci pe o matrice densă metoda
iterativă e mai ieftină doar dacă se oprește în mai puțin de n/6 iterații. Pe o matrice rară o
trecere atinge doar elementele nenule, deci pragul urcă; contorul vizualizatorului numără însă și
înmulțirile cu zero, pentru că pseudocodul din bibliotecă are bucle dense. Panoul "Convergență"
arată comparația lângă graficul reziduului.

Dintre ceilalți algoritmi iterativi ai cursului, în bibliotecă este doar metoda puterii. MPI
(slide-ul 318) rezolvă un sistem la fiecare iterație, iar iterațiile QR sunt scrise cu apeluri la
alți algoritmi, pe care limbajul nu le are.

## 8. Codul Python generat

Laboratoarele cursului scriu Python cu NumPy așa:

- `import numpy as np`; indexarea începe de la 0.
- Bucle `for i in range(...)` pe elemente, cu `A[i, k]`; nicio actualizare vectorizată de linie în
  algoritmi.
- Dimensiunea se ia din tablou (`n = U.shape[0]`, `m, n = np.shape(A)`), nu se dă ca parametru.
- Funcțiile întorc rezultatele: `return x`, `return A, p`.
- Sumele se adună într-o variabilă (`s = s + A[i, k]**2`), numele sunt fără litere grecești
  (`sigma`, `beta`), iar intrarea se copiază ca tablou de numere reale, ca o matrice de întregi să
  nu trunchieze împărțirile.

Emițătorul din `src/motor/python.ts` produce acest stil din arborele sintactic. Diferența de
fond față de pseudocod este numărarea de la 0: variabilele de buclă și mărimile care țin poziții
(`i_k` din `argmax`, vectorul `p` de la GPP) se mută cu 1 în jos, iar capetele buclelor se
rescriu (`i = n : -1 : 1` devine `range(n - 1, -1, -1)`). Testul `tests/python.test.ts` rulează
codul generat și îl compară cu interpretorul și cu oracolul, pe bibliotecă și pe programe scrise
de mână.

Funcția `sgn` din codul generat are sgn(0) = 1, ca în cartea cursului (pagina 129, nota 5:
utilizarea funcțiilor sgn predefinite, cu sgn(0) = 0, "poate conduce la rezultate eronate").
`np.sign(0)` este 0: la RFG și QR, testul σ ≠ 0 ar trece, apoi σ ar deveni 0 și împărțirea la σ ar
eșua.

## 9. Biblioteca față de slide-uri

Compararea linie cu linie a pseudocodului din bibliotecă cu slide-urile și cu cartea:

- Identice ca bucle, memorare și termen dominant al costului: C = AB (slide-ul 67), LTRIS și UTRIS
  (83-85), G (113), GPP (121-122), Crout (137), S_GPP (140), CHOL (160), RFG (197), Algoritmul QR
  (211), Algoritmul SQR (224), MP (314); din carte, Gaxpy (Algoritmul 1.5, pagina 31), Gb și GPPb
  (algoritmii 2.14 și 2.15, paginile 106-108).
- Algoritmul QR păstrează vectorul Householder scalat (u_kk = 1 + a_kk/σ = β_k) în A. Linia
  `a_kk ← u_kk = β_k` este în plus față de slide, ca sumele pe i = k : m să citească vectorul din A,
  cum face SQR. Pe exemplul din curs iese ce tipărește slide-ul 212: u_1 = (5/3, -1/3, 2/3),
  β_1 = 5/3.
- SQR: pe slide prima linie din buclă apare ca "t = a_kk = 0"; aici este `t ← a_kk`. Linia
  `r ← ‖b(n+1:m)‖` vine din slide-ul 223. Pe exemplul de pe slide-ul 225 soluția exactă este
  x = (2/3, 0), cu reziduul √10; slide-ul tipărește (0.65, 0.003), pentru că lucrează cu Qᵀ scris
  cu două zecimale.
- RFG: linia `β ← 0` nu este pe slide; este convenția cărții (pagina 129, punctul 2) pentru cazul
  în care nu este nimic de anulat.
- S_G (slide-ul 138 descrie pașii fără pseudocod) pornește pe exemplul de pe slide-ul 114 cu 3
  cifre semnificative și dă x₁ = 0, soluția falsă de pe slide; S_GPP pe aceleași date dă x₁ = 1.
  Slide-ul spune "precizia mașinii ε = 10⁻³" și rotunjește 9998/9999 la 1. Cele 3 cifre reproduc
  acest calcul; formula de pe slide-ul 19 (precizia de ordinul β^-(t-1)) ar da 4 cifre, cu care
  x₁ iese 1.
- Matricele bandă urmează definiția din carte (pagina 40: lățimea inferioară și cea superioară)
  și secțiunea 2.9; teoremele 2.9 și 2.10 spun că U are q diagonale deasupra la G și cel mult
  q + r la GPP. Cartea lasă cititorului formula de cost și spune doar că e mult sub 2n³/3; formula
  din aplicație este numărată pe pseudocod.

Algoritmi din curs care nu sunt în bibliotecă, în ordinea în care ar merita adăugați:

1. Variantele adaptate la structură (G, Crout și QR pe matrice Hessenberg, sisteme bidiagonale
   și tridiagonale). Se pot scrie de pe acum în modul "pseudocod propriu", schimbând capetele
   buclelor.
2. DVS pentru o matrice de rang 1 și un pas de deflație spre forma Schur; se pot scrie cu
   reflectori și bucle pe elemente, dar sunt lungi. Slide-ul 493 spune că la examen se cer cel
   mult două transformări Householder.
3. Rotațiile Givens (ROTG, ROT) și GQR.
4. GPC și S_GPC (maximul pe doi indici se scrie cu două bucle), LINV, INV_GPP, DET_GPP, LDLᵀ.
5. MPI, care are nevoie de o rezolvare de sistem în interiorul buclei.
6. HQr, iterațiile QR și DVS completă, construite pe apeluri între algoritmi.

## 10. Culori și accesibilitate

Culorile inițiale ale rolurilor (nuanțe pastelate pentru fond și un ton închis pentru text) au
fost măsurate cu raportul de contrast WCAG 2 și cu distanța în OKLab (înmulțită cu 100) sub
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

## 11. Verificarea conținutului

Fiecare enunț din `src/motor/biblioteca.ts`, `src/notiuni.ts`, `src/natura.ts`, `src/i18n.ts`, din
panouri și din `README.md` a fost căutat în slide-uri și în carte, iar pseudocodul a fost comparat
cu imaginea fiecărui slide (textul extras din PDF pierde literele grecești). Fiecare algoritm are
câmpul `curs`: cursul, titlul slide-ului și ce diferă aici. Fiecare intrare cu o proprietate
cerută are o natură; `tests/natura.test.ts` verifică că valorile din "aleator" o respectă și că
algoritmul se termină pe ele. `tests/algebra.test.ts` verifică identitățile fiecărui algoritm pe
matrice aleatoare, iar `tests/cost.test.ts` compară formula de cost cu flopii numărați.

Enunțurile din aplicație au una dintre aceste surse:

- slide-urile cursului;
- cartea cursului, numită în text: factorul de creștere și "practic stabil" (pagina 103), testul
  reziduului (pagina 99), definiția stabilității numerice (definiția 0.4, pagina 13), stabilitatea
  lui CHOL (pagina 116) și a triangularizării ortogonale (pagina 148), sgn(0) = 1 și convenția
  β = 0 (pagina 129), dubla precizie cu 16 cifre (pagina 7), matricele bandă (pagina 40 și
  secțiunea 2.9);
- calcule elementare din definițiile cursului (de exemplu, o matrice triunghiulară este
  nesingulară exact când diagonala nu are zerouri);
- documentația NumPy și SciPy, pentru ce fac funcțiile cu care se compară rezultatul.

Convenții ale aplicației, spuse ca atare în text: bucla și testul de oprire ale metodelor
iterative, reziduul relativ ‖r‖/‖b‖, toleranța între 0 și 1, pragul reziduurilor 10^(2-t) la
aritmetica cu t cifre (de zece ori precizia mașinii de pe slide-ul 19), pragul 10⁻⁹ față de cel
mai mare element sub care un pivot sau α se socotește practic 0.

Greșeli din surse, unde aplicația urmează varianta corectă:

- slide-ul 15: definiția matricei bandă ("B(i,j) = 0 ∀ i < j + p și j < i + p") nu are sens;
  aplicația folosește definiția din carte;
- slide-ul 114: x₂ = 0.999990 în loc de 0.99990;
- slide-ul 172: în matricea tipărită a₂₆ = -1, dar a₆₂ = 0; soluția tipărită verifică sistemul
  doar cu a₂₆ = 0;
- slide-ul 224: "t = a_kk = 0" în loc de "t = a_kk";
- slide-ul 310 cere și x₁ᵀy₀ ≠ 0, și γ₁ ≠ 0, care diferă pentru o matrice nesimetrică
  (A = [2 1; 0 1], y = (1, -1) are x₁ᵀy = 1, dar γ₁ = 0); aplicația verifică γ₁ ≠ 0;
- slide-ul 314 și Algoritmul 4.1 din carte (pagina 234): "tol > 1"; cu e = 1 la pornire bucla nu
  s-ar executa, iar Algoritmul 4.2 din carte (pagina 236) scrie tol < 1;
- slide-ul 168 dă marginea Kaczmarz fără să spună pentru ce ordine a liniilor ține; pe ordinea
  ciclică ea nu ține pas cu pas (secțiunea 7).

## 12. Recenzia UI/UX și așezarea

O recenzie de design independentă, făcută pe descrierea aplicației, utilizatorii ei și capturi
de ecran, a dat un audit cu 14 constatări și 16 propuneri. Cele cu impact mare coincid cu ce se
vedea în capturi: linia de cod, grila și formula erau în trei colțuri ale ecranului; coloana din
dreapta era o stivă în care graficele cădeau sub pliu; "Rulează" și "Redă" erau amândouă butoane
principale; bifa "ascunde rezultatul" și câmpul de răspuns nu spuneau că sunt un mod; pe telefon
pagina depășea lățimea; culorile de sintaxă din editor foloseau nuanțele rolurilor (mov pentru
cuvintele cheie și pentru μ).

Ce s-a adoptat, în ordinea recenziei: așezarea 1b (aplicația ocupă fereastra: coloana de cod cu
intrările pliabile sub ea, scena cu cardul pasului deasupra grilelor, sertarul din dreapta cu
panouri pliabile care își arată rezumatul și închise, bara de parcurgere lipită jos; fiecare
coloană derulează singură); cardul citează linia curentă cu valorile variabilelor ei și are
rânduri cu înălțime rezervată; pasul înainte e singurul buton plin, cu pictograme și etichete,
iar cursorul pe urmă are crestături la scrieri, la iterații și la oprire; comutatorul
Parcurgere | Exercițiu cu scorul în card, în locul bifei; legenda pe un rând, cu frazele la
cerere; Verificarea ca rând pliat cu rezumat, deschis singur la final, cu reziduurile și în card;
catalogul de avertizări (informativ pentru rularea veche, cu scena estompată; eroarea de sintaxă
cu semnul "!"; intrarea greșită cu câmpul marcat; oprirea cu pătrat roșu); lățimea coloanelor
grilei calculată din toată urma și formatul compact peste 36 de celule; sintaxa editorului fără
nuanțe de rol, cu temă proprie în ambele teme; indentarea atârnată a liniilor lungi; IBM Plex Sans
și Mono înglobate în fișierul unic (subseturile latin și latin-ext, 137 KB woff2); modul
prezentare pe tasta P (rădăcina la 125 %, coloanele cresc mai puțin decât textul); harta tastelor
în antet; benzile responsive (1440, 1200, 900, 600 px) cu bara fixă jos pe telefon.

Ce nu s-a adoptat și de ce: paleta propusă pica cinci verificări din `tests/culori.test.ts`
(măsurate cu formulele testului): țintă și pivot în formulă sub deuteranopie 7.0 față
de pragul 8, litera μ pe fondul mov 3.6 și 3.1 față de 4.5, conturul comenzilor pe fundal 2.7 față
de 3, cuvântul cheie One Dark pe linia curentă 4.3; se păstrează fondurile și culorile de rol
actuale. O listă de examen, presupusă de recenzie, nu există în aplicație: unealta urmează doar
sursele cursului, fără liste care se schimbă de la an la an. Toleranța la exercițiu rămâne 0.5 %,
cât lasă rotunjirea la trei cifre, nu 0.05 % cum scria recenzia. Selectorul de algoritmi rămâne
meniul nativ, care merge pe telefon și cu cititorul de ecran. În banda de proiector (900-1199 px)
sertarul rămâne vizibil, îngustat, nu ascuns într-o foaie laterală, ca graficul și pasul să se vadă
deodată.

## 13. Surse

Materialele cursului:

- slide-urile cursului de Metode numerice, cursurile I-VI: cerințele de colocviu (slide-urile 2-3,
  256, 468), notațiile (11-15), algoritmii din secțiunea 9 și metodele iterative (163-172);
- B. Dumitrescu, C. Popeea, B. Jora, "Metode de calcul numeric matriceal. Algoritmi
  fundamentali", cartea cursului: paginile citate în secțiunile 7-9 și 11.

Biblioteci (pagini oficiale):

- numpy.linalg (solve, cholesky, qr, lstsq, eigvals): https://numpy.org/doc/stable/reference/routines.linalg.html;
  numpy.linalg.solve folosește rutina LAPACK gesv (eliminare cu pivotare parțială):
  https://numpy.org/doc/1.26/reference/generated/numpy.linalg.solve.html
- scipy.linalg (lu, solve_triangular): https://docs.scipy.org/doc/scipy/reference/linalg.html
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

Culori și accesibilitate:

- Machado, Oliveira, Fernandes 2009, A physiologically-based model for simulation of color
  vision deficiency, IEEE TVCG 15(6): DOI 10.1109/TVCG.2009.113
- WCAG 2.2, criteriile 1.4.1 (folosirea culorii), 1.4.3 (contrast minim) și 1.4.11 (contrast
  pentru elemente netextuale): https://www.w3.org/TR/WCAG22/

Unelte existente și literatură despre vizualizare:

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
