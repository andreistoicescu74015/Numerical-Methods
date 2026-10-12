"""Scrie tests/fixtures/algoritmi.json: intrari si iesiri pentru cei opt algoritmi de examen.

Iesirile vin din mn/algoritmi.py, traducerea literala a pseudocodului. Interpretorul
TypeScript ruleaza acelasi pseudocod pe aceleasi intrari si trebuie sa dea aceleasi numere.
Rulare din radacina repo-ului: python python/genereaza_fixturi.py
"""

import json
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from mn import algoritmi as alg  # noqa: E402

rng = np.random.default_rng(7)
n, m = 4, 6


def rotunjit(a):
    """Numere cu o zecimala: usor de citit cand un test pica."""
    return np.round(a, 1)


def lista(a):
    return np.asarray(a).tolist()


cazuri = []

A = rotunjit(rng.standard_normal((n, n)) + n * np.eye(n))
b = rotunjit(rng.standard_normal(n))
x = rotunjit(rng.standard_normal(n))
Ar = rotunjit(rng.standard_normal((m, n)))

y = alg.matvec_linii(alg.pad(Ar), alg.pad(x), m, n)
cazuri.append({"algoritm": "matvec", "descriere": "A 6x4", "intrari": {"A": lista(Ar), "x": lista(x)}, "iesiri": {"y": lista(y[1:])}})

B1 = rotunjit(rng.standard_normal((3, 2)))
B2 = rotunjit(rng.standard_normal((2, 4)))
Cm = alg.mm(alg.pad(B1), alg.pad(B2), 3, 2, 4)
cazuri.append({"algoritm": "matmul", "descriere": "3x2 ori 2x4", "intrari": {"A": lista(B1), "B": lista(B2)}, "iesiri": {"C": lista(Cm[1:, 1:])}})

L = np.tril(A)
cazuri.append({"algoritm": "LTRIS", "descriere": "n = 4", "intrari": {"L": lista(L), "b": lista(b)}, "iesiri": {"x": lista(alg.ltris(alg.pad(L), alg.pad(b), n)[1:])}})

U = np.triu(A)
cazuri.append({"algoritm": "UTRIS", "descriere": "n = 4", "intrari": {"U": lista(U), "b": lista(b)}, "iesiri": {"x": lista(alg.utris(alg.pad(U), alg.pad(b), n)[1:])}})

cazuri.append({"algoritm": "G", "descriere": "n = 4", "intrari": {"A": lista(A)}, "iesiri": {"A": lista(alg.g(alg.pad(A), n)[1:, 1:])}})

A3 = np.array([[1.0, 2.0, 1.0], [2.0, 1.0, 2.0], [1.0, 1.0, 2.0]])
cazuri.append({"algoritm": "G", "descriere": "exemplul din curs", "intrari": {"A": lista(A3)}, "iesiri": {"A": lista(alg.g(alg.pad(A3), 3)[1:, 1:])}})

Ap = rotunjit(rng.standard_normal((n, n)))
Fp, pp = alg.gpp(alg.pad(Ap), n)
cazuri.append({"algoritm": "GPP", "descriere": "n = 4, cu permutari", "intrari": {"A": lista(Ap)}, "iesiri": {"A": lista(Fp[1:, 1:]), "p": lista(pp[1:])}})
assert any(pp[k] != k for k in range(1, n)), "exemplul GPP trebuie sa aiba macar o interschimbare"

xs, Fs, ps, bs = alg.s_gpp(alg.pad(Ap), alg.pad(b), n)
cazuri.append(
    {
        "algoritm": "S_GPP",
        "descriere": "n = 4",
        "intrari": {"A": lista(Ap), "b": lista(b)},
        "iesiri": {"A": lista(Fs[1:, 1:]), "p": lista(ps[1:]), "b": lista(bs[1:]), "x": lista(xs[1:])},
    }
)
assert np.allclose(Ap @ xs[1:], b)

cazuri.append({"algoritm": "LU", "descriere": "Crout, n = 4", "intrari": {"A": lista(A)}, "iesiri": {"A": lista(alg.crout(alg.pad(A), n)[1:, 1:])}})

S = rotunjit(A @ A.T + n * np.eye(n))
cazuri.append({"algoritm": "CHOL", "descriere": "pozitiv definita, n = 4", "intrari": {"A": lista(S)}, "iesiri": {"A": lista(alg.chol(alg.pad(S), n)[1:, 1:])}})

nedef = S.copy()
nedef[2, 2] = -1.0
assert alg.chol(alg.pad(nedef), n) is None
cazuri.append({"algoritm": "CHOL", "descriere": "nu e pozitiv definita: se opreste", "intrari": {"A": lista(nedef)}, "iesiri": {"final": "stop"}})

R, Uh, beta = alg.tort(alg.pad(Ar), m, n)
cazuri.append(
    {
        "algoritm": "TORT",
        "descriere": "A 6x4",
        "intrari": {"A": lista(Ar)},
        "iesiri": {"A": lista(R[1:, 1:]), "U": lista(Uh[1:, 1:]), "β": lista(beta[1:])},
    }
)

At = np.array([[2.0, 3.0], [-1.0, 1.0], [2.0, -1.0]])
Rt, Ut, bt = alg.tort(alg.pad(At), 3, 2)
cazuri.append(
    {
        "algoritm": "TORT",
        "descriere": "exemplul din curs, 3x2",
        "intrari": {"A": lista(At)},
        "iesiri": {"A": lista(Rt[1:, 1:]), "U": lista(Ut[1:, 1:]), "β": lista(bt[1:])},
    }
)

bm = rotunjit(rng.standard_normal(m))
xc, Rc, Uc, bc, dc, rc = alg.cmmp(alg.pad(Ar), alg.pad(bm), m, n)
assert np.allclose(xc[1:], np.linalg.lstsq(Ar, bm, rcond=None)[0])
cazuri.append(
    {
        "algoritm": "CMMP",
        "descriere": "A 6x4, b 6",
        "intrari": {"A": lista(Ar), "b": lista(bm)},
        "iesiri": {"A": lista(Rc[1:, 1:]), "U": lista(Uc[1:, 1:]), "β": lista(bc[1:]), "b": lista(dc[1:]), "x": lista(xc[1:]), "r": rc},
    }
)

Sy = rotunjit(rng.standard_normal((n, n)))
Sy = Sy + Sy.T
y0 = rotunjit(rng.standard_normal(n))
ym, it = alg.mp(Sy, y0, 1e-10, 500)
assert ym is not None
cazuri.append(
    {
        "algoritm": "MP",
        "descriere": f"simetrica 4x4, {it} iteratii",
        "intrari": {"A": lista(Sy), "y": lista(y0), "tol": 1e-10, "maxiter": 500},
        "iesiri": {"y": lista(ym), "i": it},
    }
)

iesire = pathlib.Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "algoritmi.json"
iesire.parent.mkdir(parents=True, exist_ok=True)
iesire.write_text(json.dumps({"sursa": "python/genereaza_fixturi.py, samanta 7", "cazuri": cazuri}, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"{len(cazuri)} cazuri scrise in {iesire}")
