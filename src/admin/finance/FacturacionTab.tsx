import React, { useState, useMemo } from 'react'
import { FileText, Plus, Search, Download, Send, CheckCircle, Clock, AlertTriangle, Eye } from 'lucide-react'
import { useAuth } from '../../services/auth'
import { btnPrimary, btnSecondary, btnSmall, thStyle, tdStyle, inputStyle, selectStyle, fmt } from '../shared/styles'

// ─── DTE Types per SII ────────────────────────────────────────
const DTE_TYPES = [
  { code: 33, label: 'Factura Electrónica' },
  { code: 34, label: 'Factura Exenta Electrónica' },
  { code: 61, label: 'Nota de Crédito Electrónica' },
  { code: 56, label: 'Nota de Débito Electrónica' },
  { code: 39, label: 'Boleta Electrónica' },
  { code: 52, label: 'Guía de Despacho Electrónica' },
]

interface Factura {
  id: string
  tipo: number
  folio: number
  fecha: string
  rutReceptor: string
  razonSocial: string
  giro: string
  items: { descripcion: string; cantidad: number; precioUnit: number; total: number }[]
  neto: number
  iva: number
  total: number
  estado: 'borrador' | 'emitida' | 'anulada' | 'pagada'
  formaPago: string
}

// Demo invoices
const DEMO_FACTURAS: Factura[] = [
  {
    id: '1', tipo: 33, folio: 1001, fecha: '2026-04-01',
    rutReceptor: '76.111.222-3', razonSocial: 'Universidad de Chile', giro: 'Educación Superior',
    items: [
      { descripcion: 'Licencia Conniku PRO — 50 usuarios x 12 meses', cantidad: 1, precioUnit: 3000000, total: 3000000 },
      { descripcion: 'Soporte técnico dedicado', cantidad: 12, precioUnit: 150000, total: 1800000 },
    ],
    neto: 4800000, iva: 912000, total: 5712000,
    estado: 'emitida', formaPago: 'Transferencia',
  },
  {
    id: '2', tipo: 33, folio: 1002, fecha: '2026-04-03',
    rutReceptor: '77.333.444-5', razonSocial: 'TechCorp SpA', giro: 'Desarrollo de Software',
    items: [
      { descripcion: 'Servicio consultoría plataforma educativa', cantidad: 40, precioUnit: 80000, total: 3200000 },
    ],
    neto: 3200000, iva: 608000, total: 3808000,
    estado: 'pagada', formaPago: 'Transferencia',
  },
  {
    id: '3', tipo: 39, folio: 5001, fecha: '2026-04-05',
    rutReceptor: '12.345.678-9', razonSocial: 'María González', giro: 'Particular',
    items: [
      { descripcion: 'Suscripción Conniku MAX anual', cantidad: 1, precioUnit: 156000, total: 156000 },
    ],
    neto: 131092, iva: 24908, total: 156000,
    estado: 'emitida', formaPago: 'Tarjeta',
  },
  {
    id: '4', tipo: 61, folio: 101, fecha: '2026-04-06',
    rutReceptor: '76.111.222-3', razonSocial: 'Universidad de Chile', giro: 'Educación Superior',
    items: [
      { descripcion: 'Descuento institucional 10% — Ref. Factura 1001', cantidad: 1, precioUnit: -480000, total: -480000 },
    ],
    neto: -480000, iva: -91200, total: -571200,
    estado: 'emitida', formaPago: 'N/A',
  },
]

