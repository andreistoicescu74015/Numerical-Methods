"""Ruleaza codul Python generat din pseudocod (python/generat/*.py) pe cazurile din
python/generat/cazuri.json si compara cu rezultatele asteptate: iesirile interpretorului
TypeScript pe aceleasi intrari si, pentru algoritmii din biblioteca, fixture-urile oracolului.
Fiecare fisier se ruleaza de doua ori: functia apelata cu intrarile cazului, apoi fisierul intreg
ca script, cu exemplul scris la sfarsitul lui, care trebuie sa dea aceleasi rezultate.

Fisierele generate si lista de cazuri le scrie testul tests/python.test.ts; rulare de mana,
dupa `npm test`: python python/verifica_export.py
"""

import contextlib
import importlib
import io
import json
import pathlib
import runpy
import sys

import numpy as np

AICI = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(AICI / "generat"))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")



def compara(caz, obtinut, unde):
    """Diferentele dintre rezultatele obtinute (nume din pseudocod -> valoare) si cele asteptate."""
    probleme = []
    for nume, asteptat in caz["asteptat"].items():
        valoare = np.asarray(obtinut[nume], dtype=float)
        # pozitiile sunt numarate de la 0 in Python si de la 1 in pseudocod
        if nume in caz["indici"]:
            valoare = valoare + 1
        asteptat = np.asarray(asteptat, dtype=float)
        if valoare.shape != asteptat.shape:
            probleme.append(f"{unde}{nume}: forma {valoare.shape} in loc de {asteptat.shape}")
            continue
        eroare = float(np.max(np.abs(valoare - asteptat))) if valoare.size else 0.0
        if not eroare <= 1e-9:
            probleme.append(f"{unde}{nume}: eroare {eroare:.2e}")
    return probleme


cazuri = json.loads((AICI / "generat" / "cazuri.json").read_text(encoding="utf-8"))
greseli = 0
for caz in cazuri:
    modul = importlib.import_module(caz["modul"])
    f = getattr(modul, caz["functie"])
    probleme = []
    try:
        rezultat = f(**caz["intrari"])
        oprit = False
    except RuntimeError:
        rezultat = ()
        oprit = True
    if oprit != caz["stop"]:
        probleme.append("s-a oprit cu stop" if oprit else "trebuia sa se opreasca cu stop")
    elif not oprit:
        if len(caz["iesiri"]) == 1:
            rezultat = (rezultat,)
        probleme += compara(caz, dict(zip(caz["iesiri"], rezultat)), "")

    # fisierul intreg, ca script: exemplul de la sfarsit lasa rezultatele in variabilele cu numele lor
    tiparit = io.StringIO()
    try:
        with contextlib.redirect_stdout(tiparit):
            globale = runpy.run_path(str(AICI / "generat" / f"{caz['modul']}.py"), run_name="__main__")
        oprit = False
    except RuntimeError:
        oprit = True
    if oprit != caz["stop"]:
        probleme.append("exemplu: s-a oprit cu stop" if oprit else "exemplu: trebuia sa se opreasca cu stop")
    elif not oprit:
        probleme += compara(caz, {nume: globale[py] for nume, py in zip(caz["iesiri"], caz["rezultateExemplu"])}, "exemplu: ")
        lipsa = [py for py in caz["rezultateExemplu"] if f"{py} =" not in tiparit.getvalue()]
        if lipsa:
            probleme.append(f"exemplu: nu tipareste {', '.join(lipsa)}")
        # comparatia cu NumPy tipareste diferenta; trebuie sa fie mica
        diferente = [float(l.split(":")[-1]) for l in tiparit.getvalue().splitlines() if l.startswith("diferenta maxima fata de NumPy:")]
        # Kaczmarz pe o matrice dreptunghiulara tipareste doar reziduul: solutia nu e unica
        if caz["cuNumpy"] and not diferente and "norma reziduului:" not in tiparit.getvalue():
            probleme.append("exemplu: nu tipareste comparatia cu NumPy")
        mari = [d for d in diferente if not d <= caz["pragNumpy"]]
        if mari:
            probleme.append(f"exemplu: diferenta fata de NumPy {mari[0]:.2e}")
    stare = "ok " if not probleme else "RAU"
    print(f"{stare} {caz['modul']:<12} {caz['descriere']:<40} {'; '.join(probleme)}")
    greseli += bool(probleme)

print(f"{len(cazuri)} cazuri, {greseli} cu probleme")
sys.exit(1 if greseli else 0)
