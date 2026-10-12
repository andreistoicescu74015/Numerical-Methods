"""Compara algoritmii din mn/algoritmi.py cu functiile standard din NumPy, pe matrice aleatoare:
eroarea maxima fata de NumPy, flopii dupa formulele din curs si timpul de calcul.

Tabelul iese in Markdown, pentru raportul de colocviu. Rulare: python python/compara.py [n ...]
"""

import pathlib
import sys
import time

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from mn import algoritmi as alg  # noqa: E402

rng = np.random.default_rng(2026)


def cronometru(f):
    t0 = time.perf_counter()
    rez = f()
    return rez, (time.perf_counter() - t0) * 1000


def eroare(a, b):
    return float(np.max(np.abs(np.asarray(a) - np.asarray(b))))


def cazuri(n):
    m = 2 * n
    A = rng.standard_normal((n, n)) + n * np.eye(n)
    b = rng.standard_normal(n)
    S = A @ A.T + n * np.eye(n)
    Ar = rng.standard_normal((m, n))
    bm = rng.standard_normal(m)
    Sy = rng.standard_normal((n, n))
    Sy = Sy + Sy.T
    y0 = rng.standard_normal(n)
    L = np.tril(A)
    Ap, bp = alg.pad(A), alg.pad(b)

    x_np, t_np = cronometru(lambda: np.linalg.solve(L, b))
    x, t = cronometru(lambda: alg.ltris(alg.pad(L), bp, n)[1:])
    yield "LTRIS", "numpy.linalg.solve", eroare(x, x_np), n * n, t, t_np

    x_np, t_np = cronometru(lambda: np.linalg.solve(A, b))

    def g_utris():
        F = alg.g(Ap, n)
        d = bp.copy()
        for k in alg.r(1, n - 1):
            for i in alg.r(k + 1, n):
                d[i] = d[i] - F[i, k] * d[k]
        return alg.utris(F, d, n)[1:]

    x, t = cronometru(g_utris)
    yield "G + UTRIS", "numpy.linalg.solve", eroare(x, x_np), 2 * n**3 // 3 + 2 * n * n, t, t_np
    x, t = cronometru(lambda: alg.s_gpp(Ap, bp, n)[0][1:])
    yield "S_GPP", "numpy.linalg.solve", eroare(x, x_np), 2 * n**3 // 3 + 2 * n * n, t, t_np

    F, t = cronometru(lambda: alg.crout(Ap, n)[1:, 1:])
    Lc, Uc = np.tril(F), np.triu(F, 1) + np.eye(n)
    yield "LU Crout", "L·U față de A", eroare(Lc @ Uc, A), 2 * n**3 // 3, t, float("nan")

    L_np, t_np = cronometru(lambda: np.linalg.cholesky(S))
    Lch, t = cronometru(lambda: np.tril(alg.chol(alg.pad(S), n)[1:, 1:]))
    yield "CHOL", "numpy.linalg.cholesky", eroare(Lch, L_np), n**3 // 3, t, t_np

    R_np, t_np = cronometru(lambda: np.linalg.qr(Ar)[1])
    R, t = cronometru(lambda: np.triu(alg.tort(alg.pad(Ar), m, n)[0][1:, 1:])[:n])
    yield "TORT", "numpy.linalg.qr, |R|", eroare(np.abs(R), np.abs(R_np)), 2 * (m * n * n - n**3 // 3), t, t_np

    x_np, t_np = cronometru(lambda: np.linalg.lstsq(Ar, bm, rcond=None)[0])
    x, t = cronometru(lambda: alg.cmmp(alg.pad(Ar), alg.pad(bm), m, n)[0][1:])
    yield "CMMP", "numpy.linalg.lstsq", eroare(x, x_np), 2 * (m * n * n - n**3 // 3) + 2 * m * n + n * n, t, t_np

    w, t_np = cronometru(lambda: np.linalg.eigvalsh(Sy))
    (ym, it), t = cronometru(lambda: alg.mp(Sy, y0, 1e-10, 10000))
    lam = float(ym @ Sy @ ym) if ym is not None else float("nan")
    dominanta = w[np.argmax(np.abs(w))]
    yield f"MP ({it} iter.)", "numpy.linalg.eigvalsh, λ dominantă", abs(lam - dominanta), it * 2 * n * n, t, t_np


def main(argv):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    marimi = [int(a) for a in argv] or [5, 10, 20, 40]
    print("| algoritm | n | față de | eroare maximă | flopi (formula din curs) | timp (ms) | timp NumPy (ms) |")
    print("|---|---|---|---|---|---|---|")
    for n in marimi:
        for nume, ref, err, flopi, t, t_np in cazuri(n):
            tnp = "" if np.isnan(t_np) else f"{t_np:.3f}"
            print(f"| {nume} | {n} | {ref} | {err:.1e} | {flopi} | {t:.3f} | {tnp} |")


if __name__ == "__main__":
    main(sys.argv[1:])
