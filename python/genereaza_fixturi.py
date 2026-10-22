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

# exemplul din curs (slide-ul 320, tabelul 4.1 din carte): 5 iteratii, fata de 23 la MP
Ac = np.array([[2.0, 3.0, 2.0, -6.0], [1.0, 0.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0], [0.0, 0.0, 1.0, 0.0]])
yc, ic = alg.mpi(Ac, np.array([1.0, 0.0, 0.0, 0.0]), 1e-15, 50)
assert yc is not None and ic == 5
cazuri.append({"algoritm": "MPI", "descriere": f"matricea companion din curs, {ic} iteratii", "intrari": {"A": lista(Ac), "y": [1.0, 0.0, 0.0, 0.0], "tol": 1e-15, "maxiter": 50}, "iesiri": {"y": lista(yc), "i": ic}})

# S_G: exemplul din curs cu pivotul 10^-4, in dubla precizie (solutia corecta), si o matrice cu
# submatricele lider nesingulare (cea diagonal dominanta de mai sus)
Asg = np.array([[0.0001, 1.0], [1.0, 1.0]])
bsg = np.array([1.0, 2.0])
xsg, Fsg, dsg = alg.s_g(alg.pad(Asg), alg.pad(bsg), 2)
assert np.allclose(Asg @ xsg[1:], bsg)
cazuri.append({"algoritm": "S_G", "descriere": "exemplul din curs cu pivotul 1e-4, dubla precizie", "intrari": {"A": lista(Asg), "b": lista(bsg)}, "iesiri": {"A": lista(Fsg[1:, 1:]), "b": lista(dsg[1:]), "x": lista(xsg[1:])}})
xs4, Fs4, ds4 = alg.s_g(alg.pad(A), alg.pad(b), n)
assert np.allclose(A @ xs4[1:], b)
cazuri.append({"algoritm": "S_G", "descriere": "n = 4, fara pivotare", "intrari": {"A": lista(A), "b": lista(b)}, "iesiri": {"A": lista(Fs4[1:, 1:]), "b": lista(ds4[1:]), "x": lista(xs4[1:])}})

# Gb si GPPb: exemplele din biblioteca (r = q = 1) si o matrice banda 6x6 cu r = 2, q = 1,
# diagonal dominanta, ca eliminarea fara pivotare sa aiba pivoti nenuli
Agb = np.array([[2.0, 1, 0, 0, 0], [4, 3, 1, 0, 0], [0, 3, 4, 1, 0], [0, 0, 2, 3, 1], [0, 0, 0, 1, 2]])
Fgb = alg.gb(alg.pad(Agb), 5, 1, 1)
Lgb = np.tril(Fgb[1:, 1:], -1) + np.eye(5)
assert np.allclose(Lgb @ np.triu(Fgb[1:, 1:]), Agb)
cazuri.append({"algoritm": "Gb", "descriere": "tridiagonala 5x5 din biblioteca", "intrari": {"A": lista(Agb), "r": 1, "q": 1}, "iesiri": {"A": lista(Fgb[1:, 1:])}})
nb = 6
Ab = rotunjit(rng.standard_normal((nb, nb)))
Ab = np.array([[Ab[i, j] if i - j <= 2 and j - i <= 1 else 0.0 for j in range(nb)] for i in range(nb)]) + nb * np.eye(nb)
Fb = alg.gb(alg.pad(Ab), nb, 2, 1)
assert np.allclose((np.tril(Fb[1:, 1:], -1) + np.eye(nb)) @ np.triu(Fb[1:, 1:]), Ab)
cazuri.append({"algoritm": "Gb", "descriere": "banda 6x6 cu r = 2, q = 1", "intrari": {"A": lista(Ab), "r": 2, "q": 1}, "iesiri": {"A": lista(Fb[1:, 1:])}})

Agppb = np.array([[1.0, 2, 0, 0, 0], [3, 1, 1, 0, 0], [0, 4, 1, 2, 0], [0, 0, 1, 3, 1], [0, 0, 0, 2, 1]])
Fgppb, pgppb = alg.gppb(alg.pad(Agppb), 5, 1, 1)
assert any(pgppb[k] != k for k in range(1, 5)), "exemplul GPPb trebuie sa aiba macar o interschimbare"
cazuri.append({"algoritm": "GPPb", "descriere": "banda 5x5 din biblioteca, cu interschimbari", "intrari": {"A": lista(Agppb), "r": 1, "q": 1}, "iesiri": {"A": lista(Fgppb[1:, 1:]), "p": lista(pgppb[1:])}})
Fb2, pb2 = alg.gppb(alg.pad(Ab), nb, 2, 1)
cazuri.append({"algoritm": "GPPb", "descriere": "banda 6x6 cu r = 2, q = 1", "intrari": {"A": lista(Ab), "r": 2, "q": 1}, "iesiri": {"A": lista(Fb2[1:, 1:]), "p": lista(pb2[1:])}})

# UTRISb: exemplul din biblioteca (q = 1) si o matrice superior banda 6x6 cu q = 2
Ub = np.array([[2.0, 1, 0, 0, 0], [0, 1, 1, 0, 0], [0, 0, 1, 1, 0], [0, 0, 0, 1, 1], [0, 0, 0, 0, 1]])
bub = np.array([3.0, 2, 2, 2, 1])
xub = alg.utrisb(alg.pad(Ub), alg.pad(bub), 5, 1)
assert np.allclose(Ub @ xub[1:], bub)
cazuri.append({"algoritm": "UTRISb", "descriere": "bidiagonala 5x5 din biblioteca", "intrari": {"U": lista(Ub), "b": lista(bub), "q": 1}, "iesiri": {"x": lista(xub[1:])}})
Ub2 = np.array([[Ab[i, j] if 0 <= j - i <= 2 else 0.0 for j in range(nb)] for i in range(nb)])
bub2 = rotunjit(rng.standard_normal(nb))
xub2 = alg.utrisb(alg.pad(Ub2), alg.pad(bub2), nb, 2)
assert np.allclose(Ub2 @ xub2[1:], bub2)
cazuri.append({"algoritm": "UTRISb", "descriere": "superior banda 6x6 cu q = 2", "intrari": {"U": lista(Ub2), "b": lista(bub2), "q": 2}, "iesiri": {"x": lista(xub2[1:])}})

iesire = pathlib.Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "algoritmi.json"
iesire.parent.mkdir(parents=True, exist_ok=True)
iesire.write_text(json.dumps({"sursa": "python/genereaza_fixturi.py, samanta 7", "cazuri": cazuri}, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"{len(cazuri)} cazuri scrise in {iesire}")
