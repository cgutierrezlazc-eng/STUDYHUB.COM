// ═════════════════════════════════════════════════════════════════
// ERC DATA — Job Descriptions, Expectation Memos & Contract Templates
// Based on Disney ERC Model (Expectations, Responsibilities, Commitments)
// Conniku SpA — 5 core positions
// ═════════════════════════════════════════════════════════════════

export interface ERCJobDescription {
  positionKey: string;
  title: string;
  department: string;
  email: string;
  reportTo: string;
  mision: string;
  expectations: string[]; // Lo que se espera del colaborador
  responsibilities: string[]; // Funciones y tareas especificas
  commitments: string[]; // Lo que la empresa se compromete a entregar
  requirements: string[]; // Requisitos del cargo
  desirable: string[]; // Deseables
  kpis: { metric: string; target: string }[];
  tools: string[]; // Herramientas que usara
  schedule: string;
  compensation: { base: string; benefits: string[] };
}

export interface ERCExpectationMemo {
  positionKey: string;
  title: string;
  intro: string;
  day30: { title: string; items: string[] };
  day60: { title: string; items: string[] };
  day90: { title: string; items: string[] };
  ongoing: string[]; // Expectativas permanentes
  values: string[]; // Valores Conniku que debe vivir
  evaluationCriteria: string[];
  signature: { employee: boolean; supervisor: boolean; date: boolean };
}

export interface ERCContractTemplate {
  positionKey: string;
  title: string;
  type: string; // indefinido, plazo_fijo
  clauses: { title: string; content: string }[];
}

// ═════════════════════════════════════════════════════════════════
// VALORES CONNIKU (transversales a todos los cargos)
// ═════════════════════════════════════════════════════════════════
export const CONNIKU_VALUES = [
  'Innovacion Constante — Buscar siempre nuevas formas de mejorar la experiencia del estudiante',
  'Compromiso con el Estudiante — El estudiante es el centro de todas las decisiones',
  'Colaboracion Radical — Trabajar en equipo sin silos, compartir conocimiento',
  'Excelencia Operacional — Hacer las cosas bien, con calidad y a tiempo',
  'Transparencia — Comunicar con honestidad, celebrar logros y asumir errores',
  'Crecimiento Personal — Cada miembro del equipo debe crecer profesionalmente junto a Conniku',
];

// ═════════════════════════════════════════════════════════════════
// JOB DESCRIPTIONS
// ═════════════════════════════════════════════════════════════════
export const JOB_DESCRIPTIONS: ERCJobDescription[] = [
  // ─── CTO ───
  {
    positionKey: 'cto',
    title: 'CTO — Director de Tecnologia',
    department: 'Tecnologia',
    email: 'cto@conniku.com',
    reportTo: 'CEO / Cristian Andrés Gutiérrez Lazcano',
    mision:
      'Liderar la vision tecnologica de Conniku, asegurando que la plataforma sea robusta, escalable y este a la vanguardia de la tecnologia educativa en Chile.',
    expectations: [
      'Mantener la plataforma con 99.5% de uptime mensual',
      'Entregar features nuevos segun el roadmap acordado con el CEO',
      'Proteger la seguridad de los datos de estudiantes (Ley 19.628)',
      'Comunicar proactivamente riesgos tecnicos y proponer soluciones',
      'Mentorear al equipo tecnico y fomentar buenas practicas de desarrollo',
      'Tomar decisiones de arquitectura que prioricen escalabilidad y costo-eficiencia',
    ],
    responsibilities: [
      'Disenar y mantener la arquitectura del sistema (React + FastAPI + PostgreSQL)',
      'Administrar infraestructura en Vercel (frontend) y Render (backend)',
      'Implementar y mantener CI/CD pipelines (GitHub Actions)',
      'Gestionar integraciones: Claude API, Gemini, Zoho Mail, mindicador.cl',
      'Desarrollar y mantener la app movil (Capacitor + Android/iOS)',
      'Implementar PWA, Service Worker y push notifications',
      'Code reviews y merge management en GitHub',
      'Definir estandares de codigo, testing y documentacion tecnica',
      'Monitorear performance, errores y metricas de la plataforma',
      'Planificar y ejecutar migraciones de base de datos',
      'Gestionar certificados SSL, dominios y DNS',
      'Implementar features inteligentes (chatbot, generacion de contenido, feed personalizado)',
    ],
    commitments: [
      'Acceso completo a todas las herramientas y servicios necesarios',
      'Presupuesto mensual para infraestructura cloud y APIs',
      'Autonomia tecnica en decisiones de stack y arquitectura',
      'Participacion en la planificacion estrategica del producto',
      'Capacitacion continua en tecnologias emergentes',
      'Equipo de trabajo (computador, licencias de software)',
    ],
    requirements: [
      'Titulo en Ingenieria Civil Informatica, Computacion o carrera afin',
      'Minimo 3 anos de experiencia en desarrollo fullstack',
      'Dominio de React, TypeScript, Python, FastAPI',
      'Experiencia con PostgreSQL y ORMs (SQLAlchemy)',
      'Conocimiento de cloud (Vercel, Render, AWS o similar)',
      'Experiencia con CI/CD y DevOps',
      'Ingles tecnico avanzado',
    ],
    desirable: [
      'Experiencia en EdTech o plataformas B2C',
      'Conocimiento de tecnologias inteligentes aplicado a educacion',
      'Experiencia con apps moviles (Capacitor, React Native)',
      'Certificaciones cloud (AWS, GCP)',
    ],
    kpis: [
      { metric: 'Uptime plataforma', target: '>= 99.5% mensual' },
      { metric: 'Tiempo de respuesta API', target: '< 200ms p95' },
      { metric: 'Deploy frequency', target: '>= 3 deploys/semana' },
      { metric: 'Bug resolution time', target: '< 24hrs criticos, < 72hrs normales' },
      { metric: 'Code coverage', target: '>= 70%' },
      { metric: 'Features entregados vs planificados', target: '>= 85% del sprint' },
    ],
    tools: ['VS Code', 'GitHub', 'Vercel', 'Render', 'PostgreSQL', 'Claude API', 'Figma', 'Slack'],
    schedule:
      'Lunes a Viernes, 45 hrs semanales. Disponibilidad para incidentes criticos fuera de horario.',
    compensation: {
      base: '$2.800.000 CLP bruto mensual',
      benefits: [
        'Colacion $80.000',
        'Movilizacion $50.000',
        'Bono por uptime trimestral',
        'Dias libres adicionales por deploy exitoso de version mayor',
      ],
    },
  },

  // ─── HEAD OF OPERATIONS ───
  {
    positionKey: 'head_operations',
    title: 'Head of Operations',
    department: 'Operaciones',
    email: 'operaciones@conniku.com',
    reportTo: 'CEO / Cristian Andrés Gutiérrez Lazcano',
    mision:
      'Asegurar que todas las operaciones de Conniku funcionen de manera eficiente, desde la gestion interna hasta la experiencia del usuario, optimizando procesos y recursos.',
    expectations: [
      'Mantener los procesos internos documentados y optimizados',
      'Coordinar entre todos los departamentos para evitar cuellos de botella',
      'Asegurar compliance con legislacion laboral chilena (Codigo del Trabajo)',
      'Gestionar presupuestos operacionales dentro del margen aprobado',
      'Reportar KPIs operacionales semanalmente al CEO',
      'Anticipar problemas operacionales y proponer soluciones preventivas',
    ],
    responsibilities: [
      'Gestionar RRHH: contratos, onboarding, offboarding, vacaciones, asistencia',
      'Administrar relacion con proveedores (hosting, APIs, servicios legales)',
      'Supervisar el cumplimiento de plazos y entregables de cada area',
      'Gestionar el modulo de RRHH en la plataforma Conniku',
      'Coordinar procesos de remuneraciones y Previred',
      'Mantener documentacion legal al dia (contratos, reglamento interno, ODI)',
      'Implementar y supervisar politicas de seguridad de la informacion',
      'Planificar y ejecutar capacitaciones del equipo (Ley 19.518 SENCE)',
      'Gestionar relacion con mutuales de seguridad',
      'Preparar reportes financieros y operacionales para directorio',
      'Coordinar con contabilidad externa (declaraciones, IVA, renta)',
    ],
    commitments: [
      'Acceso al modulo completo de administracion de Conniku',
      'Presupuesto operacional mensual definido y transparente',
      'Apoyo legal cuando sea necesario (abogado externo)',
      'Herramientas de gestion de proyectos y comunicacion',
      'Capacitacion en legislacion laboral y gestion de personas',
      'Participacion en decisiones estrategicas del negocio',
    ],
    requirements: [
      'Titulo en Ingenieria Comercial, Administracion de Empresas o carrera afin',
      'Minimo 2 anos en gestion de operaciones o administracion',
      'Conocimiento de legislacion laboral chilena',
      'Experiencia en gestion de RRHH y remuneraciones',
      'Dominio de herramientas ofice y gestion de proyectos',
      'Habilidades de comunicacion y liderazgo',
    ],
    desirable: [
      'Experiencia en startups o empresas de tecnologia',
      'Conocimiento de Previred y procesos previsionales',
      'Certificacion en gestion de proyectos (PMP, Scrum)',
      'Experiencia con plataformas SaaS',
    ],
    kpis: [
      { metric: 'Documentacion al dia', target: '100% contratos y documentos legales vigentes' },
      { metric: 'Tiempo de onboarding', target: '< 5 dias habiles para nuevo empleado' },
      { metric: 'Cumplimiento Previred', target: '100% declarado antes del dia 13' },
      { metric: 'Satisfaccion interna', target: '>= 4.0/5.0 en encuesta trimestral' },
      { metric: 'Presupuesto operacional', target: 'Dentro del +/- 5% del presupuesto aprobado' },
      { metric: 'Proveedores gestionados', target: '0 pagos atrasados' },
    ],
    tools: ['Plataforma Conniku (Admin)', 'Google Workspace', 'Previred', 'SII', 'Slack'],
    schedule: 'Lunes a Viernes, 45 hrs semanales.',
    compensation: {
      base: '$2.200.000 CLP bruto mensual',
      benefits: [
        'Colacion $80.000',
        'Movilizacion $50.000',
        'Bono trimestral por cumplimiento KPIs',
      ],
    },
  },

  // ─── COMMUNITY MANAGER ───
  {
    positionKey: 'community_manager',
    title: 'Community Manager',
    department: 'Marketing',
    email: 'comunidad@conniku.com',
    reportTo: 'Marketing & Growth Lead / CEO',
    mision:
      'Construir, nutrir y hacer crecer la comunidad de estudiantes universitarios de Conniku, generando engagement y sentido de pertenencia a traves de contenido relevante e interacciones significativas.',
    expectations: [
      'Mantener crecimiento constante de la comunidad activa',
      'Generar contenido que los estudiantes compartan organicamente',
      'Responder a interacciones de la comunidad en menos de 2 horas',
      'Identificar oportunidades de mejora del producto desde el feedback estudiantil',
      'Representar la voz del estudiante dentro del equipo de Conniku',
      'Mantener un tono cercano, profesional y alineado con la identidad de marca',
    ],
    responsibilities: [
      'Crear y gestionar contenido para redes sociales (Instagram, TikTok, LinkedIn)',
      'Moderar la comunidad interna de Conniku (feed, comunidades, grupos)',
      'Planificar y ejecutar calendario editorial mensual',
      'Organizar eventos virtuales (webinars, AMA, study sessions)',
      'Gestionar relacion con embajadores estudiantiles en universidades',
      'Monitorear menciones de marca y responder en redes sociales',
      'Crear y curar contenido educativo (tips de estudio, guias rapidas)',
      'Analizar metricas de engagement y reportar insights semanales',
      'Coordinar con Marketing para campanas y lanzamientos',
      'Gestionar el programa de referidos entre estudiantes',
    ],
    commitments: [
      'Herramientas de diseno y gestion de redes sociales',
      'Presupuesto mensual para contenido y promocion',
      'Acceso a metricas y analytics de la plataforma',
      'Capacitacion en herramientas de diseno y video',
      'Libertad creativa dentro de los lineamientos de marca',
      'Acceso directo al CEO para feedback de producto',
    ],
    requirements: [
      'Titulo o cursando ultimo ano de Periodismo, Publicidad, Marketing o carrera afin',
      'Minimo 1 ano de experiencia en community management',
      'Dominio de Instagram, TikTok, LinkedIn y herramientas de programacion de contenido',
      'Habilidades de redaccion y storytelling',
      'Conocimiento de metricas de redes sociales y analytics',
      'Creatividad y proactividad',
    ],
    desirable: [
      'Experiencia gestionando comunidades de estudiantes',
      'Conocimiento de Canva, Figma o herramientas de diseno',
      'Experiencia con video (Reels, TikTok, YouTube Shorts)',
      'Conocimiento basico de SEO y marketing digital',
    ],
    kpis: [
      { metric: 'Crecimiento comunidad activa', target: '>= 15% mensual' },
      { metric: 'Engagement rate (redes)', target: '>= 5% promedio' },
      { metric: 'Tiempo de respuesta comunidad', target: '< 2 horas en horario laboral' },
      { metric: 'Contenido publicado', target: '>= 20 posts/mes en redes + 10 en plataforma' },
      { metric: 'NPS de comunidad', target: '>= 40' },
      { metric: 'Referidos generados', target: '>= 50 referidos activos/mes' },
    ],
    tools: [
      'Canva',
      'Instagram Business',
      'TikTok Creator',
      'LinkedIn',
      'Plataforma Conniku',
      'Google Analytics',
      'Slack',
    ],
    schedule: 'Lunes a Viernes, 45 hrs semanales. Flexibilidad para publicar en horarios peak.',
    compensation: {
      base: '$1.200.000 CLP bruto mensual',
      benefits: [
        'Colacion $70.000',
        'Movilizacion $40.000',
        'Bono por hitos de crecimiento de comunidad',
      ],
    },
  },

  // ─── CUSTOMER SUPPORT LEAD ───
  {
    positionKey: 'customer_support',
    title: 'Customer Support Lead',
    department: 'Soporte',
    email: 'soporte@conniku.com',
    reportTo: 'Head of Operations / CEO',
    mision:
      'Garantizar que cada estudiante que contacte a Conniku reciba una respuesta rapida, empatica y resolutiva, convirtiendo cada interaccion de soporte en una oportunidad de fidelizacion.',
    expectations: [
      'Resolver el 90% de tickets en primera respuesta',
      'Mantener satisfaccion de soporte >= 4.5/5.0',
      'Escalar problemas tecnicos correctamente al CTO',
      'Documentar problemas recurrentes para mejora del producto',
      'Ser la voz mas empatica y paciente del equipo',
      'Proponer mejoras al flujo de soporte basado en datos',
    ],
    responsibilities: [
      'Atender consultas de estudiantes via chat, email y redes sociales',
      'Gestionar el chatbot de soporte y entrenar respuestas',
      'Crear y mantener base de conocimiento (FAQ, tutoriales, guias)',
      'Monitorear tickets de soporte y priorizar por urgencia',
      'Documentar bugs reportados por usuarios y coordinar con CTO',
      'Realizar seguimiento de casos complejos hasta resolucion',
      'Generar reportes semanales de metricas de soporte',
      'Capacitar al equipo en protocolos de atencion',
      'Gestionar el email soporte@conniku.com',
      'Coordinar con Community Manager para temas de comunidad que requieran soporte',
    ],
    commitments: [
      'Herramientas de soporte y ticketing',
      'Acceso al chatbot y configuracion de respuestas automaticas',
      'Capacitacion en el producto y actualizaciones constantes',
      'Protocolo claro de escalamiento para temas tecnicos y legales',
      'Metricas y dashboards de soporte en tiempo real',
      'Horario definido sin expectativa de disponibilidad 24/7',
    ],
    requirements: [
      'Titulo o cursando ultimo ano en carrera de servicios, comunicacion o afin',
      'Minimo 1 ano en atencion al cliente o soporte',
      'Excelente redaccion y comunicacion escrita',
      'Empatia, paciencia y orientacion al servicio',
      'Capacidad para manejar multiples conversaciones simultaneas',
      'Conocimiento basico de tecnologia (navegadores, apps, cuentas)',
    ],
    desirable: [
      'Experiencia con herramientas de ticketing (Zendesk, Freshdesk, Intercom)',
      'Conocimiento de chatbots y automatizacion',
      'Experiencia en soporte para plataformas educativas',
      'Ingles intermedio para documentacion tecnica',
    ],
    kpis: [
      { metric: 'First response time', target: '< 30 minutos en horario laboral' },
      { metric: 'Resolution rate (1st contact)', target: '>= 90%' },
      { metric: 'CSAT (satisfaccion)', target: '>= 4.5/5.0' },
      { metric: 'Tickets resueltos/dia', target: '>= 25' },
      { metric: 'FAQ articles creados/actualizados', target: '>= 5/mes' },
      { metric: 'Bugs reportados documentados', target: '100% con reproduccion' },
    ],
    tools: ['Plataforma Conniku', 'Zoho Mail', 'Chatbot de soporte', 'Google Docs', 'Slack'],
    schedule: 'Lunes a Viernes, 45 hrs semanales.',
    compensation: {
      base: '$1.000.000 CLP bruto mensual',
      benefits: ['Colacion $70.000', 'Movilizacion $40.000', 'Bono trimestral por CSAT'],
    },
  },

  // ─── MARKETING & GROWTH LEAD ───
  {
    positionKey: 'marketing_growth',
    title: 'Marketing & Growth Lead',
    department: 'Marketing',
    email: 'marketing@conniku.com',
    reportTo: 'CEO / Cristian Andrés Gutiérrez Lazcano',
    mision:
      'Disenar y ejecutar la estrategia de crecimiento de Conniku, posicionando la plataforma como la herramienta #1 para estudiantes universitarios en Chile, adquiriendo usuarios de forma eficiente y sostenible.',
    expectations: [
      'Lograr crecimiento sostenido de usuarios activos mensuales',
      'Optimizar el costo de adquisicion (CAC) mes a mes',
      'Construir la marca Conniku como referente en EdTech chileno',
      'Experimentar constantemente con canales y mensajes (growth hacking)',
      'Tomar decisiones basadas en datos, no en intuicion',
      'Coordinar todas las iniciativas de marketing del equipo',
    ],
    responsibilities: [
      'Disenar y ejecutar estrategia de growth (adquisicion, activacion, retencion)',
      'Gestionar campanas de performance (Google Ads, Meta Ads, TikTok Ads)',
      'Implementar y optimizar funnels de conversion',
      'Coordinar con Community Manager la estrategia de contenido',
      'Gestionar relaciones con universidades y centros de estudiantes',
      'Planificar y ejecutar lanzamientos de producto',
      'A/B testing en landing pages, emails y flujos de onboarding',
      'Analizar metricas de growth (MAU, DAU, retention, churn, CAC, LTV)',
      'Gestionar el email marketing (Zoho Mail + automaciones)',
      'Desarrollar estrategia SEO para conniku.com',
      'Coordinar con CTO la implementacion de analytics y tracking',
      'Gestionar presupuesto de marketing y reportar ROI',
    ],
    commitments: [
      'Presupuesto mensual de marketing definido y transparente',
      'Acceso a herramientas de analytics y ads',
      'Autonomia para experimentar con canales y estrategias',
      'Soporte tecnico del CTO para implementaciones de tracking',
      'Acceso a datos de producto para decisiones de growth',
      'Participacion en roadmap de producto',
    ],
    requirements: [
      'Titulo en Marketing, Ingenieria Comercial, Publicidad o carrera afin',
      'Minimo 2 anos en marketing digital o growth',
      'Experiencia con Google Ads, Meta Ads y analytics',
      'Dominio de Google Analytics, Google Tag Manager',
      'Mentalidad data-driven y experimentacion constante',
      'Experiencia gestionando presupuestos de marketing',
    ],
    desirable: [
      'Experiencia en startups o EdTech',
      'Conocimiento de SEO tecnico y contenido',
      'Experiencia con email marketing y automaciones',
      'Conocimiento de product-led growth',
      'Certificaciones Google Ads o Meta Blueprint',
    ],
    kpis: [
      { metric: 'Usuarios activos mensuales (MAU)', target: 'Crecimiento >= 20% mensual' },
      { metric: 'CAC (Costo Adquisicion)', target: 'Reduccion >= 10% trimestral' },
      { metric: 'Conversion signup->activo', target: '>= 40%' },
      { metric: 'Retention D30', target: '>= 35%' },
      { metric: 'ROI de campanas', target: '>= 3x' },
      { metric: 'Trafico organico', target: 'Crecimiento >= 15% mensual' },
    ],
    tools: [
      'Google Ads',
      'Meta Ads Manager',
      'Google Analytics',
      'Google Tag Manager',
      'Canva',
      'Zoho Mail',
      'Plataforma Conniku (Admin)',
      'Slack',
    ],
    schedule: 'Lunes a Viernes, 45 hrs semanales.',
    compensation: {
      base: '$1.500.000 CLP bruto mensual',
      benefits: [
        'Colacion $70.000',
        'Movilizacion $40.000',
        'Bono trimestral por cumplimiento de growth targets',
      ],
    },
  },
];

