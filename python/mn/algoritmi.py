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


def tort(A, m, n):
    A = A.copy()
    p = min(m - 1, n)
    U = np.zeros((m + 1, p + 1))
    beta = np.zeros(p + 1)
    for k in r(1, p):
        sigma = sgn(A[k, k]) * math.sqrt(sum(A[i, k] ** 2 for i in r(k, m)))
        if sigma == 0:
            beta[k] = 0
        else:
            U[k, k] = A[k, k] + sigma
            for i in r(k + 1, m):
                U[i, k] = A[i, k]
            beta[k] = sigma * U[k, k]
            A[k, k] = -sigma
            for i in r(k + 1, m):
                A[i, k] = 0
            for j in r(k + 1, n):
                tau = sum(U[i, k] * A[i, j] for i in r(k, m)) / beta[k]
                for i in r(k, m):
                    A[i, j] = A[i, j] - tau * U[i, k]
    return A, U, beta


def cmmp(A, b, m, n):
    """Solutia in sensul celor mai mici patrate; intoarce x, b transformat (d = Q^T b) si reziduul."""
    R, U, beta = tort(A, m, n)
    b = b.copy()
    for k in r(1, n):
        tau = sum(U[i, k] * b[i] for i in r(k, m)) / beta[k]
        for i in r(k, m):
            b[i] = b[i] - tau * U[i, k]
    x = np.zeros(n + 1)
    for i in r(n, 1, -1):
        x[i] = b[i]
        for j in r(i + 1, n):
            x[i] = x[i] - R[i, j] * x[j]
        x[i] = x[i] / R[i, i]
    rez = math.sqrt(sum(b[i] ** 2 for i in r(n + 1, m)))
    return x, R, U, beta, b, rez


def norma(v):
    return math.sqrt(sum(x * x for x in v))


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