export default function FacturacionTab() {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState<'facturas' | 'nueva' | 'resumen'>('facturas')
  const [facturas] = useState<Factura[]>(DEMO_FACTURAS)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('all')
  const [filterTipo, setFilterTipo] = useState<string>('all')
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null)

  // New invoice form
  const [newTipo, setNewTipo] = useState(33)
  const [newRut, setNewRut] = useState('')
  const [newRazon, setNewRazon] = useState('')
  const [newGiro, setNewGiro] = useState('')
  const [newItems, setNewItems] = useState([{ descripcion: '', cantidad: 1, precioUnit: 0, total: 0 }])

  const filteredFacturas = useMemo(() => {
    return facturas.filter(f => {
      if (filterEstado !== 'all' && f.estado !== filterEstado) return false
      if (filterTipo !== 'all' && f.tipo !== +filterTipo) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!f.razonSocial.toLowerCase().includes(q) && !f.rutReceptor.includes(q) && !f.folio.toString().includes(q)) return false
      }
      return true
    })
  }, [facturas, searchQuery, filterEstado, filterTipo])

  // Summary stats
  const stats = useMemo(() => {
    const emitidas = facturas.filter(f => f.tipo === 33 || f.tipo === 34)
    const boletas = facturas.filter(f => f.tipo === 39)
    const notas = facturas.filter(f => f.tipo === 61 || f.tipo === 56)
    return {
      totalFacturado: emitidas.reduce((s, f) => s + f.total, 0),
      totalBoletas: boletas.reduce((s, f) => s + f.total, 0),
      totalNotas: notas.reduce((s, f) => s + f.total, 0),
      ivaDebito: facturas.reduce((s, f) => s + f.iva, 0),
      pendientes: facturas.filter(f => f.estado === 'emitida').length,
      pagadas: facturas.filter(f => f.estado === 'pagada').length,
    }
  }, [facturas])

  const estadoStyle = (estado: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      borrador: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
      emitida: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      pagada: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
      anulada: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    }
    return colors[estado] || colors.borrador
  }

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Acceso restringido</div>
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={26} /> Facturación / DTE
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          Emisión de documentos tributarios electrónicos — Integración SII Chile
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Facturado', value: `$${fmt(stats.totalFacturado)}`, color: '#3b82f6' },
          { label: 'Boletas', value: `$${fmt(stats.totalBoletas)}`, color: '#10b981' },
          { label: 'Notas Crédito', value: `$${fmt(stats.totalNotas)}`, color: '#f59e0b' },
          { label: 'IVA Débito', value: `$${fmt(stats.ivaDebito)}`, color: '#ef4444' },
          { label: 'Pendientes', value: stats.pendientes.toString(), color: '#8b5cf6' },
          { label: 'Pagadas', value: stats.pagadas.toString(), color: '#10b981' },
        ].map((card, i) => (
          <div key={i} style={{
            padding: '14px 18px', borderRadius: 14, background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: card.color, marginTop: 4 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 8 }}>
        {[
          { id: 'facturas' as const, label: 'Documentos Emitidos' },
          { id: 'nueva' as const, label: '+ Nueva Factura' },
          { id: 'resumen' as const, label: 'Resumen IVA' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)} style={{
            padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none',
            background: activeView === tab.id ? 'var(--accent)' : 'transparent',
            color: activeView === tab.id ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Documentos Emitidos ─── */}
      {activeView === 'facturas' && !selectedFactura && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
              <input
                placeholder="Buscar por razón social, RUT o folio..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 30 }}
              />
            </div>
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ ...selectStyle, width: 200 }}>
              <option value="all">Todos los tipos</option>
              {DTE_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={{ ...selectStyle, width: 140 }}>
              <option value="all">Todos</option>
              <option value="borrador">Borrador</option>
              <option value="emitida">Emitida</option>
              <option value="pagada">Pagada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>

          <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Folio</th>
                  <th style={thStyle}>Fecha</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Receptor</th>
                  <th style={thStyle}>Neto</th>
                  <th style={thStyle}>IVA</th>
                  <th style={{ ...thStyle, fontWeight: 800 }}>Total</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {filteredFacturas.map(f => {
                  const tipo = DTE_TYPES.find(t => t.code === f.tipo)
                  const est = estadoStyle(f.estado)
                  return (
                    <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ ...tdStyle, fontSize: 11 }}>{tipo?.label || f.tipo}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>{f.folio}</td>
                      <td style={{ ...tdStyle, fontSize: 11 }}>{f.fecha}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{f.razonSocial}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{f.rutReceptor}</div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(f.neto)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--text-muted)' }}>${fmt(f.iva)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>${fmt(f.total)}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                          background: est.bg, color: est.color, textTransform: 'capitalize',
                        }}>
                          {f.estado}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => setSelectedFactura(f)} style={btnSmall}>
                          <Eye size={12} /> Ver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Detail view */}
      {activeView === 'facturas' && selectedFactura && (
        <div>
          <button onClick={() => setSelectedFactura(null)} style={{ ...btnSmall, marginBottom: 16 }}>
            ← Volver al listado
          </button>
          <div style={{
            borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden',
            background: 'var(--bg-secondary)', maxWidth: 800,
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                    {DTE_TYPES.find(t => t.code === selectedFactura.tipo)?.label} N° {selectedFactura.folio}
                  </h2>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{selectedFactura.fecha}</div>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  ...estadoStyle(selectedFactura.estado), textTransform: 'capitalize',
                }}>
                  {selectedFactura.estado}
                </span>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Receptor</div>
              <div style={{ fontWeight: 600 }}>{selectedFactura.razonSocial}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>RUT: {selectedFactura.rutReceptor} — {selectedFactura.giro}</div>
            </div>
            <div style={{ padding: '0 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Descripción</th>
                    <th style={thStyle}>Cant.</th>
                    <th style={thStyle}>P. Unit.</th>
                    <th style={thStyle}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedFactura.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>{item.descripcion}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{item.cantidad}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(item.precioUnit)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>${fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ display: 'flex', gap: 40, fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Neto</span>
                <span style={{ fontWeight: 600, minWidth: 100, textAlign: 'right' }}>${fmt(selectedFactura.neto)}</span>
              </div>
              <div style={{ display: 'flex', gap: 40, fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>IVA 19%</span>
                <span style={{ fontWeight: 600, minWidth: 100, textAlign: 'right' }}>${fmt(selectedFactura.iva)}</span>
              </div>
              <div style={{ display: 'flex', gap: 40, fontSize: 16, fontWeight: 800, marginTop: 4, paddingTop: 8, borderTop: '2px solid var(--border)' }}>
                <span>TOTAL</span>
                <span style={{ minWidth: 100, textAlign: 'right', color: 'var(--accent)' }}>${fmt(selectedFactura.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Nueva Factura ─── */}
      {activeView === 'nueva' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
            fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertTriangle size={14} color="#3b82f6" />
            <span>
              <strong>Próximamente:</strong> La emisión de DTE requiere integración con el SII mediante certificado digital.
              Por ahora puedes generar borradores y exportarlos.
            </span>
          </div>

          <div style={{
            padding: 24, borderRadius: 14, background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Nuevo Documento</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tipo de Documento</label>
                <select value={newTipo} onChange={e => setNewTipo(+e.target.value)} style={selectStyle}>
                  {DTE_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Forma de Pago</label>
                <select style={selectStyle}>
                  <option>Transferencia</option>
                  <option>Tarjeta</option>
                  <option>Cheque</option>
                  <option>Contado</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>RUT Receptor</label>
                <input value={newRut} onChange={e => setNewRut(e.target.value)} placeholder="76.123.456-7" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Razón Social</label>
                <input value={newRazon} onChange={e => setNewRazon(e.target.value)} placeholder="Empresa SpA" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Giro</label>
                <input value={newGiro} onChange={e => setNewGiro(e.target.value)} placeholder="Actividad económica" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Detalle</div>
              {newItems.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <input
                    placeholder="Descripción"
                    value={item.descripcion}
                    onChange={e => { const n = [...newItems]; n[i].descripcion = e.target.value; setNewItems(n) }}
                    style={inputStyle}
                  />
                  <input
                    type="number" placeholder="Cant."
                    value={item.cantidad || ''}
                    onChange={e => { const n = [...newItems]; n[i].cantidad = +e.target.value; n[i].total = n[i].cantidad * n[i].precioUnit; setNewItems(n) }}
                    style={inputStyle}
                  />
                  <input
                    type="number" placeholder="P. Unit."
                    value={item.precioUnit || ''}
                    onChange={e => { const n = [...newItems]; n[i].precioUnit = +e.target.value; n[i].total = n[i].cantidad * n[i].precioUnit; setNewItems(n) }}
                    style={inputStyle}
                  />
                  <div style={{ ...inputStyle, background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                    ${fmt(item.total)}
                  </div>
                </div>
              ))}
              <button onClick={() => setNewItems([...newItems, { descripcion: '', cantidad: 1, precioUnit: 0, total: 0 }])} style={btnSmall}>
                <Plus size={12} /> Agregar línea
              </button>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={btnSecondary}>Guardar Borrador</button>
              <button style={btnPrimary}><Send size={14} /> Emitir DTE</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Resumen IVA ─── */}
      {activeView === 'resumen' && (
        <div style={{ maxWidth: 600 }}>
          <div style={{
            padding: 24, borderRadius: 14, background: 'var(--bg-secondary)',
            border: '1px solid var(--border)', marginBottom: 16,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Resumen IVA — Abril 2026</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { label: 'IVA Débito Fiscal (ventas)', value: stats.ivaDebito, color: '#ef4444' },
                { label: 'IVA Crédito Fiscal (compras)', value: 285000, color: '#10b981' },
                { label: 'IVA a Pagar', value: stats.ivaDebito - 285000, color: '#8b5cf6', bold: true },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: 10, background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 13, fontWeight: item.bold ? 700 : 400 }}>{item.label}</span>
                  <span style={{ fontSize: item.bold ? 18 : 14, fontWeight: item.bold ? 800 : 600, color: item.color }}>
                    ${fmt(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            padding: 24, borderRadius: 14, background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Documentos por Tipo</h3>
            {DTE_TYPES.map(tipo => {
              const count = facturas.filter(f => f.tipo === tipo.code).length
              const total = facturas.filter(f => f.tipo === tipo.code).reduce((s, f) => s + f.total, 0)
              if (count === 0) return null
              return (
                <div key={tipo.code} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                  borderBottom: '1px solid var(--border)', fontSize: 13,
                }}>
                  <span>{tipo.label} ({count})</span>
                  <span style={{ fontWeight: 600 }}>${fmt(total)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
