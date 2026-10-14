"""Scrie tests/fixtures/algoritmi.json: intrari si iesiri pentru algoritmii din biblioteca.

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

R, beta = alg.qr(alg.pad(Ar), m, n)
# R, fara partea de sub diagonala, este cel de la NumPy pana la semnul liniilor
assert np.allclose(np.abs(np.triu(R[1:, 1:])[:n]), np.abs(np.linalg.qr(Ar)[1]))
cazuri.append({"algoritm": "QR", "descriere": "A 6x4", "intrari": {"A": lista(Ar)}, "iesiri": {"A": lista(R[1:, 1:]), "β": lista(beta[1:])}})

At = np.array([[2.0, 3.0], [-1.0, 1.0], [2.0, -1.0]])
Rt, bt = alg.qr(alg.pad(At), 3, 2)
# valorile de pe slide: u_1 = (5/3, -1/3, 2/3), beta_1 = 5/3, R cu diagonala (-3, -sqrt(10))
assert np.allclose(bt[1:], [5 / 3, 1 + 1.8 / np.sqrt(10)])
assert np.allclose(Rt[1:, 1:], [[-3, -1], [-1 / 3, -np.sqrt(10)], [2 / 3, -2.6 / np.sqrt(10)]])
cazuri.append({"algoritm": "QR", "descriere": "exemplul din curs, 3x2", "intrari": {"A": lista(At)}, "iesiri": {"A": lista(Rt[1:, 1:]), "β": lista(bt[1:])}})

# generator separat, ca valorile cazurilor de dupa sa ramana cele dinainte
Al = rotunjit(np.random.default_rng(11).standard_normal((3, 5)))
Rl, bl = alg.qr(alg.pad(Al), 3, 5)
cazuri.append({"algoritm": "QR", "descriere": "matrice lata, 3x5", "intrari": {"A": lista(Al)}, "iesiri": {"A": lista(Rl[1:, 1:]), "β": lista(bl[1:])}})

bm = rotunjit(rng.standard_normal(m))
xc, Rc, bc, dc, rc = alg.sqr(alg.pad(Ar), alg.pad(bm), m, n)
assert np.allclose(xc[1:], np.linalg.lstsq(Ar, bm, rcond=None)[0])
cazuri.append(
    {
        "algoritm": "SQR",
        "descriere": "A 6x4, b 6",
        "intrari": {"A": lista(Ar), "b": lista(bm)},
        "iesiri": {"A": lista(Rc[1:, 1:]), "β": lista(bc[1:]), "b": lista(dc[1:]), "x": lista(xc[1:]), "r": rc},
    }
)

xs3, Rs3, bs3, ds3, rs3 = alg.sqr(alg.pad(At), alg.pad(np.array([1.0, 2.0, 3.0])), 3, 2)
# exemplul din curs: x = (2/3, 0), reziduul minim sqrt(10)
assert np.allclose(xs3[1:], [2 / 3, 0]) and np.isclose(rs3, np.sqrt(10))
cazuri.append(
    {
        "algoritm": "SQR",
        "descriere": "exemplul din curs, 3x2",
        "intrari": {"A": lista(At), "b": [1.0, 2.0, 3.0]},
        "iesiri": {"A": lista(Rs3[1:, 1:]), "β": lista(bs3[1:]), "b": lista(ds3[1:]), "x": lista(xs3[1:]), "r": rs3},
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

# Cazurile de mai jos trag numere dupa toate cele de sus, ca fixture-urile vechi sa ramana aceleasi.
Ad = rotunjit(rng.standard_normal((n, n)) + 2 * n * np.eye(n))
bd = rotunjit(rng.standard_normal(n))
x0 = np.zeros(n)
exact = np.linalg.solve(Ad, bd)

xj, kj = alg.jacobi(alg.pad(Ad), alg.pad(bd), alg.pad(x0), n, 1e-6, 200)
assert xj is not None and np.linalg.norm(xj[1:] - exact) < 1e-5
cazuri.append({"algoritm": "JACOBI", "descriere": f"diagonal dominanta 4x4, {kj} iteratii", "intrari": {"A": lista(Ad), "b": lista(bd), "x": lista(x0), "tol": 1e-6, "maxiter": 200}, "iesiri": {"x": lista(xj[1:]), "k": kj}})

xg, kg = alg.gauss_seidel(alg.pad(Ad), alg.pad(bd), alg.pad(x0), n, 1e-6, 200)
assert xg is not None and np.linalg.norm(xg[1:] - exact) < 1e-5 and kg <= kj
cazuri.append({"algoritm": "GS", "descriere": f"diagonal dominanta 4x4, {kg} iteratii", "intrari": {"A": lista(Ad), "b": lista(bd), "x": lista(x0), "tol": 1e-6, "maxiter": 200}, "iesiri": {"x": lista(xg[1:]), "k": kg}})

Ak = rotunjit(rng.standard_normal((m, n)) + 2 * np.eye(m, n))
bk = Ak @ np.array([1.0, -2.0, 0.5, 3.0])
xk, kk = alg.kaczmarz(alg.pad(Ak), alg.pad(bk), alg.pad(x0), m, n, 1e-4, 300)
assert xk is not None and kk < 150 and np.linalg.norm(xk[1:] - np.array([1.0, -2.0, 0.5, 3.0])) < 1e-2
cazuri.append({"algoritm": "KACZMARZ", "descriere": f"compatibil 6x4, {kk} treceri", "intrari": {"A": lista(Ak), "b": lista(bk), "x": lista(x0), "tol": 1e-4, "maxiter": 300}, "iesiri": {"x": lista(xk[1:]), "k": kk}})

xr = rotunjit(rng.standard_normal(5))
xh, bh = alg.rfg(alg.pad(xr), 2, 5)
assert bh != 0
cazuri.append({"algoritm": "RFG", "descriere": "vector de 5, indice 2", "intrari": {"x": lista(xr), "k": 2}, "iesiri": {"x": lista(xh[1:]), "β": bh}})

iesire = pathlib.Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "algoritmi.json"
iesire.parent.mkdir(parents=True, exist_ok=True)
iesire.write_text(json.dumps({"sursa": "python/genereaza_fixturi.py, samanta 7", "cazuri": cazuri}, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"{len(cazuri)} cazuri scrise in {iesire}")
