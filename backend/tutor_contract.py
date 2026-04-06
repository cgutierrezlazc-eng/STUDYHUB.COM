"""
Generador de Contrato de Prestacion de Servicios Profesionales para Tutores.

Genera un PDF con formato legal chileno (Ley 19.799) usando ReportLab.
El tutor es un prestador de servicios independiente (boleta de honorarios),
NO un empleado de Conniku SpA.
"""
import hashlib
from datetime import datetime
from io import BytesIO

# ReportLab imports are deferred to function scope for resilience
# (same pattern as certificate_routes.py)


def _generate_contract_id(tutor_id: str) -> str:
    """Generate unique contract identifier: CK-CTR-XXXXXXXXXX."""
    raw = f"contract-{tutor_id}-{datetime.utcnow().isoformat()}"
    return "CK-CTR-" + hashlib.sha256(raw.encode()).hexdigest()[:10].upper()


def _generate_verification_code(contract_id: str, tutor_id: str) -> str:
    """Generate verification code for the contract."""
    raw = f"verify-{contract_id}-{tutor_id}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16].upper()


# ─── Contract clause texts ────────────────────────────────────────

CLAUSULAS = {
    "PRIMERO": {
        "titulo": "PRIMERO: Objeto del Contrato",
        "texto": (
            "El/La PRESTADOR/A se obliga a prestar servicios profesionales de tutoria "
            "academica a traves de la plataforma digital Conniku (en adelante, la \"Plataforma\"), "
            "consistentes en la imparticion de clases particulares y/o grupales en las materias "
            "de su especialidad, de forma independiente y autonoma, sin sujecion a jornada laboral "
            "ni subordinacion o dependencia respecto de Conniku SpA."
        ),
    },
    "SEGUNDO": {
        "titulo": "SEGUNDO: Naturaleza de la Relacion",
        "texto": (
            "Las partes dejan expresa constancia de que la presente convencion NO constituye un "
            "contrato de trabajo, ni genera relacion laboral alguna entre ellas, en los terminos "
            "establecidos en el Codigo del Trabajo. El/La PRESTADOR/A actua como profesional "
            "independiente conforme al articulo 2006 y siguientes del Codigo Civil chileno y al "
            "articulo 42 N.2 de la Ley sobre Impuesto a la Renta, emitiendo boleta de honorarios "
            "por cada servicio prestado. El/La PRESTADOR/A no tendra derecho a vacaciones, "
            "indemnizacion por anos de servicio, gratificaciones, ni ningun otro beneficio propio "
            "de una relacion laboral dependiente."
        ),
    },
    "TERCERO": {
        "titulo": "TERCERO: Obligaciones del/la Prestador/a",
        "texto": (
            "El/La PRESTADOR/A se compromete a: (a) Impartir clases de calidad profesional, "
            "cumpliendo los horarios acordados con los estudiantes a traves de la Plataforma; "
            "(b) Mantener actualizados sus datos profesionales, especialidades y disponibilidad "
            "horaria en su perfil de la Plataforma; (c) Emitir la correspondiente boleta de "
            "honorarios electronica ante el Servicio de Impuestos Internos (SII) por cada pago "
            "recibido, dentro de los plazos legales vigentes; (d) Responder las consultas de los "
            "estudiantes en un plazo razonable; (e) Notificar con al menos 24 horas de anticipacion "
            "cualquier cancelacion o reprogramacion de clases; (f) Mantener un estandar de "
            "evaluacion minimo de 3.0 sobre 5.0 en la Plataforma."
        ),
    },
    "CUARTO": {
        "titulo": "CUARTO: Comision y Estructura de Pagos",
        "texto": (
            "El estudiante pagara directamente a Conniku SpA el valor total de cada clase. "
            "Conniku SpA retendra una comision equivalente al diez por ciento (10%) del valor "
            "bruto de cada clase como contraprestacion por el uso de la Plataforma, sus servicios "
            "tecnologicos, procesamiento de pagos y captacion de estudiantes. El noventa por ciento "
            "(90%) restante del valor bruto sera pagado al/la PRESTADOR/A en los terminos "
            "establecidos en la clausula siguiente. Las tarifas por hora seran fijadas por el/la "
            "PRESTADOR/A dentro de los rangos permitidos por la Plataforma y podran ser modificadas "
            "con efecto para futuras clases."
        ),
    },
    "QUINTO": {
        "titulo": "QUINTO: Forma y Plazo de Pago",
        "texto": (
            "Conniku SpA pagara al/la PRESTADOR/A dentro de los siete (7) dias habiles siguientes "
            "a la confirmacion de la clase por parte del estudiante, o en su defecto, transcurridas "
            "cuarenta y ocho (48) horas desde la hora programada de finalizacion de la clase sin "
            "que el estudiante haya presentado reclamo (confirmacion automatica). El pago se "
            "realizara mediante transferencia electronica a la cuenta bancaria registrada por el/la "
            "PRESTADOR/A en la Plataforma, contra la presentacion de la correspondiente boleta de "
            "honorarios electronica emitida ante el SII. El/La PRESTADOR/A podra elegir entre "
            "frecuencia de pago por clase, quincenal o mensual."
        ),
    },
    "SEXTO": {
        "titulo": "SEXTO: Obligaciones Tributarias",
        "texto": (
            "El/La PRESTADOR/A es exclusivamente responsable del cumplimiento de todas sus "
            "obligaciones tributarias ante el Servicio de Impuestos Internos (SII), incluyendo "
            "pero no limitado a: (a) La emision oportuna de boletas de honorarios electronicas; "
            "(b) La retencion provisional del impuesto a la renta aplicable (actualmente 13,75% "
            "conforme al articulo 74 N.2 de la Ley sobre Impuesto a la Renta); (c) La declaracion "
            "y pago de impuestos mensuales y anuales; (d) Cualquier otra obligacion tributaria "
            "que le corresponda como contribuyente independiente. Conniku SpA actuara como agente "
            "retenedor unicamente en los casos que la ley asi lo exija. Conniku SpA no sera "
            "responsable de las obligaciones previsionales ni de salud del/la PRESTADOR/A, "
            "quien debera cotizar de forma independiente si asi lo desea o corresponda."
        ),
    },
    "SEPTIMO": {
        "titulo": "SEPTIMO: Propiedad Intelectual",
        "texto": (
            "El contenido academico creado por el/la PRESTADOR/A para sus clases (materiales, "
            "presentaciones, guias, ejercicios) permanecera bajo su propiedad intelectual. "
            "Sin embargo, el/la PRESTADOR/A otorga a Conniku SpA una licencia no exclusiva, "
            "gratuita y revocable para utilizar el nombre, imagen profesional y descripcion "
            "de las clases del/la PRESTADOR/A dentro de la Plataforma con fines de promocion "
            "y difusion. Esta licencia se extinguira automaticamente al termino de la relacion "
            "contractual. Las grabaciones de clases, si las hubiere, requeriran consentimiento "
            "expreso y por escrito de ambas partes y del estudiante."
        ),
    },
    "OCTAVO": {
        "titulo": "OCTAVO: Confidencialidad y Proteccion de Datos",
        "texto": (
            "El/La PRESTADOR/A se obliga a mantener estricta confidencialidad respecto de "
            "los datos personales de los estudiantes a los que tenga acceso con motivo de la "
            "prestacion de sus servicios, en conformidad con la Ley N. 19.628 sobre Proteccion "
            "de la Vida Privada y sus modificaciones. Queda expresamente prohibido: (a) Compartir "
            "datos de contacto de estudiantes con terceros; (b) Contactar estudiantes fuera de la "
            "Plataforma con fines comerciales; (c) Utilizar la informacion de estudiantes para "
            "fines distintos a la prestacion del servicio contratado. La infraccion de esta "
            "clausula facultara a Conniku SpA para terminar el contrato de forma inmediata, "
            "sin perjuicio de las acciones legales que correspondan."
        ),
    },
    "NOVENO": {
        "titulo": "NOVENO: Vigencia y Terminacion",
        "texto": (
            "El presente contrato tendra una duracion indefinida, contada desde la fecha de su "
            "firma digital. Cualquiera de las partes podra ponerle termino mediante aviso escrito "
            "enviado a traves de la Plataforma o por correo electronico con al menos treinta (30) "
            "dias corridos de anticipacion. No obstante lo anterior, Conniku SpA podra poner "
            "termino inmediato al contrato en caso de: (a) Incumplimiento grave de las obligaciones "
            "del/la PRESTADOR/A; (b) Evaluacion promedio inferior a 2.0 sobre 5.0 mantenida por "
            "mas de 30 dias; (c) Infraccion a la clausula de confidencialidad; (d) Conducta que "
            "atente contra la integridad o reputacion de la Plataforma. Los pagos pendientes por "
            "clases ya confirmadas seran liquidados dentro de los 15 dias habiles siguientes al "
            "termino del contrato."
        ),
    },
    "DECIMO": {
        "titulo": "DECIMO: Garantia de Pago",
        "texto": (
            "Conniku SpA garantiza al/la PRESTADOR/A el pago integro del monto correspondiente "
            "(90% del valor bruto) por toda clase cuya realizacion haya sido confirmada por el "
            "estudiante o por el sistema de confirmacion automatica. En caso de disputa por parte "
            "del estudiante, Conniku SpA mediara entre las partes y resolvera dentro de un plazo "
            "maximo de diez (10) dias habiles. Durante el periodo de mediacion, el pago quedara "
            "retenido. Si la resolucion es favorable al/la PRESTADOR/A, el pago se liberara de "
            "forma inmediata."
        ),
    },
    "UNDECIMO": {
        "titulo": "UNDECIMO: Resolucion de Controversias",
        "texto": (
            "Toda controversia que surja entre las partes con motivo de la interpretacion, "
            "aplicacion o terminacion del presente contrato sera sometida, en primera instancia, "
            "a un procedimiento de mediacion directa entre las partes por un plazo maximo de "
            "treinta (30) dias corridos. De no alcanzarse un acuerdo, las partes se someten "
            "a la jurisdiccion de los Tribunales Ordinarios de Justicia de la ciudad de Santiago "
            "de Chile, renunciando expresamente a cualquier otro fuero que pudiera corresponderles."
        ),
    },
    "DUODECIMO": {
        "titulo": "DUODECIMO: Firma Digital y Validez",
        "texto": (
            "Las partes reconocen y aceptan que el presente contrato se celebra y firma de forma "
            "electronica a traves de la Plataforma, conforme a lo establecido en la Ley N. 19.799 "
            "sobre Documentos Electronicos, Firma Electronica y Servicios de Certificacion de "
            "dicha Firma. La firma electronica simple empleada tiene plena validez legal y las "
            "partes renuncian a impugnar la validez de este contrato por el solo hecho de haber "
            "sido celebrado electronicamente. El registro digital de aceptacion, incluyendo fecha, "
            "hora e identificador unico del contrato, constituye plena prueba de la voluntad de "
            "las partes."
        ),
    },
}

