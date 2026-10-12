"""Ruleaza codul Python generat din pseudocod (python/generat/*.py) pe cazurile din
tests/fixtures/algoritmi.json si compara cu iesirile oracolului. Fisierele generate le scrie
testul tests/python.test.ts; rulare de mana: python python/verifica_export.py
"""

import importlib
import json
import pathlib
import sys

import numpy as np

AICI = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(AICI))
sys.path.insert(0, str(AICI / "generat"))
from mn.runtime import Oprire  # noqa: E402

fixturi = json.loads((AICI.parent / "tests" / "fixtures" / "algoritmi.json").read_text(encoding="utf-8"))
greseli = 0
for caz in fixturi["cazuri"]:
    nume = caz["algoritm"]
    try:
        modul = importlib.import_module(nume)
        f = getattr(modul, nume)
    except (ImportError, AttributeError) as e:
        print(f"LIPSA {nume}: {e}")
        greseli += 1
        continue
    intrari = {k: (np.asarray(v, dtype=float) if isinstance(v, list) else v) for k, v in caz["intrari"].items()}
    asteptat = caz["iesiri"]
    try:
        obtinut = f(**intrari)
        final = "gata"
    except Oprire:
        obtinut = {}
        final = "stop"
    probleme = []
    for cheie, val in asteptat.items():
        if cheie == "final":
            if final != val:
                probleme.append(f"final {final} in loc de {val}")
            continue
        if cheie not in obtinut:
            probleme.append(f"lipseste {cheie}")
            continue
        eroare = float(np.max(np.abs(np.asarray(obtinut[cheie], dtype=float) - np.asarray(val, dtype=float))))
        if not eroare <= 1e-9:
            probleme.append(f"{cheie}: eroare {eroare:.2e}")
    if final == "gata" and "final" in asteptat:
        probleme.append("trebuia sa se opreasca")
    stare = "ok " if not probleme else "RAU"
    print(f"{stare} {nume:<8} {caz['descriere']:<34} {'; '.join(probleme)}")
    greseli += bool(probleme)

print(f"{len(fixturi['cazuri'])} cazuri, {greseli} cu probleme")
sys.exit(1 if greseli else 0)