// ═════════════════════════════════════════════════════════════════
// EXPECTATION MEMOS (30/60/90 dias)
// ═════════════════════════════════════════════════════════════════
export const EXPECTATION_MEMOS: ERCExpectationMemo[] = [
  // ─── CTO ───
  {
    positionKey: 'cto',
    title: 'Expectation Memo — CTO',
    intro:
      'Este documento establece las expectativas claras para los primeros 90 dias en el cargo de CTO de Conniku SpA. Se entrega junto al contrato de trabajo y debe ser firmado por ambas partes.',
    day30: {
      title: 'Primeros 30 dias — Inmersion y Diagnostico',
      items: [
        'Comprender completamente la arquitectura actual (React + FastAPI + PostgreSQL)',
        'Revisar todo el repositorio y documentar deuda tecnica existente',
        'Configurar entorno de desarrollo local y accesos a todos los servicios',
        'Reunirse con cada miembro del equipo para entender flujos de trabajo',
        'Identificar los 3 principales riesgos tecnicos y presentar plan de mitigacion',
        'Realizar primer deploy exitoso a produccion',
        'Establecer rutina de monitoreo (uptime, errores, performance)',
      ],
    },
    day60: {
      title: 'Dias 31-60 — Estabilizacion y Quick Wins',
      items: [
        'Implementar CI/CD pipeline completo (GitHub Actions → Vercel/Render)',
        'Resolver los 5 bugs mas criticos reportados por usuarios',
        'Establecer code review process y estandares de calidad',
        'Implementar monitoreo automatizado (alertas, logs, metricas)',
        'Entregar al menos 2 features del roadmap del producto',
        'Documentar arquitectura y procedimientos de deploy',
        'Optimizar tiempo de carga de la plataforma a < 3 segundos',
      ],
    },
    day90: {
      title: 'Dias 61-90 — Liderazgo y Vision',
      items: [
        'Presentar roadmap tecnico para los proximos 6 meses',
        'Tener code coverage >= 50% en areas criticas',
        'Haber entregado >= 80% de los features planificados en el trimestre',
        'Establecer proceso de sprint planning y retrospectivas',
        'Implementar al menos 1 feature inteligente que diferencie a Conniku',
        'Tener la app movil (Android) publicada en Play Store',
        'Presentar propuesta de escalamiento de infraestructura',
      ],
    },
    ongoing: [
      'Mantener uptime >= 99.5% y comunicar incidentes proactivamente',
      'Participar en reuniones semanales de liderazgo',
      'Mentorear al equipo tecnico y fomentar cultura de aprendizaje',
      'Evaluar y proponer nuevas tecnologias cuando aporten valor',
    ],
    values: CONNIKU_VALUES,
    evaluationCriteria: [
      'Cumplimiento de KPIs tecnicos (uptime, response time, deploy frequency)',
      'Calidad del codigo entregado (bugs en produccion, code review feedback)',
      'Capacidad de comunicacion tecnica con equipo no-tecnico',
      'Proactividad en identificacion y resolucion de problemas',
      'Alineamiento con la vision del producto y la empresa',
    ],
    signature: { employee: true, supervisor: true, date: true },
  },

  // ─── HEAD OF OPERATIONS ───
  {
    positionKey: 'head_operations',
    title: 'Expectation Memo — Head of Operations',
    intro:
      'Este documento establece las expectativas claras para los primeros 90 dias en el cargo de Head of Operations de Conniku SpA. Se entrega junto al contrato de trabajo y debe ser firmado por ambas partes.',
    day30: {
      title: 'Primeros 30 dias — Levantamiento y Orden',
      items: [
        'Conocer el estado actual de toda la documentacion legal y laboral',
        'Revisar contratos vigentes y verificar cumplimiento del Codigo del Trabajo',
        'Mapear todos los procesos operativos existentes (formales e informales)',
        'Familiarizarse con el modulo de administracion de Conniku',
        'Verificar que Previred, AFC y AFP esten al dia',
        'Crear checklist de onboarding estandar para nuevos empleados',
        'Reunirse individualmente con cada miembro del equipo',
      ],
    },
    day60: {
      title: 'Dias 31-60 — Procesos y Estructura',
      items: [
        'Tener todos los contratos de trabajo actualizados y firmados',
        'Implementar proceso de control de asistencia',
        'Crear y distribuir Reglamento Interno de Orden, Higiene y Seguridad',
        'Establecer proceso mensual de remuneraciones (cierre dia 22)',
        'Documentar procedimientos de onboarding/offboarding',
        'Gestionar primera declaracion de Previred exitosa',
        'Implementar sistema de vacaciones y licencias',
      ],
    },
    day90: {
      title: 'Dias 61-90 — Optimizacion y Autonomia',
      items: [
        'Tener 100% de la documentacion legal al dia',
        'Presentar presupuesto operacional trimestral',
        'Haber ejecutado al menos 1 capacitacion para el equipo',
        'Establecer KPIs operacionales y sistema de medicion',
        'Tener relacion establecida con mutual de seguridad',
        'Coordinar inscripcion SENCE para capacitaciones futuras',
        'Presentar propuesta de mejora de procesos internos',
      ],
    },
    ongoing: [
      'Mantener compliance 100% con legislacion laboral chilena',
      'Reportar KPIs operacionales semanalmente',
      'Gestionar relacion con proveedores sin atrasos de pago',
      'Coordinar entre departamentos para mantener flujo de trabajo',
    ],
    values: CONNIKU_VALUES,
    evaluationCriteria: [
      'Compliance legal (contratos, Previred, AFC al dia)',
      'Eficiencia operacional (tiempo de procesos, costos)',
      'Satisfaccion del equipo interno',
      'Calidad de reportes y documentacion',
      'Capacidad de anticipar y resolver problemas',
    ],
    signature: { employee: true, supervisor: true, date: true },
  },

  // ─── COMMUNITY MANAGER ───
  {
    positionKey: 'community_manager',
    title: 'Expectation Memo — Community Manager',
    intro:
      'Este documento establece las expectativas claras para los primeros 90 dias en el cargo de Community Manager de Conniku SpA. Se entrega junto al contrato de trabajo y debe ser firmado por ambas partes.',
    day30: {
      title: 'Primeros 30 dias — Inmersion en la Comunidad',
      items: [
        'Conocer profundamente el producto Conniku como usuario',
        'Estudiar el perfil del estudiante universitario chileno objetivo',
        'Crear perfiles de redes sociales o auditar los existentes',
        'Disenar identidad visual para redes sociales (templates, paleta)',
        'Publicar primeros 15 contenidos en redes sociales',
        'Identificar 10 universidades clave para penetracion inicial',
        'Crear primer calendario editorial mensual',
      ],
    },
    day60: {
      title: 'Dias 31-60 — Crecimiento y Engagement',
      items: [
        'Alcanzar primeros 500 seguidores en redes principales',
        'Organizar primer evento virtual para estudiantes',
        'Establecer programa de embajadores estudiantiles (3-5 embajadores)',
        'Publicar contenido consistente (minimo 5 posts/semana)',
        'Generar primeros 20 posts dentro de la plataforma Conniku',
        'Lograr engagement rate >= 3% en redes sociales',
        'Presentar primer reporte de metricas de comunidad',
      ],
    },
    day90: {
      title: 'Dias 61-90 — Escala y Sistematizacion',
      items: [
        'Alcanzar 1.500 seguidores combinados en redes',
        'Tener >= 10 embajadores activos en universidades diferentes',
        'Implementar programa de referidos dentro de la plataforma',
        'Documentar procesos de creacion de contenido',
        'Lograr que al menos 2 contenidos se viralicen organicamente',
        'Establecer alianzas con 3 centros de estudiantes',
        'Presentar estrategia de comunidad para el proximo trimestre',
      ],
    },
    ongoing: [
      'Publicar contenido consistente segun calendario editorial',
      'Responder interacciones en < 2 horas',
      'Reportar metricas de engagement semanalmente',
      'Identificar tendencias estudiantiles y proponer contenido',
    ],
    values: CONNIKU_VALUES,
    evaluationCriteria: [
      'Crecimiento de comunidad (seguidores, miembros activos)',
      'Engagement rate y calidad de interacciones',
      'Consistencia en publicacion de contenido',
      'Creatividad y relevancia del contenido',
      'Capacidad de representar la marca Conniku',
    ],
    signature: { employee: true, supervisor: true, date: true },
  },

  // ─── CUSTOMER SUPPORT LEAD ───
  {
    positionKey: 'customer_support',
    title: 'Expectation Memo — Customer Support Lead',
    intro:
      'Este documento establece las expectativas claras para los primeros 90 dias en el cargo de Customer Support Lead de Conniku SpA. Se entrega junto al contrato de trabajo y debe ser firmado por ambas partes.',
    day30: {
      title: 'Primeros 30 dias — Conocer el Producto y los Usuarios',
      items: [
        'Dominar completamente todas las funcionalidades de Conniku',
        'Crear cuenta y usar la plataforma como estudiante durante 1 semana',
        'Revisar y categorizar todas las consultas/problemas recibidos hasta la fecha',
        'Configurar y personalizar el chatbot de soporte',
        'Crear primeros 10 articulos de FAQ',
        'Establecer plantillas de respuesta para consultas frecuentes',
        'Definir protocolo de escalamiento (soporte → CTO para bugs tecnicos)',
      ],
    },
    day60: {
      title: 'Dias 31-60 — Estructura y Eficiencia',
      items: [
        'Tener base de conocimiento con >= 25 articulos',
        'Alcanzar CSAT >= 4.0/5.0',
        'Reducir tiempo de primera respuesta a < 1 hora',
        'Documentar los 10 problemas mas recurrentes y soluciones',
        'Entrenar al chatbot con >= 50 respuestas automaticas',
        'Establecer proceso de reporte de bugs al CTO',
        'Crear dashboard de metricas de soporte',
      ],
    },
    day90: {
      title: 'Dias 61-90 — Excelencia y Proactividad',
      items: [
        'Alcanzar CSAT >= 4.5/5.0 consistente',
        'First response time < 30 minutos promedio',
        'Tener >= 90% resolution rate en primer contacto',
        'Base de conocimiento con >= 50 articulos',
        'Haber identificado >= 5 mejoras de producto desde feedback',
        'Presentar propuesta de automatizacion de soporte para proximos 3 meses',
        'Crear manual de capacitacion para futuros agentes de soporte',
      ],
    },
    ongoing: [
      'Mantener CSAT >= 4.5/5.0 y respuesta < 30 min',
      'Actualizar FAQ y base de conocimiento semanalmente',
      'Reportar bugs y mejoras de producto constantemente',
      'Mantener chatbot entrenado con nuevas funcionalidades',
    ],
    values: CONNIKU_VALUES,
    evaluationCriteria: [
      'CSAT y NPS de soporte',
      'Tiempos de respuesta y resolucion',
      'Calidad y completitud de la base de conocimiento',
      'Cantidad de mejoras de producto sugeridas e implementadas',
      'Empatia y profesionalismo en cada interaccion',
    ],
    signature: { employee: true, supervisor: true, date: true },
  },

  // ─── MARKETING & GROWTH LEAD ───
  {
    positionKey: 'marketing_growth',
    title: 'Expectation Memo — Marketing & Growth Lead',
    intro:
      'Este documento establece las expectativas claras para los primeros 90 dias en el cargo de Marketing & Growth Lead de Conniku SpA. Se entrega junto al contrato de trabajo y debe ser firmado por ambas partes.',
    day30: {
      title: 'Primeros 30 dias — Data y Estrategia Base',
      items: [
        'Auditar estado actual de marketing (canales, metricas, assets)',
        'Implementar Google Analytics 4 y Google Tag Manager en conniku.com',
        'Definir funnel de conversion y puntos de medicion',
        'Investigar competencia (EdTech en Chile y LATAM)',
        'Crear buyer personas basados en datos de estudiantes existentes',
        'Configurar primeras campanas de performance (Google/Meta)',
        'Presentar estrategia de growth para los primeros 6 meses',
      ],
    },
    day60: {
      title: 'Dias 31-60 — Ejecucion y Experimentacion',
      items: [
        'Lanzar >= 3 campanas de adquisicion en diferentes canales',
        'Realizar >= 5 A/B tests (landing pages, copy, CTAs)',
        'Lograr primeros 500 registros atribuidos a campanas pagadas',
        'Implementar email marketing automatizado (welcome series)',
        'Establecer alianzas con >= 3 universidades para promocion',
        'Optimizar SEO basico de conniku.com (meta tags, sitemap, robots.txt)',
        'Reportar primer analisis de CAC y conversion funnel',
      ],
    },
    day90: {
      title: 'Dias 61-90 — Escala y Optimizacion',
      items: [
        'Lograr crecimiento de MAU >= 50% respecto al inicio',
        'Reducir CAC en >= 20% vs primer mes de campanas',
        'Tener conversion signup→activo >= 30%',
        'Implementar programa de referidos con tracking',
        'Presentar ROI de cada canal de adquisicion',
        'Establecer proceso de experimentacion sistematico (hipotesis → test → learn)',
        'Presentar roadmap de marketing para el proximo trimestre',
      ],
    },
    ongoing: [
      'Monitorear y optimizar campanas semanalmente',
      'Reportar metricas de growth (MAU, CAC, retention, churn)',
      'Experimentar constantemente con nuevos canales y mensajes',
      'Coordinar con Community Manager y CTO para alineamiento',
    ],
    values: CONNIKU_VALUES,
    evaluationCriteria: [
      'Crecimiento de usuarios activos (MAU, DAU)',
      'Eficiencia en adquisicion (CAC, ROI)',
      'Conversion rates del funnel completo',
      'Calidad y frecuencia de experimentacion',
      'Capacidad de tomar decisiones basadas en datos',
    ],
    signature: { employee: true, supervisor: true, date: true },
  },
];

