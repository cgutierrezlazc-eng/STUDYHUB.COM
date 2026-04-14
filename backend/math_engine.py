"""
Motor de Cálculo — Conniku
Combina SymPy (cómputo simbólico exacto) + Claude API (explicación pedagógica) +
Matplotlib (gráficos) + SciPy (estadística).

Capacidades:
  - Derivadas, integrales, límites, series de Taylor
  - Ecuaciones y sistemas de ecuaciones
  - Álgebra lineal (matrices, det, eigenvalores, rango)
  - Ecuaciones diferenciales (1er y 2do orden)
  - Estadística: media, varianza, desv. estándar, correlación
  - Graficación 2D de funciones
  - Conversiones de unidades (pint)
  - Verificar la solución del alumno
  - Lenguaje natural en español/inglés → operación SymPy
"""
from __future__ import annotations

import base64
import io
import json
import logging
import os
import re
from typing import Optional

log = logging.getLogger(__name__)

# ── SymPy imports ──────────────────────────────────────────────────────────────
from sympy import (
    symbols, sympify, solve, diff, integrate, limit, series,
    Matrix, simplify, expand, factor, apart, cancel, dsolve, Function,
    sin, cos, tan, asin, acos, atan, sinh, cosh, tanh,
    log as sym_log, exp, sqrt, pi, oo, E, I,
    latex, pretty, nsimplify, Rational, Abs,
    det, trace, eigenvals, eigenvects, zeros as sym_zeros,
    eye as sym_eye, Eq, Symbol, Number,
)
from sympy.parsing.sympy_parser import (
    parse_expr, standard_transformations,
    implicit_multiplication_application, convert_xor,
)
from sympy.solvers.ode import dsolve as sym_dsolve

# ── Optional heavy deps (graceful fallback) ────────────────────────────────────
try:
    import numpy as np
    import scipy.stats as _stats
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False
    log.warning("[MathEngine] scipy not available — statistics disabled")

try:
    import matplotlib
    matplotlib.use("Agg")          # non-interactive backend, safe for servers
    import matplotlib.pyplot as plt
    import numpy as _np_graph
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False
    log.warning("[MathEngine] matplotlib not available — graphing disabled")

try:
    import pint
    _ureg = pint.UnitRegistry()
    HAS_PINT = True
except ImportError:
    HAS_PINT = False

# ── Claude client (reuse existing env key) ─────────────────────────────────────
_claude_client = None
try:
    import anthropic as _anthropic
    _api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if _api_key:
        _claude_client = _anthropic.Anthropic(api_key=_api_key)
except Exception:
    pass

TRANSFORMATIONS = standard_transformations + (
    implicit_multiplication_application,
    convert_xor,
)

_COMMON_SYMS = {n: Symbol(n) for n in "x y z t n a b c k m p q r s u v w"}


# ══════════════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════════════

def _parse(expr_str: str):
    """Parse a math expression string → SymPy expression."""
    clean = expr_str.strip()
    # Remove common Spanish prefixes
    for prefix in [
        "derivar ", "derivada de ", "integrar ", "integral de ",
        "calcular ", "resolver ", "simplificar ", "factorizar ",
        "limite de ", "lim de ", "evaluar ",
    ]:
        if clean.lower().startswith(prefix):
            clean = clean[len(prefix):].strip()
    # ^ → ** for powers (convert_xor handles this but just in case)
    clean = clean.replace("^", "**")
    return parse_expr(clean, local_dict=_COMMON_SYMS, transformations=TRANSFORMATIONS)


