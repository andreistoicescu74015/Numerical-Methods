"""Functiile pe care le foloseste codul Python generat din pseudocod.

Tablourile sunt captusite: linia si coloana 0 nu se folosesc, ca indicii sa fie de la 1, ca in
pseudocod. `rezultat` scoate captuseala la sfarsit.
"""

import math

import numpy as np


class Oprire(Exception):
    """Instructiunea `stop` din pseudocod."""


def pad(a):
    a = np.asarray(a, dtype=float)
    if a.ndim == 1:
        return np.concatenate(([0.0], a))
    out = np.zeros((a.shape[0] + 1, a.shape[1] + 1))
    out[1:, 1:] = a
    return out


def unpad(a):
    a = np.asarray(a)
    return a[1:] if a.ndim == 1 else a[1:, 1:]


def zeros(*dims):
    return np.zeros(tuple(int(d) + 1 for d in dims))


def interval(a, b, pas=1):
    """i = a : b sau i = a : pas : b, cu capetele incluse."""
    a, b, pas = int(a), int(b), int(pas)
    return range(a, b + (1 if pas > 0 else -1), pas)


r = interval


def dimensiuni(**tablouri):
    """n pentru matrice patrate si vectori, m si n pentru matrice dreptunghiulare (ca in TypeScript)."""
    d = {}
    for t in tablouri.values():
        if t.ndim != 2:
            continue
        m, n = t.shape[0] - 1, t.shape[1] - 1
        if m == n:
            d.setdefault("n", n)
        else:
            d.setdefault("m", m)
            d.setdefault("n", n)
    for t in tablouri.values():
        if t.ndim == 1:
            d.setdefault("n", t.shape[0] - 1)
    return d


def linii(A):
    return A.shape[0] - 1


def coloane(A):
    return A.shape[1] - 1 if A.ndim == 2 else 1


def lungime(x):
    return x.size - 1 if x.ndim == 1 else (x.shape[0] - 1) * (x.shape[1] - 1)


def norma(x):
    x = np.asarray(x, dtype=float)
    return math.sqrt(float(np.sum(x * x)))


def sgn(x):
    return 1.0 if x >= 0 else -1.0


def argmax(interval, f):
    """Cel mai mic indice din interval la care f e maxima."""
    bun, unde = None, None
    for k in interval:
        v = f(k)
        if bun is None or v > bun:
            bun, unde = v, k
    if unde is None:
        raise ValueError("argmax pe un interval gol")
    return unde


def argmin(interval, f):
    bun, unde = None, None
    for k in interval:
        v = f(k)
        if bun is None or v < bun:
            bun, unde = v, k
    if unde is None:
        raise ValueError("argmin pe un interval gol")
    return unde


def matvec(A, y):
    return pad(A[1:, 1:] @ y[1:])


def dot(z, y):
    return float(z[1:] @ y[1:])


def vecmat(z, A):
    return pad(z[1:] @ A[1:, 1:])


def transpusa(A):
    return A.T.copy()


def rezultat(local):
    """Valorile functiei generate, fara captuseala si fara numele interne."""
    rez = {}
    for nume, v in local.items():
        if nume.startswith("_"):
            continue
        if isinstance(v, np.ndarray):
            rez[nume] = unpad(v)
        elif isinstance(v, (int, float, np.floating, np.integer)):
            rez[nume] = float(v)
    return rez
