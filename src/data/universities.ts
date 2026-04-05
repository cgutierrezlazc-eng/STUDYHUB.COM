// =============================================================================
// CONNIKU - University Database
// Comprehensive list of universities and higher education institutions
// =============================================================================

export interface University {
  id: string;
  name: string;
  shortName: string;
  country: string;
  type: 'universidad' | 'instituto' | 'cft' | 'university' | 'college' | 'institute';
  website: string;
  newsUrl?: string;
  rssUrl?: string;
  logoUrl?: string;
}

// =============================================================================
// CHILE (CL) - Instituciones de Educacion Superior
// =============================================================================

// -----------------------------------------------------------------------------
// Universidades del CRUCH (Consejo de Rectores de las Universidades Chilenas)
// -----------------------------------------------------------------------------

const CL_CRUCH: University[] = [
  {
    id: 'cl-uch',
    name: 'Universidad de Chile',
    shortName: 'UCH',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uchile.cl',
    newsUrl: 'https://www.uchile.cl/noticias',
    logoUrl: 'https://www.uchile.cl/dam/jcr:0e0cab08-87d4-434f-9ab2-e42f36f3e7c3/escudo-uchile.png',
  },
  {
    id: 'cl-puc',
    name: 'Pontificia Universidad Catolica de Chile',
    shortName: 'PUC',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uc.cl',
    newsUrl: 'https://www.uc.cl/noticias',
    logoUrl: 'https://www.uc.cl/site/assets/files/1018/logo_uc.png',
  },
  {
    id: 'cl-udec',
    name: 'Universidad de Concepcion',
    shortName: 'UdeC',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.udec.cl',
    newsUrl: 'https://noticias.udec.cl',
  },
  {
    id: 'cl-usach',
    name: 'Universidad de Santiago de Chile',
    shortName: 'USACH',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.usach.cl',
    newsUrl: 'https://www.usach.cl/news',
  },
  {
    id: 'cl-pucv',
    name: 'Pontificia Universidad Catolica de Valparaiso',
    shortName: 'PUCV',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.pucv.cl',
    newsUrl: 'https://www.pucv.cl/pucv/noticias',
  },
  {
    id: 'cl-utfsm',
    name: 'Universidad Tecnica Federico Santa Maria',
    shortName: 'UTFSM',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.usm.cl',
    newsUrl: 'https://www.usm.cl/noticias',
  },
  {
    id: 'cl-uach',
    name: 'Universidad Austral de Chile',
    shortName: 'UACh',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uach.cl',
    newsUrl: 'https://noticias.uach.cl',
  },
  {
    id: 'cl-ucn',
    name: 'Universidad Catolica del Norte',
    shortName: 'UCN',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.ucn.cl',
    newsUrl: 'https://www.noticias.ucn.cl',
  },
  {
    id: 'cl-uv',
    name: 'Universidad de Valparaiso',
    shortName: 'UV',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uv.cl',
    newsUrl: 'https://www.uv.cl/pdn/',
  },
  {
    id: 'cl-uantof',
    name: 'Universidad de Antofagasta',
    shortName: 'UA',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uantof.cl',
    newsUrl: 'https://www.uantof.cl/noticias',
  },
  {
    id: 'cl-uls',
    name: 'Universidad de La Serena',
    shortName: 'ULS',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.userena.cl',
    newsUrl: 'https://www.userena.cl/noticias',
  },
  {
    id: 'cl-ubb',
    name: 'Universidad del Bio-Bio',
    shortName: 'UBB',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.ubiobio.cl',
    newsUrl: 'https://noticias.ubiobio.cl',
  },
  {
    id: 'cl-ufro',
    name: 'Universidad de La Frontera',
    shortName: 'UFRO',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.ufro.cl',
    newsUrl: 'https://www.ufro.cl/index.php/noticias',
  },
  {
    id: 'cl-ulagos',
    name: 'Universidad de Los Lagos',
    shortName: 'ULagos',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.ulagos.cl',
    newsUrl: 'https://www.ulagos.cl/noticias',
  },
  {
    id: 'cl-umag',
    name: 'Universidad de Magallanes',
    shortName: 'UMAG',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.umag.cl',
    newsUrl: 'https://www.umag.cl/vcm/',
  },
  {
    id: 'cl-utalca',
    name: 'Universidad de Talca',
    shortName: 'UTalca',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.utalca.cl',
    newsUrl: 'https://www.utalca.cl/noticias',
  },
  {
    id: 'cl-uda',
    name: 'Universidad de Atacama',
    shortName: 'UDA',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uda.cl',
    newsUrl: 'https://www.uda.cl/index.php/noticias',
  },
  {
    id: 'cl-uta',
    name: 'Universidad de Tarapaca',
    shortName: 'UTA',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uta.cl',
    newsUrl: 'https://www.uta.cl/web/noticias',
  },
  {
    id: 'cl-unap',
    name: 'Universidad Arturo Prat',
    shortName: 'UNAP',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.unap.cl',
    newsUrl: 'https://www.unap.cl/prontus_unap/site/edic/base/port/noticias.html',
  },
  {
    id: 'cl-upla',
    name: 'Universidad de Playa Ancha',
    shortName: 'UPLA',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.upla.cl',
    newsUrl: 'https://www.upla.cl/noticias',
  },
  {
    id: 'cl-umce',
    name: 'Universidad Metropolitana de Ciencias de la Educacion',
    shortName: 'UMCE',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.umce.cl',
    newsUrl: 'https://www.umce.cl/index.php/noticias',
  },
  {
    id: 'cl-utem',
    name: 'Universidad Tecnologica Metropolitana',
    shortName: 'UTEM',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.utem.cl',
    newsUrl: 'https://www.utem.cl/noticias',
  },
  {
    id: 'cl-ucm',
    name: 'Universidad Catolica del Maule',
    shortName: 'UCM',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.ucm.cl',
    newsUrl: 'https://www.ucm.cl/noticias',
  },
  {
    id: 'cl-ucsc',
    name: 'Universidad Catolica de la Santisima Concepcion',
    shortName: 'UCSC',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.ucsc.cl',
    newsUrl: 'https://www.ucsc.cl/noticias',
  },
  {
    id: 'cl-uct',
    name: 'Universidad Catolica de Temuco',
    shortName: 'UCT',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uct.cl',
    newsUrl: 'https://www.uct.cl/noticias',
  },
  {
    id: 'cl-uoh',
    name: "Universidad de O'Higgins",
    shortName: 'UOH',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uoh.cl',
    newsUrl: 'https://www.uoh.cl/noticias/',
  },
  {
    id: 'cl-uaysen',
    name: 'Universidad de Aysen',
    shortName: 'UAysen',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uaysen.cl',
    newsUrl: 'https://www.uaysen.cl/noticias',
  },
];

// -----------------------------------------------------------------------------
// Universidades Privadas - Chile
// -----------------------------------------------------------------------------

const CL_PRIVADAS: University[] = [
  {
    id: 'cl-uss',
    name: 'Universidad San Sebastian',
    shortName: 'USS',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uss.cl',
    newsUrl: 'https://www.uss.cl/noticias',
  },
  {
    id: 'cl-udd',
    name: 'Universidad del Desarrollo',
    shortName: 'UDD',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.udd.cl',
    newsUrl: 'https://www.udd.cl/noticias',
  },
  {
    id: 'cl-udp',
    name: 'Universidad Diego Portales',
    shortName: 'UDP',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.udp.cl',
    newsUrl: 'https://www.udp.cl/noticias',
  },
  {
    id: 'cl-uai',
    name: 'Universidad Adolfo Ibanez',
    shortName: 'UAI',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uai.cl',
    newsUrl: 'https://noticias.uai.cl',
  },
  {
    id: 'cl-unab',
    name: 'Universidad Andres Bello',
    shortName: 'UNAB',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.unab.cl',
    newsUrl: 'https://noticias.unab.cl',
  },
  {
    id: 'cl-umayor',
    name: 'Universidad Mayor',
    shortName: 'UMayor',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.umayor.cl',
    newsUrl: 'https://www.umayor.cl/um/noticias',
  },
  {
    id: 'cl-uandes',
    name: 'Universidad de los Andes',
    shortName: 'UAndes',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uandes.cl',
    newsUrl: 'https://www.uandes.cl/noticias',
  },
  {
    id: 'cl-uft',
    name: 'Universidad Finis Terrae',
    shortName: 'UFT',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uft.cl',
    newsUrl: 'https://www.uft.cl/noticias',
  },
  {
    id: 'cl-uah',
    name: 'Universidad Alberto Hurtado',
    shortName: 'UAH',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uahurtado.cl',
    newsUrl: 'https://www.uahurtado.cl/noticias',
  },
  {
    id: 'cl-ucen',
    name: 'Universidad Central de Chile',
    shortName: 'UCEN',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.ucentral.cl',
    newsUrl: 'https://www.ucentral.cl/noticias',
  },
  {
    id: 'cl-uautonoma',
    name: 'Universidad Autonoma de Chile',
    shortName: 'UA',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uautonoma.cl',
    newsUrl: 'https://www.uautonoma.cl/noticias',
  },
  {
    id: 'cl-ust',
    name: 'Universidad Santo Tomas',
    shortName: 'UST',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.ust.cl',
    newsUrl: 'https://www.ust.cl/noticias',
  },
  {
    id: 'cl-upv',
    name: 'Universidad Pedro de Valdivia',
    shortName: 'UPV',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.upv.cl',
  },
  {
    id: 'cl-ubo',
    name: "Universidad Bernardo O'Higgins",
    shortName: 'UBO',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.ubo.cl',
    newsUrl: 'https://www.ubo.cl/noticias',
  },
  {
    id: 'cl-usek',
    name: 'Universidad SEK',
    shortName: 'USEK',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.usek.cl',
  },
  {
    id: 'cl-ugm',
    name: 'Universidad Gabriela Mistral',
    shortName: 'UGM',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.ugm.cl',
  },
  {
    id: 'cl-udla',
    name: 'Universidad de las Americas',
    shortName: 'UDLA',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.udla.cl',
    newsUrl: 'https://www.udla.cl/noticias',
  },
  {
    id: 'cl-ulare',
    name: 'Universidad La Republica',
    shortName: 'ULARE',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.ulare.cl',
  },
  {
    id: 'cl-udalba',
    name: 'Universidad del Alba',
    shortName: 'UDALBA',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.udelalba.cl',
  },
  {
    id: 'cl-ucinf',
    name: 'Universidad UCINF',
    shortName: 'UCINF',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.ucinf.cl',
  },
  {
    id: 'cl-uvm',
    name: 'Universidad de Vina del Mar',
    shortName: 'UVM',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uvm.cl',
    newsUrl: 'https://www.uvm.cl/noticias',
  },
  {
    id: 'cl-ub',
    name: 'Universidad Bolivariana',
    shortName: 'UB',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.ubolivariana.cl',
  },
  {
    id: 'cl-uac',
    name: 'Universidad de Aconcagua',
    shortName: 'UAC',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uaconcagua.cl',
  },
  {
    id: 'cl-uniacc',
    name: 'Universidad UNIACC',
    shortName: 'UNIACC',
    country: 'CL',
    type: 'universidad',
    website: 'https://www.uniacc.cl',
    newsUrl: 'https://www.uniacc.cl/noticias',
  },
];

// -----------------------------------------------------------------------------
// Institutos Profesionales (IP) - Chile
// -----------------------------------------------------------------------------

const CL_IP: University[] = [
  {
    id: 'cl-ip-inacap',
    name: 'INACAP Instituto Profesional',
    shortName: 'INACAP',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.inacap.cl',
    newsUrl: 'https://www.inacap.cl/tportalvp/inacap/noticias',
  },
  {
    id: 'cl-ip-duocuc',
    name: 'DUOC UC',
    shortName: 'DUOC UC',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.duoc.cl',
    newsUrl: 'https://www.duoc.cl/noticias',
  },
  {
    id: 'cl-ip-santotomas',
    name: 'Instituto Profesional Santo Tomas',
    shortName: 'IP Santo Tomas',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.ipsantotomas.cl',
  },
  {
    id: 'cl-ip-aiep',
    name: 'AIEP Instituto Profesional',
    shortName: 'AIEP',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.aiep.cl',
    newsUrl: 'https://www.aiep.cl/noticias',
  },
  {
    id: 'cl-ip-ipg',
    name: 'Instituto Profesional de Chile',
    shortName: 'IPG',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.ipchile.cl',
  },
  {
    id: 'cl-ip-laaraucana',
    name: 'Instituto Profesional La Araucana',
    shortName: 'IP La Araucana',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.iplaaraucana.cl',
  },
  {
    id: 'cl-ip-virginiogomez',
    name: 'Instituto Profesional Virginio Gomez',
    shortName: 'IP Virginio Gomez',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.virginiogomez.cl',
  },
  {
    id: 'cl-ip-losleones',
    name: 'Instituto Profesional Los Leones',
    shortName: 'IP Los Leones',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.iplosleones.cl',
  },
  {
    id: 'cl-ip-ciisa',
    name: 'Instituto Profesional CIISA',
    shortName: 'IP CIISA',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.ciisa.cl',
  },
  {
    id: 'cl-ip-providencia',
    name: 'Instituto Profesional Providencia',
    shortName: 'IP Providencia',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.ipp.cl',
  },
  {
    id: 'cl-ip-eatri',
    name: 'Instituto Profesional EATRI',
    shortName: 'IP EATRI',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.eatri.cl',
  },
  {
    id: 'cl-ip-escuelamoderna',
    name: 'Instituto Profesional Escuela Moderna de Musica',
    shortName: 'Escuela Moderna',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.emoderna.cl',
  },
  {
    id: 'cl-ip-ipchile',
    name: 'Instituto Profesional de Chile IPCHILE',
    shortName: 'IPCHILE',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.ipchile.cl',
  },
  {
    id: 'cl-ip-arcos',
    name: 'Instituto Profesional de Arte y Comunicacion ARCOS',
    shortName: 'IP ARCOS',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.arcos.cl',
  },
  {
    id: 'cl-ip-esucomex',
    name: 'Instituto Profesional ESUCOMEX',
    shortName: 'IP ESUCOMEX',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.esucomex.cl',
  },
  {
    id: 'cl-ip-loslagos',
    name: 'Instituto Profesional Los Lagos',
    shortName: 'IP Los Lagos',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.iploslagos.cl',
  },
  {
    id: 'cl-ip-vallecentral',
    name: 'Instituto Profesional Valle Central',
    shortName: 'IP Valle Central',
    country: 'CL',
    type: 'instituto',
    website: 'https://www.ipvc.cl',
  },
];

// -----------------------------------------------------------------------------
// Centros de Formacion Tecnica (CFT) - Chile
// -----------------------------------------------------------------------------

const CL_CFT: University[] = [
  {
    id: 'cl-cft-inacap',
    name: 'CFT INACAP',
    shortName: 'CFT INACAP',
    country: 'CL',
    type: 'cft',
    website: 'https://www.inacap.cl',
  },
  {
    id: 'cl-cft-santotomas',
    name: 'CFT Santo Tomas',
    shortName: 'CFT Santo Tomas',
    country: 'CL',
    type: 'cft',
    website: 'https://www.cftsantotomas.cl',
  },
  {
    id: 'cl-cft-cenco',
    name: 'CFT CENCO',
    shortName: 'CFT CENCO',
    country: 'CL',
    type: 'cft',
    website: 'https://www.cenco.cl',
  },
  {
    id: 'cl-cft-estatal',
    name: 'CFT Estatal',
    shortName: 'CFT Estatal',
    country: 'CL',
    type: 'cft',
    website: 'https://www.cftestatal.cl',
  },
  {
    id: 'cl-cft-iprosec',
    name: 'CFT IPROSEC',
    shortName: 'CFT IPROSEC',
    country: 'CL',
    type: 'cft',
    website: 'https://www.iprosec.cl',
  },
  {
    id: 'cl-cft-lotaarauco',
    name: 'CFT Lota-Arauco',
    shortName: 'CFT Lota-Arauco',
    country: 'CL',
    type: 'cft',
    website: 'https://www.cftlotaarauco.cl',
  },
  {
    id: 'cl-cft-manpower',
    name: 'CFT Manpower',
    shortName: 'CFT Manpower',
    country: 'CL',
    type: 'cft',
    website: 'https://www.cftmanpower.cl',
  },
  {
    id: 'cl-cft-sanagustin',
    name: 'CFT San Agustin',
    shortName: 'CFT San Agustin',
    country: 'CL',
    type: 'cft',
    website: 'https://www.cftsanagustin.cl',
  },
  {
    id: 'cl-cft-teodorowickel',
    name: 'CFT Teodoro Wickel',
    shortName: 'CFT Teodoro Wickel',
    country: 'CL',
    type: 'cft',
    website: 'https://www.cftteodorowickel.cl',
  },
];

