"""
Konni Tools — function-calling tools for Konni Admin.
Gives Konni real-time access to platform data: employees, payroll,
leave requests, expenses, and economic indicators.
"""
import json
import requests
from datetime import datetime

from hr_routes import Employee, PayrollRecord, LeaveRequest, OperationalExpense


# ── Tool Definitions (JSON Schema para Claude API) ────────────────────────────

KONNI_TOOLS = [
    {
        "name": "listar_empleados",
        "description": (
            "Lista los empleados de la empresa con nombre, RUT, cargo, departamento, "
            "tipo de contrato y sueldo bruto. Úsalo cuando pregunten por el equipo, "
            "nómina, trabajadores activos, o datos de algún empleado."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "solo_activos": {
                    "type": "boolean",
                    "description": "Si true (default), solo retorna activos. False incluye todos."
                }
            },
            "required": []
        }
    },
    {
        "name": "obtener_payroll_mes",
        "description": (
            "Obtiene las liquidaciones de sueldo (payroll) de un mes específico. "
            "Sin parámetros usa el mes y año actuales. Úsalo para consultas sobre "
            "sueldos, liquidaciones, totales de nómina o estado de pago."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "mes":  {"type": "integer", "description": "Número de mes 1-12. Default: mes actual."},
                "anio": {"type": "integer", "description": "Año ej. 2026. Default: año actual."}
            },
            "required": []
        }
    },
    {
        "name": "listar_ausencias",
        "description": (
            "Lista solicitudes de vacaciones y licencias médicas del equipo, "
            "filtradas por estado. Úsalo para consultas sobre vacaciones pendientes, "
            "licencias aprobadas, o ausencias del mes."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "estado": {
                    "type": "string",
                    "enum": ["pending", "approved", "rejected", "all"],
                    "description": "Estado a filtrar. Default: 'all'."
                }
            },
            "required": []
        }
    },
    {
        "name": "obtener_indicadores",
        "description": (
            "Obtiene los indicadores económicos actuales de Chile desde mindicador.cl: "
            "UF, UTM, USD (dólar) e IMM (ingreso mínimo mensual). "
            "Úsalo cuando pregunten por valores actuales de UF, UTM, dólar o sueldo mínimo."
        ),
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "ofertas_activas",
        "description": (
            "Obtiene las ofertas laborales activas publicadas en Conniku via Konni. "
            "Usalo cuando el usuario pregunte por trabajo, ofertas, empleos, o bolsa laboral. "
            "Retorna titulo, empresa, tipo, ubicacion e ID de cada oferta."
        ),
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "listar_gastos_mes",
        "description": (
            "Obtiene el resumen de gastos operacionales de un mes: total, número de registros "
            "y desglose por categoría. Sin parámetros usa el mes actual."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "mes":  {"type": "integer", "description": "Mes 1-12. Default: mes actual."},
                "anio": {"type": "integer", "description": "Año. Default: año actual."}
            },
            "required": []
        }
    },
]

# ── Navigation paths (used in system prompt) ──────────────────────────────────

NAV_ROUTES = """
RRHH:     /admin-panel/hr/personal | /admin-panel/hr/contratos | /admin-panel/hr/vacaciones
          /admin-panel/hr/documentos | /admin-panel/hr/asistencia | /admin-panel/hr/onboarding
          /admin-panel/hr/desempeno  | /admin-panel/hr/reclutamiento | /admin-panel/hr/accesos
Payroll:  /admin-panel/payroll/liquidaciones | /admin-panel/payroll/finiquitos
          /admin-panel/payroll/historial | /admin-panel/payroll/previred | /admin-panel/payroll/dj1887
Finanzas: /admin-panel/finance/gastos | /admin-panel/finance/dashboard
          /admin-panel/finance/facturacion | /admin-panel/finance/presupuestos | /admin-panel/finance/analytics
Legal:    /admin-panel/legal/compliance | /admin-panel/legal/fraude
Tools:    /admin-panel/tools/ai-workflows | /admin-panel/tools/certificaciones | /admin-panel/tools/push
"""


# ── Tool execution functions ───────────────────────────────────────────────────

def _listar_empleados(args: dict, db) -> str:
    try:
        solo_activos = args.get("solo_activos", True)
        q = db.query(Employee)
        if solo_activos:
            q = q.filter(Employee.status == "active")
        emps = q.order_by(Employee.last_name).all()
        if not emps:
            return '{"total": 0, "empleados": [], "mensaje": "No hay empleados registrados."}'
        data = [{
            "id":               e.id,
            "nombre":           f"{e.first_name} {e.last_name}",
            "rut":              e.rut,
            "cargo":            e.position or "—",
            "departamento":     e.department or "—",
            "tipo_contrato":    e.contract_type or "—",
            "sueldo_bruto_clp": e.gross_salary,
            "fecha_ingreso":    str(e.hire_date) if e.hire_date else None,
            "estado":           e.status,
        } for e in emps]
        return json.dumps({"total": len(data), "empleados": data}, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)[:120]})


