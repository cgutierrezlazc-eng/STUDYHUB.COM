"""
Math Engine: solves mathematical expressions with step-by-step solutions using SymPy.
"""
import json
from sympy import (
    symbols, sympify, solve, diff, integrate, limit, series,
    Matrix, simplify, expand, factor, apart, cancel,
    sin, cos, tan, log, exp, sqrt, pi, oo, E,
    latex, pretty,
)
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication


class MathEngine:
    def __init__(self):
        self.x, self.y, self.z, self.t, self.n = symbols('x y z t n')
        self.transformations = standard_transformations + (implicit_multiplication,)

    def solve(self, expression: str, step_by_step: bool = True) -> dict:
        try:
            expr_lower = expression.lower().strip()

            # Detect operation type
            if 'derivar' in expr_lower or 'derivada' in expr_lower or "d/dx" in expr_lower:
                return self._derivative(expression, step_by_step)
            elif 'integrar' in expr_lower or 'integral' in expr_lower:
                return self._integrate(expression, step_by_step)
            elif 'resolver' in expr_lower or '=' in expression:
                return self._solve_equation(expression, step_by_step)
            elif 'limite' in expr_lower or 'lim' in expr_lower:
                return self._limit(expression, step_by_step)
            elif 'simplificar' in expr_lower:
                return self._simplify(expression, step_by_step)
            elif 'factorizar' in expr_lower:
                return self._factor(expression, step_by_step)
            elif 'matriz' in expr_lower or 'matrix' in expr_lower:
                return self._matrix(expression, step_by_step)
            else:
                return self._evaluate(expression, step_by_step)

        except Exception as e:
            return {"error": str(e), "expression": expression}

    def _parse(self, expr_str: str) -> object:
        # Clean the expression
        clean = expr_str.strip()
        for prefix in ['derivar', 'derivada de', 'integrar', 'integral de',
                       'resolver', 'simplificar', 'factorizar', 'limite de',
                       'd/dx', 'lim']:
            if clean.lower().startswith(prefix):
                clean = clean[len(prefix):].strip()
        return parse_expr(clean, transformations=self.transformations)

    def _derivative(self, expression: str, step_by_step: bool) -> dict:
        expr = self._parse(expression)
        result = diff(expr, self.x)
        steps = []
        if step_by_step:
            steps = [
                f"Expresión original: ${latex(expr)}$",
                f"Aplicando reglas de derivación",
                f"Resultado: ${latex(result)}$",
            ]
        return {
            "type": "derivative",
            "input": latex(expr),
            "result": latex(result),
            "result_pretty": pretty(result),
            "steps": steps,
        }

    def _integrate(self, expression: str, step_by_step: bool) -> dict:
        expr = self._parse(expression)
        result = integrate(expr, self.x)
        steps = []
        if step_by_step:
            steps = [
                f"Expresión original: ${latex(expr)}$",
                f"Calculando integral indefinida respecto a x",
                f"Resultado: ${latex(result)} + C$",
            ]
        return {
            "type": "integral",
            "input": latex(expr),
            "result": latex(result) + " + C",
            "result_pretty": pretty(result),
            "steps": steps,
        }

    def _solve_equation(self, expression: str, step_by_step: bool) -> dict:
        clean = expression.lower().replace('resolver', '').strip()
        if '=' in clean:
            left, right = clean.split('=', 1)
            expr = self._parse(f"({left}) - ({right})")
        else:
            expr = self._parse(clean)

        result = solve(expr, self.x)
        steps = []
        if step_by_step:
            steps = [
                f"Ecuación: ${latex(expr)} = 0$",
                f"Resolviendo para x",
                f"Soluciones: {', '.join(f'$x = {latex(r)}$' for r in result)}",
            ]
        return {
            "type": "equation",
            "input": latex(expr) + " = 0",
            "result": [latex(r) for r in result],
            "steps": steps,
        }

    def _limit(self, expression: str, step_by_step: bool) -> dict:
        expr = self._parse(expression)
        result = limit(expr, self.x, 0)  # Default limit to 0
        return {
            "type": "limit",
            "input": latex(expr),
            "result": latex(result),
            "steps": [f"${latex(expr)}$ cuando $x \\to 0$ = ${latex(result)}$"],
        }

    def _simplify(self, expression: str, step_by_step: bool) -> dict:
        expr = self._parse(expression)
        result = simplify(expr)
        return {
            "type": "simplify",
            "input": latex(expr),
            "result": latex(result),
            "steps": [f"${latex(expr)}$ = ${latex(result)}$"],
        }

    def _factor(self, expression: str, step_by_step: bool) -> dict:
        expr = self._parse(expression)
        result = factor(expr)
        return {
            "type": "factor",
            "input": latex(expr),
            "result": latex(result),
            "steps": [f"${latex(expr)}$ = ${latex(result)}$"],
        }

    def _matrix(self, expression: str, step_by_step: bool) -> dict:
        return {
            "type": "matrix",
            "info": "Operaciones con matrices disponibles. Envía la matriz en formato [[1,2],[3,4]]",
        }

    def _evaluate(self, expression: str, step_by_step: bool) -> dict:
        expr = self._parse(expression)
        simplified = simplify(expr)
        return {
            "type": "evaluate",
            "input": latex(expr),
            "result": latex(simplified),
            "result_pretty": pretty(simplified),
            "steps": [f"${latex(expr)}$ = ${latex(simplified)}$"] if step_by_step else [],
        }