// =============================================================================
// MEXICO (MX)
// =============================================================================

const MX_UNIVERSITIES: University[] = [
  { id: 'mx-unam', name: 'Universidad Nacional Autonoma de Mexico', shortName: 'UNAM', country: 'MX', type: 'universidad', website: 'https://www.unam.mx', newsUrl: 'https://www.unam.mx/noticias' },
  { id: 'mx-itesm', name: 'Tecnologico de Monterrey', shortName: 'ITESM', country: 'MX', type: 'universidad', website: 'https://www.tec.mx', newsUrl: 'https://conecta.tec.mx' },
  { id: 'mx-ipn', name: 'Instituto Politecnico Nacional', shortName: 'IPN', country: 'MX', type: 'universidad', website: 'https://www.ipn.mx', newsUrl: 'https://www.ipn.mx/CCS/' },
  { id: 'mx-uam', name: 'Universidad Autonoma Metropolitana', shortName: 'UAM', country: 'MX', type: 'universidad', website: 'https://www.uam.mx' },
  { id: 'mx-udg', name: 'Universidad de Guadalajara', shortName: 'UDG', country: 'MX', type: 'universidad', website: 'https://www.udg.mx' },
  { id: 'mx-ibero', name: 'Universidad Iberoamericana', shortName: 'IBERO', country: 'MX', type: 'universidad', website: 'https://www.ibero.mx' },
  { id: 'mx-itam', name: 'Instituto Tecnologico Autonomo de Mexico', shortName: 'ITAM', country: 'MX', type: 'universidad', website: 'https://www.itam.mx' },
  { id: 'mx-buap', name: 'Benemerita Universidad Autonoma de Puebla', shortName: 'BUAP', country: 'MX', type: 'universidad', website: 'https://www.buap.mx' },
  { id: 'mx-uanl', name: 'Universidad Autonoma de Nuevo Leon', shortName: 'UANL', country: 'MX', type: 'universidad', website: 'https://www.uanl.mx' },
  { id: 'mx-colmex', name: 'El Colegio de Mexico', shortName: 'COLMEX', country: 'MX', type: 'universidad', website: 'https://www.colmex.mx' },
  { id: 'mx-uabc', name: 'Universidad Autonoma de Baja California', shortName: 'UABC', country: 'MX', type: 'universidad', website: 'https://www.uabc.mx' },
  { id: 'mx-uv', name: 'Universidad Veracruzana', shortName: 'UV', country: 'MX', type: 'universidad', website: 'https://www.uv.mx' },
  { id: 'mx-uaemex', name: 'Universidad Autonoma del Estado de Mexico', shortName: 'UAEMex', country: 'MX', type: 'universidad', website: 'https://www.uaemex.mx' },
  { id: 'mx-uaslp', name: 'Universidad Autonoma de San Luis Potosi', shortName: 'UASLP', country: 'MX', type: 'universidad', website: 'https://www.uaslp.mx' },
  { id: 'mx-unison', name: 'Universidad de Sonora', shortName: 'UNISON', country: 'MX', type: 'universidad', website: 'https://www.unison.mx' },
  { id: 'mx-uaq', name: 'Universidad Autonoma de Queretaro', shortName: 'UAQ', country: 'MX', type: 'universidad', website: 'https://www.uaq.mx' },
  { id: 'mx-anahuac', name: 'Universidad Anahuac', shortName: 'Anahuac', country: 'MX', type: 'universidad', website: 'https://www.anahuac.mx' },
  { id: 'mx-lasalle', name: 'Universidad La Salle', shortName: 'La Salle', country: 'MX', type: 'universidad', website: 'https://www.lasalle.mx' },
  { id: 'mx-up', name: 'Universidad Panamericana', shortName: 'UP', country: 'MX', type: 'universidad', website: 'https://www.up.edu.mx' },
  { id: 'mx-uady', name: 'Universidad Autonoma de Yucatan', shortName: 'UADY', country: 'MX', type: 'universidad', website: 'https://www.uady.mx' },
];

// =============================================================================
// COLOMBIA (CO)
// =============================================================================

const CO_UNIVERSITIES: University[] = [
  { id: 'co-unal', name: 'Universidad Nacional de Colombia', shortName: 'UNAL', country: 'CO', type: 'universidad', website: 'https://www.unal.edu.co', newsUrl: 'https://agenciadenoticias.unal.edu.co' },
  { id: 'co-uniandes', name: 'Universidad de los Andes', shortName: 'Uniandes', country: 'CO', type: 'universidad', website: 'https://www.uniandes.edu.co' },
  { id: 'co-javeriana', name: 'Pontificia Universidad Javeriana', shortName: 'Javeriana', country: 'CO', type: 'universidad', website: 'https://www.javeriana.edu.co' },
  { id: 'co-udea', name: 'Universidad de Antioquia', shortName: 'UdeA', country: 'CO', type: 'universidad', website: 'https://www.udea.edu.co' },
  { id: 'co-univalle', name: 'Universidad del Valle', shortName: 'Univalle', country: 'CO', type: 'universidad', website: 'https://www.univalle.edu.co' },
  { id: 'co-rosario', name: 'Universidad del Rosario', shortName: 'URosario', country: 'CO', type: 'universidad', website: 'https://www.urosario.edu.co' },
  { id: 'co-eafit', name: 'Universidad EAFIT', shortName: 'EAFIT', country: 'CO', type: 'universidad', website: 'https://www.eafit.edu.co' },
  { id: 'co-uninorte', name: 'Universidad del Norte', shortName: 'Uninorte', country: 'CO', type: 'universidad', website: 'https://www.uninorte.edu.co' },
  { id: 'co-sabana', name: 'Universidad de la Sabana', shortName: 'Sabana', country: 'CO', type: 'universidad', website: 'https://www.unisabana.edu.co' },
  { id: 'co-icesi', name: 'Universidad Icesi', shortName: 'Icesi', country: 'CO', type: 'universidad', website: 'https://www.icesi.edu.co' },
  { id: 'co-uis', name: 'Universidad Industrial de Santander', shortName: 'UIS', country: 'CO', type: 'universidad', website: 'https://www.uis.edu.co' },
  { id: 'co-externado', name: 'Universidad Externado de Colombia', shortName: 'Externado', country: 'CO', type: 'universidad', website: 'https://www.uexternado.edu.co' },
  { id: 'co-bolivariana', name: 'Universidad Pontificia Bolivariana', shortName: 'UPB', country: 'CO', type: 'universidad', website: 'https://www.upb.edu.co' },
  { id: 'co-utadeo', name: 'Universidad Jorge Tadeo Lozano', shortName: 'UTadeo', country: 'CO', type: 'universidad', website: 'https://www.utadeo.edu.co' },
  { id: 'co-ean', name: 'Universidad EAN', shortName: 'EAN', country: 'CO', type: 'universidad', website: 'https://www.universidadean.edu.co' },
  { id: 'co-utp', name: 'Universidad Tecnologica de Pereira', shortName: 'UTP', country: 'CO', type: 'universidad', website: 'https://www.utp.edu.co' },
  { id: 'co-unicauca', name: 'Universidad del Cauca', shortName: 'Unicauca', country: 'CO', type: 'universidad', website: 'https://www.unicauca.edu.co' },
  { id: 'co-militar', name: 'Universidad Militar Nueva Granada', shortName: 'UMNG', country: 'CO', type: 'universidad', website: 'https://www.umng.edu.co' },
  { id: 'co-sergio', name: 'Universidad Sergio Arboleda', shortName: 'USA', country: 'CO', type: 'universidad', website: 'https://www.usergioarboleda.edu.co' },
  { id: 'co-libre', name: 'Universidad Libre', shortName: 'Unilibre', country: 'CO', type: 'universidad', website: 'https://www.unilibre.edu.co' },
];

// =============================================================================
// PERU (PE)
// =============================================================================

const PE_UNIVERSITIES: University[] = [
  { id: 'pe-pucp', name: 'Pontificia Universidad Catolica del Peru', shortName: 'PUCP', country: 'PE', type: 'universidad', website: 'https://www.pucp.edu.pe' },
  { id: 'pe-unmsm', name: 'Universidad Nacional Mayor de San Marcos', shortName: 'UNMSM', country: 'PE', type: 'universidad', website: 'https://www.unmsm.edu.pe' },
  { id: 'pe-uni', name: 'Universidad Nacional de Ingenieria', shortName: 'UNI', country: 'PE', type: 'universidad', website: 'https://www.uni.edu.pe' },
  { id: 'pe-cayetano', name: 'Universidad Peruana Cayetano Heredia', shortName: 'UPCH', country: 'PE', type: 'universidad', website: 'https://www.cayetano.edu.pe' },
  { id: 'pe-ulima', name: 'Universidad de Lima', shortName: 'ULima', country: 'PE', type: 'universidad', website: 'https://www.ulima.edu.pe' },
  { id: 'pe-up', name: 'Universidad del Pacifico', shortName: 'UP', country: 'PE', type: 'universidad', website: 'https://www.up.edu.pe' },
  { id: 'pe-upc', name: 'Universidad Peruana de Ciencias Aplicadas', shortName: 'UPC', country: 'PE', type: 'universidad', website: 'https://www.upc.edu.pe' },
  { id: 'pe-esan', name: 'Universidad ESAN', shortName: 'ESAN', country: 'PE', type: 'universidad', website: 'https://www.esan.edu.pe' },
  { id: 'pe-unsa', name: 'Universidad Nacional de San Agustin', shortName: 'UNSA', country: 'PE', type: 'universidad', website: 'https://www.unsa.edu.pe' },
  { id: 'pe-unt', name: 'Universidad Nacional de Trujillo', shortName: 'UNT', country: 'PE', type: 'universidad', website: 'https://www.unitru.edu.pe' },
  { id: 'pe-unalm', name: 'Universidad Nacional Agraria La Molina', shortName: 'UNALM', country: 'PE', type: 'universidad', website: 'https://www.lamolina.edu.pe' },
  { id: 'pe-piura', name: 'Universidad de Piura', shortName: 'UDEP', country: 'PE', type: 'universidad', website: 'https://www.udep.edu.pe' },
  { id: 'pe-usil', name: 'Universidad San Ignacio de Loyola', shortName: 'USIL', country: 'PE', type: 'universidad', website: 'https://www.usil.edu.pe' },
  { id: 'pe-usmp', name: 'Universidad de San Martin de Porres', shortName: 'USMP', country: 'PE', type: 'universidad', website: 'https://www.usmp.edu.pe' },
  { id: 'pe-ucsm', name: 'Universidad Catolica de Santa Maria', shortName: 'UCSM', country: 'PE', type: 'universidad', website: 'https://www.ucsm.edu.pe' },
  { id: 'pe-urp', name: 'Universidad Ricardo Palma', shortName: 'URP', country: 'PE', type: 'universidad', website: 'https://www.urp.edu.pe' },
  { id: 'pe-unsaac', name: 'Universidad Nacional de San Antonio Abad del Cusco', shortName: 'UNSAAC', country: 'PE', type: 'universidad', website: 'https://www.unsaac.edu.pe' },
  { id: 'pe-ucsp', name: 'Universidad Catolica San Pablo', shortName: 'UCSP', country: 'PE', type: 'universidad', website: 'https://www.ucsp.edu.pe' },
  { id: 'pe-utp', name: 'Universidad Tecnologica del Peru', shortName: 'UTP', country: 'PE', type: 'universidad', website: 'https://www.utp.edu.pe' },
  { id: 'pe-continental', name: 'Universidad Continental', shortName: 'UC', country: 'PE', type: 'universidad', website: 'https://www.continental.edu.pe' },
];

// =============================================================================
// ARGENTINA (AR)
// =============================================================================

const AR_UNIVERSITIES: University[] = [
  { id: 'ar-uba', name: 'Universidad de Buenos Aires', shortName: 'UBA', country: 'AR', type: 'universidad', website: 'https://www.uba.ar', newsUrl: 'https://www.uba.ar/noticia/' },
  { id: 'ar-itba', name: 'Instituto Tecnologico de Buenos Aires', shortName: 'ITBA', country: 'AR', type: 'universidad', website: 'https://www.itba.edu.ar' },
  { id: 'ar-utdt', name: 'Universidad Torcuato Di Tella', shortName: 'UTDT', country: 'AR', type: 'universidad', website: 'https://www.utdt.edu' },
  { id: 'ar-austral', name: 'Universidad Austral', shortName: 'Austral', country: 'AR', type: 'universidad', website: 'https://www.austral.edu.ar' },
  { id: 'ar-udesa', name: 'Universidad de San Andres', shortName: 'UdeSA', country: 'AR', type: 'universidad', website: 'https://www.udesa.edu.ar' },
  { id: 'ar-uca', name: 'Pontificia Universidad Catolica Argentina', shortName: 'UCA', country: 'AR', type: 'universidad', website: 'https://www.uca.edu.ar' },
  { id: 'ar-unlp', name: 'Universidad Nacional de La Plata', shortName: 'UNLP', country: 'AR', type: 'universidad', website: 'https://www.unlp.edu.ar' },
  { id: 'ar-unc', name: 'Universidad Nacional de Cordoba', shortName: 'UNC', country: 'AR', type: 'universidad', website: 'https://www.unc.edu.ar' },
  { id: 'ar-unr', name: 'Universidad Nacional de Rosario', shortName: 'UNR', country: 'AR', type: 'universidad', website: 'https://www.unr.edu.ar' },
  { id: 'ar-utn', name: 'Universidad Tecnologica Nacional', shortName: 'UTN', country: 'AR', type: 'universidad', website: 'https://www.utn.edu.ar' },
  { id: 'ar-uncuyo', name: 'Universidad Nacional de Cuyo', shortName: 'UNCuyo', country: 'AR', type: 'universidad', website: 'https://www.uncuyo.edu.ar' },
  { id: 'ar-uns', name: 'Universidad Nacional del Sur', shortName: 'UNS', country: 'AR', type: 'universidad', website: 'https://www.uns.edu.ar' },
  { id: 'ar-unl', name: 'Universidad Nacional del Litoral', shortName: 'UNL', country: 'AR', type: 'universidad', website: 'https://www.unl.edu.ar' },
  { id: 'ar-untref', name: 'Universidad Nacional de Tres de Febrero', shortName: 'UNTREF', country: 'AR', type: 'universidad', website: 'https://www.untref.edu.ar' },
  { id: 'ar-unsam', name: 'Universidad Nacional de San Martin', shortName: 'UNSAM', country: 'AR', type: 'universidad', website: 'https://www.unsam.edu.ar' },
  { id: 'ar-ungs', name: 'Universidad Nacional de General Sarmiento', shortName: 'UNGS', country: 'AR', type: 'universidad', website: 'https://www.ungs.edu.ar' },
  { id: 'ar-uade', name: 'Universidad Argentina de la Empresa', shortName: 'UADE', country: 'AR', type: 'universidad', website: 'https://www.uade.edu.ar' },
  { id: 'ar-up', name: 'Universidad de Palermo', shortName: 'UP', country: 'AR', type: 'universidad', website: 'https://www.palermo.edu' },
  { id: 'ar-ub', name: 'Universidad de Belgrano', shortName: 'UB', country: 'AR', type: 'universidad', website: 'https://www.ub.edu.ar' },
  { id: 'ar-unq', name: 'Universidad Nacional de Quilmes', shortName: 'UNQ', country: 'AR', type: 'universidad', website: 'https://www.unq.edu.ar' },
];