def _obtener_payroll(args: dict, db) -> str:
    try:
        now  = datetime.now()
        mes  = args.get("mes",  now.month)
        anio = args.get("anio", now.year)
        records = db.query(PayrollRecord).filter(
            PayrollRecord.period_month == mes,
            PayrollRecord.period_year  == anio,
        ).all()
        if not records:
            return json.dumps({"periodo": f"{mes}/{anio}", "total_empleados": 0,
                               "mensaje": f"No hay liquidaciones para {mes}/{anio}."})
        rows = []
        total_bruto = total_neto = 0
        for r in records:
            emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
            nombre = f"{emp.first_name} {emp.last_name}" if emp else f"ID {r.employee_id}"
            rows.append({
                "empleado": nombre,
                "bruto_clp":  r.gross_salary,
                "liquido_clp": r.net_salary,
                "estado":     r.status or "generado",
            })
            total_bruto += r.gross_salary or 0
            total_neto  += r.net_salary   or 0
        return json.dumps({
            "periodo":          f"{mes}/{anio}",
            "total_empleados":  len(rows),
            "total_bruto_clp":  total_bruto,
            "total_neto_clp":   total_neto,
            "liquidaciones":    rows,
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)[:120]})


def _listar_ausencias(args: dict, db) -> str:
    try:
        estado = args.get("estado", "all")
        q = db.query(LeaveRequest)
        if estado != "all":
            q = q.filter(LeaveRequest.status == estado)
        reqs = q.order_by(LeaveRequest.start_date.desc()).limit(30).all()
        rows = []
        for r in reqs:
            emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
            nombre = f"{emp.first_name} {emp.last_name}" if emp else f"ID {r.employee_id}"
            rows.append({
                "empleado": nombre,
                "tipo":     r.leave_type,
                "desde":    str(r.start_date),
                "hasta":    str(r.end_date),
                "dias":     r.days,
                "estado":   r.status,
            })
        return json.dumps({"total": len(rows), "solicitudes": rows}, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)[:120]})


def _obtener_indicadores(_args: dict) -> str:
    try:
        r = requests.get("https://mindicador.cl/api", timeout=5)
        d = r.json()
        return json.dumps({
            "UF":  d.get("uf",  {}).get("valor"),
            "UTM": d.get("utm", {}).get("valor"),
            "USD": d.get("dolar", {}).get("valor"),
            "IMM": d.get("ingreso_minimo_mensual", {}).get("valor"),
        })
    except Exception as e:
        return json.dumps({"error": f"No se pudo obtener indicadores: {str(e)[:60]}"})


def _listar_gastos(args: dict, db) -> str:
    try:
        now  = datetime.now()
        mes  = args.get("mes",  now.month)
        anio = args.get("anio", now.year)
        exps = db.query(OperationalExpense).filter(
            OperationalExpense.period_month == mes,
            OperationalExpense.period_year  == anio,
        ).all()
        if not exps:
            return json.dumps({"periodo": f"{mes}/{anio}", "total_clp": 0,
                               "mensaje": f"No hay gastos para {mes}/{anio}."})
        total   = sum(e.amount_clp or 0 for e in exps)
        por_cat: dict = {}
        for e in exps:
            cat = e.category or "Sin categoría"
            por_cat[cat] = por_cat.get(cat, 0) + (e.amount_clp or 0)
        return json.dumps({
            "periodo":       f"{mes}/{anio}",
            "total_clp":     total,
            "n_registros":   len(exps),
            "por_categoria": por_cat,
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)[:120]})


def _ofertas_activas(_args: dict, db) -> str:
    try:
        from database import JobListing
        jobs = (db.query(JobListing)
                .filter(JobListing.konni_broadcast == True, JobListing.is_active == True)
                .order_by(JobListing.created_at.desc())
                .limit(10).all())
        if not jobs:
            return json.dumps({"total": 0, "ofertas": [],
                               "mensaje": "No hay ofertas laborales activas en este momento."})
        data = [{
            "id":        j.id,
            "titulo":    j.job_title,
            "empresa":   j.company_name,
            "tipo":      j.job_type or "—",
            "remoto":    j.is_remote,
            "ubicacion": j.location or "—",
            "area":      j.career_field or "—",
            "nivel":     j.experience_level or "—",
        } for j in jobs]
        return json.dumps({"total": len(data), "ofertas": data}, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)[:120]})


# ── Main dispatcher ────────────────────────────────────────────────────────────

def execute_tool(name: str, args: dict, db=None) -> str:
    """Execute a named Konni tool and return a JSON string result."""
    if name == "listar_empleados":    return _listar_empleados(args, db)
    if name == "obtener_payroll_mes": return _obtener_payroll(args, db)
    if name == "listar_ausencias":    return _listar_ausencias(args, db)
    if name == "obtener_indicadores": return _obtener_indicadores(args)
    if name == "listar_gastos_mes":   return _listar_gastos(args, db)
    if name == "ofertas_activas":     return _ofertas_activas(args, db)
    return json.dumps({"error": f"Tool '{name}' not found"})