// ═════════════════════════════════════════════════════════════════
// CONTRACT TEMPLATES
// ═════════════════════════════════════════════════════════════════
export const CONTRACT_TEMPLATES: ERCContractTemplate[] = [
  {
    positionKey: 'cto',
    title: 'Contrato Tipo — CTO',
    type: 'indefinido',
    clauses: [
      {
        title: 'PRIMERO: Antecedentes del Empleador',
        content:
          'CONNIKU SpA, RUT 78.395.702-7, representada legalmente por don Cristian Andrés Gutiérrez Lazcano, en adelante "el Empleador", con domicilio en Antofagasta, II Región de Antofagasta, Chile.',
      },
      {
        title: 'SEGUNDO: Antecedentes del Trabajador',
        content:
          'Don/Dona [NOMBRE COMPLETO], RUT [RUT], de nacionalidad [NACIONALIDAD], estado civil [ESTADO CIVIL], domiciliado/a en [DIRECCION], en adelante "el Trabajador".',
      },
      {
        title: 'TERCERO: Naturaleza de los Servicios',
        content:
          'El Trabajador se desempenara como CTO — Director de Tecnologia, realizando las funciones descritas en la Job Description adjunta (Anexo 1), la cual forma parte integrante de este contrato.',
      },
      {
        title: 'CUARTO: Lugar de Prestacion de Servicios',
        content:
          'El Trabajador prestara sus servicios en modalidad remota/hibrida, pudiendo desempenar funciones desde su domicilio o desde las oficinas que la empresa designe en Santiago, Chile.',
      },
      {
        title: 'QUINTO: Jornada de Trabajo',
        content:
          'La jornada ordinaria sera de 45 horas semanales, distribuidas de lunes a viernes, de 09:00 a 18:00 horas, con 1 hora de colacion. El Trabajador tendra disponibilidad para incidentes criticos fuera de horario.',
      },
      {
        title: 'SEXTO: Remuneracion',
        content:
          'El Empleador pagara al Trabajador una remuneracion bruta mensual de $2.800.000 (dos millones ochocientos mil pesos), mas asignacion de colacion de $80.000 y movilizacion de $50.000, ambas no imponibles. El pago se realizara el ultimo dia habil de cada mes.',
      },
      {
        title: 'SEPTIMO: Duracion del Contrato',
        content:
          'El presente contrato tendra duracion indefinida, comenzando a regir desde el [FECHA INICIO].',
      },
      {
        title: 'OCTAVO: Confidencialidad y Terminacion Inmediata',
        content:
          'El Trabajador se obliga a mantener estricta y absoluta confidencialidad sobre toda informacion tecnica, comercial, financiera, estrategica, de propiedad intelectual y datos personales de usuarios a la que tenga acceso durante el ejercicio de sus funciones en Conniku SpA. Esta obligacion incluye, sin limitarse a: codigo fuente, algoritmos, bases de datos, planes de negocio, informacion financiera, datos de usuarios, estrategias de marketing, credenciales de acceso, y cualquier informacion que razonablemente pueda considerarse como confidencial o propietaria de la empresa. La violacion de esta clausula constituye CAUSAL DE TERMINACION INMEDIATA del contrato conforme al articulo 160 N°7 del Codigo del Trabajo (Incumplimiento Grave de las Obligaciones del Contrato), sin derecho a indemnizacion alguna. Adicionalmente, el Trabajador podra ser sujeto a acciones civiles por los danos y perjuicios causados. Esta clausula de confidencialidad subsiste por un periodo de 2 anos despues de terminada la relacion laboral.',
      },
      {
        title: 'NOVENO: Propiedad Intelectual',
        content:
          'Todo el codigo, disenos, algoritmos y propiedad intelectual creada por el Trabajador en el ejercicio de sus funciones sera propiedad exclusiva de Conniku SpA.',
      },
      {
        title: 'DECIMO: Expectation Memo',
        content:
          'El Trabajador declara haber recibido y comprendido el Expectation Memo (Anexo 2), que detalla las expectativas para los primeros 90 dias y forma parte integrante de este contrato.',
      },
      {
        title: 'UNDECIMO: Disciplina Progresiva',
        content:
          'El Empleador aplicara un sistema de disciplina progresiva ante incumplimientos laborales, consistente en: (i) Amonestacion Verbal, (ii) Amonestacion Escrita 1, (iii) Amonestacion Escrita 2, y (iv) Terminacion del contrato. Cada etapa sera documentada en el Electronic Record Card (ERC) del Trabajador y firmada electronicamente. El Trabajador sera notificado formalmente en cada instancia y tendra derecho a presentar sus descargos dentro de 3 dias habiles.',
      },
      {
        title: 'DUODECIMO: Evaluacion de Desempeno',
        content:
          'El Trabajador sera evaluado mediante Performance Reviews programadas (Mid-Contract y End-of-Contract), utilizando un sistema de 7 dimensiones calificadas de 1 a 5. Si el Trabajador obtiene un promedio inferior a 3.0 en dos evaluaciones consecutivas, la empresa se reserva el derecho de poner termino al contrato por necesidades de la empresa conforme al articulo 161 del Codigo del Trabajo, con las indemnizaciones legales correspondientes. El Trabajador recibira copia de cada evaluacion y podra firmar su recepcion a traves del sistema de Firma Electronica Simple (FES).',
      },
      {
        title: 'DECIMOTERCERO: Falta de Probidad',
        content:
          'Constituye causal de terminacion inmediata del contrato, conforme al articulo 160 N°1 del Codigo del Trabajo, toda falta de probidad del Trabajador en el desempeno de sus funciones. Se entiende por falta de probidad cualquier conducta deshonesta, fraudulenta o contraria a la buena fe, incluyendo pero no limitandose a: apropiacion indebida de recursos, falsificacion de documentos, declaraciones falsas, uso de informacion privilegiada para beneficio personal, y cualquier acto que atente contra la integridad y confianza depositada por el Empleador.',
      },
      {
        title: 'DECIMOCUARTO: Incumplimiento de Contrato',
        content:
          'Sin perjuicio de las causales de terminacion establecidas en el Codigo del Trabajo, el incumplimiento reiterado de las obligaciones contractuales, incluyendo las metas definidas en la Job Description y el Expectation Memo, podra dar lugar a la aplicacion del sistema de disciplina progresiva. En casos de incumplimiento grave, se aplicara el articulo 160 N°7 del Codigo del Trabajo.',
      },
      {
        title: 'DECIMOQUINTO: Legislacion Aplicable',
        content:
          'El presente contrato se rige por las disposiciones del Codigo del Trabajo de Chile y demas normativa laboral vigente.',
      },
    ],
  },
  {
    positionKey: 'head_operations',
    title: 'Contrato Tipo — Head of Operations',
    type: 'indefinido',
    clauses: [
      {
        title: 'PRIMERO: Antecedentes del Empleador',
        content:
          'CONNIKU SpA, RUT 78.395.702-7, representada legalmente por don Cristian Andrés Gutiérrez Lazcano, en adelante "el Empleador", con domicilio en Antofagasta, II Región de Antofagasta, Chile.',
      },
      {
        title: 'SEGUNDO: Antecedentes del Trabajador',
        content:
          'Don/Dona [NOMBRE COMPLETO], RUT [RUT], de nacionalidad [NACIONALIDAD], estado civil [ESTADO CIVIL], domiciliado/a en [DIRECCION], en adelante "el Trabajador".',
      },
      {
        title: 'TERCERO: Naturaleza de los Servicios',
        content:
          'El Trabajador se desempenara como Head of Operations, realizando las funciones descritas en la Job Description adjunta (Anexo 1), la cual forma parte integrante de este contrato.',
      },
      {
        title: 'CUARTO: Lugar de Prestacion de Servicios',
        content:
          'El Trabajador prestara sus servicios en modalidad remota/hibrida, pudiendo desempenar funciones desde su domicilio o desde las oficinas que la empresa designe en Santiago, Chile.',
      },
      {
        title: 'QUINTO: Jornada de Trabajo',
        content:
          'La jornada ordinaria sera de 45 horas semanales, distribuidas de lunes a viernes, de 09:00 a 18:00 horas, con 1 hora de colacion.',
      },
      {
        title: 'SEXTO: Remuneracion',
        content:
          'El Empleador pagara al Trabajador una remuneracion bruta mensual de $2.200.000 (dos millones doscientos mil pesos), mas asignacion de colacion de $80.000 y movilizacion de $50.000, ambas no imponibles. El pago se realizara el ultimo dia habil de cada mes.',
      },
      {
        title: 'SEPTIMO: Duracion del Contrato',
        content:
          'El presente contrato tendra duracion indefinida, comenzando a regir desde el [FECHA INICIO].',
      },
      {
        title: 'OCTAVO: Confidencialidad y Terminacion Inmediata',
        content:
          'El Trabajador se obliga a mantener estricta y absoluta confidencialidad sobre toda informacion tecnica, comercial, financiera, estrategica, de propiedad intelectual y datos personales de usuarios a la que tenga acceso durante el ejercicio de sus funciones en Conniku SpA. Esta obligacion incluye, sin limitarse a: codigo fuente, algoritmos, bases de datos, planes de negocio, informacion financiera, datos de usuarios, estrategias de marketing, credenciales de acceso, y cualquier informacion que razonablemente pueda considerarse como confidencial o propietaria de la empresa. La violacion de esta clausula constituye CAUSAL DE TERMINACION INMEDIATA del contrato conforme al articulo 160 N°7 del Codigo del Trabajo (Incumplimiento Grave de las Obligaciones del Contrato), sin derecho a indemnizacion alguna. Adicionalmente, el Trabajador podra ser sujeto a acciones civiles por los danos y perjuicios causados. Esta clausula de confidencialidad subsiste por un periodo de 2 anos despues de terminada la relacion laboral.',
      },
      {
        title: 'NOVENO: Manejo de Datos Personales',
        content:
          'El Trabajador tendra acceso a datos personales de empleados conforme a la Ley 19.628, comprometiendose a su tratamiento exclusivamente para fines laborales.',
      },
      {
        title: 'DECIMO: Expectation Memo',
        content:
          'El Trabajador declara haber recibido y comprendido el Expectation Memo (Anexo 2), que detalla las expectativas para los primeros 90 dias y forma parte integrante de este contrato.',
      },
      {
        title: 'UNDECIMO: Disciplina Progresiva',
        content:
          'El Empleador aplicara un sistema de disciplina progresiva ante incumplimientos laborales, consistente en: (i) Amonestacion Verbal, (ii) Amonestacion Escrita 1, (iii) Amonestacion Escrita 2, y (iv) Terminacion del contrato. Cada etapa sera documentada en el Electronic Record Card (ERC) del Trabajador y firmada electronicamente. El Trabajador sera notificado formalmente en cada instancia y tendra derecho a presentar sus descargos dentro de 3 dias habiles.',
      },
      {
        title: 'DUODECIMO: Evaluacion de Desempeno',
        content:
          'El Trabajador sera evaluado mediante Performance Reviews programadas (Mid-Contract y End-of-Contract), utilizando un sistema de 7 dimensiones calificadas de 1 a 5. Si el Trabajador obtiene un promedio inferior a 3.0 en dos evaluaciones consecutivas, la empresa se reserva el derecho de poner termino al contrato por necesidades de la empresa conforme al articulo 161 del Codigo del Trabajo, con las indemnizaciones legales correspondientes. El Trabajador recibira copia de cada evaluacion y podra firmar su recepcion a traves del sistema de Firma Electronica Simple (FES).',
      },
      {
        title: 'DECIMOTERCERO: Falta de Probidad',
        content:
          'Constituye causal de terminacion inmediata del contrato, conforme al articulo 160 N°1 del Codigo del Trabajo, toda falta de probidad del Trabajador en el desempeno de sus funciones. Se entiende por falta de probidad cualquier conducta deshonesta, fraudulenta o contraria a la buena fe, incluyendo pero no limitandose a: apropiacion indebida de recursos, falsificacion de documentos, declaraciones falsas, uso de informacion privilegiada para beneficio personal, y cualquier acto que atente contra la integridad y confianza depositada por el Empleador.',
      },
      {
        title: 'DECIMOCUARTO: Incumplimiento de Contrato',
        content:
          'Sin perjuicio de las causales de terminacion establecidas en el Codigo del Trabajo, el incumplimiento reiterado de las obligaciones contractuales, incluyendo las metas definidas en la Job Description y el Expectation Memo, podra dar lugar a la aplicacion del sistema de disciplina progresiva. En casos de incumplimiento grave, se aplicara el articulo 160 N°7 del Codigo del Trabajo.',
      },
      {
        title: 'DECIMOQUINTO: Legislacion Aplicable',
        content:
          'El presente contrato se rige por las disposiciones del Codigo del Trabajo de Chile y demas normativa laboral vigente.',
      },
    ],
  },
  {
    positionKey: 'community_manager',
    title: 'Contrato Tipo — Community Manager',
    type: 'indefinido',
    clauses: [
      {
        title: 'PRIMERO: Antecedentes del Empleador',
        content:
          'CONNIKU SpA, RUT 78.395.702-7, representada legalmente por don Cristian Andrés Gutiérrez Lazcano, en adelante "el Empleador", con domicilio en Antofagasta, II Región de Antofagasta, Chile.',
      },
      {
        title: 'SEGUNDO: Antecedentes del Trabajador',
        content:
          'Don/Dona [NOMBRE COMPLETO], RUT [RUT], de nacionalidad [NACIONALIDAD], estado civil [ESTADO CIVIL], domiciliado/a en [DIRECCION], en adelante "el Trabajador".',
      },
      {
        title: 'TERCERO: Naturaleza de los Servicios',
        content:
          'El Trabajador se desempenara como Community Manager, realizando las funciones descritas en la Job Description adjunta (Anexo 1), la cual forma parte integrante de este contrato.',
      },
      {
        title: 'CUARTO: Lugar de Prestacion de Servicios',
        content:
          'El Trabajador prestara sus servicios en modalidad remota/hibrida, pudiendo desempenar funciones desde su domicilio o desde las oficinas que la empresa designe en Santiago, Chile.',
      },
      {
        title: 'QUINTO: Jornada de Trabajo',
        content:
          'La jornada ordinaria sera de 45 horas semanales, distribuidas de lunes a viernes, de 09:00 a 18:00 horas, con 1 hora de colacion. Se permite flexibilidad horaria para publicacion en horarios peak de redes sociales.',
      },
      {
        title: 'SEXTO: Remuneracion',
        content:
          'El Empleador pagara al Trabajador una remuneracion bruta mensual de $1.200.000 (un millon doscientos mil pesos), mas asignacion de colacion de $70.000 y movilizacion de $40.000, ambas no imponibles. El pago se realizara el ultimo dia habil de cada mes.',
      },
      {
        title: 'SEPTIMO: Duracion del Contrato',
        content:
          'El presente contrato tendra duracion indefinida, comenzando a regir desde el [FECHA INICIO].',
      },
      {
        title: 'OCTAVO: Redes Sociales y Propiedad',
        content:
          'Las cuentas de redes sociales creadas y gestionadas en nombre de Conniku SpA son propiedad exclusiva de la empresa. El Trabajador se compromete a traspasar accesos al terminar la relacion laboral.',
      },
      {
        title: 'NOVENO: Uso de Imagen',
        content:
          'El Trabajador autoriza el uso de su imagen y voz en contenido de Conniku SpA para fines de marketing y comunidad, durante y despues de la relacion laboral.',
      },
      {
        title: 'DECIMO: Confidencialidad y Terminacion Inmediata',
        content:
          'El Trabajador se obliga a mantener estricta y absoluta confidencialidad sobre toda informacion tecnica, comercial, financiera, estrategica, de propiedad intelectual y datos personales de usuarios a la que tenga acceso durante el ejercicio de sus funciones en Conniku SpA. Esta obligacion incluye, sin limitarse a: codigo fuente, algoritmos, bases de datos, planes de negocio, informacion financiera, datos de usuarios, estrategias de marketing, credenciales de acceso, y cualquier informacion que razonablemente pueda considerarse como confidencial o propietaria de la empresa. La violacion de esta clausula constituye CAUSAL DE TERMINACION INMEDIATA del contrato conforme al articulo 160 N°7 del Codigo del Trabajo (Incumplimiento Grave de las Obligaciones del Contrato), sin derecho a indemnizacion alguna. Adicionalmente, el Trabajador podra ser sujeto a acciones civiles por los danos y perjuicios causados. Esta clausula de confidencialidad subsiste por un periodo de 2 anos despues de terminada la relacion laboral.',
      },
      {
        title: 'UNDECIMO: Expectation Memo',
        content:
          'El Trabajador declara haber recibido y comprendido el Expectation Memo (Anexo 2), que detalla las expectativas para los primeros 90 dias y forma parte integrante de este contrato.',
      },
      {
        title: 'DUODECIMO: Disciplina Progresiva',
        content:
          'El Empleador aplicara un sistema de disciplina progresiva ante incumplimientos laborales, consistente en: (i) Amonestacion Verbal, (ii) Amonestacion Escrita 1, (iii) Amonestacion Escrita 2, y (iv) Terminacion del contrato. Cada etapa sera documentada en el Electronic Record Card (ERC) del Trabajador y firmada electronicamente. El Trabajador sera notificado formalmente en cada instancia y tendra derecho a presentar sus descargos dentro de 3 dias habiles.',
      },
      {
        title: 'DECIMOTERCERO: Evaluacion de Desempeno',
        content:
          'El Trabajador sera evaluado mediante Performance Reviews programadas (Mid-Contract y End-of-Contract), utilizando un sistema de 7 dimensiones calificadas de 1 a 5. Si el Trabajador obtiene un promedio inferior a 3.0 en dos evaluaciones consecutivas, la empresa se reserva el derecho de poner termino al contrato por necesidades de la empresa conforme al articulo 161 del Codigo del Trabajo, con las indemnizaciones legales correspondientes. El Trabajador recibira copia de cada evaluacion y podra firmar su recepcion a traves del sistema de Firma Electronica Simple (FES).',
      },
      {
        title: 'DECIMOCUARTO: Falta de Probidad',
        content:
          'Constituye causal de terminacion inmediata del contrato, conforme al articulo 160 N°1 del Codigo del Trabajo, toda falta de probidad del Trabajador en el desempeno de sus funciones. Se entiende por falta de probidad cualquier conducta deshonesta, fraudulenta o contraria a la buena fe, incluyendo pero no limitandose a: apropiacion indebida de recursos, falsificacion de documentos, declaraciones falsas, uso de informacion privilegiada para beneficio personal, y cualquier acto que atente contra la integridad y confianza depositada por el Empleador.',
      },
      {
        title: 'DECIMOQUINTO: Incumplimiento de Contrato',
        content:
          'Sin perjuicio de las causales de terminacion establecidas en el Codigo del Trabajo, el incumplimiento reiterado de las obligaciones contractuales, incluyendo las metas definidas en la Job Description y el Expectation Memo, podra dar lugar a la aplicacion del sistema de disciplina progresiva. En casos de incumplimiento grave, se aplicara el articulo 160 N°7 del Codigo del Trabajo.',
      },
      {
        title: 'DECIMOSEXTO: Legislacion Aplicable',
        content:
          'El presente contrato se rige por las disposiciones del Codigo del Trabajo de Chile y demas normativa laboral vigente.',
      },
    ],
  },
  {
    positionKey: 'customer_support',
    title: 'Contrato Tipo — Customer Support Lead',
    type: 'indefinido',
    clauses: [
      {
        title: 'PRIMERO: Antecedentes del Empleador',
        content:
          'CONNIKU SpA, RUT 78.395.702-7, representada legalmente por don Cristian Andrés Gutiérrez Lazcano, en adelante "el Empleador", con domicilio en Antofagasta, II Región de Antofagasta, Chile.',
      },
      {
        title: 'SEGUNDO: Antecedentes del Trabajador',
        content:
          'Don/Dona [NOMBRE COMPLETO], RUT [RUT], de nacionalidad [NACIONALIDAD], estado civil [ESTADO CIVIL], domiciliado/a en [DIRECCION], en adelante "el Trabajador".',
      },
      {
        title: 'TERCERO: Naturaleza de los Servicios',
        content:
          'El Trabajador se desempenara como Customer Support Lead, realizando las funciones descritas en la Job Description adjunta (Anexo 1), la cual forma parte integrante de este contrato.',
      },
      {
        title: 'CUARTO: Lugar de Prestacion de Servicios',
        content:
          'El Trabajador prestara sus servicios en modalidad remota/hibrida, pudiendo desempenar funciones desde su domicilio o desde las oficinas que la empresa designe en Santiago, Chile.',
      },
      {
        title: 'QUINTO: Jornada de Trabajo',
        content:
          'La jornada ordinaria sera de 45 horas semanales, distribuidas de lunes a viernes, de 09:00 a 18:00 horas, con 1 hora de colacion.',
      },
      {
        title: 'SEXTO: Remuneracion',
        content:
          'El Empleador pagara al Trabajador una remuneracion bruta mensual de $1.000.000 (un millon de pesos), mas asignacion de colacion de $70.000 y movilizacion de $40.000, ambas no imponibles. El pago se realizara el ultimo dia habil de cada mes.',
      },
      {
        title: 'SEPTIMO: Duracion del Contrato',
        content:
          'El presente contrato tendra duracion indefinida, comenzando a regir desde el [FECHA INICIO].',
      },
      {
        title: 'OCTAVO: Confidencialidad y Terminacion Inmediata',
        content:
          'El Trabajador se obliga a mantener estricta y absoluta confidencialidad sobre toda informacion tecnica, comercial, financiera, estrategica, de propiedad intelectual y datos personales de usuarios a la que tenga acceso durante el ejercicio de sus funciones en Conniku SpA. Esta obligacion incluye, sin limitarse a: codigo fuente, algoritmos, bases de datos, planes de negocio, informacion financiera, datos de usuarios, estrategias de marketing, credenciales de acceso, y cualquier informacion que razonablemente pueda considerarse como confidencial o propietaria de la empresa. La violacion de esta clausula constituye CAUSAL DE TERMINACION INMEDIATA del contrato conforme al articulo 160 N°7 del Codigo del Trabajo (Incumplimiento Grave de las Obligaciones del Contrato), sin derecho a indemnizacion alguna. Adicionalmente, el Trabajador podra ser sujeto a acciones civiles por los danos y perjuicios causados. Esta clausula de confidencialidad subsiste por un periodo de 2 anos despues de terminada la relacion laboral.',
      },
      {
        title: 'NOVENO: Protocolo de Atencion',
        content:
          'El Trabajador se compromete a seguir los protocolos de atencion establecidos y mantener los estandares de calidad definidos en las metricas de soporte.',
      },
      {
        title: 'DECIMO: Expectation Memo',
        content:
          'El Trabajador declara haber recibido y comprendido el Expectation Memo (Anexo 2), que detalla las expectativas para los primeros 90 dias y forma parte integrante de este contrato.',
      },
      {
        title: 'UNDECIMO: Disciplina Progresiva',
        content:
          'El Empleador aplicara un sistema de disciplina progresiva ante incumplimientos laborales, consistente en: (i) Amonestacion Verbal, (ii) Amonestacion Escrita 1, (iii) Amonestacion Escrita 2, y (iv) Terminacion del contrato. Cada etapa sera documentada en el Electronic Record Card (ERC) del Trabajador y firmada electronicamente. El Trabajador sera notificado formalmente en cada instancia y tendra derecho a presentar sus descargos dentro de 3 dias habiles.',
      },
      {
        title: 'DUODECIMO: Evaluacion de Desempeno',
        content:
          'El Trabajador sera evaluado mediante Performance Reviews programadas (Mid-Contract y End-of-Contract), utilizando un sistema de 7 dimensiones calificadas de 1 a 5. Si el Trabajador obtiene un promedio inferior a 3.0 en dos evaluaciones consecutivas, la empresa se reserva el derecho de poner termino al contrato por necesidades de la empresa conforme al articulo 161 del Codigo del Trabajo, con las indemnizaciones legales correspondientes. El Trabajador recibira copia de cada evaluacion y podra firmar su recepcion a traves del sistema de Firma Electronica Simple (FES).',
      },
      {
        title: 'DECIMOTERCERO: Falta de Probidad',
        content:
          'Constituye causal de terminacion inmediata del contrato, conforme al articulo 160 N°1 del Codigo del Trabajo, toda falta de probidad del Trabajador en el desempeno de sus funciones. Se entiende por falta de probidad cualquier conducta deshonesta, fraudulenta o contraria a la buena fe, incluyendo pero no limitandose a: apropiacion indebida de recursos, falsificacion de documentos, declaraciones falsas, uso de informacion privilegiada para beneficio personal, y cualquier acto que atente contra la integridad y confianza depositada por el Empleador.',
      },
      {
        title: 'DECIMOCUARTO: Incumplimiento de Contrato',
        content:
          'Sin perjuicio de las causales de terminacion establecidas en el Codigo del Trabajo, el incumplimiento reiterado de las obligaciones contractuales, incluyendo las metas definidas en la Job Description y el Expectation Memo, podra dar lugar a la aplicacion del sistema de disciplina progresiva. En casos de incumplimiento grave, se aplicara el articulo 160 N°7 del Codigo del Trabajo.',
      },
      {
        title: 'DECIMOQUINTO: Legislacion Aplicable',
        content:
          'El presente contrato se rige por las disposiciones del Codigo del Trabajo de Chile y demas normativa laboral vigente.',
      },
    ],
  },
  {
    positionKey: 'marketing_growth',
    title: 'Contrato Tipo — Marketing & Growth Lead',
    type: 'indefinido',
    clauses: [
      {
        title: 'PRIMERO: Antecedentes del Empleador',
        content:
          'CONNIKU SpA, RUT 78.395.702-7, representada legalmente por don Cristian Andrés Gutiérrez Lazcano, en adelante "el Empleador", con domicilio en Antofagasta, II Región de Antofagasta, Chile.',
      },
      {
        title: 'SEGUNDO: Antecedentes del Trabajador',
        content:
          'Don/Dona [NOMBRE COMPLETO], RUT [RUT], de nacionalidad [NACIONALIDAD], estado civil [ESTADO CIVIL], domiciliado/a en [DIRECCION], en adelante "el Trabajador".',
      },
      {
        title: 'TERCERO: Naturaleza de los Servicios',
        content:
          'El Trabajador se desempenara como Marketing & Growth Lead, realizando las funciones descritas en la Job Description adjunta (Anexo 1), la cual forma parte integrante de este contrato.',
      },
      {
        title: 'CUARTO: Lugar de Prestacion de Servicios',
        content:
          'El Trabajador prestara sus servicios en modalidad remota/hibrida, pudiendo desempenar funciones desde su domicilio o desde las oficinas que la empresa designe en Santiago, Chile.',
      },
      {
        title: 'QUINTO: Jornada de Trabajo',
        content:
          'La jornada ordinaria sera de 45 horas semanales, distribuidas de lunes a viernes, de 09:00 a 18:00 horas, con 1 hora de colacion.',
      },
      {
        title: 'SEXTO: Remuneracion',
        content:
          'El Empleador pagara al Trabajador una remuneracion bruta mensual de $1.500.000 (un millon quinientos mil pesos), mas asignacion de colacion de $70.000 y movilizacion de $40.000, ambas no imponibles. El pago se realizara el ultimo dia habil de cada mes.',
      },
      {
        title: 'SEPTIMO: Duracion del Contrato',
        content:
          'El presente contrato tendra duracion indefinida, comenzando a regir desde el [FECHA INICIO].',
      },
      {
        title: 'OCTAVO: Presupuesto de Marketing',
        content:
          'El Trabajador gestionara el presupuesto de marketing asignado, debiendo reportar ROI y gastos mensualmente. Cualquier gasto que exceda el presupuesto requiere aprobacion previa del CEO.',
      },
      {
        title: 'NOVENO: Propiedad Intelectual',
        content:
          'Todo material creativo, campanas, copy, y assets creados para Conniku SpA son propiedad exclusiva de la empresa.',
      },
      {
        title: 'DECIMO: Confidencialidad y Terminacion Inmediata',
        content:
          'El Trabajador se obliga a mantener estricta y absoluta confidencialidad sobre toda informacion tecnica, comercial, financiera, estrategica, de propiedad intelectual y datos personales de usuarios a la que tenga acceso durante el ejercicio de sus funciones en Conniku SpA. Esta obligacion incluye, sin limitarse a: codigo fuente, algoritmos, bases de datos, planes de negocio, informacion financiera, datos de usuarios, estrategias de marketing, credenciales de acceso, y cualquier informacion que razonablemente pueda considerarse como confidencial o propietaria de la empresa. La violacion de esta clausula constituye CAUSAL DE TERMINACION INMEDIATA del contrato conforme al articulo 160 N°7 del Codigo del Trabajo (Incumplimiento Grave de las Obligaciones del Contrato), sin derecho a indemnizacion alguna. Adicionalmente, el Trabajador podra ser sujeto a acciones civiles por los danos y perjuicios causados. Esta clausula de confidencialidad subsiste por un periodo de 2 anos despues de terminada la relacion laboral.',
      },
      {
        title: 'UNDECIMO: Expectation Memo',
        content:
          'El Trabajador declara haber recibido y comprendido el Expectation Memo (Anexo 2), que detalla las expectativas para los primeros 90 dias y forma parte integrante de este contrato.',
      },
      {
        title: 'DUODECIMO: Disciplina Progresiva',
        content:
          'El Empleador aplicara un sistema de disciplina progresiva ante incumplimientos laborales, consistente en: (i) Amonestacion Verbal, (ii) Amonestacion Escrita 1, (iii) Amonestacion Escrita 2, y (iv) Terminacion del contrato. Cada etapa sera documentada en el Electronic Record Card (ERC) del Trabajador y firmada electronicamente. El Trabajador sera notificado formalmente en cada instancia y tendra derecho a presentar sus descargos dentro de 3 dias habiles.',
      },
      {
        title: 'DECIMOTERCERO: Evaluacion de Desempeno',
        content:
          'El Trabajador sera evaluado mediante Performance Reviews programadas (Mid-Contract y End-of-Contract), utilizando un sistema de 7 dimensiones calificadas de 1 a 5. Si el Trabajador obtiene un promedio inferior a 3.0 en dos evaluaciones consecutivas, la empresa se reserva el derecho de poner termino al contrato por necesidades de la empresa conforme al articulo 161 del Codigo del Trabajo, con las indemnizaciones legales correspondientes. El Trabajador recibira copia de cada evaluacion y podra firmar su recepcion a traves del sistema de Firma Electronica Simple (FES).',
      },
      {
        title: 'DECIMOCUARTO: Falta de Probidad',
        content:
          'Constituye causal de terminacion inmediata del contrato, conforme al articulo 160 N°1 del Codigo del Trabajo, toda falta de probidad del Trabajador en el desempeno de sus funciones. Se entiende por falta de probidad cualquier conducta deshonesta, fraudulenta o contraria a la buena fe, incluyendo pero no limitandose a: apropiacion indebida de recursos, falsificacion de documentos, declaraciones falsas, uso de informacion privilegiada para beneficio personal, y cualquier acto que atente contra la integridad y confianza depositada por el Empleador.',
      },
      {
        title: 'DECIMOQUINTO: Incumplimiento de Contrato',
        content:
          'Sin perjuicio de las causales de terminacion establecidas en el Codigo del Trabajo, el incumplimiento reiterado de las obligaciones contractuales, incluyendo las metas definidas en la Job Description y el Expectation Memo, podra dar lugar a la aplicacion del sistema de disciplina progresiva. En casos de incumplimiento grave, se aplicara el articulo 160 N°7 del Codigo del Trabajo.',
      },
      {
        title: 'DECIMOSEXTO: Legislacion Aplicable',
        content:
          'El presente contrato se rige por las disposiciones del Codigo del Trabajo de Chile y demas normativa laboral vigente.',
      },
    ],
  },
];