// =============================================================================
// BRAZIL (BR)
// =============================================================================

const BR_UNIVERSITIES: University[] = [
  { id: 'br-usp', name: 'Universidade de Sao Paulo', shortName: 'USP', country: 'BR', type: 'universidad', website: 'https://www.usp.br', newsUrl: 'https://jornal.usp.br' },
  { id: 'br-unicamp', name: 'Universidade Estadual de Campinas', shortName: 'UNICAMP', country: 'BR', type: 'universidad', website: 'https://www.unicamp.br' },
  { id: 'br-ufrj', name: 'Universidade Federal do Rio de Janeiro', shortName: 'UFRJ', country: 'BR', type: 'universidad', website: 'https://www.ufrj.br' },
  { id: 'br-unesp', name: 'Universidade Estadual Paulista', shortName: 'UNESP', country: 'BR', type: 'universidad', website: 'https://www.unesp.br' },
  { id: 'br-ufmg', name: 'Universidade Federal de Minas Gerais', shortName: 'UFMG', country: 'BR', type: 'universidad', website: 'https://www.ufmg.br' },
  { id: 'br-ufrgs', name: 'Universidade Federal do Rio Grande do Sul', shortName: 'UFRGS', country: 'BR', type: 'universidad', website: 'https://www.ufrgs.br' },
  { id: 'br-ufsc', name: 'Universidade Federal de Santa Catarina', shortName: 'UFSC', country: 'BR', type: 'universidad', website: 'https://www.ufsc.br' },
  { id: 'br-unb', name: 'Universidade de Brasilia', shortName: 'UnB', country: 'BR', type: 'universidad', website: 'https://www.unb.br' },
  { id: 'br-ufpr', name: 'Universidade Federal do Parana', shortName: 'UFPR', country: 'BR', type: 'universidad', website: 'https://www.ufpr.br' },
  { id: 'br-ufpe', name: 'Universidade Federal de Pernambuco', shortName: 'UFPE', country: 'BR', type: 'universidad', website: 'https://www.ufpe.br' },
  { id: 'br-ufba', name: 'Universidade Federal da Bahia', shortName: 'UFBA', country: 'BR', type: 'universidad', website: 'https://www.ufba.br' },
  { id: 'br-ufc', name: 'Universidade Federal do Ceara', shortName: 'UFC', country: 'BR', type: 'universidad', website: 'https://www.ufc.br' },
  { id: 'br-ufpa', name: 'Universidade Federal do Para', shortName: 'UFPA', country: 'BR', type: 'universidad', website: 'https://www.ufpa.br' },
  { id: 'br-pucrio', name: 'Pontificia Universidade Catolica do Rio de Janeiro', shortName: 'PUC-Rio', country: 'BR', type: 'universidad', website: 'https://www.puc-rio.br' },
  { id: 'br-pucsp', name: 'Pontificia Universidade Catolica de Sao Paulo', shortName: 'PUC-SP', country: 'BR', type: 'universidad', website: 'https://www.pucsp.br' },
  { id: 'br-fgv', name: 'Fundacao Getulio Vargas', shortName: 'FGV', country: 'BR', type: 'universidad', website: 'https://www.fgv.br' },
  { id: 'br-ita', name: 'Instituto Tecnologico de Aeronautica', shortName: 'ITA', country: 'BR', type: 'universidad', website: 'https://www.ita.br' },
  { id: 'br-ufscar', name: 'Universidade Federal de Sao Carlos', shortName: 'UFSCar', country: 'BR', type: 'universidad', website: 'https://www.ufscar.br' },
  { id: 'br-uff', name: 'Universidade Federal Fluminense', shortName: 'UFF', country: 'BR', type: 'universidad', website: 'https://www.uff.br' },
  { id: 'br-uerj', name: 'Universidade do Estado do Rio de Janeiro', shortName: 'UERJ', country: 'BR', type: 'universidad', website: 'https://www.uerj.br' },
];

// =============================================================================
// ECUADOR (EC)
// =============================================================================

const EC_UNIVERSITIES: University[] = [
  { id: 'ec-usfq', name: 'Universidad San Francisco de Quito', shortName: 'USFQ', country: 'EC', type: 'universidad', website: 'https://www.usfq.edu.ec' },
  { id: 'ec-espol', name: 'Escuela Superior Politecnica del Litoral', shortName: 'ESPOL', country: 'EC', type: 'universidad', website: 'https://www.espol.edu.ec' },
  { id: 'ec-puce', name: 'Pontificia Universidad Catolica del Ecuador', shortName: 'PUCE', country: 'EC', type: 'universidad', website: 'https://www.puce.edu.ec' },
  { id: 'ec-uce', name: 'Universidad Central del Ecuador', shortName: 'UCE', country: 'EC', type: 'universidad', website: 'https://www.uce.edu.ec' },
  { id: 'ec-udla', name: 'Universidad de las Americas', shortName: 'UDLA', country: 'EC', type: 'universidad', website: 'https://www.udla.edu.ec' },
  { id: 'ec-epn', name: 'Escuela Politecnica Nacional', shortName: 'EPN', country: 'EC', type: 'universidad', website: 'https://www.epn.edu.ec' },
  { id: 'ec-ucuenca', name: 'Universidad de Cuenca', shortName: 'UCuenca', country: 'EC', type: 'universidad', website: 'https://www.ucuenca.edu.ec' },
  { id: 'ec-uazuay', name: 'Universidad del Azuay', shortName: 'UDA', country: 'EC', type: 'universidad', website: 'https://www.uazuay.edu.ec' },
  { id: 'ec-utpl', name: 'Universidad Tecnica Particular de Loja', shortName: 'UTPL', country: 'EC', type: 'universidad', website: 'https://www.utpl.edu.ec' },
  { id: 'ec-ug', name: 'Universidad de Guayaquil', shortName: 'UG', country: 'EC', type: 'universidad', website: 'https://www.ug.edu.ec' },
  { id: 'ec-uees', name: 'Universidad de Especialidades Espiritu Santo', shortName: 'UEES', country: 'EC', type: 'universidad', website: 'https://www.uees.edu.ec' },
  { id: 'ec-uisek', name: 'Universidad Internacional SEK', shortName: 'UISEK', country: 'EC', type: 'universidad', website: 'https://www.uisek.edu.ec' },
  { id: 'ec-ute', name: 'Universidad Tecnologica Equinoccial', shortName: 'UTE', country: 'EC', type: 'universidad', website: 'https://www.ute.edu.ec' },
  { id: 'ec-espe', name: 'Universidad de las Fuerzas Armadas ESPE', shortName: 'ESPE', country: 'EC', type: 'universidad', website: 'https://www.espe.edu.ec' },
  { id: 'ec-unach', name: 'Universidad Nacional de Chimborazo', shortName: 'UNACH', country: 'EC', type: 'universidad', website: 'https://www.unach.edu.ec' },
  { id: 'ec-utn', name: 'Universidad Tecnica del Norte', shortName: 'UTN', country: 'EC', type: 'universidad', website: 'https://www.utn.edu.ec' },
  { id: 'ec-uta', name: 'Universidad Tecnica de Ambato', shortName: 'UTA', country: 'EC', type: 'universidad', website: 'https://www.uta.edu.ec' },
  { id: 'ec-ucsg', name: 'Universidad Catolica de Santiago de Guayaquil', shortName: 'UCSG', country: 'EC', type: 'universidad', website: 'https://www.ucsg.edu.ec' },
  { id: 'ec-upacifico', name: 'Universidad del Pacifico', shortName: 'UPacif', country: 'EC', type: 'universidad', website: 'https://www.upacifico.edu.ec' },
  { id: 'ec-uhemisferios', name: 'Universidad de Los Hemisferios', shortName: 'UHemisf', country: 'EC', type: 'universidad', website: 'https://www.uhemisferios.edu.ec' },
];

// =============================================================================
// URUGUAY (UY)
// =============================================================================

const UY_UNIVERSITIES: University[] = [
  { id: 'uy-udelar', name: 'Universidad de la Republica', shortName: 'UdelaR', country: 'UY', type: 'universidad', website: 'https://www.universidad.edu.uy' },
  { id: 'uy-ort', name: 'Universidad ORT Uruguay', shortName: 'ORT', country: 'UY', type: 'universidad', website: 'https://www.ort.edu.uy' },
  { id: 'uy-ucudal', name: 'Universidad Catolica del Uruguay', shortName: 'UCU', country: 'UY', type: 'universidad', website: 'https://www.ucu.edu.uy' },
  { id: 'uy-um', name: 'Universidad de Montevideo', shortName: 'UM', country: 'UY', type: 'universidad', website: 'https://www.um.edu.uy' },
  { id: 'uy-utec', name: 'Universidad Tecnologica del Uruguay', shortName: 'UTEC', country: 'UY', type: 'universidad', website: 'https://www.utec.edu.uy' },
  { id: 'uy-claeh', name: 'Universidad CLAEH', shortName: 'CLAEH', country: 'UY', type: 'universidad', website: 'https://universidad.claeh.edu.uy' },
  { id: 'uy-ude', name: 'Universidad de la Empresa', shortName: 'UDE', country: 'UY', type: 'universidad', website: 'https://www.ude.edu.uy' },
  { id: 'uy-ucu', name: 'Universidad UCUDAL Damaso Antonio Larranaga', shortName: 'UCUDAL', country: 'UY', type: 'universidad', website: 'https://www.ucu.edu.uy' },
  { id: 'uy-unilasalle', name: 'Universidad de la Salle Uruguay', shortName: 'La Salle UY', country: 'UY', type: 'universidad', website: 'https://www.lasalle.edu.uy' },
  { id: 'uy-upunta', name: 'Universidad de Punta del Este', shortName: 'UPE', country: 'UY', type: 'universidad', website: 'https://www.upe.edu.uy' },
  { id: 'uy-utu', name: 'Universidad del Trabajo del Uruguay', shortName: 'UTU', country: 'UY', type: 'instituto', website: 'https://www.utu.edu.uy' },
  { id: 'uy-anep', name: 'Administracion Nacional de Educacion Publica', shortName: 'ANEP', country: 'UY', type: 'instituto', website: 'https://www.anep.edu.uy' },
  { id: 'uy-isede', name: 'Instituto Superior de Educacion', shortName: 'ISEDE', country: 'UY', type: 'instituto', website: 'https://www.isede.edu.uy' },
  { id: 'uy-bios', name: 'Instituto BIOS', shortName: 'BIOS', country: 'UY', type: 'instituto', website: 'https://www.bios.edu.uy' },
  { id: 'uy-ipa', name: 'Instituto de Profesores Artigas', shortName: 'IPA', country: 'UY', type: 'instituto', website: 'https://www.ipa.edu.uy' },
  { id: 'uy-cure', name: 'Centro Universitario Regional del Este', shortName: 'CURE', country: 'UY', type: 'universidad', website: 'https://www.cure.edu.uy' },
  { id: 'uy-uclaeh', name: 'Centro Latinoamericano de Economia Humana', shortName: 'CLAEH', country: 'UY', type: 'universidad', website: 'https://www.claeh.edu.uy' },
  { id: 'uy-iuacj', name: 'Instituto Universitario ACJ', shortName: 'IUACJ', country: 'UY', type: 'instituto', website: 'https://www.iuacj.edu.uy' },
  { id: 'uy-iecon', name: 'Instituto de Economia', shortName: 'IECON', country: 'UY', type: 'instituto', website: 'https://www.iecon.ccee.edu.uy' },
  { id: 'uy-cediiap', name: 'Centro de Investigacion y Docencia', shortName: 'CEDIIAP', country: 'UY', type: 'instituto', website: 'https://www.cediiap.edu.uy' },
];

// =============================================================================
// PARAGUAY (PY)
// =============================================================================

const PY_UNIVERSITIES: University[] = [
  { id: 'py-una', name: 'Universidad Nacional de Asuncion', shortName: 'UNA', country: 'PY', type: 'universidad', website: 'https://www.una.py' },
  { id: 'py-uca', name: 'Universidad Catolica Nuestra Senora de la Asuncion', shortName: 'UCA', country: 'PY', type: 'universidad', website: 'https://www.uca.edu.py' },
  { id: 'py-uninorte', name: 'Universidad del Norte', shortName: 'UniNorte', country: 'PY', type: 'universidad', website: 'https://www.uninorte.edu.py' },
  { id: 'py-americana', name: 'Universidad Americana', shortName: 'UA', country: 'PY', type: 'universidad', website: 'https://www.americana.edu.py' },
  { id: 'py-columbia', name: 'Universidad Columbia del Paraguay', shortName: 'Columbia', country: 'PY', type: 'universidad', website: 'https://www.columbia.edu.py' },
  { id: 'py-uaa', name: 'Universidad Autonoma de Asuncion', shortName: 'UAA', country: 'PY', type: 'universidad', website: 'https://www.uaa.edu.py' },
  { id: 'py-up', name: 'Universidad del Pacifico', shortName: 'UP', country: 'PY', type: 'universidad', website: 'https://www.upacifico.edu.py' },
  { id: 'py-uca-itapua', name: 'Universidad Catolica de Itapua', shortName: 'UCI', country: 'PY', type: 'universidad', website: 'https://www.ucitapua.edu.py' },
  { id: 'py-une', name: 'Universidad Nacional del Este', shortName: 'UNE', country: 'PY', type: 'universidad', website: 'https://www.une.edu.py' },
  { id: 'py-unican', name: 'Universidad Nacional de Canindeyu', shortName: 'UNICAN', country: 'PY', type: 'universidad', website: 'https://www.unican.edu.py' },
  { id: 'py-utic', name: 'Universidad Tecnologica Intercontinental', shortName: 'UTIC', country: 'PY', type: 'universidad', website: 'https://www.utic.edu.py' },
  { id: 'py-unp', name: 'Universidad Nacional de Pilar', shortName: 'UNP', country: 'PY', type: 'universidad', website: 'https://www.unp.edu.py' },
  { id: 'py-upap', name: 'Universidad Politecnica y Artistica del Paraguay', shortName: 'UPAP', country: 'PY', type: 'universidad', website: 'https://www.upap.edu.py' },
  { id: 'py-unida', name: 'Universidad de la Integracion de las Americas', shortName: 'UNIDA', country: 'PY', type: 'universidad', website: 'https://www.unida.edu.py' },
  { id: 'py-ucsa', name: 'Universidad del Cono Sur de las Americas', shortName: 'UCSA', country: 'PY', type: 'universidad', website: 'https://www.ucsa.edu.py' },
  { id: 'py-umi', name: 'Universidad Maria Auxiliadora', shortName: 'UNIMAS', country: 'PY', type: 'universidad', website: 'https://www.unimas.edu.py' },
  { id: 'py-ibero', name: 'Universidad Iberoamericana', shortName: 'UNIBE', country: 'PY', type: 'universidad', website: 'https://www.unibe.edu.py' },
  { id: 'py-ung', name: 'Universidad Nacional de General San Martin', shortName: 'UNG', country: 'PY', type: 'universidad', website: 'https://www.ung.edu.py' },
  { id: 'py-uninternacional', name: 'Universidad Internacional Tres Fronteras', shortName: 'UNITF', country: 'PY', type: 'universidad', website: 'https://www.unitresfronteras.edu.py' },
  { id: 'py-ucnsa', name: 'Universidad Comunera', shortName: 'UCOM', country: 'PY', type: 'universidad', website: 'https://www.ucom.edu.py' },
];

// =============================================================================
// BOLIVIA (BO)
// =============================================================================

