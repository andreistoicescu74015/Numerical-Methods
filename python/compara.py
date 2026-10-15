"""Compara algoritmii din mn/algoritmi.py cu functiile standard din NumPy, pe matrice aleatoare:
eroarea maxima fata de NumPy, flopii si timpul de calcul. Flopii metodelor directe sunt
formulele din curs si din cartea cursului; la metodele iterative sunt numarati pe pseudocodul din
biblioteca vizualizatorului, al carui test de oprire nu este pe slide-uri.

Tabelul iese in Markdown, pentru raportul de colocviu. Rulare: python python/compara.py [n ...]
"""

import os
import pathlib
import sys
import timeit

# BLAS pe un singur fir, setat inainte de importul NumPy: pe matrice atat de mici, pornirea firelor
# costa mai mult decat calculul (np.linalg.solve pe 40 x 40 dura 22 ms cu firele OpenBLAS si 0.01
# ms fara ele), iar firele ramase active incetineau si codul Python masurat dupa ele
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")

import numpy as np  # noqa: E402

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from mn import algoritmi as alg  # noqa: E402

rng = np.random.default_rng(2026)


def fara_incetinire():
    """Cere Windows sa nu incetineasca procesul.

    Windows muta un proces care nu e in prim-plan pe nuclee mai lente si ii scade frecventa
    (EcoQoS), iar acelasi rand al tabelului iesea de pana la 2.5 ori mai lent de la o rulare la
    alta. Cu SetProcessInformation(ProcessPowerThrottling), ControlMask =
    PROCESS_POWER_THROTTLING_EXECUTION_SPEED si StateMask = 0, trei rulari au dat timpi care difera
    cu cel mult 7%. Pe alte sisteme nu face nimic.
    """
    if sys.platform != "win32":
        return
    import ctypes
    from ctypes import wintypes

    class Stare(ctypes.Structure):
        _fields_ = [("Version", wintypes.ULONG), ("ControlMask", wintypes.ULONG), ("StateMask", wintypes.ULONG)]

    k32 = ctypes.WinDLL("kernel32")
    k32.GetCurrentProcess.restype = wintypes.HANDLE
    k32.SetProcessInformation.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD]
    stare = Stare(1, 1, 0)
    # 4 este ProcessPowerThrottling in PROCESS_INFORMATION_CLASS
    k32.SetProcessInformation(k32.GetCurrentProcess(), 4, ctypes.byref(stare), ctypes.sizeof(stare))


def cronometru(f):
    """Rezultatul lui f si durata unui apel, in ms.

    Un singur apel masurat o data e mai ales zgomot: primul apel plateste pornirea bibliotecilor,
    iar sistemul poate intrerupe oricare altul (np.linalg.solve pe 40 x 40 a iesit o data 77 ms,
    apoi intre 1.7 si 18 ms). De aceea primul apel, cel care da rezultatul, ramane in afara
    masurarii, apelurile se grupeaza cate trebuie ca un grup sa dureze cel putin 20 ms, iar din 5
    grupuri se pastreaza cel mai rapid: documentatia lui timeit.Timer.repeat spune ca valorile mai
    mari vin de la alte procese, nu de la codul masurat.
    """
    rez = f()
    cronometru_ = timeit.Timer(f)
    numar = 1
    while cronometru_.timeit(numar) < 0.02:
        numar *= 2
    return rez, min(cronometru_.repeat(repeat=5, number=numar)) / numar * 1000


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
    R, t = cronometru(lambda: np.triu(alg.qr(alg.pad(Ar), m, n)[0][1:, 1:])[:n])
    # "|" desparte celulele in Markdown, deci modulul se scrie \|R\|
    yield "QR", "numpy.linalg.qr, \\|R\\|", eroare(np.abs(R), np.abs(R_np)), 2 * (m * n * n - n**3 // 3), t, t_np

    x_np, t_np = cronometru(lambda: np.linalg.lstsq(Ar, bm, rcond=None)[0])
    x, t = cronometru(lambda: alg.sqr(alg.pad(Ar), alg.pad(bm), m, n)[0][1:])
    yield "SQR", "numpy.linalg.lstsq", eroare(x, x_np), 2 * (m * n * n - n**3 // 3) + 4 * m * n - n * n, t, t_np

    w, t_np = cronometru(lambda: np.linalg.eigvalsh(Sy))
    (ym, it), t = cronometru(lambda: alg.mp(Sy, y0, 1e-10, 10000))
    lam = float(ym @ Sy @ ym) if ym is not None else float("nan")
    dominanta = w[np.argmax(np.abs(w))]
    yield f"MP ({it} iter.)", "numpy.linalg.eigvalsh, λ dominantă", abs(lam - dominanta), it * 2 * n * n, t, t_np

    # metodele iterative, pe o matrice strict diagonal dominanta; x porneste de la zero
    Ad = rng.standard_normal((n, n)) + 2 * n * np.eye(n)
    bd = rng.standard_normal(n)
    zero = alg.pad(np.zeros(n))
    x_np, t_np = cronometru(lambda: np.linalg.solve(Ad, bd))
    for nume, metoda in (("Jacobi", alg.jacobi), ("Gauss-Seidel", alg.gauss_seidel)):
        (x, it), t = cronometru(lambda: metoda(alg.pad(Ad), alg.pad(bd), zero, n, 1e-10, 1000))
        yield f"{nume} ({it} iter.)", "numpy.linalg.solve", eroare(x[1:], x_np), (4 * it + 2) * n * n, t, t_np
    (x, it), t = cronometru(lambda: alg.kaczmarz(alg.pad(Ad), alg.pad(bd), zero, n, n, 1e-10, 5000))
    yield f"Kaczmarz ({it} treceri)", "numpy.linalg.solve", eroare(x[1:], x_np), (8 * it + 2) * n * n, t, t_np


def main(argv):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    fara_incetinire()
    marimi = [int(a) for a in argv] or [5, 10, 20, 40]
    print("| algoritm | n | față de | eroare maximă | flopi | timp (ms) | timp NumPy (ms) |")
    print("|---|---|---|---|---|---|---|")
    for n in marimi:
        for nume, ref, err, flopi, t, t_np in cazuri(n):
            tnp = "" if np.isnan(t_np) else f"{t_np:.3f}"
            print(f"| {nume} | {n} | {ref} | {err:.1e} | {flopi} | {t:.3f} | {tnp} |")
    print()
    print("Timpul este durata unui apel: după un apel de încălzire, cel mai rapid din 5 grupuri de apeluri de cel puțin 20 ms fiecare, cu BLAS pe un singur fir.")


if __name__ == "__main__":
    main(sys.argv[1:])