// ═════════════════════════════════════════════════════════════════
// HELPER: Match employee position to ERC data
// ═════════════════════════════════════════════════════════════════
const POSITION_MAP: Record<string, string> = {
  'CTO — Director de Tecnología': 'cto',
  'CTO — Director de Tecnologia': 'cto',
  CTO: 'cto',
  'Head of Operations': 'head_operations',
  'Jefa de Operaciones': 'head_operations',
  'Community Manager': 'community_manager',
  'Customer Support Lead': 'customer_support',
  'Lider de Soporte': 'customer_support',
  'Marketing & Growth Lead': 'marketing_growth',
  'Marketing Lead': 'marketing_growth',
};

export function getPositionKey(position: string): string | null {
  // Direct match
  if (POSITION_MAP[position]) return POSITION_MAP[position];
  // Fuzzy match
  const lower = position.toLowerCase();
  if (lower.includes('cto') || lower.includes('director de tecnolog')) return 'cto';
  if (lower.includes('operations') || lower.includes('operacion')) return 'head_operations';
  if (lower.includes('community') || lower.includes('comunidad')) return 'community_manager';
  if (lower.includes('support') || lower.includes('soporte')) return 'customer_support';
  if (lower.includes('marketing') || lower.includes('growth')) return 'marketing_growth';
  return null;
}