const BO_UNIVERSITIES: University[] = [
  { id: 'bo-umsa', name: 'Universidad Mayor de San Andres', shortName: 'UMSA', country: 'BO', type: 'universidad', website: 'https://www.umsa.bo' },
  { id: 'bo-umss', name: 'Universidad Mayor de San Simon', shortName: 'UMSS', country: 'BO', type: 'universidad', website: 'https://www.umss.edu.bo' },
  { id: 'bo-ucb', name: 'Universidad Catolica Boliviana San Pablo', shortName: 'UCB', country: 'BO', type: 'universidad', website: 'https://www.ucb.edu.bo' },
  { id: 'bo-uagrm', name: 'Universidad Autonoma Gabriel Rene Moreno', shortName: 'UAGRM', country: 'BO', type: 'universidad', website: 'https://www.uagrm.edu.bo' },
  { id: 'bo-upb', name: 'Universidad Privada Boliviana', shortName: 'UPB', country: 'BO', type: 'universidad', website: 'https://www.upb.edu' },
  { id: 'bo-uatf', name: 'Universidad Autonoma Tomas Frias', shortName: 'UATF', country: 'BO', type: 'universidad', website: 'https://www.uatf.edu.bo' },
  { id: 'bo-ujb', name: 'Universidad Juan Misael Saracho', shortName: 'UAJMS', country: 'BO', type: 'universidad', website: 'https://www.uajms.edu.bo' },
  { id: 'bo-uto', name: 'Universidad Tecnica de Oruro', shortName: 'UTO', country: 'BO', type: 'universidad', website: 'https://www.uto.edu.bo' },
  { id: 'bo-univalle', name: 'Universidad Privada del Valle', shortName: 'UNIVALLE', country: 'BO', type: 'universidad', website: 'https://www.univalle.edu' },
  { id: 'bo-upsa', name: 'Universidad Privada de Santa Cruz de la Sierra', shortName: 'UPSA', country: 'BO', type: 'universidad', website: 'https://www.upsa.edu.bo' },
  { id: 'bo-udabol', name: 'Universidad de Aquino Bolivia', shortName: 'UDABOL', country: 'BO', type: 'universidad', website: 'https://www.udabol.edu.bo' },
  { id: 'bo-usfx', name: 'Universidad Mayor Real y Pontificia de San Francisco Xavier de Chuquisaca', shortName: 'USFX', country: 'BO', type: 'universidad', website: 'https://www.usfx.bo' },
  { id: 'bo-emi', name: 'Escuela Militar de Ingenieria', shortName: 'EMI', country: 'BO', type: 'universidad', website: 'https://www.emi.edu.bo' },
  { id: 'bo-unitepc', name: 'Universidad Tecnica Privada Cosmos', shortName: 'UNITEPC', country: 'BO', type: 'universidad', website: 'https://www.unitepc.edu.bo' },
  { id: 'bo-ucebol', name: 'Universidad Cristiana de Bolivia', shortName: 'UCEBOL', country: 'BO', type: 'universidad', website: 'https://www.ucebol.edu.bo' },
  { id: 'bo-utb', name: 'Universidad Tecnica de Beni', shortName: 'UTB', country: 'BO', type: 'universidad', website: 'https://www.utb.edu.bo' },
  { id: 'bo-uap', name: 'Universidad Amazonica de Pando', shortName: 'UAP', country: 'BO', type: 'universidad', website: 'https://www.uap.edu.bo' },
  { id: 'bo-unifranz', name: 'Universidad Franz Tamayo', shortName: 'UNIFRANZ', country: 'BO', type: 'universidad', website: 'https://www.unifranz.edu.bo' },
  { id: 'bo-nur', name: 'Universidad NUR', shortName: 'NUR', country: 'BO', type: 'universidad', website: 'https://www.nur.edu' },
  { id: 'bo-ureal', name: 'Universidad Real', shortName: 'UREAL', country: 'BO', type: 'universidad', website: 'https://www.ureal.edu.bo' },
];

// =============================================================================
// VENEZUELA (VE)
// =============================================================================

const VE_UNIVERSITIES: University[] = [
  { id: 've-ucv', name: 'Universidad Central de Venezuela', shortName: 'UCV', country: 'VE', type: 'universidad', website: 'https://www.ucv.ve' },
  { id: 've-usb', name: 'Universidad Simon Bolivar', shortName: 'USB', country: 'VE', type: 'universidad', website: 'https://www.usb.ve' },
  { id: 've-ucab', name: 'Universidad Catolica Andres Bello', shortName: 'UCAB', country: 'VE', type: 'universidad', website: 'https://www.ucab.edu.ve' },
  { id: 've-unimet', name: 'Universidad Metropolitana', shortName: 'UNIMET', country: 'VE', type: 'universidad', website: 'https://www.unimet.edu.ve' },
  { id: 've-luz', name: 'Universidad del Zulia', shortName: 'LUZ', country: 'VE', type: 'universidad', website: 'https://www.luz.edu.ve' },
  { id: 've-ula', name: 'Universidad de Los Andes', shortName: 'ULA', country: 'VE', type: 'universidad', website: 'https://www.ula.ve' },
  { id: 've-uc', name: 'Universidad de Carabobo', shortName: 'UC', country: 'VE', type: 'universidad', website: 'https://www.uc.edu.ve' },
  { id: 've-uniandes', name: 'Universidad Privada Dr. Rafael Belloso Chacin', shortName: 'URBE', country: 'VE', type: 'universidad', website: 'https://www.urbe.edu' },
  { id: 've-unexpo', name: 'Universidad Nacional Experimental Politecnica', shortName: 'UNEXPO', country: 'VE', type: 'universidad', website: 'https://www.unexpo.edu.ve' },
  { id: 've-ucla', name: 'Universidad Centroccidental Lisandro Alvarado', shortName: 'UCLA', country: 'VE', type: 'universidad', website: 'https://www.ucla.edu.ve' },
  { id: 've-udo', name: 'Universidad de Oriente', shortName: 'UDO', country: 'VE', type: 'universidad', website: 'https://www.udo.edu.ve' },
  { id: 've-uneg', name: 'Universidad Nacional Experimental de Guayana', shortName: 'UNEG', country: 'VE', type: 'universidad', website: 'https://www.uneg.edu.ve' },
  { id: 've-uny', name: 'Universidad Yacambu', shortName: 'UNY', country: 'VE', type: 'universidad', website: 'https://www.uny.edu.ve' },
  { id: 've-ujap', name: 'Universidad Jose Antonio Paez', shortName: 'UJAP', country: 'VE', type: 'universidad', website: 'https://www.ujap.edu.ve' },
  { id: 've-uat', name: 'Universidad Arturo Michelena', shortName: 'UAM', country: 'VE', type: 'universidad', website: 'https://www.uam.edu.ve' },
  { id: 've-unefa', name: 'Universidad Nacional Experimental de la Fuerza Armada', shortName: 'UNEFA', country: 'VE', type: 'universidad', website: 'https://www.unefa.edu.ve' },
  { id: 've-upel', name: 'Universidad Pedagogica Experimental Libertador', shortName: 'UPEL', country: 'VE', type: 'universidad', website: 'https://www.upel.edu.ve' },
  { id: 've-unesr', name: 'Universidad Nacional Experimental Simon Rodriguez', shortName: 'UNESR', country: 'VE', type: 'universidad', website: 'https://www.unesr.edu.ve' },
  { id: 've-uba', name: 'Universidad Bicentenaria de Aragua', shortName: 'UBA', country: 'VE', type: 'universidad', website: 'https://www.uba.edu.ve' },
  { id: 've-ujmv', name: 'Universidad Jose Maria Vargas', shortName: 'UJMV', country: 'VE', type: 'universidad', website: 'https://www.ujmv.edu.ve' },
];

// =============================================================================
// COSTA RICA (CR)
// =============================================================================

const CR_UNIVERSITIES: University[] = [
  { id: 'cr-ucr', name: 'Universidad de Costa Rica', shortName: 'UCR', country: 'CR', type: 'universidad', website: 'https://www.ucr.ac.cr' },
  { id: 'cr-tec', name: 'Instituto Tecnologico de Costa Rica', shortName: 'TEC', country: 'CR', type: 'universidad', website: 'https://www.tec.ac.cr' },
  { id: 'cr-una', name: 'Universidad Nacional de Costa Rica', shortName: 'UNA', country: 'CR', type: 'universidad', website: 'https://www.una.ac.cr' },
  { id: 'cr-uned', name: 'Universidad Estatal a Distancia', shortName: 'UNED', country: 'CR', type: 'universidad', website: 'https://www.uned.ac.cr' },
  { id: 'cr-utn', name: 'Universidad Tecnica Nacional', shortName: 'UTN', country: 'CR', type: 'universidad', website: 'https://www.utn.ac.cr' },
  { id: 'cr-ulacit', name: 'Universidad Latinoamericana de Ciencia y Tecnologia', shortName: 'ULACIT', country: 'CR', type: 'universidad', website: 'https://www.ulacit.ac.cr' },
  { id: 'cr-ulatina', name: 'Universidad Latina de Costa Rica', shortName: 'ULatina', country: 'CR', type: 'universidad', website: 'https://www.ulatina.ac.cr' },
  { id: 'cr-ufidelitas', name: 'Universidad Fidelitas', shortName: 'UFidelitas', country: 'CR', type: 'universidad', website: 'https://www.ufidelitas.ac.cr' },
  { id: 'cr-veritas', name: 'Universidad Veritas', shortName: 'Veritas', country: 'CR', type: 'universidad', website: 'https://www.veritas.cr' },
  { id: 'cr-uam', name: 'Universidad Americana', shortName: 'UAM', country: 'CR', type: 'universidad', website: 'https://www.uam.ac.cr' },
  { id: 'cr-ucimed', name: 'Universidad de Ciencias Medicas', shortName: 'UCIMED', country: 'CR', type: 'universidad', website: 'https://www.ucimed.com' },
  { id: 'cr-usantapaula', name: 'Universidad Santa Paula', shortName: 'USP', country: 'CR', type: 'universidad', website: 'https://www.uspsantapaula.com' },
  { id: 'cr-uia', name: 'Universidad Internacional de las Americas', shortName: 'UIA', country: 'CR', type: 'universidad', website: 'https://www.uia.ac.cr' },
  { id: 'cr-uaca', name: 'Universidad Autonoma de Centro America', shortName: 'UACA', country: 'CR', type: 'universidad', website: 'https://www.uaca.ac.cr' },
  { id: 'cr-lead', name: 'Universidad LEAD', shortName: 'LEAD', country: 'CR', type: 'universidad', website: 'https://www.ulead.ac.cr' },
  { id: 'cr-ucr-sede', name: 'Universidad Hispanoamericana', shortName: 'UH', country: 'CR', type: 'universidad', website: 'https://www.uhispanoamericana.ac.cr' },
  { id: 'cr-earth', name: 'Universidad EARTH', shortName: 'EARTH', country: 'CR', type: 'universidad', website: 'https://www.earth.ac.cr' },
  { id: 'cr-incae', name: 'INCAE Business School', shortName: 'INCAE', country: 'CR', type: 'universidad', website: 'https://www.incae.edu' },
  { id: 'cr-ucenfotec', name: 'Universidad CENFOTEC', shortName: 'CENFOTEC', country: 'CR', type: 'universidad', website: 'https://www.ucenfotec.ac.cr' },
  { id: 'cr-unadeca', name: 'Universidad Adventista de Centroamerica', shortName: 'UNADECA', country: 'CR', type: 'universidad', website: 'https://www.unadeca.ac.cr' },
];

// =============================================================================
// PANAMA (PA)
// =============================================================================

const PA_UNIVERSITIES: University[] = [
  { id: 'pa-up', name: 'Universidad de Panama', shortName: 'UP', country: 'PA', type: 'universidad', website: 'https://www.up.ac.pa' },
  { id: 'pa-utp', name: 'Universidad Tecnologica de Panama', shortName: 'UTP', country: 'PA', type: 'universidad', website: 'https://www.utp.ac.pa' },
  { id: 'pa-usma', name: 'Universidad Catolica Santa Maria La Antigua', shortName: 'USMA', country: 'PA', type: 'universidad', website: 'https://www.usma.ac.pa' },
  { id: 'pa-ulat', name: 'Universidad Latina de Panama', shortName: 'ULAT', country: 'PA', type: 'universidad', website: 'https://www.ulat.ac.pa' },
  { id: 'pa-fsu-panama', name: 'Florida State University Panama', shortName: 'FSU Panama', country: 'PA', type: 'university', website: 'https://www.fsu.edu' },
  { id: 'pa-uip', name: 'Universidad Interamericana de Panama', shortName: 'UIP', country: 'PA', type: 'universidad', website: 'https://www.uip.pa' },
  { id: 'pa-udelas', name: 'Universidad Especializada de las Americas', shortName: 'UDELAS', country: 'PA', type: 'universidad', website: 'https://www.udelas.ac.pa' },
  { id: 'pa-unachi', name: 'Universidad Autonoma de Chiriqui', shortName: 'UNACHI', country: 'PA', type: 'universidad', website: 'https://www.unachi.ac.pa' },
  { id: 'pa-umip', name: 'Universidad Maritima Internacional de Panama', shortName: 'UMIP', country: 'PA', type: 'universidad', website: 'https://www.umip.ac.pa' },
  { id: 'pa-aden', name: 'ADEN University', shortName: 'ADEN', country: 'PA', type: 'university', website: 'https://www.adenuniversity.edu.pa' },
  { id: 'pa-quality', name: 'Quality Leadership University', shortName: 'QLU', country: 'PA', type: 'university', website: 'https://www.qlu.ac.pa' },
  { id: 'pa-columbus', name: 'Columbus University', shortName: 'Columbus', country: 'PA', type: 'university', website: 'https://www.columbus.edu' },
  { id: 'pa-isae', name: 'ISAE Universidad', shortName: 'ISAE', country: 'PA', type: 'universidad', website: 'https://www.isaeuniversidad.ac.pa' },
  { id: 'pa-uam', name: 'Universidad del Arte Ganexa', shortName: 'Ganexa', country: 'PA', type: 'universidad', website: 'https://www.ganexa.edu.pa' },
  { id: 'pa-unadp', name: 'Universidad Abierta y a Distancia de Panama', shortName: 'UNADP', country: 'PA', type: 'universidad', website: 'https://www.unadp.ac.pa' },
  { id: 'pa-uniedpa', name: 'Universidad OTEIMA', shortName: 'OTEIMA', country: 'PA', type: 'universidad', website: 'https://www.oteima.ac.pa' },
  { id: 'pa-udi', name: 'Universidad del Istmo', shortName: 'UDI', country: 'PA', type: 'universidad', website: 'https://www.udi.edu' },
  { id: 'pa-louisville', name: 'University of Louisville Panama', shortName: 'UofL Panama', country: 'PA', type: 'university', website: 'https://www.louisville.edu' },
  { id: 'pa-americana', name: 'Universidad Americana de Panama', shortName: 'UAM', country: 'PA', type: 'universidad', website: 'https://www.uam.edu.pa' },
  { id: 'pa-metropolitana', name: 'Universidad Metropolitana de Educacion', shortName: 'UMECIT', country: 'PA', type: 'universidad', website: 'https://www.umecit.edu.pa' },
];

// =============================================================================
// DOMINICAN REPUBLIC (DO)
// =============================================================================