def _ai_explain(operation: str, input_latex: str, result_latex: str,
                steps_raw: list[str], language: str = "es") -> str:
    """
    Ask Claude to produce a clear, pedagogical step-by-step explanation.
    Falls back to the raw SymPy steps if Claude is unavailable.
    """
    if not _claude_client:
        return "\n".join(steps_raw) if steps_raw else f"Resultado: ${result_latex}$"

    lang_name = "español" if language == "es" else "inglés" if language == "en" else language
    steps_text = "\n".join(steps_raw) if steps_raw else "(sin pasos intermedios)"

    prompt = (
        f"Operación: {operation}\n"
        f"Expresión de entrada (LaTeX): {input_latex}\n"
        f"Resultado (LaTeX): {result_latex}\n"
        f"Pasos crudos de SymPy:\n{steps_text}\n\n"
        "Escribe una explicación pedagógica, paso a paso, clara y amigable para un estudiante universitario. "
        "Usa notación LaTeX entre $...$ para las expresiones matemáticas. "
        f"Responde SOLO la explicación en {lang_name}, sin encabezados extra."
    )
    try:
        resp = _claude_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.content[0].text.strip()
    except Exception as e:
        log.warning(f"[MathEngine] Claude explain error: {e}")
        return "\n".join(steps_raw)


def _graph_function(expr_str: str, var: str = "x",
                    x_min: float = -10, x_max: float = 10) -> Optional[str]:
    """Render a function as a matplotlib PNG → base64. Returns None if unavailable."""
    if not HAS_MATPLOTLIB:
        return None
    try:
        expr = _parse(expr_str)
        sym = Symbol(var)
        xs = _np_graph.linspace(x_min, x_max, 800)
        f = _np_graph.vectorize(lambda v: float(expr.subs(sym, v).evalf()))
        ys = f(xs)

        fig, ax = plt.subplots(figsize=(7, 4))
        ax.plot(xs, ys, color="#6366F1", linewidth=2)
        ax.axhline(0, color="gray", linewidth=0.8)
        ax.axvline(0, color="gray", linewidth=0.8)
        ax.set_xlabel(var)
        ax.set_ylabel(f"f({var})")
        ax.set_title(f"$f({var}) = {latex(expr)}$", fontsize=11)
        ax.grid(True, alpha=0.3)
        fig.tight_layout()

        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=120)
        plt.close(fig)
        buf.seek(0)
        return base64.b64encode(buf.read()).decode()
    except Exception as e:
        log.warning(f"[MathEngine] graph error: {e}")
        return None


def _detect_variable(expr) -> Symbol:
    """Return the most likely free variable in an expression."""
    free = list(expr.free_symbols)
    if not free:
        return Symbol("x")
    priority = ["x", "t", "y", "z", "n"]
    for p in priority:
        for s in free:
            if s.name == p:
                return s
    return free[0]


# ══════════════════════════════════════════════════════════════════════════════
# Main MathEngine class
# ══════════════════════════════════════════════════════════════════════════════