export function getJobDescription(position: string): ERCJobDescription | null {
  const key = getPositionKey(position);
  return key ? JOB_DESCRIPTIONS.find((jd) => jd.positionKey === key) || null : null;
}

export function getExpectationMemo(position: string): ERCExpectationMemo | null {
  const key = getPositionKey(position);
  return key ? EXPECTATION_MEMOS.find((em) => em.positionKey === key) || null : null;
}

export function getContractTemplate(position: string): ERCContractTemplate | null {
  const key = getPositionKey(position);
  return key ? CONTRACT_TEMPLATES.find((ct) => ct.positionKey === key) || null : null;
}

// All available positions for dropdown
export const CONNIKU_POSITIONS = [
  { value: 'CTO — Director de Tecnologia', label: 'CTO — Director de Tecnologia', key: 'cto' },
  { value: 'Head of Operations', label: 'Head of Operations', key: 'head_operations' },
  { value: 'Community Manager', label: 'Community Manager', key: 'community_manager' },
  { value: 'Customer Support Lead', label: 'Customer Support Lead', key: 'customer_support' },
  { value: 'Marketing & Growth Lead', label: 'Marketing & Growth Lead', key: 'marketing_growth' },
];

// ═════════════════════════════════════════════════════════════════
// PDF GENERATION — Open printable HTML in new window
// ═════════════════════════════════════════════════════════════════