const DO_UNIVERSITIES: University[] = [
  { id: 'do-uasd', name: 'Universidad Autonoma de Santo Domingo', shortName: 'UASD', country: 'DO', type: 'universidad', website: 'https://www.uasd.edu.do' },
  { id: 'do-pucmm', name: 'Pontificia Universidad Catolica Madre y Maestra', shortName: 'PUCMM', country: 'DO', type: 'universidad', website: 'https://www.pucmm.edu.do' },
  { id: 'do-intec', name: 'Instituto Tecnologico de Santo Domingo', shortName: 'INTEC', country: 'DO', type: 'universidad', website: 'https://www.intec.edu.do' },
  { id: 'do-unibe', name: 'Universidad Iberoamericana', shortName: 'UNIBE', country: 'DO', type: 'universidad', website: 'https://www.unibe.edu.do' },
  { id: 'do-unphu', name: 'Universidad Nacional Pedro Henriquez Urena', shortName: 'UNPHU', country: 'DO', type: 'universidad', website: 'https://www.unphu.edu.do' },
  { id: 'do-apec', name: 'Universidad APEC', shortName: 'UNAPEC', country: 'DO', type: 'universidad', website: 'https://www.unapec.edu.do' },
  { id: 'do-utesa', name: 'Universidad Tecnologica de Santiago', shortName: 'UTESA', country: 'DO', type: 'universidad', website: 'https://www.utesa.edu' },
  { id: 'do-ucsd', name: 'Universidad Catolica de Santo Domingo', shortName: 'UCSD', country: 'DO', type: 'universidad', website: 'https://www.ucsd.edu.do' },
  { id: 'do-unicaribe', name: 'Universidad del Caribe', shortName: 'UNICARIBE', country: 'DO', type: 'universidad', website: 'https://www.unicaribe.edu.do' },
  { id: 'do-uce', name: 'Universidad Central del Este', shortName: 'UCE', country: 'DO', type: 'universidad', website: 'https://www.uce.edu.do' },
  { id: 'do-ufhec', name: 'Universidad Federico Henriquez y Carvajal', shortName: 'UFHEC', country: 'DO', type: 'universidad', website: 'https://www.ufhec.edu.do' },
  { id: 'do-unev', name: 'Universidad Nacional Evangelica', shortName: 'UNEV', country: 'DO', type: 'universidad', website: 'https://www.unev.edu.do' },
  { id: 'do-uod', name: 'Universidad Abierta para Adultos', shortName: 'UAPA', country: 'DO', type: 'universidad', website: 'https://www.uapa.edu.do' },
  { id: 'do-isa', name: 'Universidad ISA', shortName: 'ISA', country: 'DO', type: 'universidad', website: 'https://www.isa.edu.do' },
  { id: 'do-uafam', name: 'Universidad Agroforestal Fernando Arturo de Merino', shortName: 'UAFAM', country: 'DO', type: 'universidad', website: 'https://www.uafam.edu.do' },
  { id: 'do-ucne', name: 'Universidad Catolica Nordestana', shortName: 'UCNE', country: 'DO', type: 'universidad', website: 'https://www.ucne.edu.do' },
  { id: 'do-unnatec', name: 'Universidad Nacional Tecnologica', shortName: 'UNNATEC', country: 'DO', type: 'universidad', website: 'https://www.unnatec.edu.do' },
  { id: 'do-oym', name: 'Universidad O&M', shortName: 'O&M', country: 'DO', type: 'universidad', website: 'https://www.udoym.edu.do' },
  { id: 'do-uniremhos', name: 'Universidad Eugenio Maria de Hostos', shortName: 'UNIREMHOS', country: 'DO', type: 'universidad', website: 'https://www.uniremhos.edu.do' },
  { id: 'do-pucamaima', name: 'Universidad Catolica del Cibao', shortName: 'UCATECI', country: 'DO', type: 'universidad', website: 'https://www.ucateci.edu.do' },
];

// =============================================================================
// GUATEMALA (GT)
// =============================================================================

const GT_UNIVERSITIES: University[] = [
  { id: 'gt-usac', name: 'Universidad de San Carlos de Guatemala', shortName: 'USAC', country: 'GT', type: 'universidad', website: 'https://www.usac.edu.gt' },
  { id: 'gt-url', name: 'Universidad Rafael Landivar', shortName: 'URL', country: 'GT', type: 'universidad', website: 'https://www.url.edu.gt' },
  { id: 'gt-uvg', name: 'Universidad del Valle de Guatemala', shortName: 'UVG', country: 'GT', type: 'universidad', website: 'https://www.uvg.edu.gt' },
  { id: 'gt-ufm', name: 'Universidad Francisco Marroquin', shortName: 'UFM', country: 'GT', type: 'universidad', website: 'https://www.ufm.edu' },
  { id: 'gt-unis', name: 'Universidad del Istmo', shortName: 'UNIS', country: 'GT', type: 'universidad', website: 'https://www.unis.edu.gt' },
  { id: 'gt-umg', name: 'Universidad Mariano Galvez de Guatemala', shortName: 'UMG', country: 'GT', type: 'universidad', website: 'https://www.umg.edu.gt' },
  { id: 'gt-galileo', name: 'Universidad Galileo', shortName: 'Galileo', country: 'GT', type: 'universidad', website: 'https://www.galileo.edu' },
  { id: 'gt-upana', name: 'Universidad Panamericana de Guatemala', shortName: 'UPANA', country: 'GT', type: 'universidad', website: 'https://www.upana.edu.gt' },
  { id: 'gt-usma', name: 'Universidad Mesoamericana', shortName: 'UMES', country: 'GT', type: 'universidad', website: 'https://www.umes.edu.gt' },
  { id: 'gt-uca', name: 'Universidad Rural de Guatemala', shortName: 'URURAL', country: 'GT', type: 'universidad', website: 'https://www.urural.edu.gt' },
  { id: 'gt-uinteramericana', name: 'Universidad InterNaciones', shortName: 'UNI', country: 'GT', type: 'universidad', website: 'https://www.uni.edu.gt' },
  { id: 'gt-uda', name: 'Universidad Da Vinci de Guatemala', shortName: 'UDV', country: 'GT', type: 'universidad', website: 'https://www.udv.edu.gt' },
  { id: 'gt-cunoc', name: 'Centro Universitario de Occidente USAC', shortName: 'CUNOC', country: 'GT', type: 'universidad', website: 'https://www.cunoc.usac.edu.gt' },
  { id: 'gt-usantapaula', name: 'Universidad San Pablo de Guatemala', shortName: 'USPG', country: 'GT', type: 'universidad', website: 'https://www.uspg.edu.gt' },
  { id: 'gt-ucv', name: 'Universidad de Ciencias Comerciales', shortName: 'UCC', country: 'GT', type: 'universidad', website: 'https://www.ucc.edu.gt' },
  { id: 'gt-ectafide', name: 'Escuela de Ciencia y Tecnologia ECTAFIDE', shortName: 'ECTAFIDE', country: 'GT', type: 'instituto', website: 'https://www.ectafide.edu.gt' },
  { id: 'gt-intecap', name: 'Instituto Tecnico de Capacitacion y Productividad', shortName: 'INTECAP', country: 'GT', type: 'instituto', website: 'https://www.intecap.edu.gt' },
  { id: 'gt-usa', name: 'Universidad de San Pedro Sula', shortName: 'USAP', country: 'GT', type: 'universidad', website: 'https://www.usap.edu.gt' },
  { id: 'gt-ucaribeana', name: 'Universidad Caribena de Guatemala', shortName: 'UCG', country: 'GT', type: 'universidad', website: 'https://www.ucg.edu.gt' },
  { id: 'gt-unp', name: 'Universidad de la Paz', shortName: 'UPAZ', country: 'GT', type: 'universidad', website: 'https://www.upaz.edu.gt' },
];

// =============================================================================
// HONDURAS (HN)
// =============================================================================

const HN_UNIVERSITIES: University[] = [
  { id: 'hn-unah', name: 'Universidad Nacional Autonoma de Honduras', shortName: 'UNAH', country: 'HN', type: 'universidad', website: 'https://www.unah.edu.hn' },
  { id: 'hn-unitec', name: 'Universidad Tecnologica Centroamericana', shortName: 'UNITEC', country: 'HN', type: 'universidad', website: 'https://www.unitec.edu' },
  { id: 'hn-upnfm', name: 'Universidad Pedagogica Nacional Francisco Morazan', shortName: 'UPNFM', country: 'HN', type: 'universidad', website: 'https://www.upnfm.edu.hn' },
  { id: 'hn-zamorano', name: 'Escuela Agricola Panamericana El Zamorano', shortName: 'Zamorano', country: 'HN', type: 'universidad', website: 'https://www.zamorano.edu' },
  { id: 'hn-upi', name: 'Universidad Politecnica de Ingenieria', shortName: 'UPI', country: 'HN', type: 'universidad', website: 'https://www.upi.edu.hn' },
  { id: 'hn-ucenm', name: 'Universidad Cristiana Evangelica Nuevo Milenio', shortName: 'UCENM', country: 'HN', type: 'universidad', website: 'https://www.ucenm.edu.hn' },
  { id: 'hn-unicah', name: 'Universidad Catolica de Honduras', shortName: 'UNICAH', country: 'HN', type: 'universidad', website: 'https://www.unicah.edu' },
  { id: 'hn-utm', name: 'Universidad Tecnologica de Honduras', shortName: 'UTH', country: 'HN', type: 'universidad', website: 'https://www.uth.hn' },
  { id: 'hn-usps', name: 'Universidad de San Pedro Sula', shortName: 'USPS', country: 'HN', type: 'universidad', website: 'https://www.usps.edu.hn' },
  { id: 'hn-unag', name: 'Universidad Nacional de Agricultura', shortName: 'UNAG', country: 'HN', type: 'universidad', website: 'https://www.unag.edu.hn' },
  { id: 'hn-udn', name: 'Universidad de Defensa Nacional', shortName: 'UDN', country: 'HN', type: 'universidad', website: 'https://www.udn.edu.hn' },
  { id: 'hn-ujcv', name: 'Universidad Jose Cecilio del Valle', shortName: 'UJCV', country: 'HN', type: 'universidad', website: 'https://www.ujcv.edu.hn' },
  { id: 'hn-ceutec', name: 'CEUTEC Honduras', shortName: 'CEUTEC', country: 'HN', type: 'universidad', website: 'https://www.ceutec.edu.hn' },
  { id: 'hn-unm', name: 'Universidad Nacional de la Marina Mercante', shortName: 'UNM', country: 'HN', type: 'universidad', website: 'https://www.unm.edu.hn' },
  { id: 'hn-usap', name: 'Universidad de San Pedro y San Pablo', shortName: 'USP', country: 'HN', type: 'universidad', website: 'https://www.usp.edu.hn' },
  { id: 'hn-uah', name: 'Universidad Metropolitana de Honduras', shortName: 'UMH', country: 'HN', type: 'universidad', website: 'https://www.umh.edu.hn' },
  { id: 'hn-infop', name: 'Instituto Nacional de Formacion Profesional', shortName: 'INFOP', country: 'HN', type: 'instituto', website: 'https://www.infop.hn' },
  { id: 'hn-unah-vs', name: 'UNAH Valle de Sula', shortName: 'UNAH-VS', country: 'HN', type: 'universidad', website: 'https://www.unah.edu.hn' },
  { id: 'hn-curla', name: 'Centro Universitario Regional del Litoral Atlantico', shortName: 'CURLA', country: 'HN', type: 'universidad', website: 'https://www.unah.edu.hn' },
  { id: 'hn-udh', name: 'Universidad de Honduras', shortName: 'UDH', country: 'HN', type: 'universidad', website: 'https://www.udh.edu.hn' },
];

// =============================================================================
// EL SALVADOR (SV)
// =============================================================================

const SV_UNIVERSITIES: University[] = [
  { id: 'sv-ues', name: 'Universidad de El Salvador', shortName: 'UES', country: 'SV', type: 'universidad', website: 'https://www.ues.edu.sv' },
  { id: 'sv-uca', name: 'Universidad Centroamericana Jose Simeon Canas', shortName: 'UCA', country: 'SV', type: 'universidad', website: 'https://www.uca.edu.sv' },
  { id: 'sv-ujmd', name: 'Universidad Dr. Jose Matias Delgado', shortName: 'UJMD', country: 'SV', type: 'universidad', website: 'https://www.ujmd.edu.sv' },
  { id: 'sv-utec', name: 'Universidad Tecnologica de El Salvador', shortName: 'UTEC', country: 'SV', type: 'universidad', website: 'https://www.utec.edu.sv' },
  { id: 'sv-usam', name: 'Universidad Salvadorena Alberto Masferrer', shortName: 'USAM', country: 'SV', type: 'universidad', website: 'https://www.usam.edu.sv' },
  { id: 'sv-udb', name: 'Universidad Don Bosco', shortName: 'UDB', country: 'SV', type: 'universidad', website: 'https://www.udb.edu.sv' },
  { id: 'sv-monica', name: 'Universidad Monica Herrera', shortName: 'UMH', country: 'SV', type: 'universidad', website: 'https://www.monicaherrera.edu.sv' },
  { id: 'sv-univo', name: 'Universidad de Oriente', shortName: 'UNIVO', country: 'SV', type: 'universidad', website: 'https://www.univo.edu.sv' },
  { id: 'sv-uped', name: 'Universidad Pedagogica de El Salvador', shortName: 'UPES', country: 'SV', type: 'universidad', website: 'https://www.upes.edu.sv' },
  { id: 'sv-ufg', name: 'Universidad Francisco Gavidia', shortName: 'UFG', country: 'SV', type: 'universidad', website: 'https://www.ufg.edu.sv' },
  { id: 'sv-unicaes', name: 'Universidad Catolica de El Salvador', shortName: 'UNICAES', country: 'SV', type: 'universidad', website: 'https://www.catolica.edu.sv' },
  { id: 'sv-uees', name: 'Universidad Evangélica de El Salvador', shortName: 'UEES', country: 'SV', type: 'universidad', website: 'https://www.uees.edu.sv' },
  { id: 'sv-up', name: 'Universidad Panamericana de El Salvador', shortName: 'UPAN', country: 'SV', type: 'universidad', website: 'https://www.upan.edu.sv' },
  { id: 'sv-usonsonate', name: 'Universidad de Sonsonate', shortName: 'USO', country: 'SV', type: 'universidad', website: 'https://www.usonsonate.edu.sv' },
  { id: 'sv-andres', name: 'Universidad Andres Bello El Salvador', shortName: 'UNAB SV', country: 'SV', type: 'universidad', website: 'https://www.unab.edu.sv' },
  { id: 'sv-ean', name: 'Escuela de Artes y Negocios', shortName: 'EAN', country: 'SV', type: 'instituto', website: 'https://www.ean.edu.sv' },
  { id: 'sv-itca', name: 'Instituto Tecnologico Centroamericano', shortName: 'ITCA', country: 'SV', type: 'instituto', website: 'https://www.itca.edu.sv' },
  { id: 'sv-umodular', name: 'Universidad Modular Abierta', shortName: 'UMA', country: 'SV', type: 'universidad', website: 'https://www.uma.edu.sv' },
  { id: 'sv-ucm', name: 'Universidad Capitan General Gerardo Barrios', shortName: 'UGB', country: 'SV', type: 'universidad', website: 'https://www.ugb.edu.sv' },
  { id: 'sv-usal', name: 'Universidad de La Paz', shortName: 'ULPAZ', country: 'SV', type: 'universidad', website: 'https://www.ulpaz.edu.sv' },
];

// =============================================================================
// NICARAGUA (NI)
// =============================================================================

