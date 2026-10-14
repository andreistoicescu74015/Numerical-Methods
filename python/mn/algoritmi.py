"""Traducerea literala a pseudocodului din curs in Python, rand cu rand.

Indicii sunt de la 1, ca in pseudocod: tablourile primite au o linie si o coloana in plus,
nefolosite (vezi `pad`). Functiile sunt oracolul numeric pentru interpretorul TypeScript:
`genereaza_fixturi.py` le ruleaza si scrie intrarile si iesirile in tests/fixtures.
"""

import math

import numpy as np


def pad(a):
    """Adauga linia si coloana 0, ca indicii sa inceapa de la 1."""
    a = np.asarray(a, dtype=float)
    if a.ndim == 1:
        return np.concatenate(([0.0], a))
    out = np.zeros((a.shape[0] + 1, a.shape[1] + 1))
    out[1:, 1:] = a
    return out


def r(a, b, pas=1):
    """i = a : b sau i = a : -1 : b."""
    return range(a, b + (1 if pas > 0 else -1), pas)


def matvec_linii(A, x, m, n):
    y = np.zeros(m + 1)
    for i in r(1, m):
        y[i] = 0
        for j in r(1, n):
            y[i] = y[i] + A[i, j] * x[j]
    return y


def mm(A, B, m, l, n):
    C = np.zeros((m + 1, n + 1))
    for j in r(1, n):
        for i in r(1, m):
            for k in r(1, l):
                C[i, j] = C[i, j] + A[i, k] * B[k, j]
    return C


def gpp(A, n):
    """Intoarce A cu U sus si multiplicatorii jos, si permutarile p (p[0] nefolosit)."""
    A = A.copy()
    p = np.zeros(n, dtype=int)
    for k in r(1, n - 1):
        ik = k
        for i in r(k, n):
            if abs(A[i, k]) > abs(A[ik, k]):
                ik = i
        p[k] = ik
        for j in r(k, n):
            A[k, j], A[ik, j] = A[ik, j], A[k, j]
        for i in r(k + 1, n):
            A[i, k] = A[i, k] / A[k, k]
        for j in r(k + 1, n):
            for i in r(k + 1, n):
                A[i, j] = A[i, j] - A[i, k] * A[k, j]
    return A, p


def s_gpp(A, b, n):
    F, p = gpp(A, n)
    b = b.copy()
    for k in r(1, n - 1):
        b[k], b[p[k]] = b[p[k]], b[k]
        for i in r(k + 1, n):
            b[i] = b[i] - F[i, k] * b[k]
    return utris(F, b, n), F, p, b


def ltris(L, b, n):
    x = b.copy()
    for i in r(1, n):
        for j in r(1, i - 1):
            x[i] = x[i] - L[i, j] * x[j]
        x[i] = x[i] / L[i, i]
    return x


def utris(U, b, n):
    x = b.copy()
    for i in r(n, 1, -1):
        for j in r(i + 1, n):
            x[i] = x[i] - U[i, j] * x[j]
        x[i] = x[i] / U[i, i]
    return x


def g(A, n):
    A = A.copy()
    for k in r(1, n - 1):
        for i in r(k + 1, n):
            A[i, k] = A[i, k] / A[k, k]
        for j in r(k + 1, n):
            for i in r(k + 1, n):
                A[i, j] = A[i, j] - A[i, k] * A[k, j]
    return A


def crout(A, n):
    A = A.copy()
    for k in r(1, n):
        for i in r(k, n):
            A[i, k] = A[i, k] - sum(A[i, s] * A[s, k] for s in r(1, k - 1))
        for j in r(k + 1, n):
            A[k, j] = (A[k, j] - sum(A[k, s] * A[s, j] for s in r(1, k - 1))) / A[k, k]
    return A


def chol(A, n):
    """Intoarce A cu L in triunghiul inferior, sau None daca A nu e pozitiv definita."""
    A = A.copy()
    for k in r(1, n):
        alfa = A[k, k] - sum(A[k, j] ** 2 for j in r(1, k - 1))
        if alfa <= 0:
            return None
        A[k, k] = math.sqrt(alfa)
        for i in r(k + 1, n):
            A[i, k] = (A[i, k] - sum(A[i, j] * A[k, j] for j in r(1, k - 1))) / A[k, k]
    return A


def sgn(v):
    return 1.0 if v >= 0 else -1.0