const PDF_STYLES = `
  <style>
    @page { margin: 2cm; size: letter; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a1a; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 22px; text-align: center; margin-bottom: 4px; color: #1a1a1a; }
    h2 { font-size: 16px; color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 4px; margin-top: 24px; }
    h3 { font-size: 14px; color: #1e40af; margin-top: 18px; }
    .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 24px; }
    .logo-header { text-align: center; margin-bottom: 16px; }
    .logo-header img { height: 40px; }
    .section { margin-bottom: 16px; }
    .clause { margin-bottom: 14px; }
    .clause-title { font-weight: 700; color: #1e40af; margin-bottom: 4px; }
    .clause-content { text-align: justify; }
    ul { margin: 4px 0; padding-left: 20px; }
    li { margin-bottom: 3px; }
    .kpi-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    .kpi-table th, .kpi-table td { border: 1px solid #ddd; padding: 6px 10px; font-size: 11px; text-align: left; }
    .kpi-table th { background: #f0f4ff; font-weight: 700; color: #1e40af; }
    .signature-block { display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid; }
    .signature-line { width: 45%; text-align: center; }
    .signature-line hr { border: none; border-top: 1px solid #333; margin-bottom: 4px; }
    .signature-line p { font-size: 11px; color: #666; margin: 2px 0; }
    .meta-info { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; }
    .meta-info p { margin: 3px 0; font-size: 12px; }
    .meta-info strong { color: #1e40af; }
    .values-box { background: #f0f4ff; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 12px 0; }
    .timeline { border-left: 3px solid #2563eb; padding-left: 16px; margin: 8px 0; }
    .timeline h3 { position: relative; }
    .timeline h3::before { content: ''; position: absolute; left: -22px; top: 6px; width: 10px; height: 10px; background: #2563eb; border-radius: 50%; }
    .footer { text-align: center; font-size: 10px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 8px; }
    @media print { body { padding: 0; } .no-print { display: none; } }
    .print-btn { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; z-index: 100; }
    .print-btn:hover { background: #1d4ed8; }
  </style>
`;

const fmtCLP = (n: number) => '$' + Math.round(n).toLocaleString('es-CL');
const fmtDate = (d: string) =>
  d
    ? new Date(d + 'T12:00:00').toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '[FECHA]';

interface EmployeeData {
  firstName: string;
  lastName: string;
  rut: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  nationality: string;
  maritalStatus: string;
  position: string;
  department: string;
  hireDate: string;
  contractType: string;
  workSchedule: string;
  weeklyHours: number;
  grossSalary: number;
  colacion: number;
  movilizacion: number;
  bonoAsistencia?: number;
  bonoProduccion?: number;
  afp: string;
  healthSystem: string;
  isapreName?: string | null;
  isapreUf?: number | null;
  afcActive: boolean;
  bankName: string;
  bankAccountType: string;
  bankAccountNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  gender?: string;
  profession1?: string;
  profession2?: string;
  notes?: string;
}

function openPrintWindow(html: string) {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Permite ventanas emergentes para generar PDF');
    return;
  }
  win.document.write(html);
  win.document.close();
}