ORDEN_CLAUSULAS = [
    "PRIMERO", "SEGUNDO", "TERCERO", "CUARTO", "QUINTO", "SEXTO",
    "SEPTIMO", "OCTAVO", "NOVENO", "DECIMO", "UNDECIMO", "DUODECIMO",
]


# ─── PDF Generation ──────────────────────────────────────────────

def generate_tutor_contract(tutor_data: dict) -> bytes:
    """
    Generate a Contrato de Prestacion de Servicios Profesionales PDF.

    Args:
        tutor_data: dict with keys:
            - tutor_name: str — full name
            - tutor_rut: str — RUT (e.g. "12.345.678-9")
            - tutor_professional_title: str — e.g. "Ingeniero Civil"
            - tutor_address: str — domicilio
            - tutor_email: str
            - tutor_role_number: str — CK-T-XXXXX
            - contract_id: str (optional, auto-generated if missing)
            - tutor_id: str (for contract_id generation)

    Returns:
        bytes — PDF file content
    """
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import mm, cm
    from reportlab.lib.colors import HexColor, black, Color
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, PageBreak, KeepTogether,
    )
    from reportlab.pdfgen import canvas

    # ── Extract data ─────────────────────────────────────────────
    tutor_name = tutor_data.get("tutor_name", "___________________________")
    tutor_rut = tutor_data.get("tutor_rut", "__.___.__-_")
    tutor_title = tutor_data.get("tutor_professional_title", "Profesional independiente")
    tutor_address = tutor_data.get("tutor_address", "Santiago, Chile")
    tutor_email = tutor_data.get("tutor_email", "")
    tutor_role_number = tutor_data.get("tutor_role_number", "")
    tutor_id = tutor_data.get("tutor_id", "unknown")

    contract_id = tutor_data.get("contract_id") or _generate_contract_id(tutor_id)
    verification_code = _generate_verification_code(contract_id, tutor_id)
    now = datetime.utcnow()
    fecha_str = now.strftime("%d de %B de %Y").replace(
        "January", "enero").replace("February", "febrero").replace(
        "March", "marzo").replace("April", "abril").replace(
        "May", "mayo").replace("June", "junio").replace(
        "July", "julio").replace("August", "agosto").replace(
        "September", "septiembre").replace("October", "octubre").replace(
        "November", "noviembre").replace("December", "diciembre")

    # ── Colors ───────────────────────────────────────────────────
    CONNIKU_BLUE = HexColor("#2D62C8")
    DARK_TEXT = HexColor("#1A1A2E")
    MEDIUM_TEXT = HexColor("#3D3D5C")
    LIGHT_TEXT = HexColor("#6B7280")
    ACCENT_LINE = HexColor("#2D62C8")
    BG_LIGHT = HexColor("#F8FAFC")

    # ── Styles ───────────────────────────────────────────────────
    styles = getSampleStyleSheet()

    style_title = ParagraphStyle(
        "ContractTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=DARK_TEXT,
        alignment=TA_CENTER,
        spaceAfter=6 * mm,
    )

    style_subtitle = ParagraphStyle(
        "ContractSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=MEDIUM_TEXT,
        alignment=TA_CENTER,
        spaceAfter=8 * mm,
    )

    style_section = ParagraphStyle(
        "SectionHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=CONNIKU_BLUE,
        spaceBefore=5 * mm,
        spaceAfter=2 * mm,
    )

    style_body = ParagraphStyle(
        "ContractBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=DARK_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=3 * mm,
    )

    style_party = ParagraphStyle(
        "PartyInfo",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=DARK_TEXT,
        alignment=TA_LEFT,
        spaceAfter=1 * mm,
    )

    style_party_bold = ParagraphStyle(
        "PartyBold",
        parent=style_party,
        fontName="Helvetica-Bold",
    )

    style_footer = ParagraphStyle(
        "FooterText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        leading=10,
        textColor=LIGHT_TEXT,
        alignment=TA_CENTER,
    )

    style_signature_label = ParagraphStyle(
        "SignatureLabel",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=DARK_TEXT,
        alignment=TA_CENTER,
    )

    style_signature_name = ParagraphStyle(
        "SignatureName",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=DARK_TEXT,
        alignment=TA_CENTER,
    )

    style_digital_note = ParagraphStyle(
        "DigitalNote",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=LIGHT_TEXT,
        alignment=TA_CENTER,
        spaceBefore=4 * mm,
        spaceAfter=2 * mm,
    )

    # ── Build document ───────────────────────────────────────────
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=25 * mm,
        rightMargin=25 * mm,
        topMargin=25 * mm,
        bottomMargin=25 * mm,
        title="Contrato de Prestacion de Servicios Profesionales",
        author="Conniku SpA",
    )

    story = []

    # ── Header ───────────────────────────────────────────────────
    story.append(Paragraph("CONNIKU", ParagraphStyle(
        "LogoText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        textColor=CONNIKU_BLUE,
        alignment=TA_CENTER,
        spaceAfter=2 * mm,
    )))

    story.append(HRFlowable(
        width="100%", thickness=2, color=CONNIKU_BLUE,
        spaceAfter=5 * mm, spaceBefore=1 * mm,
    ))

    story.append(Paragraph(
        "CONTRATO DE PRESTACION DE SERVICIOS PROFESIONALES",
        style_title,
    ))

    story.append(Paragraph(
        f"Contrato N. {contract_id}",
        style_subtitle,
    ))

    # ── Preambulo ────────────────────────────────────────────────
    story.append(Paragraph(
        f"En Santiago de Chile, a {fecha_str}, entre:",
        style_body,
    ))

    story.append(Spacer(1, 3 * mm))

    # Party 1: Conniku
    story.append(Paragraph(
        "<b>PARTE CONTRATANTE:</b>",
        style_party_bold,
    ))
    story.append(Paragraph(
        "<b>Conniku SpA</b>, sociedad por acciones constituida conforme a las leyes de la "
        "Republica de Chile, con domicilio en Santiago, Region Metropolitana, representada "
        "legalmente para estos efectos (en adelante, \"Conniku\" o la \"Plataforma\").",
        style_party,
    ))

    story.append(Spacer(1, 3 * mm))

    # Party 2: Tutor
    story.append(Paragraph(
        "<b>PRESTADOR/A DE SERVICIOS:</b>",
        style_party_bold,
    ))

    tutor_info_parts = [
        f"<b>{tutor_name}</b>",
        f"RUT: {tutor_rut}",
        f"Titulo profesional: {tutor_title}",
        f"Domicilio: {tutor_address}",
    ]
    if tutor_email:
        tutor_info_parts.append(f"Correo electronico: {tutor_email}")
    if tutor_role_number:
        tutor_info_parts.append(f"Numero de tutor Conniku: {tutor_role_number}")

    tutor_info_parts.append(
        "(en adelante, el/la \"PRESTADOR/A\")"
    )
    story.append(Paragraph("<br/>".join(tutor_info_parts), style_party))

    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph(
        "Las partes, mayores de edad, libres y espontaneamente, han convenido celebrar el "
        "presente Contrato de Prestacion de Servicios Profesionales, que se regira por las "
        "siguientes clausulas:",
        style_body,
    ))

    story.append(HRFlowable(
        width="100%", thickness=0.5, color=HexColor("#D1D5DB"),
        spaceAfter=4 * mm, spaceBefore=4 * mm,
    ))

    # ── Clausulas ────────────────────────────────────────────────
    for key in ORDEN_CLAUSULAS:
        clausula = CLAUSULAS[key]
        story.append(Paragraph(clausula["titulo"], style_section))
        story.append(Paragraph(clausula["texto"], style_body))

    # ── Firma section ────────────────────────────────────────────
    story.append(HRFlowable(
        width="100%", thickness=0.5, color=HexColor("#D1D5DB"),
        spaceAfter=6 * mm, spaceBefore=6 * mm,
    ))

    story.append(Paragraph(
        f"Para constancia y en senal de conformidad, las partes firman el presente contrato "
        f"en Santiago de Chile, a {fecha_str}.",
        style_body,
    ))

    story.append(Spacer(1, 12 * mm))

    # Signature table
    sig_data = [
        [
            Paragraph("_" * 35, style_signature_label),
            Paragraph("", style_signature_label),
            Paragraph("_" * 35, style_signature_label),
        ],
        [
            Paragraph("<b>Cristian Gonzalez</b>", style_signature_name),
            Paragraph("", style_signature_label),
            Paragraph(f"<b>{tutor_name}</b>", style_signature_name),
        ],
        [
            Paragraph("Representante Legal", style_signature_label),
            Paragraph("", style_signature_label),
            Paragraph("Prestador/a de Servicios", style_signature_label),
        ],
        [
            Paragraph("Conniku SpA", style_signature_label),
            Paragraph("", style_signature_label),
            Paragraph(f"RUT: {tutor_rut}", style_signature_label),
        ],
    ]

    sig_table = Table(sig_data, colWidths=[200, 60, 200])
    sig_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(sig_table)

    # Digital signature note
    story.append(Paragraph(
        "Firmado digitalmente conforme a Ley N. 19.799 sobre Documentos Electronicos, "
        "Firma Electronica y Servicios de Certificacion de dicha Firma.",
        style_digital_note,
    ))

    story.append(Spacer(1, 4 * mm))

    # Contract ID and verification
    story.append(HRFlowable(
        width="100%", thickness=0.5, color=HexColor("#D1D5DB"),
        spaceAfter=3 * mm, spaceBefore=2 * mm,
    ))

    story.append(Paragraph(
        f"Identificador unico del contrato: <b>{contract_id}</b>",
        style_footer,
    ))
    story.append(Paragraph(
        f"Codigo de verificacion: <b>{verification_code}</b>",
        style_footer,
    ))
    story.append(Paragraph(
        f"Fecha de generacion: {now.strftime('%d/%m/%Y %H:%M')} UTC",
        style_footer,
    ))
    story.append(Paragraph(
        "Verificar en: conniku.com/contract/verify",
        style_footer,
    ))

    # ── Build PDF ────────────────────────────────────────────────
    doc.build(story)
    pdf_bytes = buf.getvalue()
    buf.close()
    return pdf_bytes