def qr(A, m, n):
    """Algoritmul QR din curs. Intoarce A, cu R in triunghiul superior si partea de sub diagonala
    a vectorilor Householder scalati in locul zerourilor, si beta (beta[k] = u_kk)."""
    A = A.copy()
    s = min(m - 1, n)
    beta = np.zeros(s + 1)
    for k in r(1, s):
        sigma = math.sqrt(sum(A[i, k] ** 2 for i in r(k, m)))
        if sigma != 0:
            sigma = sgn(A[k, k]) * sigma
            for i in r(k, m):
                A[i, k] = A[i, k] / sigma
            beta[k] = 1 + A[k, k]
            # u_kk sta si in A pana la sfarsitul pasului
            A[k, k] = beta[k]
            for j in r(k + 1, n):
                nu = sum(A[i, k] * A[i, j] for i in r(k, m)) / beta[k]
                for i in r(k, m):
                    A[i, j] = A[i, j] - nu * A[i, k]
            A[k, k] = -sigma
    return A, beta


def sqr(A, b, m, n):
    """Algoritmul SQR din curs, pornit de la iesirea lui QR: solutia in sensul celor mai mici
    patrate. Intoarce x, A si beta de la QR, b transformat (d = Q^T b) si norma reziduului."""
    A, beta = qr(A, m, n)
    b = b.copy()
    for k in r(1, n):
        t = A[k, k]
        A[k, k] = beta[k]
        nu = sum(A[i, k] * b[i] for i in r(k, m)) / beta[k]
        for i in r(k, m):
            b[i] = b[i] - nu * A[i, k]
        A[k, k] = t
    x = np.zeros(n + 1)
    for k in r(n, 1, -1):
        x[k] = (b[k] - sum(A[k, j] * x[j] for j in r(k + 1, n))) / A[k, k]
    rez = math.sqrt(sum(b[i] ** 2 for i in r(n + 1, m)))
    return x, A, beta, b, rez


def norma(v):
    return math.sqrt(sum(x * x for x in v))


def reziduu_relativ(A, x, b, m, n):
    """e = ||Ax - b|| / ||b||, cu produsul pe linii, ca in interpretor."""
    rez = [sum(A[i, j] * x[j] for j in r(1, n)) - b[i] for i in r(1, m)]
    return norma(rez) / norma(b[1:])


def jacobi(A, b, x, n, tol, maxiter):
    """Intoarce (x, k) sau (None, k) daca nu a convers in maxiter iteratii."""
    x = x.copy()
    y = np.zeros(n + 1)
    e = reziduu_relativ(A, x, b, n, n)
    k = 0
    while e > tol:
        if k >= maxiter:
            return None, k
        for i in r(1, n):
            y[i] = (b[i] - sum(A[i, j] * x[j] for j in r(1, i - 1)) - sum(A[i, j] * x[j] for j in r(i + 1, n))) / A[i, i]
        x = y.copy()
        e = reziduu_relativ(A, x, b, n, n)
        k = k + 1
    return x, k


def gauss_seidel(A, b, x, n, tol, maxiter):
    """Ca Jacobi, cu x actualizat pe loc. Intoarce (x, k) sau (None, k)."""
    x = x.copy()
    e = reziduu_relativ(A, x, b, n, n)
    k = 0
    while e > tol:
        if k >= maxiter:
            return None, k
        for i in r(1, n):
            x[i] = (b[i] - sum(A[i, j] * x[j] for j in r(1, i - 1)) - sum(A[i, j] * x[j] for j in r(i + 1, n))) / A[i, i]
        e = reziduu_relativ(A, x, b, n, n)
        k = k + 1
    return x, k


def kaczmarz(A, b, x, m, n, tol, maxiter):
    """Proiectii ciclice pe hiperplanele ecuatiilor. Intoarce (x, k) sau (None, k)."""
    x = x.copy()
    e = reziduu_relativ(A, x, b, m, n)
    k = 0
    while e > tol:
        if k >= maxiter:
            return None, k
        for i in r(1, m):
            alfa = (sum(A[i, j] * x[j] for j in r(1, n)) - b[i]) / norma(A[i, 1:]) ** 2
            for j in r(1, n):
                x[j] = x[j] - alfa * A[i, j]
        e = reziduu_relativ(A, x, b, m, n)
        k = k + 1
    return x, k


def rfg(x, k, m):
    """Reflectorul de indice k pentru x, in forma scalata din slide-uri. Intoarce (x, beta)."""
    x = x.copy()
    beta = 0.0
    if k < m:
        sigma = math.sqrt(sum(x[i] ** 2 for i in r(k, m)))
        if sigma != 0:
            sigma = sgn(x[k]) * sigma
            for i in r(k, m):
                x[i] = x[i] / sigma
            beta = 1 + x[k]
            x[k] = -sigma
    return x, beta


def mp(A, y, tol, maxiter):
    """Metoda puterii pe tablouri cu indici de la 0. Intoarce (y, i) sau (None, i)."""
    y = y / norma(y)
    i, e = 0, 1.0
    while e > tol:
        if i > maxiter:
            return None, i
        z = A @ y
        z = z / norma(z)
        e = abs(1 - abs(z @ y))
        y = z
        i = i + 1
    return y, i