const NI_UNIVERSITIES: University[] = [
  { id: 'ni-unan-managua', name: 'Universidad Nacional Autonoma de Nicaragua Managua', shortName: 'UNAN-Managua', country: 'NI', type: 'universidad', website: 'https://www.unan.edu.ni' },
  { id: 'ni-unan-leon', name: 'Universidad Nacional Autonoma de Nicaragua Leon', shortName: 'UNAN-Leon', country: 'NI', type: 'universidad', website: 'https://www.unanleon.edu.ni' },
  { id: 'ni-uni', name: 'Universidad Nacional de Ingenieria', shortName: 'UNI', country: 'NI', type: 'universidad', website: 'https://www.uni.edu.ni' },
  { id: 'ni-uca', name: 'Universidad Centroamericana', shortName: 'UCA', country: 'NI', type: 'universidad', website: 'https://www.uca.edu.ni' },
  { id: 'ni-ucc', name: 'Universidad de Ciencias Comerciales', shortName: 'UCC', country: 'NI', type: 'universidad', website: 'https://www.ucc.edu.ni' },
  { id: 'ni-una', name: 'Universidad Nacional Agraria', shortName: 'UNA', country: 'NI', type: 'universidad', website: 'https://www.una.edu.ni' },
  { id: 'ni-upoli', name: 'Universidad Politecnica de Nicaragua', shortName: 'UPOLI', country: 'NI', type: 'universidad', website: 'https://www.upoli.edu.ni' },
  { id: 'ni-uam', name: 'Universidad Americana', shortName: 'UAM', country: 'NI', type: 'universidad', website: 'https://www.uam.edu.ni' },
  { id: 'ni-unica', name: 'Universidad de las Regiones Autonomas de la Costa Caribe Nicaraguense', shortName: 'URACCAN', country: 'NI', type: 'universidad', website: 'https://www.uraccan.edu.ni' },
  { id: 'ni-uhispam', name: 'Universidad Hispanoamericana', shortName: 'UHISPAM', country: 'NI', type: 'universidad', website: 'https://www.uhispam.edu.ni' },
  { id: 'ni-bicu', name: 'Bluefields Indian and Caribbean University', shortName: 'BICU', country: 'NI', type: 'university', website: 'https://www.bicu.edu.ni' },
  { id: 'ni-uth', name: 'Universidad Thomas More', shortName: 'UTM', country: 'NI', type: 'universidad', website: 'https://www.utm.edu.ni' },
  { id: 'ni-uniav', name: 'Universidad Internacional para el Desarrollo', shortName: 'UNID', country: 'NI', type: 'universidad', website: 'https://www.unid.edu.ni' },
  { id: 'ni-ulam', name: 'Universidad Latinoamericana de Managua', shortName: 'ULAM', country: 'NI', type: 'universidad', website: 'https://www.ulam.edu.ni' },
  { id: 'ni-ucyt', name: 'Universidad de Ciencias y Tecnologia', shortName: 'UCyT', country: 'NI', type: 'universidad', website: 'https://www.ucyt.edu.ni' },
  { id: 'ni-keiser', name: 'Keiser University Nicaragua', shortName: 'Keiser', country: 'NI', type: 'university', website: 'https://www.keiseruniversity.edu.ni' },
  { id: 'ni-unicit', name: 'Universidad Iberoamericana de Ciencia y Tecnologia', shortName: 'UNICIT', country: 'NI', type: 'universidad', website: 'https://www.unicit.edu.ni' },
  { id: 'ni-uenic', name: 'Universidad Evangelica Nicaraguense', shortName: 'UENIC', country: 'NI', type: 'universidad', website: 'https://www.uenic.edu.ni' },
  { id: 'ni-ucm', name: 'Universidad Cristiana de las Asambleas de Dios', shortName: 'UCAD', country: 'NI', type: 'universidad', website: 'https://www.ucad.edu.ni' },
  { id: 'ni-inatec', name: 'Instituto Nacional Tecnologico', shortName: 'INATEC', country: 'NI', type: 'instituto', website: 'https://www.inatec.edu.ni' },
];

// =============================================================================
// UNITED STATES (US)
// =============================================================================

const US_UNIVERSITIES: University[] = [
  { id: 'us-mit', name: 'Massachusetts Institute of Technology', shortName: 'MIT', country: 'US', type: 'university', website: 'https://www.mit.edu', newsUrl: 'https://news.mit.edu' },
  { id: 'us-stanford', name: 'Stanford University', shortName: 'Stanford', country: 'US', type: 'university', website: 'https://www.stanford.edu', newsUrl: 'https://news.stanford.edu' },
  { id: 'us-harvard', name: 'Harvard University', shortName: 'Harvard', country: 'US', type: 'university', website: 'https://www.harvard.edu', newsUrl: 'https://news.harvard.edu' },
  { id: 'us-caltech', name: 'California Institute of Technology', shortName: 'Caltech', country: 'US', type: 'university', website: 'https://www.caltech.edu' },
  { id: 'us-princeton', name: 'Princeton University', shortName: 'Princeton', country: 'US', type: 'university', website: 'https://www.princeton.edu' },
  { id: 'us-yale', name: 'Yale University', shortName: 'Yale', country: 'US', type: 'university', website: 'https://www.yale.edu' },
  { id: 'us-columbia', name: 'Columbia University', shortName: 'Columbia', country: 'US', type: 'university', website: 'https://www.columbia.edu' },
  { id: 'us-uchicago', name: 'University of Chicago', shortName: 'UChicago', country: 'US', type: 'university', website: 'https://www.uchicago.edu' },
  { id: 'us-upenn', name: 'University of Pennsylvania', shortName: 'UPenn', country: 'US', type: 'university', website: 'https://www.upenn.edu' },
  { id: 'us-berkeley', name: 'University of California Berkeley', shortName: 'UC Berkeley', country: 'US', type: 'university', website: 'https://www.berkeley.edu' },
  { id: 'us-ucla', name: 'University of California Los Angeles', shortName: 'UCLA', country: 'US', type: 'university', website: 'https://www.ucla.edu' },
  { id: 'us-umich', name: 'University of Michigan', shortName: 'UMich', country: 'US', type: 'university', website: 'https://www.umich.edu' },
  { id: 'us-nyu', name: 'New York University', shortName: 'NYU', country: 'US', type: 'university', website: 'https://www.nyu.edu' },
  { id: 'us-cornell', name: 'Cornell University', shortName: 'Cornell', country: 'US', type: 'university', website: 'https://www.cornell.edu' },
  { id: 'us-duke', name: 'Duke University', shortName: 'Duke', country: 'US', type: 'university', website: 'https://www.duke.edu' },
  { id: 'us-jhu', name: 'Johns Hopkins University', shortName: 'JHU', country: 'US', type: 'university', website: 'https://www.jhu.edu' },
  { id: 'us-northwestern', name: 'Northwestern University', shortName: 'Northwestern', country: 'US', type: 'university', website: 'https://www.northwestern.edu' },
  { id: 'us-cmu', name: 'Carnegie Mellon University', shortName: 'CMU', country: 'US', type: 'university', website: 'https://www.cmu.edu' },
  { id: 'us-gatech', name: 'Georgia Institute of Technology', shortName: 'Georgia Tech', country: 'US', type: 'university', website: 'https://www.gatech.edu' },
  { id: 'us-uiuc', name: 'University of Illinois Urbana-Champaign', shortName: 'UIUC', country: 'US', type: 'university', website: 'https://www.illinois.edu' },
];

// =============================================================================
// CANADA (CA)
// =============================================================================

const CA_UNIVERSITIES: University[] = [
  { id: 'ca-utoronto', name: 'University of Toronto', shortName: 'UofT', country: 'CA', type: 'university', website: 'https://www.utoronto.ca' },
  { id: 'ca-ubc', name: 'University of British Columbia', shortName: 'UBC', country: 'CA', type: 'university', website: 'https://www.ubc.ca' },
  { id: 'ca-mcgill', name: 'McGill University', shortName: 'McGill', country: 'CA', type: 'university', website: 'https://www.mcgill.ca' },
  { id: 'ca-uwaterloo', name: 'University of Waterloo', shortName: 'UWaterloo', country: 'CA', type: 'university', website: 'https://www.uwaterloo.ca' },
  { id: 'ca-ualberta', name: 'University of Alberta', shortName: 'UAlberta', country: 'CA', type: 'university', website: 'https://www.ualberta.ca' },
  { id: 'ca-umontreal', name: 'Universite de Montreal', shortName: 'UdeM', country: 'CA', type: 'university', website: 'https://www.umontreal.ca' },
  { id: 'ca-mcmaster', name: 'McMaster University', shortName: 'McMaster', country: 'CA', type: 'university', website: 'https://www.mcmaster.ca' },
  { id: 'ca-uottawa', name: 'University of Ottawa', shortName: 'uOttawa', country: 'CA', type: 'university', website: 'https://www.uottawa.ca' },
  { id: 'ca-western', name: 'Western University', shortName: 'Western', country: 'CA', type: 'university', website: 'https://www.uwo.ca' },
  { id: 'ca-queens', name: "Queen's University", shortName: "Queen's", country: 'CA', type: 'university', website: 'https://www.queensu.ca' },
  { id: 'ca-ucalgary', name: 'University of Calgary', shortName: 'UCalgary', country: 'CA', type: 'university', website: 'https://www.ucalgary.ca' },
  { id: 'ca-dalhousie', name: 'Dalhousie University', shortName: 'Dal', country: 'CA', type: 'university', website: 'https://www.dal.ca' },
  { id: 'ca-simon-fraser', name: 'Simon Fraser University', shortName: 'SFU', country: 'CA', type: 'university', website: 'https://www.sfu.ca' },
  { id: 'ca-laval', name: 'Universite Laval', shortName: 'ULaval', country: 'CA', type: 'university', website: 'https://www.ulaval.ca' },
  { id: 'ca-uvic', name: 'University of Victoria', shortName: 'UVic', country: 'CA', type: 'university', website: 'https://www.uvic.ca' },
  { id: 'ca-york', name: 'York University', shortName: 'York', country: 'CA', type: 'university', website: 'https://www.yorku.ca' },
  { id: 'ca-concordia', name: 'Concordia University', shortName: 'Concordia', country: 'CA', type: 'university', website: 'https://www.concordia.ca' },
  { id: 'ca-usherbrooke', name: 'Universite de Sherbrooke', shortName: 'USherbrooke', country: 'CA', type: 'university', website: 'https://www.usherbrooke.ca' },
  { id: 'ca-umanitoba', name: 'University of Manitoba', shortName: 'UManitoba', country: 'CA', type: 'university', website: 'https://www.umanitoba.ca' },
  { id: 'ca-usask', name: 'University of Saskatchewan', shortName: 'USask', country: 'CA', type: 'university', website: 'https://www.usask.ca' },
];

// =============================================================================
// UNITED KINGDOM (GB)
// =============================================================================

const GB_UNIVERSITIES: University[] = [
  { id: 'gb-oxford', name: 'University of Oxford', shortName: 'Oxford', country: 'GB', type: 'university', website: 'https://www.ox.ac.uk' },
  { id: 'gb-cambridge', name: 'University of Cambridge', shortName: 'Cambridge', country: 'GB', type: 'university', website: 'https://www.cam.ac.uk' },
  { id: 'gb-imperial', name: 'Imperial College London', shortName: 'Imperial', country: 'GB', type: 'university', website: 'https://www.imperial.ac.uk' },
  { id: 'gb-ucl', name: 'University College London', shortName: 'UCL', country: 'GB', type: 'university', website: 'https://www.ucl.ac.uk' },
  { id: 'gb-lse', name: 'London School of Economics and Political Science', shortName: 'LSE', country: 'GB', type: 'university', website: 'https://www.lse.ac.uk' },
  { id: 'gb-edinburgh', name: 'University of Edinburgh', shortName: 'Edinburgh', country: 'GB', type: 'university', website: 'https://www.ed.ac.uk' },
  { id: 'gb-kcl', name: "King's College London", shortName: 'KCL', country: 'GB', type: 'university', website: 'https://www.kcl.ac.uk' },
  { id: 'gb-manchester', name: 'University of Manchester', shortName: 'Manchester', country: 'GB', type: 'university', website: 'https://www.manchester.ac.uk' },
  { id: 'gb-bristol', name: 'University of Bristol', shortName: 'Bristol', country: 'GB', type: 'university', website: 'https://www.bristol.ac.uk' },
  { id: 'gb-warwick', name: 'University of Warwick', shortName: 'Warwick', country: 'GB', type: 'university', website: 'https://www.warwick.ac.uk' },
  { id: 'gb-glasgow', name: 'University of Glasgow', shortName: 'Glasgow', country: 'GB', type: 'university', website: 'https://www.gla.ac.uk' },
  { id: 'gb-durham', name: 'Durham University', shortName: 'Durham', country: 'GB', type: 'university', website: 'https://www.durham.ac.uk' },
  { id: 'gb-birmingham', name: 'University of Birmingham', shortName: 'Birmingham', country: 'GB', type: 'university', website: 'https://www.birmingham.ac.uk' },
  { id: 'gb-leeds', name: 'University of Leeds', shortName: 'Leeds', country: 'GB', type: 'university', website: 'https://www.leeds.ac.uk' },
  { id: 'gb-sheffield', name: 'University of Sheffield', shortName: 'Sheffield', country: 'GB', type: 'university', website: 'https://www.sheffield.ac.uk' },
  { id: 'gb-nottingham', name: 'University of Nottingham', shortName: 'Nottingham', country: 'GB', type: 'university', website: 'https://www.nottingham.ac.uk' },
  { id: 'gb-southampton', name: 'University of Southampton', shortName: 'Southampton', country: 'GB', type: 'university', website: 'https://www.southampton.ac.uk' },
  { id: 'gb-standrews', name: 'University of St Andrews', shortName: 'St Andrews', country: 'GB', type: 'university', website: 'https://www.st-andrews.ac.uk' },
  { id: 'gb-exeter', name: 'University of Exeter', shortName: 'Exeter', country: 'GB', type: 'university', website: 'https://www.exeter.ac.uk' },
  { id: 'gb-bath', name: 'University of Bath', shortName: 'Bath', country: 'GB', type: 'university', website: 'https://www.bath.ac.uk' },
];

// =============================================================================
// SPAIN (ES)
// =============================================================================

const ES_UNIVERSITIES: University[] = [
  { id: 'es-ub', name: 'Universitat de Barcelona', shortName: 'UB', country: 'ES', type: 'universidad', website: 'https://www.ub.edu' },
  { id: 'es-uam', name: 'Universidad Autonoma de Madrid', shortName: 'UAM', country: 'ES', type: 'universidad', website: 'https://www.uam.es' },
  { id: 'es-ucm', name: 'Universidad Complutense de Madrid', shortName: 'UCM', country: 'ES', type: 'universidad', website: 'https://www.ucm.es' },
  { id: 'es-uab', name: 'Universitat Autonoma de Barcelona', shortName: 'UAB', country: 'ES', type: 'universidad', website: 'https://www.uab.cat' },
  { id: 'es-upf', name: 'Universitat Pompeu Fabra', shortName: 'UPF', country: 'ES', type: 'universidad', website: 'https://www.upf.edu' },
  { id: 'es-uc3m', name: 'Universidad Carlos III de Madrid', shortName: 'UC3M', country: 'ES', type: 'universidad', website: 'https://www.uc3m.es' },
  { id: 'es-unav', name: 'Universidad de Navarra', shortName: 'UNAV', country: 'ES', type: 'universidad', website: 'https://www.unav.edu' },
  { id: 'es-ie', name: 'IE University', shortName: 'IE', country: 'ES', type: 'university', website: 'https://www.ie.edu' },
  { id: 'es-esade', name: 'ESADE Business School', shortName: 'ESADE', country: 'ES', type: 'university', website: 'https://www.esade.edu' },
  { id: 'es-upc', name: 'Universitat Politecnica de Catalunya', shortName: 'UPC', country: 'ES', type: 'universidad', website: 'https://www.upc.edu' },
  { id: 'es-upm', name: 'Universidad Politecnica de Madrid', shortName: 'UPM', country: 'ES', type: 'universidad', website: 'https://www.upm.es' },
  { id: 'es-uv', name: 'Universitat de Valencia', shortName: 'UV', country: 'ES', type: 'universidad', website: 'https://www.uv.es' },
  { id: 'es-ugr', name: 'Universidad de Granada', shortName: 'UGR', country: 'ES', type: 'universidad', website: 'https://www.ugr.es' },
  { id: 'es-us', name: 'Universidad de Sevilla', shortName: 'US', country: 'ES', type: 'universidad', website: 'https://www.us.es' },
  { id: 'es-ehu', name: 'Universidad del Pais Vasco', shortName: 'UPV/EHU', country: 'ES', type: 'universidad', website: 'https://www.ehu.eus' },
  { id: 'es-usal', name: 'Universidad de Salamanca', shortName: 'USAL', country: 'ES', type: 'universidad', website: 'https://www.usal.es' },
  { id: 'es-uz', name: 'Universidad de Zaragoza', shortName: 'UNIZAR', country: 'ES', type: 'universidad', website: 'https://www.unizar.es' },
  { id: 'es-usc', name: 'Universidade de Santiago de Compostela', shortName: 'USC', country: 'ES', type: 'universidad', website: 'https://www.usc.gal' },
  { id: 'es-deusto', name: 'Universidad de Deusto', shortName: 'Deusto', country: 'ES', type: 'universidad', website: 'https://www.deusto.es' },
  { id: 'es-comillas', name: 'Universidad Pontificia Comillas', shortName: 'Comillas', country: 'ES', type: 'universidad', website: 'https://www.comillas.edu' },
];