// ─── GENERATE FULL CONTRACT PDF ───
export function generateContractPDF(emp: EmployeeData, afpRate: number) {
  const jd = getJobDescription(emp.position);
  const totalImponible = emp.grossSalary;
  const gratificacion = Math.min(Math.round(totalImponible * 0.25), 176066); // tope legal 4.75 IMM
  const afpAmount = Math.round((totalImponible * afpRate) / 100);
  const healthAmount = Math.round(totalImponible * 0.07);
  const afcEmpAmount =
    emp.contractType === 'indefinido'
      ? Math.round(totalImponible * 0.006)
      : Math.round(totalImponible * 0.03);
  const afcErAmount =
    emp.contractType === 'indefinido'
      ? Math.round(totalImponible * 0.024)
      : Math.round(totalImponible * 0.02);
  const sisAmount = Math.round(totalImponible * 0.0141);
  const mutualAmount = Math.round(totalImponible * 0.0093);
  const contractTypeLabel =
    emp.contractType === 'indefinido'
      ? 'indefinida'
      : emp.contractType === 'plazo_fijo'
        ? 'plazo fijo'
        : emp.contractType === 'por_obra'
          ? 'por obra o faena'
          : 'segun acuerdo';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contrato - ${emp.firstName} ${emp.lastName}</title>${PDF_STYLES}</head><body>
    <button class="print-btn no-print" onclick="window.print()">Imprimir / Guardar PDF</button>

    <div class="logo-header">
      <h1>CONNIKU SpA</h1>
      <p class="subtitle">Contrato Individual de Trabajo</p>
    </div>

    <p style="text-align:center; font-size:11px; color:#666; margin-bottom:20px;">
      Conforme al Codigo del Trabajo de Chile — Articulos 7 al 12
    </p>

    <div class="clause">
      <div class="clause-title">PRIMERO: ANTECEDENTES DEL EMPLEADOR</div>
      <div class="clause-content">
        CONNIKU SpA, RUT 78.395.702-7, representada legalmente por don <strong>Cristian Andrés Gutiérrez Lazcano</strong>,
        en adelante "el Empleador", con domicilio en Antofagasta, II Región de Antofagasta, Chile.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">SEGUNDO: ANTECEDENTES DEL TRABAJADOR</div>
      <div class="clause-content">
        Don/Dona <strong>${emp.firstName} ${emp.lastName}</strong>, RUT <strong>${emp.rut}</strong>,
        de nacionalidad ${emp.nationality || '[NACIONALIDAD]'}, estado civil ${emp.maritalStatus || '[ESTADO CIVIL]'},
        nacido/a el ${fmtDate(emp.birthDate)}, domiciliado/a en ${emp.address || '[DIRECCION]'},
        telefono ${emp.phone || '[TELEFONO]'}, email ${emp.email || '[EMAIL]'},
        en adelante "el Trabajador".
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">TERCERO: NATURALEZA DE LOS SERVICIOS</div>
      <div class="clause-content">
        El Trabajador se desempenara en el cargo de <strong>${emp.position}</strong>, en el departamento de
        <strong>${emp.department}</strong>, realizando las funciones detalladas en la Job Description adjunta como
        Anexo 1, la cual forma parte integrante de este contrato. ${jd ? `El Trabajador reportara a ${jd.reportTo}.` : ''}
        <br><br>
        Sin perjuicio de lo anterior, el Trabajador podra desempenar otras funciones complementarias que le encomiende
        el Empleador, siempre que sean compatibles con su cargo y calificacion profesional.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CUARTO: LUGAR DE PRESTACION DE SERVICIOS</div>
      <div class="clause-content">
        El Trabajador prestara sus servicios en modalidad remota/hibrida, pudiendo desempenar funciones desde su
        domicilio particular o desde las dependencias que el Empleador designe en Santiago, Region Metropolitana.
        El Empleador podra modificar el lugar de trabajo dentro de la misma ciudad, conforme al articulo 12 del
        Codigo del Trabajo (ius variandi).
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">QUINTO: JORNADA DE TRABAJO</div>
      <div class="clause-content">
        La jornada ordinaria de trabajo sera de <strong>${emp.weeklyHours} horas semanales</strong>, distribuidas de
        ${emp.workSchedule || 'lunes a viernes'}, en horario de 09:00 a 18:00 horas, con una hora de colacion
        imputable a la jornada (articulo 22 del Codigo del Trabajo).
        <br><br>
        Las horas extraordinarias se regiran por los articulos 30 al 33 del Codigo del Trabajo. Se podran pactar
        horas extraordinarias hasta un maximo de 2 horas diarias, las que seran remuneradas con un recargo del 50%
        sobre el sueldo convenido.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">SEXTO: REMUNERACION</div>
      <div class="clause-content">
        El Empleador pagara al Trabajador las siguientes remuneraciones mensuales:
        <br><br>
        <table class="kpi-table">
          <tr><th>Concepto</th><th>Monto (CLP)</th><th>Imponible</th></tr>
          <tr><td>Sueldo Base Bruto</td><td><strong>${fmtCLP(emp.grossSalary)}</strong></td><td>Si</td></tr>
          <tr><td>Gratificacion Legal (Art. 50 CT)</td><td>${fmtCLP(gratificacion)}</td><td>Si</td></tr>
          <tr><td>Asignacion de Colacion</td><td>${fmtCLP(emp.colacion)}</td><td>No</td></tr>
          <tr><td>Asignacion de Movilizacion</td><td>${fmtCLP(emp.movilizacion)}</td><td>No</td></tr>
          ${(emp.bonoAsistencia || 0) > 0 ? `<tr><td>Bono de Asistencia</td><td>${fmtCLP(emp.bonoAsistencia!)}</td><td>Si</td></tr>` : ''}
          ${(emp.bonoProduccion || 0) > 0 ? `<tr><td>Bono de Produccion</td><td>${fmtCLP(emp.bonoProduccion!)}</td><td>Si</td></tr>` : ''}
          <tr style="background:#f0f4ff; font-weight:700">
            <td>Total Haberes</td>
            <td>${fmtCLP(emp.grossSalary + gratificacion + emp.colacion + emp.movilizacion + (emp.bonoAsistencia || 0) + (emp.bonoProduccion || 0))}</td>
            <td></td>
          </tr>
        </table>
        <br>
        El pago se realizara el <strong>ultimo dia habil de cada mes</strong>, mediante deposito en cuenta bancaria
        del Trabajador: <strong>${emp.bankName}</strong>, ${emp.bankAccountType}, N° ${emp.bankAccountNumber}.
        <br><br>
        El cierre del periodo de remuneraciones se realizara el dia <strong>22 de cada mes</strong>. Los dias 23 al
        ultimo dia del mes se arrastran al periodo siguiente.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">SEPTIMO: DESCUENTOS LEGALES Y PREVISION SOCIAL</div>
      <div class="clause-content">
        Se aplicaran los siguientes descuentos legales sobre la remuneracion imponible:
        <br><br>
        <table class="kpi-table">
          <tr><th>Concepto</th><th>Tasa / Monto</th><th>Estimacion Mensual</th></tr>
          <tr><td>AFP ${emp.afp.charAt(0).toUpperCase() + emp.afp.slice(1)}</td><td>${afpRate}%</td><td>${fmtCLP(afpAmount)}</td></tr>
          <tr><td>${emp.healthSystem === 'fonasa' ? 'Fonasa' : `Isapre ${emp.isapreName || ''}`}</td><td>${emp.healthSystem === 'fonasa' ? '7%' : (emp.isapreUf || 0) + ' UF'}</td><td>${fmtCLP(healthAmount)}</td></tr>
          <tr><td>AFC — Seguro de Cesantia (Trabajador)</td><td>${emp.contractType === 'indefinido' ? '0,6%' : '3%'}</td><td>${fmtCLP(afcEmpAmount)}</td></tr>
          <tr><td>Impuesto Unico 2da Categoria</td><td>Segun tabla SII</td><td>Segun tramo</td></tr>
        </table>
        <br>
        <strong>Cotizaciones a cargo del Empleador:</strong>
        <table class="kpi-table">
          <tr><th>Concepto</th><th>Tasa</th><th>Estimacion Mensual</th></tr>
          <tr><td>AFC — Seguro de Cesantia (Empleador)</td><td>${emp.contractType === 'indefinido' ? '2,4%' : '2%'}</td><td>${fmtCLP(afcErAmount)}</td></tr>
          <tr><td>SIS — Seguro Invalidez y Sobrevivencia</td><td>1,41%</td><td>${fmtCLP(sisAmount)}</td></tr>
          <tr><td>Mutual de Seguridad</td><td>0,93%</td><td>${fmtCLP(mutualAmount)}</td></tr>
        </table>
        <br>
        ${emp.afcActive ? 'El Trabajador se encuentra afiliado al Seguro de Cesantia (AFC Chile) conforme a la Ley 19.728.' : 'El Trabajador NO se encuentra afiliado al AFC por las razones legales correspondientes.'}
        <br><br>
        Las declaraciones y pagos de cotizaciones previsionales se realizaran a traves de <strong>Previred</strong>
        antes del dia 13 de cada mes, conforme a la legislacion vigente.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">OCTAVO: DURACION DEL CONTRATO</div>
      <div class="clause-content">
        El presente contrato tendra duracion <strong>${contractTypeLabel}</strong>, comenzando a regir desde el
        <strong>${fmtDate(emp.hireDate)}</strong>.
        ${emp.contractType === 'plazo_fijo' ? '<br><br>Conforme al articulo 159 N°4 del Codigo del Trabajo, al termino del plazo se evaluara la renovacion o transformacion a contrato indefinido.' : ''}
        ${emp.contractType === 'indefinido' ? '<br><br>Cualquiera de las partes podra poner termino al contrato conforme a las causales establecidas en los articulos 159, 160 y 161 del Codigo del Trabajo.' : ''}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">NOVENO: FERIADO ANUAL</div>
      <div class="clause-content">
        El Trabajador tendra derecho a un feriado anual de <strong>15 dias habiles</strong> con remuneracion integra,
        conforme al articulo 67 del Codigo del Trabajo. El feriado se concedera preferentemente en primavera o verano,
        debiendo solicitarse con al menos 30 dias de anticipacion.
        <br><br>
        El feriado podra acumularse hasta por dos periodos consecutivos, conforme a la ley.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">DECIMO: ANTICIPO QUINCENAL</div>
      <div class="clause-content">
        El Trabajador podra solicitar un anticipo quincenal a partir del segundo mes de trabajo,
        por un monto maximo equivalente al <strong>40% del sueldo base</strong> al cierre del dia 22.
        Este anticipo es voluntario y debe ser solicitado expresamente por el Trabajador.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">UNDECIMO: CONFIDENCIALIDAD Y TERMINACION INMEDIATA</div>
      <div class="clause-content">
        El Trabajador se obliga a mantener estricta y absoluta confidencialidad sobre toda informacion tecnica,
        comercial, financiera, estrategica, de propiedad intelectual y datos personales de usuarios a la que tenga
        acceso durante el ejercicio de sus funciones en Conniku SpA. Esta obligacion incluye, sin limitarse a:
        codigo fuente, algoritmos, bases de datos, planes de negocio, informacion financiera, datos de usuarios,
        estrategias de marketing, credenciales de acceso, y cualquier informacion que razonablemente pueda
        considerarse como confidencial o propietaria de la empresa.
        <br><br>
        La violacion de esta clausula constituye <strong>CAUSAL DE TERMINACION INMEDIATA</strong> del contrato
        conforme al articulo 160 N°7 del Codigo del Trabajo (Incumplimiento Grave de las Obligaciones del Contrato),
        sin derecho a indemnizacion alguna. Adicionalmente, el Trabajador podra ser sujeto a acciones civiles por
        los danos y perjuicios causados.
        <br><br>
        Esta clausula de confidencialidad subsiste por un periodo de <strong>2 anos</strong> despues de terminada
        la relacion laboral.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">DUODECIMO: PROPIEDAD INTELECTUAL</div>
      <div class="clause-content">
        Todo codigo, diseno, contenido, algoritmo, metodologia, material creativo y en general toda propiedad
        intelectual creada por el Trabajador en el ejercicio de sus funciones o utilizando recursos de la empresa,
        sera propiedad exclusiva de <strong>Conniku SpA</strong>, conforme a la Ley 17.336 de Propiedad Intelectual.
        <br><br>
        El Trabajador cede expresamente todos los derechos patrimoniales sobre las obras creadas en el contexto laboral.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">DECIMOTERCERO: PROTECCION DE DATOS PERSONALES</div>
      <div class="clause-content">
        El Trabajador se compromete a tratar los datos personales de usuarios, estudiantes y otros trabajadores
        conforme a la <strong>Ley 19.628 sobre Proteccion de la Vida Privada</strong> y las politicas internas
        de Conniku SpA. El uso de datos sera exclusivamente para los fines laborales autorizados.
        <br><br>
        Cualquier infraccion a esta clausula constituira incumplimiento grave de las obligaciones del contrato.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">DECIMOCUARTO: DISCIPLINA PROGRESIVA</div>
      <div class="clause-content">
        El Empleador aplicara un sistema de disciplina progresiva ante incumplimientos laborales, consistente en:
        (i) Amonestacion Verbal, (ii) Amonestacion Escrita 1, (iii) Amonestacion Escrita 2, y (iv) Terminacion
        del contrato. Cada etapa sera documentada en el Electronic Record Card (ERC) del Trabajador y firmada
        electronicamente. El Trabajador sera notificado formalmente en cada instancia y tendra derecho a presentar
        sus descargos dentro de 3 dias habiles.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">DECIMOQUINTO: EVALUACION DE DESEMPENO</div>
      <div class="clause-content">
        El Trabajador sera evaluado mediante Performance Reviews programadas (Mid-Contract y End-of-Contract),
        utilizando un sistema de 7 dimensiones calificadas de 1 a 5. Si el Trabajador obtiene un promedio inferior
        a 3.0 en dos evaluaciones consecutivas, la empresa se reserva el derecho de poner termino al contrato por
        necesidades de la empresa conforme al articulo 161 del Codigo del Trabajo, con las indemnizaciones legales
        correspondientes. El Trabajador recibira copia de cada evaluacion y podra firmar su recepcion a traves del
        sistema de Firma Electronica Simple (FES).
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">DECIMOSEXTO: FALTA DE PROBIDAD</div>
      <div class="clause-content">
        Constituye causal de terminacion inmediata del contrato, conforme al articulo 160 N°1 del Codigo del Trabajo,
        toda falta de probidad del Trabajador en el desempeno de sus funciones. Se entiende por falta de probidad
        cualquier conducta deshonesta, fraudulenta o contraria a la buena fe, incluyendo pero no limitandose a:
        apropiacion indebida de recursos, falsificacion de documentos, declaraciones falsas, uso de informacion
        privilegiada para beneficio personal, y cualquier acto que atente contra la integridad y confianza depositada
        por el Empleador.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">DECIMOSEPTIMO: INCUMPLIMIENTO DE CONTRATO</div>
      <div class="clause-content">
        Sin perjuicio de las causales de terminacion establecidas en el Codigo del Trabajo, el incumplimiento
        reiterado de las obligaciones contractuales, incluyendo las metas definidas en la Job Description y el
        Expectation Memo, podra dar lugar a la aplicacion del sistema de disciplina progresiva. En casos de
        incumplimiento grave, se aplicara el articulo 160 N°7 del Codigo del Trabajo.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">DECIMOCTAVO: REGLAMENTO INTERNO</div>
      <div class="clause-content">
        El Trabajador declara haber recibido copia del Reglamento Interno de Orden, Higiene y Seguridad de Conniku SpA,
        comprometiendose a cumplir sus disposiciones. Asimismo, declara haber recibido la Obligacion de Informar (ODI)
        sobre los riesgos laborales asociados a su cargo.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">DECIMONOVENO: CONTACTO DE EMERGENCIA</div>
      <div class="clause-content">
        El Trabajador designa como contacto de emergencia a: <strong>${emp.emergencyContactName || '[NOMBRE]'}</strong>,
        telefono <strong>${emp.emergencyContactPhone || '[TELEFONO]'}</strong>.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">VIGESIMO: DOCUMENTOS ANEXOS</div>
      <div class="clause-content">
        Forman parte integrante del presente contrato los siguientes documentos, los cuales el Trabajador declara
        haber recibido y comprendido:
        <ul>
          <li><strong>Anexo 1:</strong> Job Description — Descripcion del Cargo (${emp.position})</li>
          <li><strong>Anexo 2:</strong> Expectation Memo — Metas y Expectativas 30/60/90 dias</li>
          <li><strong>Anexo 3:</strong> Reglamento Interno de Orden, Higiene y Seguridad</li>
          <li><strong>Anexo 4:</strong> Obligacion de Informar (ODI)</li>
          <li><strong>Anexo 5:</strong> Politica de Privacidad y Confidencialidad</li>
        </ul>
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">VIGESIMO PRIMERO: LEGISLACION APLICABLE</div>
      <div class="clause-content">
        El presente contrato se rige por las disposiciones del <strong>Codigo del Trabajo de Chile</strong> y
        demas normativa laboral vigente. Para todos los efectos legales, las partes fijan domicilio en la
        ciudad de Santiago, Region Metropolitana.
        <br><br>
        El presente contrato se firma en dos ejemplares, quedando uno en poder de cada parte.
      </div>
    </div>

    <div class="signature-block">
      <div class="signature-line">
        <br><br><br><br>
        <hr />
        <p><strong>${emp.firstName} ${emp.lastName}</strong></p>
        <p>RUT: ${emp.rut}</p>
        <p>El Trabajador</p>
      </div>
      <div class="signature-line">
        <br><br><br><br>
        <hr />
        <p><strong>Cristian Andrés Gutiérrez Lazcano</strong></p>
        <p>RUT: 14.112.896-5</p>
        <p>Conniku SpA — El Empleador</p>
      </div>
    </div>

    <p style="text-align:center; margin-top:30px; font-size:11px; color:#666;">
      Santiago, ${fmtDate(emp.hireDate)}
    </p>

    <div class="footer">
      Conniku SpA — conniku.com — Contrato generado el ${new Date().toLocaleDateString('es-CL')}
    </div>
  </body></html>`;

  openPrintWindow(html);
}

// ─── GENERATE JOB DESCRIPTION PDF ───
export function generateJobDescriptionPDF(emp: EmployeeData) {
  const jd = getJobDescription(emp.position);
  if (!jd) {
    alert('No hay Job Description para este cargo');
    return;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Job Description - ${jd.title}</title>${PDF_STYLES}</head><body>
    <button class="print-btn no-print" onclick="window.print()">Imprimir / Guardar PDF</button>

    <div class="logo-header">
      <h1>CONNIKU SpA</h1>
      <p class="subtitle">Job Description — Descripcion del Cargo</p>
    </div>

    <div class="meta-info">
      <p><strong>Cargo:</strong> ${jd.title}</p>
      <p><strong>Departamento:</strong> ${jd.department}</p>
      <p><strong>Email Corporativo:</strong> ${jd.email}</p>
      <p><strong>Reporta a:</strong> ${jd.reportTo}</p>
      <p><strong>Trabajador:</strong> ${emp.firstName} ${emp.lastName} (RUT: ${emp.rut})</p>
      <p><strong>Fecha de Ingreso:</strong> ${fmtDate(emp.hireDate)}</p>
    </div>

    <h2>Mision del Cargo</h2>
    <p style="font-style:italic; font-size:13px; padding:8px 16px; background:#f8fafc; border-radius:8px;">${jd.mision}</p>

    <h2>Expectativas (Lo que se espera de ti)</h2>
    <ul>${jd.expectations.map((e) => `<li>${e}</li>`).join('')}</ul>

    <h2>Responsabilidades</h2>
    <ul>${jd.responsibilities.map((r) => `<li>${r}</li>`).join('')}</ul>

    <h2>Compromisos de Conniku (Lo que te ofrecemos)</h2>
    <ul>${jd.commitments.map((c) => `<li>${c}</li>`).join('')}</ul>

    <h2>Requisitos del Cargo</h2>
    <ul>${jd.requirements.map((r) => `<li>${r}</li>`).join('')}</ul>

    <h2>Deseables</h2>
    <ul>${jd.desirable.map((d) => `<li>${d}</li>`).join('')}</ul>

    <h2>KPIs — Indicadores de Desempeno</h2>
    <table class="kpi-table">
      <tr><th>Metrica</th><th>Meta</th></tr>
      ${jd.kpis.map((k) => `<tr><td>${k.metric}</td><td>${k.target}</td></tr>`).join('')}
    </table>

    <h2>Herramientas de Trabajo</h2>
    <p>${jd.tools.join(' • ')}</p>

    <h2>Jornada</h2>
    <p>${jd.schedule}</p>

    <h2>Compensacion</h2>
    <p><strong>Sueldo Base:</strong> ${jd.compensation.base}</p>
    <p><strong>Beneficios:</strong></p>
    <ul>${jd.compensation.benefits.map((b) => `<li>${b}</li>`).join('')}</ul>

    <div class="values-box">
      <h3 style="margin-top:0; color:#2563eb;">Valores Conniku</h3>
      <ul>${CONNIKU_VALUES.map((v) => `<li>${v}</li>`).join('')}</ul>
    </div>

    <div class="signature-block">
      <div class="signature-line">
        <br><br><br>
        <hr />
        <p><strong>${emp.firstName} ${emp.lastName}</strong></p>
        <p>Trabajador — Recibido y Comprendido</p>
      </div>
      <div class="signature-line">
        <br><br><br>
        <hr />
        <p><strong>Cristian Andrés Gutiérrez Lazcano</strong></p>
        <p>CEO — Conniku SpA</p>
      </div>
    </div>

    <div class="footer">
      Conniku SpA — conniku.com — Anexo 1 del Contrato de Trabajo — ${new Date().toLocaleDateString('es-CL')}
    </div>
  </body></html>`;

  openPrintWindow(html);
}