class MathEngine:

    def solve(self, expression: str, step_by_step: bool = True,
              language: str = "es") -> dict:
        """
        Route the expression to the appropriate operation.
        Always returns a dict with at least: type, input, result, steps, explanation.
        """
        try:
            return self._route(expression.strip(), step_by_step, language)
        except Exception as e:
            return {
                "type": "error",
                "error": str(e),
                "expression": expression,
                "tip": "Verifica la sintaxis. Ejemplo: 'derivar x**3 + 2*x'",
            }

    # ── Router ─────────────────────────────────────────────────────────────────

    def _route(self, expr: str, step_by_step: bool, lang: str) -> dict:
        low = expr.lower()

        # Differential equations
        if any(k in low for k in ["y''", "y'", "dy/dx", "ecuacion diferencial", "ode"]):
            return self._ode(expr, step_by_step, lang)

        # Statistics
        if any(k in low for k in ["media ", "promedio ", "varianza ", "desviacion", "estadistica",
                                   "correlacion", "lista:", "datos:"]):
            return self._statistics(expr, step_by_step, lang)

        # Graphing
        if any(k in low for k in ["graficar", "grafica", "plot", "dibuja", "traza"]):
            return self._graph(expr, step_by_step, lang)

        # Matrix
        if any(k in low for k in ["matriz", "matrix", "[[", "determinante", "eigenvalor",
                                   "valor propio", "inversa"]):
            return self._matrix(expr, step_by_step, lang)

        # Derivative
        if any(k in low for k in ["derivar", "derivada", "d/dx", "d/dt", "diferenci"]):
            return self._derivative(expr, step_by_step, lang)

        # Integral
        if any(k in low for k in ["integrar", "integral", "∫", "antiderivada", "primitiva"]):
            return self._integral(expr, step_by_step, lang)

        # Limit
        if any(k in low for k in ["limite", "lim ", "lim(", "límite"]):
            return self._limit(expr, step_by_step, lang)

        # Taylor series
        if any(k in low for k in ["serie", "taylor", "maclaurin"]):
            return self._series(expr, step_by_step, lang)

        # Factor / simplify / expand
        if "factorizar" in low or "factor " in low:
            return self._factor(expr, step_by_step, lang)
        if "simplificar" in low or "simplifica" in low:
            return self._symplify_op(expr, step_by_step, lang)
        if "expandir" in low or "expande" in low:
            return self._expand(expr, step_by_step, lang)

        # Equation (contains =)
        if "=" in expr and "resolver" in low:
            return self._equation(expr, step_by_step, lang)
        if "=" in expr:
            return self._equation(expr, step_by_step, lang)

        # Unit conversion
        if any(k in low for k in ["convertir", "convierte", "a metros", "a km", "a kg",
                                   "a celsius", "a fahrenheit"]):
            return self._unit_convert(expr, lang)

        # Default: evaluate / simplify
        return self._evaluate(expr, step_by_step, lang)

    # ── Derivative ─────────────────────────────────────────────────────────────

    def _derivative(self, expression: str, sbys: bool, lang: str) -> dict:
        # Check for order (segunda derivada, etc.)
        order = 1
        low = expression.lower()
        if "segunda" in low or "2da" in low or "order=2" in low:
            order = 2
        elif "tercera" in low or "3ra" in low or "order=3" in low:
            order = 3

        # Extract variable (d/dt → t, d/dx → x)
        var = Symbol("x")
        m = re.search(r"d/d([a-z])", low)
        if m:
            var = Symbol(m.group(1))

        expr = _parse(expression)
        result = diff(expr, var, order)

        steps = [
            f"$f({var}) = {latex(expr)}$",
            f"Derivando respecto a ${var}$" + (f" ({order}ª vez)" if order > 1 else ""),
            f"$f'({var}) = {latex(result)}$",
        ]
        expl = _ai_explain("derivada", latex(expr), latex(result), steps, lang) if sbys else ""

        graph = None
        if HAS_MATPLOTLIB:
            try:
                graph = _graph_function(str(expr), str(var))
            except Exception:
                pass

        return {
            "type": "derivative",
            "input_latex": latex(expr),
            "result_latex": latex(result),
            "result_pretty": pretty(result, use_unicode=True),
            "steps": steps,
            "explanation": expl,
            "graph_b64": graph,
            "order": order,
        }

    # ── Integral ───────────────────────────────────────────────────────────────

    def _integral(self, expression: str, sbys: bool, lang: str) -> dict:
        # Detect definite integral: "integral de ... de a a b"
        m = re.search(r"de\s+(-?[\d.π∞]+)\s+a\s+(-?[\d.π∞]+)", expression.lower())
        is_definite = bool(m)

        var = Symbol("x")
        expr = _parse(expression)

        if is_definite:
            a_str = m.group(1).replace("π", "pi").replace("∞", "oo")
            b_str = m.group(2).replace("π", "pi").replace("∞", "oo")
            a_val = sympify(a_str)
            b_val = sympify(b_str)
            result = integrate(expr, (var, a_val, b_val))
            steps = [
                f"Integral definida: $\\int_{{{latex(a_val)}}}^{{{latex(b_val)}}} {latex(expr)} \\, d{var}$",
                f"Resultado: ${latex(result)}$",
            ]
        else:
            result = integrate(expr, var)
            steps = [
                f"$\\int {latex(expr)} \\, d{var}$",
                f"Resultado: ${latex(result)} + C$",
            ]

        expl = _ai_explain(
            "integral" + (" definida" if is_definite else " indefinida"),
            latex(expr), latex(result), steps, lang
        ) if sbys else ""

        return {
            "type": "integral",
            "definite": is_definite,
            "input_latex": latex(expr),
            "result_latex": latex(result) + ("" if is_definite else " + C"),
            "result_pretty": pretty(result, use_unicode=True),
            "steps": steps,
            "explanation": expl,
        }

    # ── Limit ──────────────────────────────────────────────────────────────────

    def _limit(self, expression: str, sbys: bool, lang: str) -> dict:
        var = Symbol("x")
        # Detect "lim x→a" or "x tiende a a" or "x→∞"
        point = sympify(0)
        m = re.search(r"(?:→|->|tiende\s+a|cuando)\s*(-?[\w./π∞]+)", expression.lower())
        if m:
            raw = m.group(1).replace("π", "pi").replace("∞", "oo").replace("inf", "oo")
            try:
                point = sympify(raw)
            except Exception:
                pass

        expr = _parse(expression)
        result = limit(expr, var, point)

        steps = [
            f"$\\lim_{{x \\to {latex(point)}}} {latex(expr)}$",
            f"Resultado: ${latex(result)}$",
        ]
        expl = _ai_explain("límite", latex(expr), latex(result), steps, lang) if sbys else ""

        return {
            "type": "limit",
            "input_latex": latex(expr),
            "point_latex": latex(point),
            "result_latex": latex(result),
            "steps": steps,
            "explanation": expl,
        }

    # ── Taylor Series ──────────────────────────────────────────────────────────

    def _series(self, expression: str, sbys: bool, lang: str) -> dict:
        var = Symbol("x")
        n_terms = 5
        m = re.search(r"(\d+)\s*t[eé]rminos?", expression.lower())
        if m:
            n_terms = int(m.group(1))

        expr = _parse(expression)
        result = series(expr, var, 0, n_terms)

        steps = [
            f"Serie de Taylor de ${latex(expr)}$ alrededor de $x=0$",
            f"Primeros {n_terms} términos:",
            f"${latex(result)}$",
        ]
        expl = _ai_explain("serie de Taylor", latex(expr), latex(result), steps, lang) if sbys else ""

        return {
            "type": "series",
            "input_latex": latex(expr),
            "result_latex": latex(result),
            "steps": steps,
            "explanation": expl,
        }

    # ── Equation Solver ────────────────────────────────────────────────────────

    def _equation(self, expression: str, sbys: bool, lang: str) -> dict:
        # System of equations? (multiple lines or semicolons)
        if "\n" in expression or ";" in expression:
            return self._system_equations(expression, sbys, lang)

        expr_str = expression.lower().replace("resolver", "").strip()
        if "=" in expr_str:
            left, right = expr_str.split("=", 1)
            combined = _parse(f"({left.strip()}) - ({right.strip()})")
        else:
            combined = _parse(expr_str)

        var = _detect_variable(combined)
        solutions = solve(combined, var)

        sol_latex = [latex(s) for s in solutions]
        steps = [
            f"Ecuación: ${latex(combined)} = 0$",
            f"Resolviendo para ${var}$",
            f"Soluciones: {', '.join(f'${var} = {s}$' for s in sol_latex) or 'Sin solución real'}",
        ]
        expl = _ai_explain("ecuación", latex(combined), ", ".join(sol_latex), steps, lang) if sbys else ""

        return {
            "type": "equation",
            "input_latex": latex(combined) + " = 0",
            "solutions_latex": sol_latex,
            "steps": steps,
            "explanation": expl,
        }

    def _system_equations(self, expression: str, sbys: bool, lang: str) -> dict:
        lines = [l.strip() for l in re.split(r"[;\n]", expression) if l.strip() and "resolver" not in l.lower()]
        equations = []
        all_vars = set()
        for line in lines:
            if "=" in line:
                l, r = line.split("=", 1)
                eq_expr = _parse(f"({l.strip()}) - ({r.strip()})")
            else:
                eq_expr = _parse(line)
            equations.append(eq_expr)
            all_vars |= eq_expr.free_symbols

        result = solve(equations, list(all_vars))
        result_str = str(result)
        steps = [f"Sistema de {len(equations)} ecuaciones", f"Solución: {result_str}"]
        expl = _ai_explain("sistema de ecuaciones", str(lines), result_str, steps, lang) if sbys else ""

        return {
            "type": "system",
            "equations_latex": [latex(e) + " = 0" for e in equations],
            "result": result_str,
            "steps": steps,
            "explanation": expl,
        }

    # ── Factor / Simplify / Expand ─────────────────────────────────────────────

    def _factor(self, expression: str, sbys: bool, lang: str) -> dict:
        expr = _parse(expression)
        result = factor(expr)
        steps = [f"${latex(expr)}$", f"Factorizado: ${latex(result)}$"]
        expl = _ai_explain("factorización", latex(expr), latex(result), steps, lang) if sbys else ""
        return {"type": "factor", "input_latex": latex(expr), "result_latex": latex(result),
                "steps": steps, "explanation": expl}

    def _symplify_op(self, expression: str, sbys: bool, lang: str) -> dict:
        expr = _parse(expression)
        result = simplify(expr)
        steps = [f"${latex(expr)}$", f"Simplificado: ${latex(result)}$"]
        expl = _ai_explain("simplificación", latex(expr), latex(result), steps, lang) if sbys else ""
        return {"type": "simplify", "input_latex": latex(expr), "result_latex": latex(result),
                "steps": steps, "explanation": expl}

    def _expand(self, expression: str, sbys: bool, lang: str) -> dict:
        expr = _parse(expression)
        result = expand(expr)
        steps = [f"${latex(expr)}$", f"Expandido: ${latex(result)}$"]
        expl = _ai_explain("expansión", latex(expr), latex(result), steps, lang) if sbys else ""
        return {"type": "expand", "input_latex": latex(expr), "result_latex": latex(result),
                "steps": steps, "explanation": expl}

    # ── Matrix ─────────────────────────────────────────────────────────────────

    def _matrix(self, expression: str, sbys: bool, lang: str) -> dict:
        # Try to parse [[...]] notation
        m = re.search(r"\[\[(.+)\]\]", expression, re.DOTALL)
        if not m:
            return {"type": "matrix", "error": "Formato: [[1,2],[3,4]]"}

        try:
            raw = json.loads(f"[{m.group(0)[1:-1]}]")
            mat = Matrix(raw)
        except Exception as e:
            return {"type": "matrix", "error": f"No se pudo parsear la matriz: {e}"}

        low = expression.lower()
        results = {}
        steps = [f"Matriz:\n${latex(mat)}$"]

        if "determinante" in low or "det" in low:
            d = mat.det()
            results["det"] = latex(d)
            steps.append(f"Determinante: ${latex(d)}$")

        if "inversa" in low or "inverse" in low:
            try:
                inv = mat.inv()
                results["inverse"] = latex(inv)
                steps.append(f"Inversa: ${latex(inv)}$")
            except Exception:
                results["inverse"] = "No invertible"

        if "eigenvalor" in low or "eigenvalue" in low or "valor propio" in low:
            evs = mat.eigenvals()
            results["eigenvalues"] = {str(latex(k)): v for k, v in evs.items()}
            ev_parts = [f'$\\lambda={latex(k)}$ (mult. {v})' for k, v in evs.items()]
            steps.append(f"Eigenvalores: {', '.join(ev_parts)}")

        if "rango" in low or "rank" in low:
            r = mat.rank()
            results["rank"] = r
            steps.append(f"Rango: {r}")

        if not results:
            # Default: compute all
            try: results["det"] = latex(mat.det())
            except Exception: pass
            try: results["rank"] = mat.rank()
            except Exception: pass
            results["shape"] = f"{mat.rows}×{mat.cols}"
            steps.append(f"Forma: {mat.rows}×{mat.cols}")

        expl = _ai_explain("álgebra lineal", latex(mat), str(results), steps, lang) if sbys else ""
        return {"type": "matrix", "matrix_latex": latex(mat), "results": results,
                "steps": steps, "explanation": expl}

    # ── Differential Equations ─────────────────────────────────────────────────

    def _ode(self, expression: str, sbys: bool, lang: str) -> dict:
        try:
            x = Symbol("x")
            y = Function("y")
            # Try to parse ODE from expression
            # Replace y' → Derivative(y(x), x) etc.
            clean = expression.lower()
            clean = re.sub(r"y''", "y(x).diff(x,2)", clean)
            clean = re.sub(r"y'", "y(x).diff(x)", clean)
            clean = clean.replace("dy/dx", "y(x).diff(x)")

            if "=" in clean:
                left, right = clean.split("=", 1)
                ode = Eq(sympify(left.strip(), locals={"y": y, "x": x}),
                         sympify(right.strip(), locals={"y": y, "x": x}))
            else:
                ode = Eq(sympify(clean, locals={"y": y, "x": x}), 0)

            result = dsolve(ode, y(x))
            steps = [f"ODE: ${latex(ode)}$", f"Solución: ${latex(result)}$"]
            expl = _ai_explain("ecuación diferencial", latex(ode), latex(result), steps, lang) if sbys else ""
            return {"type": "ode", "input_latex": latex(ode), "result_latex": latex(result),
                    "steps": steps, "explanation": expl}
        except Exception as e:
            return {"type": "ode", "error": f"No se pudo resolver: {e}",
                    "tip": "Formato: y' + 2*y = 0 o y'' - y = 0"}

    # ── Statistics ─────────────────────────────────────────────────────────────

    def _statistics(self, expression: str, sbys: bool, lang: str) -> dict:
        if not HAS_SCIPY:
            return {"type": "statistics", "error": "scipy no disponible en este servidor."}

        # Extract list of numbers
        numbers = re.findall(r"-?\d+\.?\d*", expression)
        if not numbers:
            return {"type": "statistics", "error": "No se encontraron datos numéricos."}

        data = [float(n) for n in numbers]
        arr = np.array(data)

        mean = float(np.mean(arr))
        median = float(np.median(arr))
        std = float(np.std(arr, ddof=1)) if len(arr) > 1 else 0
        variance = float(np.var(arr, ddof=1)) if len(arr) > 1 else 0
        n = len(arr)

        results = {
            "n": n,
            "mean": round(mean, 4),
            "median": round(median, 4),
            "std": round(std, 4),
            "variance": round(variance, 4),
            "min": float(np.min(arr)),
            "max": float(np.max(arr)),
            "range": float(np.max(arr) - np.min(arr)),
        }

        steps = [
            f"Datos: {data}",
            f"n = {n}",
            f"Media = {mean:.4f}",
            f"Mediana = {median:.4f}",
            f"Desv. estándar = {std:.4f}",
            f"Varianza = {variance:.4f}",
        ]
        expl = _ai_explain("estadística descriptiva", str(data), str(results), steps, lang) if sbys else ""
        return {"type": "statistics", "data": data, "results": results,
                "steps": steps, "explanation": expl}

    # ── Graph ──────────────────────────────────────────────────────────────────

    def _graph(self, expression: str, sbys: bool, lang: str) -> dict:
        if not HAS_MATPLOTLIB:
            return {"type": "graph", "error": "matplotlib no disponible."}

        # Extract function to graph
        low = expression.lower()
        for kw in ["graficar", "grafica", "plot", "dibuja", "traza", "la función", "la funcion", "f(x)="]:
            if kw in low:
                expr_str = expression[low.find(kw) + len(kw):].strip(" =")
                break
        else:
            expr_str = expression

        # Detect x range
        x_min, x_max = -10.0, 10.0
        m = re.search(r"(?:en|para|x\s*[∈∊]\s*)\[?(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\]?", expression.lower())
        if m:
            x_min, x_max = float(m.group(1)), float(m.group(2))

        graph_b64 = _graph_function(expr_str, "x", x_min, x_max)
        if not graph_b64:
            return {"type": "graph", "error": "No se pudo generar el gráfico."}

        try:
            sym_expr = _parse(expr_str)
            expr_latex = latex(sym_expr)
        except Exception:
            expr_latex = expr_str

        return {
            "type": "graph",
            "input_latex": expr_latex,
            "graph_b64": graph_b64,
            "x_range": [x_min, x_max],
            "explanation": f"Gráfico de $f(x) = {expr_latex}$ para $x \\in [{x_min}, {x_max}]$",
        }

    # ── Unit Conversion ────────────────────────────────────────────────────────

    def _unit_convert(self, expression: str, lang: str) -> dict:
        if not HAS_PINT:
            return {"type": "conversion", "error": "pint no disponible."}
        try:
            # Pattern: "X unidad1 a unidad2"
            m = re.search(r"([\d.]+)\s+([\w/°]+)\s+(?:a|to|en)\s+([\w/°]+)", expression, re.IGNORECASE)
            if not m:
                return {"type": "conversion", "error": "Formato: '100 km a millas'"}
            value, from_unit, to_unit = float(m.group(1)), m.group(2), m.group(3)
            q = _ureg.Quantity(value, from_unit)
            converted = q.to(to_unit)
            result_str = f"{converted.magnitude:.6g} {to_unit}"
            return {
                "type": "conversion",
                "input": f"{value} {from_unit}",
                "result": result_str,
                "explanation": f"${value}\\,{from_unit} = {converted.magnitude:.6g}\\,{to_unit}$",
            }
        except Exception as e:
            return {"type": "conversion", "error": str(e)}

    # ── Evaluate ───────────────────────────────────────────────────────────────

    def _evaluate(self, expression: str, sbys: bool, lang: str) -> dict:
        expr = _parse(expression)
        result = simplify(expr)
        numeric = None
        try:
            n = float(result.evalf())
            if not (n != n):  # check NaN
                numeric = round(n, 8)
        except Exception:
            pass

        steps = [f"${latex(expr)}$", f"= ${latex(result)}$"]
        if numeric is not None:
            steps.append(f"≈ ${numeric}$")

        expl = _ai_explain("evaluación", latex(expr), latex(result), steps, lang) if sbys else ""

        # Try to graph if single variable
        graph = None
        if len(expr.free_symbols) == 1 and HAS_MATPLOTLIB:
            try:
                var_name = list(expr.free_symbols)[0].name
                graph = _graph_function(str(expr), var_name)
            except Exception:
                pass

        return {
            "type": "evaluate",
            "input_latex": latex(expr),
            "result_latex": latex(result),
            "numeric": numeric,
            "steps": steps,
            "explanation": expl,
            "graph_b64": graph,
        }

    # ── Verify student answer ──────────────────────────────────────────────────

    def verify_answer(self, problem: str, student_answer: str,
                      language: str = "es") -> dict:
        """
        Check if student_answer solves the given problem.
        Returns: correct (bool), feedback, correct_result.
        """
        try:
            correct_result = self.solve(problem, step_by_step=False)
            correct_latex = correct_result.get("result_latex", "")

            # Try symbolic comparison
            try:
                student_expr = _parse(student_answer)
                correct_expr = _parse(correct_latex)
                is_equal = simplify(student_expr - correct_expr) == 0
            except Exception:
                is_equal = None

            if _claude_client:
                lang_name = "español" if language == "es" else "inglés"
                prompt = (
                    f"Problema: {problem}\n"
                    f"Respuesta del alumno: {student_answer}\n"
                    f"Respuesta correcta (SymPy): {correct_latex}\n\n"
                    f"¿Es correcta la respuesta del alumno? Si no, explica específicamente dónde se equivocó "
                    f"y cómo llegara a la respuesta correcta. Responde en {lang_name}. "
                    "Sé preciso, pedagógico y amigable."
                )
                resp = _claude_client.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=600,
                    messages=[{"role": "user", "content": prompt}],
                )
                feedback = resp.content[0].text.strip()
            else:
                if is_equal is True:
                    feedback = "✅ ¡Correcto!"
                elif is_equal is False:
                    feedback = f"❌ Incorrecto. La respuesta correcta es: ${correct_latex}$"
                else:
                    feedback = "No se pudo verificar automáticamente."

            return {
                "correct": is_equal,
                "feedback": feedback,
                "correct_result": correct_latex,
                "student_answer": student_answer,
            }
        except Exception as e:
            return {"correct": None, "feedback": f"Error al verificar: {e}", "correct_result": ""}