// =============================================================================
// GERMANY (DE)
// =============================================================================

const DE_UNIVERSITIES: University[] = [
  { id: 'de-lmu', name: 'Ludwig-Maximilians-Universitat Munchen', shortName: 'LMU', country: 'DE', type: 'university', website: 'https://www.lmu.de' },
  { id: 'de-tum', name: 'Technische Universitat Munchen', shortName: 'TUM', country: 'DE', type: 'university', website: 'https://www.tum.de' },
  { id: 'de-heidelberg', name: 'Ruprecht-Karls-Universitat Heidelberg', shortName: 'Heidelberg', country: 'DE', type: 'university', website: 'https://www.uni-heidelberg.de' },
  { id: 'de-hu-berlin', name: 'Humboldt-Universitat zu Berlin', shortName: 'HU Berlin', country: 'DE', type: 'university', website: 'https://www.hu-berlin.de' },
  { id: 'de-fu-berlin', name: 'Freie Universitat Berlin', shortName: 'FU Berlin', country: 'DE', type: 'university', website: 'https://www.fu-berlin.de' },
  { id: 'de-rwth', name: 'RWTH Aachen University', shortName: 'RWTH', country: 'DE', type: 'university', website: 'https://www.rwth-aachen.de' },
  { id: 'de-kit', name: 'Karlsruher Institut fur Technologie', shortName: 'KIT', country: 'DE', type: 'university', website: 'https://www.kit.edu' },
  { id: 'de-freiburg', name: 'Albert-Ludwigs-Universitat Freiburg', shortName: 'Freiburg', country: 'DE', type: 'university', website: 'https://www.uni-freiburg.de' },
  { id: 'de-gottingen', name: 'Georg-August-Universitat Gottingen', shortName: 'Gottingen', country: 'DE', type: 'university', website: 'https://www.uni-goettingen.de' },
  { id: 'de-tubingen', name: 'Eberhard Karls Universitat Tubingen', shortName: 'Tubingen', country: 'DE', type: 'university', website: 'https://www.uni-tuebingen.de' },
  { id: 'de-bonn', name: 'Rheinische Friedrich-Wilhelms-Universitat Bonn', shortName: 'Bonn', country: 'DE', type: 'university', website: 'https://www.uni-bonn.de' },
  { id: 'de-tu-berlin', name: 'Technische Universitat Berlin', shortName: 'TU Berlin', country: 'DE', type: 'university', website: 'https://www.tu-berlin.de' },
  { id: 'de-hamburg', name: 'Universitat Hamburg', shortName: 'UHH', country: 'DE', type: 'university', website: 'https://www.uni-hamburg.de' },
  { id: 'de-tu-dresden', name: 'Technische Universitat Dresden', shortName: 'TU Dresden', country: 'DE', type: 'university', website: 'https://www.tu-dresden.de' },
  { id: 'de-koln', name: 'Universitat zu Koln', shortName: 'Koln', country: 'DE', type: 'university', website: 'https://www.uni-koeln.de' },
  { id: 'de-munster', name: 'Westfalische Wilhelms-Universitat Munster', shortName: 'WWU', country: 'DE', type: 'university', website: 'https://www.uni-muenster.de' },
  { id: 'de-stuttgart', name: 'Universitat Stuttgart', shortName: 'Stuttgart', country: 'DE', type: 'university', website: 'https://www.uni-stuttgart.de' },
  { id: 'de-frankfurt', name: 'Goethe-Universitat Frankfurt', shortName: 'GU Frankfurt', country: 'DE', type: 'university', website: 'https://www.uni-frankfurt.de' },
  { id: 'de-mannheim', name: 'Universitat Mannheim', shortName: 'Mannheim', country: 'DE', type: 'university', website: 'https://www.uni-mannheim.de' },
  { id: 'de-erlangen', name: 'Friedrich-Alexander-Universitat Erlangen-Nurnberg', shortName: 'FAU', country: 'DE', type: 'university', website: 'https://www.fau.de' },
];

// =============================================================================
// FRANCE (FR)
// =============================================================================

const FR_UNIVERSITIES: University[] = [
  { id: 'fr-paris-saclay', name: 'Universite Paris-Saclay', shortName: 'Paris-Saclay', country: 'FR', type: 'university', website: 'https://www.universite-paris-saclay.fr' },
  { id: 'fr-sorbonne', name: 'Sorbonne Universite', shortName: 'Sorbonne', country: 'FR', type: 'university', website: 'https://www.sorbonne-universite.fr' },
  { id: 'fr-psl', name: 'Universite PSL', shortName: 'PSL', country: 'FR', type: 'university', website: 'https://www.psl.eu' },
  { id: 'fr-polytechnique', name: 'Ecole Polytechnique', shortName: 'X', country: 'FR', type: 'university', website: 'https://www.polytechnique.edu' },
  { id: 'fr-ens', name: 'Ecole Normale Superieure Paris', shortName: 'ENS', country: 'FR', type: 'university', website: 'https://www.ens.psl.eu' },
  { id: 'fr-hec', name: 'HEC Paris', shortName: 'HEC', country: 'FR', type: 'university', website: 'https://www.hec.edu' },
  { id: 'fr-sciencespo', name: 'Sciences Po', shortName: 'Sciences Po', country: 'FR', type: 'university', website: 'https://www.sciencespo.fr' },
  { id: 'fr-centralesupelec', name: 'CentraleSupelec', shortName: 'CS', country: 'FR', type: 'university', website: 'https://www.centralesupelec.fr' },
  { id: 'fr-insead', name: 'INSEAD', shortName: 'INSEAD', country: 'FR', type: 'university', website: 'https://www.insead.edu' },
  { id: 'fr-lyon', name: 'Universite de Lyon', shortName: 'UdL', country: 'FR', type: 'university', website: 'https://www.universite-lyon.fr' },
  { id: 'fr-grenoble', name: 'Universite Grenoble Alpes', shortName: 'UGA', country: 'FR', type: 'university', website: 'https://www.univ-grenoble-alpes.fr' },
  { id: 'fr-strasbourg', name: 'Universite de Strasbourg', shortName: 'Unistra', country: 'FR', type: 'university', website: 'https://www.unistra.fr' },
  { id: 'fr-bordeaux', name: 'Universite de Bordeaux', shortName: 'UBx', country: 'FR', type: 'university', website: 'https://www.u-bordeaux.fr' },
  { id: 'fr-montpellier', name: 'Universite de Montpellier', shortName: 'UM', country: 'FR', type: 'university', website: 'https://www.umontpellier.fr' },
  { id: 'fr-aix-marseille', name: 'Aix-Marseille Universite', shortName: 'AMU', country: 'FR', type: 'university', website: 'https://www.univ-amu.fr' },
  { id: 'fr-toulouse', name: 'Universite de Toulouse', shortName: 'UT', country: 'FR', type: 'university', website: 'https://www.univ-toulouse.fr' },
  { id: 'fr-nantes', name: 'Nantes Universite', shortName: 'Nantes U', country: 'FR', type: 'university', website: 'https://www.univ-nantes.fr' },
  { id: 'fr-mines', name: 'Mines ParisTech', shortName: 'Mines', country: 'FR', type: 'university', website: 'https://www.minesparis.psl.eu' },
  { id: 'fr-essec', name: 'ESSEC Business School', shortName: 'ESSEC', country: 'FR', type: 'university', website: 'https://www.essec.edu' },
  { id: 'fr-ponts', name: 'Ecole des Ponts ParisTech', shortName: 'Ponts', country: 'FR', type: 'university', website: 'https://www.ecoledesponts.fr' },
];

// =============================================================================
// ITALY (IT)
// =============================================================================

const IT_UNIVERSITIES: University[] = [
  { id: 'it-polimi', name: 'Politecnico di Milano', shortName: 'PoliMi', country: 'IT', type: 'university', website: 'https://www.polimi.it' },
  { id: 'it-unibo', name: 'Universita di Bologna', shortName: 'UNIBO', country: 'IT', type: 'university', website: 'https://www.unibo.it' },
  { id: 'it-sapienza', name: 'Sapienza Universita di Roma', shortName: 'Sapienza', country: 'IT', type: 'university', website: 'https://www.uniroma1.it' },
  { id: 'it-polito', name: 'Politecnico di Torino', shortName: 'PoliTo', country: 'IT', type: 'university', website: 'https://www.polito.it' },
  { id: 'it-unimi', name: 'Universita degli Studi di Milano', shortName: 'UniMi', country: 'IT', type: 'university', website: 'https://www.unimi.it' },
  { id: 'it-padova', name: 'Universita degli Studi di Padova', shortName: 'UniPD', country: 'IT', type: 'university', website: 'https://www.unipd.it' },
  { id: 'it-bocconi', name: 'Universita Bocconi', shortName: 'Bocconi', country: 'IT', type: 'university', website: 'https://www.unibocconi.it' },
  { id: 'it-pisa', name: 'Universita di Pisa', shortName: 'UniPi', country: 'IT', type: 'university', website: 'https://www.unipi.it' },
  { id: 'it-firenze', name: 'Universita degli Studi di Firenze', shortName: 'UniFI', country: 'IT', type: 'university', website: 'https://www.unifi.it' },
  { id: 'it-napoli', name: 'Universita degli Studi di Napoli Federico II', shortName: 'UniNA', country: 'IT', type: 'university', website: 'https://www.unina.it' },
  { id: 'it-torino', name: 'Universita degli Studi di Torino', shortName: 'UniTO', country: 'IT', type: 'university', website: 'https://www.unito.it' },
  { id: 'it-trento', name: 'Universita degli Studi di Trento', shortName: 'UniTN', country: 'IT', type: 'university', website: 'https://www.unitn.it' },
  { id: 'it-roma-tor-vergata', name: 'Universita di Roma Tor Vergata', shortName: 'Tor Vergata', country: 'IT', type: 'university', website: 'https://www.uniroma2.it' },
  { id: 'it-cattolica', name: 'Universita Cattolica del Sacro Cuore', shortName: 'Cattolica', country: 'IT', type: 'university', website: 'https://www.unicatt.it' },
  { id: 'it-genova', name: 'Universita degli Studi di Genova', shortName: 'UniGe', country: 'IT', type: 'university', website: 'https://www.unige.it' },
  { id: 'it-sns', name: 'Scuola Normale Superiore', shortName: 'SNS', country: 'IT', type: 'university', website: 'https://www.sns.it' },
  { id: 'it-sissa', name: 'Scuola Internazionale Superiore di Studi Avanzati', shortName: 'SISSA', country: 'IT', type: 'university', website: 'https://www.sissa.it' },
  { id: 'it-luiss', name: 'LUISS Guido Carli', shortName: 'LUISS', country: 'IT', type: 'university', website: 'https://www.luiss.it' },
  { id: 'it-bicocca', name: 'Universita degli Studi di Milano-Bicocca', shortName: 'UniMiB', country: 'IT', type: 'university', website: 'https://www.unimib.it' },
  { id: 'it-siena', name: 'Universita degli Studi di Siena', shortName: 'UniSI', country: 'IT', type: 'university', website: 'https://www.unisi.it' },
];

// =============================================================================
// PORTUGAL (PT)
// =============================================================================

const PT_UNIVERSITIES: University[] = [
  { id: 'pt-ulisboa', name: 'Universidade de Lisboa', shortName: 'ULisboa', country: 'PT', type: 'university', website: 'https://www.ulisboa.pt' },
  { id: 'pt-uporto', name: 'Universidade do Porto', shortName: 'UPorto', country: 'PT', type: 'university', website: 'https://www.up.pt' },
  { id: 'pt-nova', name: 'Universidade NOVA de Lisboa', shortName: 'NOVA', country: 'PT', type: 'university', website: 'https://www.unl.pt' },
  { id: 'pt-coimbra', name: 'Universidade de Coimbra', shortName: 'UC', country: 'PT', type: 'university', website: 'https://www.uc.pt' },
  { id: 'pt-uminho', name: 'Universidade do Minho', shortName: 'UMinho', country: 'PT', type: 'university', website: 'https://www.uminho.pt' },
  { id: 'pt-ist', name: 'Instituto Superior Tecnico', shortName: 'IST', country: 'PT', type: 'institute', website: 'https://tecnico.ulisboa.pt' },
  { id: 'pt-uaveiro', name: 'Universidade de Aveiro', shortName: 'UA', country: 'PT', type: 'university', website: 'https://www.ua.pt' },
  { id: 'pt-iscte', name: 'ISCTE - Instituto Universitario de Lisboa', shortName: 'ISCTE', country: 'PT', type: 'university', website: 'https://www.iscte-iul.pt' },
  { id: 'pt-ucp', name: 'Universidade Catolica Portuguesa', shortName: 'UCP', country: 'PT', type: 'university', website: 'https://www.ucp.pt' },
  { id: 'pt-ubi', name: 'Universidade da Beira Interior', shortName: 'UBI', country: 'PT', type: 'university', website: 'https://www.ubi.pt' },
  { id: 'pt-ualg', name: 'Universidade do Algarve', shortName: 'UAlg', country: 'PT', type: 'university', website: 'https://www.ualg.pt' },
  { id: 'pt-utad', name: 'Universidade de Tras-os-Montes e Alto Douro', shortName: 'UTAD', country: 'PT', type: 'university', website: 'https://www.utad.pt' },
  { id: 'pt-uevora', name: 'Universidade de Evora', shortName: 'UEvora', country: 'PT', type: 'university', website: 'https://www.uevora.pt' },
  { id: 'pt-ulusofona', name: 'Universidade Lusofona', shortName: 'Lusofona', country: 'PT', type: 'university', website: 'https://www.ulusofona.pt' },
  { id: 'pt-ulusitana', name: 'Universidade Lusitana', shortName: 'Lusitana', country: 'PT', type: 'university', website: 'https://www.lis.ulusiada.pt' },
  { id: 'pt-iseg', name: 'ISEG - Lisbon School of Economics and Management', shortName: 'ISEG', country: 'PT', type: 'university', website: 'https://www.iseg.ulisboa.pt' },
  { id: 'pt-feup', name: 'Faculdade de Engenharia da Universidade do Porto', shortName: 'FEUP', country: 'PT', type: 'university', website: 'https://www.fe.up.pt' },
  { id: 'pt-ipp', name: 'Instituto Politecnico do Porto', shortName: 'IPP', country: 'PT', type: 'institute', website: 'https://www.ipp.pt' },
  { id: 'pt-novasbe', name: 'Nova School of Business and Economics', shortName: 'Nova SBE', country: 'PT', type: 'university', website: 'https://www.novasbe.unl.pt' },
  { id: 'pt-uacores', name: 'Universidade dos Acores', shortName: 'UAcores', country: 'PT', type: 'university', website: 'https://www.uac.pt' },
];

// =============================================================================
// JAPAN (JP)
// =============================================================================