// ─── GENERATE EXPECTATION MEMO PDF ───
export function generateExpectationMemoPDF(emp: EmployeeData) {
  const memo = getExpectationMemo(emp.position);
  if (!memo) {
    alert('No hay Expectation Memo para este cargo');
    return;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Expectation Memo - ${memo.title}</title>${PDF_STYLES}</head><body>
    <button class="print-btn no-print" onclick="window.print()">Imprimir / Guardar PDF</button>

    <div class="logo-header">
      <h1>CONNIKU SpA</h1>
      <p class="subtitle">${memo.title}</p>
    </div>

    <div class="meta-info">
      <p><strong>Trabajador:</strong> ${emp.firstName} ${emp.lastName}</p>
      <p><strong>RUT:</strong> ${emp.rut}</p>
      <p><strong>Cargo:</strong> ${emp.position}</p>
      <p><strong>Fecha de Ingreso:</strong> ${fmtDate(emp.hireDate)}</p>
    </div>

    <p style="font-style:italic; padding:8px 16px; background:#f8fafc; border-radius:8px; font-size:12px;">
      ${memo.intro}
    </p>

    <div class="timeline">
      <h3>${memo.day30.title}</h3>
      <ul>${memo.day30.items.map((i) => `<li>${i}</li>`).join('')}</ul>

      <h3>${memo.day60.title}</h3>
      <ul>${memo.day60.items.map((i) => `<li>${i}</li>`).join('')}</ul>

      <h3>${memo.day90.title}</h3>
      <ul>${memo.day90.items.map((i) => `<li>${i}</li>`).join('')}</ul>
    </div>

    <h2>Expectativas Permanentes</h2>
    <ul>${memo.ongoing.map((o) => `<li>${o}</li>`).join('')}</ul>

    <h2>Criterios de Evaluacion</h2>
    <ul>${memo.evaluationCriteria.map((c) => `<li>${c}</li>`).join('')}</ul>

    <div class="values-box">
      <h3 style="margin-top:0; color:#2563eb;">Valores Conniku que Debes Vivir</h3>
      <ul>${memo.values.map((v) => `<li>${v}</li>`).join('')}</ul>
    </div>

    <div class="signature-block">
      <div class="signature-line">
        <br><br><br>
        <hr />
        <p><strong>${emp.firstName} ${emp.lastName}</strong></p>
        <p>Trabajador — He leido y comprendo las expectativas</p>
      </div>
      <div class="signature-line">
        <br><br><br>
        <hr />
        <p><strong>Cristian Andrés Gutiérrez Lazcano</strong></p>
        <p>CEO — Conniku SpA</p>
      </div>
    </div>

    <p style="text-align:center; margin-top:16px; font-size:11px; color:#666;">
      Fecha: ${fmtDate(emp.hireDate)}
    </p>

    <div class="footer">
      Conniku SpA — conniku.com — Anexo 2 del Contrato de Trabajo — ${new Date().toLocaleDateString('es-CL')}
    </div>
  </body></html>`;

  openPrintWindow(html);
}