const JP_UNIVERSITIES: University[] = [
  { id: 'jp-utokyo', name: 'University of Tokyo', shortName: 'UTokyo', country: 'JP', type: 'university', website: 'https://www.u-tokyo.ac.jp' },
  { id: 'jp-kyoto', name: 'Kyoto University', shortName: 'KyotoU', country: 'JP', type: 'university', website: 'https://www.kyoto-u.ac.jp' },
  { id: 'jp-osaka', name: 'Osaka University', shortName: 'OsakaU', country: 'JP', type: 'university', website: 'https://www.osaka-u.ac.jp' },
  { id: 'jp-tohoku', name: 'Tohoku University', shortName: 'TohokuU', country: 'JP', type: 'university', website: 'https://www.tohoku.ac.jp' },
  { id: 'jp-titech', name: 'Tokyo Institute of Technology', shortName: 'Tokyo Tech', country: 'JP', type: 'university', website: 'https://www.titech.ac.jp' },
  { id: 'jp-nagoya', name: 'Nagoya University', shortName: 'NagoyaU', country: 'JP', type: 'university', website: 'https://www.nagoya-u.ac.jp' },
  { id: 'jp-hokkaido', name: 'Hokkaido University', shortName: 'HokkaidoU', country: 'JP', type: 'university', website: 'https://www.hokudai.ac.jp' },
  { id: 'jp-kyushu', name: 'Kyushu University', shortName: 'KyushuU', country: 'JP', type: 'university', website: 'https://www.kyushu-u.ac.jp' },
  { id: 'jp-keio', name: 'Keio University', shortName: 'Keio', country: 'JP', type: 'university', website: 'https://www.keio.ac.jp' },
  { id: 'jp-waseda', name: 'Waseda University', shortName: 'Waseda', country: 'JP', type: 'university', website: 'https://www.waseda.jp' },
  { id: 'jp-tsukuba', name: 'University of Tsukuba', shortName: 'Tsukuba', country: 'JP', type: 'university', website: 'https://www.tsukuba.ac.jp' },
  { id: 'jp-kobe', name: 'Kobe University', shortName: 'KobeU', country: 'JP', type: 'university', website: 'https://www.kobe-u.ac.jp' },
  { id: 'jp-hiroshima', name: 'Hiroshima University', shortName: 'HiroshimaU', country: 'JP', type: 'university', website: 'https://www.hiroshima-u.ac.jp' },
  { id: 'jp-chiba', name: 'Chiba University', shortName: 'ChibaU', country: 'JP', type: 'university', website: 'https://www.chiba-u.ac.jp' },
  { id: 'jp-sophia', name: 'Sophia University', shortName: 'Sophia', country: 'JP', type: 'university', website: 'https://www.sophia.ac.jp' },
  { id: 'jp-meiji', name: 'Meiji University', shortName: 'Meiji', country: 'JP', type: 'university', website: 'https://www.meiji.ac.jp' },
  { id: 'jp-ritsumei', name: 'Ritsumeikan University', shortName: 'Ritsumei', country: 'JP', type: 'university', website: 'https://www.ritsumei.ac.jp' },
  { id: 'jp-doshisha', name: 'Doshisha University', shortName: 'Doshisha', country: 'JP', type: 'university', website: 'https://www.doshisha.ac.jp' },
  { id: 'jp-icu', name: 'International Christian University', shortName: 'ICU', country: 'JP', type: 'university', website: 'https://www.icu.ac.jp' },
  { id: 'jp-kanazawa', name: 'Kanazawa University', shortName: 'KanazawaU', country: 'JP', type: 'university', website: 'https://www.kanazawa-u.ac.jp' },
];

// =============================================================================
// SOUTH KOREA (KR)
// =============================================================================

const KR_UNIVERSITIES: University[] = [
  { id: 'kr-snu', name: 'Seoul National University', shortName: 'SNU', country: 'KR', type: 'university', website: 'https://www.snu.ac.kr' },
  { id: 'kr-kaist', name: 'Korea Advanced Institute of Science and Technology', shortName: 'KAIST', country: 'KR', type: 'university', website: 'https://www.kaist.ac.kr' },
  { id: 'kr-postech', name: 'Pohang University of Science and Technology', shortName: 'POSTECH', country: 'KR', type: 'university', website: 'https://www.postech.ac.kr' },
  { id: 'kr-yonsei', name: 'Yonsei University', shortName: 'Yonsei', country: 'KR', type: 'university', website: 'https://www.yonsei.ac.kr' },
  { id: 'kr-korea', name: 'Korea University', shortName: 'KU', country: 'KR', type: 'university', website: 'https://www.korea.ac.kr' },
  { id: 'kr-skku', name: 'Sungkyunkwan University', shortName: 'SKKU', country: 'KR', type: 'university', website: 'https://www.skku.edu' },
  { id: 'kr-hanyang', name: 'Hanyang University', shortName: 'Hanyang', country: 'KR', type: 'university', website: 'https://www.hanyang.ac.kr' },
  { id: 'kr-sogang', name: 'Sogang University', shortName: 'Sogang', country: 'KR', type: 'university', website: 'https://www.sogang.ac.kr' },
  { id: 'kr-kyunghee', name: 'Kyung Hee University', shortName: 'KHU', country: 'KR', type: 'university', website: 'https://www.khu.ac.kr' },
  { id: 'kr-ewha', name: 'Ewha Womans University', shortName: 'Ewha', country: 'KR', type: 'university', website: 'https://www.ewha.ac.kr' },
  { id: 'kr-cau', name: 'Chung-Ang University', shortName: 'CAU', country: 'KR', type: 'university', website: 'https://www.cau.ac.kr' },
  { id: 'kr-inha', name: 'Inha University', shortName: 'Inha', country: 'KR', type: 'university', website: 'https://www.inha.ac.kr' },
  { id: 'kr-ajou', name: 'Ajou University', shortName: 'Ajou', country: 'KR', type: 'university', website: 'https://www.ajou.ac.kr' },
  { id: 'kr-pusan', name: 'Pusan National University', shortName: 'PNU', country: 'KR', type: 'university', website: 'https://www.pusan.ac.kr' },
  { id: 'kr-gist', name: 'Gwangju Institute of Science and Technology', shortName: 'GIST', country: 'KR', type: 'university', website: 'https://www.gist.ac.kr' },
  { id: 'kr-unist', name: 'Ulsan National Institute of Science and Technology', shortName: 'UNIST', country: 'KR', type: 'university', website: 'https://www.unist.ac.kr' },
  { id: 'kr-konkuk', name: 'Konkuk University', shortName: 'Konkuk', country: 'KR', type: 'university', website: 'https://www.konkuk.ac.kr' },
  { id: 'kr-dongguk', name: 'Dongguk University', shortName: 'Dongguk', country: 'KR', type: 'university', website: 'https://www.dongguk.edu' },
  { id: 'kr-sejong', name: 'Sejong University', shortName: 'Sejong', country: 'KR', type: 'university', website: 'https://www.sejong.ac.kr' },
  { id: 'kr-hankuk', name: 'Hankuk University of Foreign Studies', shortName: 'HUFS', country: 'KR', type: 'university', website: 'https://www.hufs.ac.kr' },
];

// =============================================================================
// AUSTRALIA (AU)
// =============================================================================

const AU_UNIVERSITIES: University[] = [
  { id: 'au-melbourne', name: 'University of Melbourne', shortName: 'Melbourne', country: 'AU', type: 'university', website: 'https://www.unimelb.edu.au' },
  { id: 'au-sydney', name: 'University of Sydney', shortName: 'USyd', country: 'AU', type: 'university', website: 'https://www.sydney.edu.au' },
  { id: 'au-anu', name: 'Australian National University', shortName: 'ANU', country: 'AU', type: 'university', website: 'https://www.anu.edu.au' },
  { id: 'au-unsw', name: 'University of New South Wales', shortName: 'UNSW', country: 'AU', type: 'university', website: 'https://www.unsw.edu.au' },
  { id: 'au-uq', name: 'University of Queensland', shortName: 'UQ', country: 'AU', type: 'university', website: 'https://www.uq.edu.au' },
  { id: 'au-monash', name: 'Monash University', shortName: 'Monash', country: 'AU', type: 'university', website: 'https://www.monash.edu' },
  { id: 'au-uwa', name: 'University of Western Australia', shortName: 'UWA', country: 'AU', type: 'university', website: 'https://www.uwa.edu.au' },
  { id: 'au-adelaide', name: 'University of Adelaide', shortName: 'Adelaide', country: 'AU', type: 'university', website: 'https://www.adelaide.edu.au' },
  { id: 'au-uts', name: 'University of Technology Sydney', shortName: 'UTS', country: 'AU', type: 'university', website: 'https://www.uts.edu.au' },
  { id: 'au-macquarie', name: 'Macquarie University', shortName: 'Macquarie', country: 'AU', type: 'university', website: 'https://www.mq.edu.au' },
  { id: 'au-rmit', name: 'RMIT University', shortName: 'RMIT', country: 'AU', type: 'university', website: 'https://www.rmit.edu.au' },
  { id: 'au-curtin', name: 'Curtin University', shortName: 'Curtin', country: 'AU', type: 'university', website: 'https://www.curtin.edu.au' },
  { id: 'au-deakin', name: 'Deakin University', shortName: 'Deakin', country: 'AU', type: 'university', website: 'https://www.deakin.edu.au' },
  { id: 'au-qut', name: 'Queensland University of Technology', shortName: 'QUT', country: 'AU', type: 'university', website: 'https://www.qut.edu.au' },
  { id: 'au-griffith', name: 'Griffith University', shortName: 'Griffith', country: 'AU', type: 'university', website: 'https://www.griffith.edu.au' },
  { id: 'au-latrobe', name: 'La Trobe University', shortName: 'La Trobe', country: 'AU', type: 'university', website: 'https://www.latrobe.edu.au' },
  { id: 'au-wollongong', name: 'University of Wollongong', shortName: 'UOW', country: 'AU', type: 'university', website: 'https://www.uow.edu.au' },
  { id: 'au-newcastle', name: 'University of Newcastle', shortName: 'UoN', country: 'AU', type: 'university', website: 'https://www.newcastle.edu.au' },
  { id: 'au-flinders', name: 'Flinders University', shortName: 'Flinders', country: 'AU', type: 'university', website: 'https://www.flinders.edu.au' },
  { id: 'au-tasmania', name: 'University of Tasmania', shortName: 'UTAS', country: 'AU', type: 'university', website: 'https://www.utas.edu.au' },
];

// =============================================================================
// INDIA (IN)
// =============================================================================

const IN_UNIVERSITIES: University[] = [
  { id: 'in-iitb', name: 'Indian Institute of Technology Bombay', shortName: 'IIT Bombay', country: 'IN', type: 'institute', website: 'https://www.iitb.ac.in' },
  { id: 'in-iitd', name: 'Indian Institute of Technology Delhi', shortName: 'IIT Delhi', country: 'IN', type: 'institute', website: 'https://www.iitd.ac.in' },
  { id: 'in-iitm', name: 'Indian Institute of Technology Madras', shortName: 'IIT Madras', country: 'IN', type: 'institute', website: 'https://www.iitm.ac.in' },
  { id: 'in-iitk', name: 'Indian Institute of Technology Kanpur', shortName: 'IIT Kanpur', country: 'IN', type: 'institute', website: 'https://www.iitk.ac.in' },
  { id: 'in-iitkgp', name: 'Indian Institute of Technology Kharagpur', shortName: 'IIT KGP', country: 'IN', type: 'institute', website: 'https://www.iitkgp.ac.in' },
  { id: 'in-iisc', name: 'Indian Institute of Science', shortName: 'IISc', country: 'IN', type: 'institute', website: 'https://www.iisc.ac.in' },
  { id: 'in-iith', name: 'Indian Institute of Technology Hyderabad', shortName: 'IIT Hyderabad', country: 'IN', type: 'institute', website: 'https://www.iith.ac.in' },
  { id: 'in-iitg', name: 'Indian Institute of Technology Guwahati', shortName: 'IIT Guwahati', country: 'IN', type: 'institute', website: 'https://www.iitg.ac.in' },
  { id: 'in-iitr', name: 'Indian Institute of Technology Roorkee', shortName: 'IIT Roorkee', country: 'IN', type: 'institute', website: 'https://www.iitr.ac.in' },
  { id: 'in-du', name: 'University of Delhi', shortName: 'DU', country: 'IN', type: 'university', website: 'https://www.du.ac.in' },
  { id: 'in-jnu', name: 'Jawaharlal Nehru University', shortName: 'JNU', country: 'IN', type: 'university', website: 'https://www.jnu.ac.in' },
  { id: 'in-bits', name: 'Birla Institute of Technology and Science', shortName: 'BITS Pilani', country: 'IN', type: 'institute', website: 'https://www.bits-pilani.ac.in' },
  { id: 'in-iima', name: 'Indian Institute of Management Ahmedabad', shortName: 'IIM-A', country: 'IN', type: 'institute', website: 'https://www.iima.ac.in' },
  { id: 'in-iimb', name: 'Indian Institute of Management Bangalore', shortName: 'IIM-B', country: 'IN', type: 'institute', website: 'https://www.iimb.ac.in' },
  { id: 'in-bhu', name: 'Banaras Hindu University', shortName: 'BHU', country: 'IN', type: 'university', website: 'https://www.bhu.ac.in' },
  { id: 'in-jadavpur', name: 'Jadavpur University', shortName: 'JU', country: 'IN', type: 'university', website: 'https://www.jaduniv.edu.in' },
  { id: 'in-anna', name: 'Anna University', shortName: 'Anna', country: 'IN', type: 'university', website: 'https://www.annauniv.edu' },
  { id: 'in-vit', name: 'Vellore Institute of Technology', shortName: 'VIT', country: 'IN', type: 'institute', website: 'https://www.vit.ac.in' },
  { id: 'in-manipal', name: 'Manipal Academy of Higher Education', shortName: 'MAHE', country: 'IN', type: 'university', website: 'https://www.manipal.edu' },
  { id: 'in-amity', name: 'Amity University', shortName: 'Amity', country: 'IN', type: 'university', website: 'https://www.amity.edu' },
];

// =============================================================================
// COMBINED UNIVERSITY DATABASE
// =============================================================================

export const UNIVERSITIES: University[] = [
  // Chile
  ...CL_CRUCH,
  ...CL_PRIVADAS,
  ...CL_IP,
  ...CL_CFT,
  // Latin America
  ...MX_UNIVERSITIES,
  ...CO_UNIVERSITIES,
  ...PE_UNIVERSITIES,
  ...AR_UNIVERSITIES,
  ...BR_UNIVERSITIES,
  ...EC_UNIVERSITIES,
  ...UY_UNIVERSITIES,
  ...PY_UNIVERSITIES,
  ...BO_UNIVERSITIES,
  ...VE_UNIVERSITIES,
  ...CR_UNIVERSITIES,
  ...PA_UNIVERSITIES,
  ...DO_UNIVERSITIES,
  ...GT_UNIVERSITIES,
  ...HN_UNIVERSITIES,
  ...SV_UNIVERSITIES,
  ...NI_UNIVERSITIES,
  // North America
  ...US_UNIVERSITIES,
  ...CA_UNIVERSITIES,
  // Europe
  ...GB_UNIVERSITIES,
  ...ES_UNIVERSITIES,
  ...DE_UNIVERSITIES,
  ...FR_UNIVERSITIES,
  ...IT_UNIVERSITIES,
  ...PT_UNIVERSITIES,
  // Asia
  ...JP_UNIVERSITIES,
  ...KR_UNIVERSITIES,
  // Oceania
  ...AU_UNIVERSITIES,
  // South Asia
  ...IN_UNIVERSITIES,
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get universities grouped by country code.
 */
export function getUniversitiesByCountry(): Record<string, University[]> {
  const grouped: Record<string, University[]> = {};
  for (const uni of UNIVERSITIES) {
    if (!grouped[uni.country]) {
      grouped[uni.country] = [];
    }
    grouped[uni.country].push(uni);
  }
  return grouped;
}

/**
 * Normalize a string for accent-insensitive comparison.
 * Removes diacritics/accents and converts to lowercase.
 */
function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Search universities by query string with optional country filter.
 * Matches against name, shortName, and id (case-insensitive, accent-insensitive).
 */
export function searchUniversities(query: string, country?: string): University[] {
  const normalizedQuery = normalizeForSearch(query);

  let pool = UNIVERSITIES;
  if (country) {
    pool = pool.filter((u) => u.country === country.toUpperCase());
  }

  return pool.filter((uni) => {
    const nameMatch = normalizeForSearch(uni.name).includes(normalizedQuery);
    const shortMatch = normalizeForSearch(uni.shortName).includes(normalizedQuery);
    const idMatch = normalizeForSearch(uni.id).includes(normalizedQuery);
    return nameMatch || shortMatch || idMatch;
  });
}

/**
 * Get a single university by its unique ID.
 */
export function getUniversityById(id: string): University | undefined {
  return UNIVERSITIES.find((u) => u.id === id);
}

/**
 * Get all universities for a specific country.
 */
export function getUniversitiesForCountry(countryCode: string): University[] {
  return UNIVERSITIES.filter((u) => u.country === countryCode.toUpperCase());
}
