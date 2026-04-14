import React, { useState, useEffect, useMemo } from 'react';
import { btnPrimary, btnSecondary, grid2, fmt } from '../shared/styles';
import {
  Receipt,
  Calculator,
  CheckCircle,
  FileText,
  Plus,
  Download,
  Trash2,
  Search,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Filter,
  RefreshCw,
  AlertTriangle,
  Zap,
  ArrowUpDown,
  Edit3,
  X,
} from 'lucide-react';
import {
  Transaction,
  TransactionType,
  DocumentType,
  PaymentMethod,
  Currency,
  ACCOUNT_CATEGORIES,
  KNOWN_RECURRING_EXPENSES,
  COMPANY,
  matchCategory,
  calculateIVA,
  generateTxId,
  calculateFiscalSummaryFromTxs,
  type AccountCategory,
} from '../shared/accountingData';
import { api } from '../../services/api';

// ─── Map API expense → Transaction ──────────────────────────────
function _mapApiExpense(e: any): Transaction {
  const amountCLP = e.amount_clp || 0;
  const iva = e.iva_amount || 0;
  const neto = amountCLP - iva;
  const deductiblePercent = e.deductible_percent ?? 100;
  return {
    id: e.id,
    date: e.date || e.created_at?.split('T')[0] || '',
    type: (e.tx_type || 'egreso') as TransactionType,
    category: e.category || 'otro',
    subcategory: e.subcategory || '',
    description: e.description || '',
    provider: e.provider_name || '',
    providerRut: e.provider_rut || null,
    documentType: (e.document_type || 'recibo') as DocumentType,
    documentNumber: e.document_number || '',
    currency: (e.currency || 'CLP') as Currency,
    amountOriginal: e.amount_original ?? amountCLP,
    exchangeRate: e.exchange_rate || 1,
    amountCLP,
    neto,
    iva,
    ivaRecuperable: e.iva_recuperable || false,
    retencion: e.retencion || 0,
    taxDeductible: e.tax_deductible ?? true,
    deductiblePercent,
    deductibleAmount: Math.round((neto * deductiblePercent) / 100),
    paymentMethod: (e.payment_method || 'transferencia') as PaymentMethod,
    recurring: e.recurring || false,
    recurringFrequency: e.recurring_frequency || null,
    periodMonth: e.period_month,
    periodYear: e.period_year,
    notes: e.notes || '',
    attachmentName: e.attachment_name || null,
    createdAt: e.created_at || new Date().toISOString(),
  };
}

// ─── Map Transaction → API expense payload ───────────────────────
function _txToApiPayload(tx: Transaction) {
  // Backend restricts doc_type; map to nearest valid value
  const docTypeMap: Record<string, string> = {
    factura: 'factura',
    factura_exenta: 'factura',
    boleta: 'boleta',
    boleta_honorarios: 'boleta_honorarios',
    invoice_internacional: 'recibo',
    recibo: 'recibo',
    comprobante_transferencia: 'recibo',
    sin_documento: 'recibo',
  };
  return {
    date: tx.date,
    tx_type: tx.type,
    category: tx.category,
    subcategory: tx.subcategory,
    description: tx.description,
    amount_clp: tx.amountCLP,
    amount_usd: tx.currency === 'USD' ? tx.amountOriginal : null,
    exchange_rate: tx.currency === 'USD' ? tx.exchangeRate : null,
    currency: tx.currency,
    amount_original: tx.amountOriginal,
    provider_name: tx.provider,
    provider_rut: tx.providerRut,
    document_number: tx.documentNumber,
    document_type: docTypeMap[tx.documentType] || 'recibo',
    tax_deductible: tx.taxDeductible,
    iva_amount: tx.iva,
    iva_recuperable: tx.ivaRecuperable,
    retencion: tx.retencion,
    deductible_percent: tx.deductiblePercent,
    period_month: tx.periodMonth,
    period_year: tx.periodYear,
    recurring: tx.recurring,
    recurring_frequency: tx.recurringFrequency,
    payment_method: tx.paymentMethod,
    notes: tx.notes,
    attachment_name: tx.attachmentName,
  };
}

// ═════════════════════════════════════════════════════════════════
// CENTRAL TRANSACTION MODULE — "Base de Datos" de Contabilidad
// Conniku SpA — Regimen 14D N°3 ProPyme
// ═════════════════════════════════════════════════════════════════

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DOC_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'factura', label: 'Factura Electronica (con IVA)' },
  { value: 'factura_exenta', label: 'Factura Exenta (sin IVA)' },
  { value: 'boleta', label: 'Boleta' },
  { value: 'boleta_honorarios', label: 'Boleta de Honorarios' },
  { value: 'invoice_internacional', label: 'Invoice Internacional (USD)' },
  { value: 'recibo', label: 'Recibo / Voucher' },
  { value: 'comprobante_transferencia', label: 'Comprobante Transferencia' },
  { value: 'sin_documento', label: 'Sin Documento' },
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'tarjeta_debito', label: 'Tarjeta Debito' },
  { value: 'tarjeta_credito', label: 'Tarjeta Credito' },
  { value: 'pago_internacional', label: 'Pago Internacional (USD)' },
  { value: 'debito_automatico', label: 'Debito Automatico / PAC' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'cheque', label: 'Cheque' },
];

const TX_TYPE_OPTIONS: { value: TransactionType; label: string; color: string }[] = [
  { value: 'egreso', label: 'Gasto / Egreso', color: '#ef4444' },
  { value: 'ingreso', label: 'Ingreso / Venta', color: '#22c55e' },
  { value: 'costo', label: 'Costo Operacional', color: '#f59e0b' },
  { value: 'inversion', label: 'Inversion / Activo', color: '#8b5cf6' },
];

export default function GastosTab() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [usdRate, setUsdRate] = useState<number>(950); // fallback

  // ─── Load transactions from API ───
  const reload = async () => {
    setLoading(true);
    try {
      const result: any = await api.getExpenses(
        `period_month=${month}&period_year=${year}&per_page=200`
      );
      const expenses: Transaction[] = (result?.expenses || []).map(_mapApiExpense);
      setTransactions(expenses);
    } catch {
      setTransactions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [month, year]);

  // Load USD rate from indicators
  useEffect(() => {
    fetch('https://mindicador.cl/api/dolar')
      .then((r) => r.json())
      .then((d) => {
        if (d?.serie?.[0]?.valor) setUsdRate(Math.round(d.serie[0].valor));
      })
      .catch(() => {});
  }, []);

  // Filter & sort — API already filters by period; apply local filters on top
  const filtered = useMemo(() => {
    let list = [...transactions];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter((t) =>
        `${t.description} ${t.provider} ${t.category} ${t.notes}`.toLowerCase().includes(s)
      );
    }
    if (filterType !== 'all') list = list.filter((t) => t.type === filterType);
    if (filterGroup !== 'all') {
      const catKeys = ACCOUNT_CATEGORIES.filter((c) => c.group === filterGroup).map((c) => c.key);
      list = list.filter((t) => catKeys.includes(t.category));
    }
    list.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'date') return mul * a.date.localeCompare(b.date);
      return mul * (a.amountCLP - b.amountCLP);
    });
    return list;
  }, [transactions, month, year, searchTerm, filterType, filterGroup, sortField, sortDir]);

  // Fiscal summary — computed from in-memory transactions
  const summary = useMemo(
    () =>
      calculateFiscalSummaryFromTxs(
        transactions.filter((t) => t.periodMonth === month && t.periodYear === year),
        month,
        year
      ),
    [transactions, month, year]
  );

  const handleDelete = async (id: string) => {
    if (confirm('Eliminar esta transaccion?')) {
      try {
        await api.deleteExpense(id);
        await reload();
      } catch {
        alert('Error al eliminar la transaccion');
      }
    }
  };

  const getCatInfo = (key: string) => ACCOUNT_CATEGORIES.find((c) => c.key === key);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Receipt size={22} /> Centro de Transacciones
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            {COMPANY.razonSocial} — RUT {COMPANY.rut} — {COMPANY.regimen}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={selectSm}>
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectSm}>
            {[2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <div
            style={{
              padding: '4px 10px',
              background: 'rgba(34,197,94,0.1)',
              borderRadius: 8,
              fontSize: 11,
              color: '#22c55e',
              fontWeight: 600,
            }}
          >
            USD: ${usdRate}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <SummaryCard
          icon={TrendingUp}
          label="Ingresos"
          value={summary.totalIngresos}
          color="#22c55e"
          sub={`IVA Debito: $${fmt(summary.ivaDebito)}`}
        />
        <SummaryCard
          icon={TrendingDown}
          label="Egresos"
          value={summary.totalEgresos}
          color="#ef4444"
          sub={`IVA Credito: $${fmt(summary.ivaCreditoRecuperable)}`}
        />
        <SummaryCard
          icon={Calculator}
          label="IVA a Pagar"
          value={summary.ivaAPagar}
          color={summary.ivaAPagar > 0 ? '#ef4444' : '#22c55e'}
          sub={summary.remanente > 0 ? `Remanente: $${fmt(summary.remanente)}` : 'Sin remanente'}
        />
        <SummaryCard
          icon={CheckCircle}
          label="Gasto Deducible"
          value={summary.totalDeducible}
          color="#3b82f6"
          sub={`PPM: $${fmt(summary.ppm)}`}
        />
        <SummaryCard
          icon={DollarSign}
          label="Resultado"
          value={summary.resultadoTributario}
          color={summary.resultadoTributario >= 0 ? '#22c55e' : '#ef4444'}
          sub="Ingresos - Gastos deducibles"
        />
      </div>

      {/* Actions bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            setEditingTx(null);
            setShowAdd(true);
          }}
          style={btnPrimary}
        >
          <Plus size={14} /> Nueva Transaccion
        </button>
        <button
          onClick={() => loadRecurring(month, year, usdRate, reload, transactions)}
          style={{ ...btnSecondary, fontSize: 12 }}
        >
          <RefreshCw size={14} /> Cargar Recurrentes
        </button>
        <button
          onClick={() => exportCSV(filtered, month, year)}
          style={{ ...btnSecondary, fontSize: 12 }}
        >
          <Download size={14} /> Exportar CSV
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '6px 8px 6px 28px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 12,
              width: 180,
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <FilterPill
          label="Todos"
          active={filterType === 'all'}
          onClick={() => setFilterType('all')}
        />
        {TX_TYPE_OPTIONS.map((t) => (
          <FilterPill
            key={t.value}
            label={t.label}
            active={filterType === t.value}
            onClick={() => setFilterType(t.value)}
            color={t.color}
          />
        ))}
        <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
        <FilterPill
          label="Todos"
          active={filterGroup === 'all'}
          onClick={() => setFilterGroup('all')}
        />
        {['costo_operacional', 'gasto_admin', 'gasto_ventas', 'remuneracion'].map((g) => (
          <FilterPill
            key={g}
            label={g.replace(/_/g, ' ')}
            active={filterGroup === g}
            onClick={() => setFilterGroup(g)}
          />
        ))}
      </div>

      {/* Sort controls */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 12,
          fontSize: 11,
          color: 'var(--text-muted)',
          alignItems: 'center',
        }}
      >
        <span>{filtered.length} transacciones</span>
        <span>•</span>
        <button
          onClick={() => {
            setSortField('date');
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
          }}
          style={sortBtn}
        >
          <ArrowUpDown size={10} /> Fecha{' '}
          {sortField === 'date' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
        </button>
        <button
          onClick={() => {
            setSortField('amount');
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
          }}
          style={sortBtn}
        >
          <ArrowUpDown size={10} /> Monto{' '}
          {sortField === 'amount' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
        </button>
      </div>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <EmptyState
          month={MONTHS[month - 1]}
          year={year}
          onAdd={() => setShowAdd(true)}
          onLoadRecurring={() => loadRecurring(month, year, usdRate, reload, transactions)}
        />
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {filtered.map((tx) => {
            const cat = getCatInfo(tx.category);
            const typeInfo = TX_TYPE_OPTIONS.find((t) => t.value === tx.type);
            return (
              <div
                key={tx.id}
                className="card"
                style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <span style={{ fontSize: 16, width: 28, textAlign: 'center' }}>
                  {cat?.icon || '📋'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {tx.description}
                    {tx.recurring && (
                      <span
                        style={{
                          fontSize: 9,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: 'rgba(59,130,246,0.12)',
                          color: '#3b82f6',
                          fontWeight: 700,
                        }}
                      >
                        REC
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {tx.date} • {tx.provider} • {cat?.name || tx.category} • {tx.documentType}
                    {tx.documentNumber ? ` #${tx.documentNumber}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: typeInfo?.color }}>
                    {tx.type === 'ingreso' ? '+' : '-'}${fmt(tx.amountCLP)}
                  </div>
                  {tx.currency === 'USD' && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      USD ${tx.amountOriginal}
                    </div>
                  )}
                  {tx.iva > 0 && (
                    <div style={{ fontSize: 10, color: '#3b82f6' }}>IVA: ${fmt(tx.iva)}</div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                  {tx.deductiblePercent < 100 && tx.deductiblePercent > 0 && (
                    <span
                      style={{
                        fontSize: 9,
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: 'rgba(245,158,11,0.12)',
                        color: '#f59e0b',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      {tx.deductiblePercent}%
                    </span>
                  )}
                  {tx.taxDeductible && (
                    <span
                      style={{
                        fontSize: 9,
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: 'rgba(34,197,94,0.12)',
                        color: '#22c55e',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      DED
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditingTx(tx);
                    setShowAdd(true);
                  }}
                  style={iconBtn}
                >
                  <Edit3 size={13} />
                </button>
                <button onClick={() => handleDelete(tx.id)} style={iconBtn}>
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Breakdown by group */}
      {filtered.length > 0 && (
        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>
            Resumen por Categoria
          </h4>
          {Object.entries(summary.byCategory)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([catKey, amount]) => {
              const cat = getCatInfo(catKey);
              return (
                <div
                  key={catKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: 14, width: 24, textAlign: 'center' }}>
                    {cat?.icon || '📋'}
                  </span>
                  <span style={{ flex: 1, fontSize: 12 }}>{cat?.name || catKey}</span>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>${fmt(amount as number)}</span>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      width: 40,
                      textAlign: 'right',
                    }}
                  >
                    {summary.totalEgresos > 0
                      ? Math.round(((amount as number) / (summary.totalEgresos || 1)) * 100)
                      : 0}
                    %
                  </span>
                </div>
              );
            })}
        </div>
      )}

      {/* Add/Edit Transaction Modal */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
          Cargando transacciones...
        </div>
      )}

      {showAdd && (
        <TransactionModal
          editing={editingTx}
          month={month}
          year={year}
          usdRate={usdRate}
          onClose={() => {
            setShowAdd(false);
            setEditingTx(null);
          }}
          onSave={async (tx) => {
            try {
              const payload = _txToApiPayload(tx);
              if (editingTx) {
                await api.updateExpense(tx.id, payload);
              } else {
                await api.createExpense(payload);
              }
              await reload();
            } catch {
              alert('Error al guardar la transaccion');
            }
            setShowAdd(false);
            setEditingTx(null);
          }}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// TRANSACTION MODAL — Smart entry form
// ═════════════════════════════════════════════════════════════════
function TransactionModal({
  editing,
  month,
  year,
  usdRate,
  onClose,
  onSave,
}: {
  editing: Transaction | null;
  month: number;
  year: number;
  usdRate: number;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
}) {
  const [form, setForm] = useState<any>(() => {
    if (editing) return { ...editing };
    return {
      type: 'egreso' as TransactionType,
      date: `${year}-${String(month).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
      description: '',
      provider: '',
      providerRut: '',
      category: '',
      documentType: 'boleta' as DocumentType,
      documentNumber: '',
      currency: 'CLP' as Currency,
      amountOriginal: 0,
      amountTotal: 0,
      hasIVA: false,
      paymentMethod: 'transferencia' as PaymentMethod,
      recurring: false,
      recurringFrequency: 'mensual',
      deductiblePercent: 100,
      notes: '',
    };
  });

  const [suggestion, setSuggestion] = useState<AccountCategory | null>(null);

  // Smart category suggestion when description or provider changes
  useEffect(() => {
    const text = `${form.description} ${form.provider}`;
    const match = matchCategory(text);
    if (match && !form.category) {
      setSuggestion(match);
    }
  }, [form.description, form.provider]);

  const applySuggestion = (cat: AccountCategory) => {
    setForm((f: any) => ({
      ...f,
      category: cat.key,
      hasIVA: cat.defaultIVA,
      currency: cat.defaultCurrency,
      deductiblePercent: cat.defaultDeductible,
      documentType: cat.defaultCurrency === 'USD' ? 'invoice_internacional' : f.documentType,
      paymentMethod: cat.defaultCurrency === 'USD' ? 'pago_internacional' : f.paymentMethod,
    }));
    setSuggestion(null);
  };

  // Calculate amounts
  const amountCLP =
    form.currency === 'USD' ? Math.round(form.amountOriginal * usdRate) : form.amountOriginal;
  const { neto, iva } = calculateIVA(amountCLP, form.hasIVA);
  const deductibleAmount = Math.round((neto * form.deductiblePercent) / 100);
  const retencion = form.documentType === 'boleta_honorarios' ? Math.round(amountCLP * 0.1375) : 0;

  const handleSave = () => {
    if (!form.description || !form.category || form.amountOriginal <= 0) {
      alert('Completa descripcion, categoria y monto');
      return;
    }
    const cat = ACCOUNT_CATEGORIES.find((c) => c.key === form.category);
    const tx: Transaction = {
      id: editing?.id || generateTxId(),
      date: form.date,
      type: form.type,
      category: form.category,
      subcategory: cat?.group || '',
      description: form.description,
      provider: form.provider,
      providerRut: form.providerRut || null,
      documentType: form.documentType,
      documentNumber: form.documentNumber,
      currency: form.currency,
      amountOriginal: form.amountOriginal,
      exchangeRate: form.currency === 'USD' ? usdRate : 1,
      amountCLP,
      neto,
      iva,
      ivaRecuperable: form.hasIVA && form.type !== 'ingreso' && form.documentType === 'factura',
      retencion,
      taxDeductible: form.deductiblePercent > 0,
      deductiblePercent: form.deductiblePercent,
      deductibleAmount,
      paymentMethod: form.paymentMethod,
      recurring: form.recurring,
      recurringFrequency: form.recurring ? form.recurringFrequency : null,
      periodMonth: month,
      periodYear: year,
      notes: form.notes,
      attachmentName: null,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    onSave(tx);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720, maxHeight: '92vh', overflow: 'auto', padding: 24 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={20} /> {editing ? 'Editar Transaccion' : 'Nueva Transaccion'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {TX_TYPE_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => setForm({ ...form, type: t.value })}
              style={{
                flex: 1,
                padding: '8px 6px',
                borderRadius: 8,
                border: form.type === t.value ? `2px solid ${t.color}` : '2px solid transparent',
                background: form.type === t.value ? `${t.color}15` : 'var(--bg-secondary)',
                color: form.type === t.value ? t.color : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Smart suggestion */}
        {suggestion && !form.category && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(37,99,235,0.08)',
              borderRadius: 8,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
            }}
          >
            <Zap size={14} style={{ color: '#2563eb' }} />
            <span>
              Sugerencia:{' '}
              <strong>
                {suggestion.icon} {suggestion.name}
              </strong>
            </span>
            <button
              onClick={() => applySuggestion(suggestion)}
              style={{
                marginLeft: 'auto',
                padding: '3px 10px',
                borderRadius: 6,
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Aplicar
            </button>
          </div>
        )}

        <div style={grid2}>
          {/* Date */}
          <div>
            <Label>Fecha</Label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={inputSm}
            />
          </div>

          {/* Description — triggers smart match */}
          <div>
            <Label>Descripcion *</Label>
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value, category: form.category || '' })
              }
              placeholder="Ej: Hosting backend Render"
              style={inputSm}
            />
          </div>

          {/* Provider */}
          <div>
            <Label>Proveedor</Label>
            <input
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              placeholder="Ej: Render, Leasity, Entel"
              style={inputSm}
            />
          </div>

          {/* Provider RUT */}
          <div>
            <Label>RUT Proveedor (si es chileno)</Label>
            <input
              value={form.providerRut}
              onChange={(e) => setForm({ ...form, providerRut: e.target.value })}
              placeholder="76.xxx.xxx-x"
              style={inputSm}
            />
          </div>

          {/* Category */}
          <div>
            <Label>Categoria *</Label>
            <select
              value={form.category}
              onChange={(e) => {
                const cat = ACCOUNT_CATEGORIES.find((c) => c.key === e.target.value);
                setForm({
                  ...form,
                  category: e.target.value,
                  hasIVA: cat?.defaultIVA ?? false,
                  currency: cat?.defaultCurrency ?? 'CLP',
                  deductiblePercent: cat?.defaultDeductible ?? 100,
                });
              }}
              style={inputSm}
            >
              <option value="">— Seleccionar —</option>
              {[
                'ingreso',
                'costo_operacional',
                'gasto_admin',
                'gasto_ventas',
                'inversion',
                'remuneracion',
                'prevision',
                'impuesto',
              ].map((group) => {
                const cats = ACCOUNT_CATEGORIES.filter((c) => c.group === group);
                if (cats.length === 0) return null;
                return (
                  <optgroup key={group} label={group.replace(/_/g, ' ').toUpperCase()}>
                    {cats.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {/* Document type */}
          <div>
            <Label>Tipo Documento</Label>
            <select
              value={form.documentType}
              onChange={(e) => {
                const dt = e.target.value as DocumentType;
                setForm({ ...form, documentType: dt, hasIVA: dt === 'factura' });
              }}
              style={inputSm}
            >
              {DOC_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Document number */}
          <div>
            <Label>N° Documento</Label>
            <input
              value={form.documentNumber}
              onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
              placeholder="N° factura, boleta, etc."
              style={inputSm}
            />
          </div>

          {/* Currency */}
          <div>
            <Label>Moneda</Label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              style={inputSm}
            >
              <option value="CLP">CLP — Peso Chileno</option>
              <option value="USD">USD — Dolar ({`$${usdRate} CLP`})</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <Label>Monto Total ({form.currency}) *</Label>
            <input
              type="number"
              value={form.amountOriginal || ''}
              onChange={(e) => setForm({ ...form, amountOriginal: Number(e.target.value) })}
              placeholder="0"
              style={inputSm}
            />
          </div>

          {/* Payment method */}
          <div>
            <Label>Medio de Pago</Label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              style={inputSm}
            >
              {PAYMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Deductible % */}
          <div>
            <Label>% Deducible</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.deductiblePercent}
                onChange={(e) => setForm({ ...form, deductiblePercent: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, minWidth: 40, textAlign: 'right' }}>
                {form.deductiblePercent}%
              </span>
            </div>
          </div>
        </div>

        {/* IVA & Recurring checkboxes */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={form.hasIVA}
              onChange={(e) => setForm({ ...form, hasIVA: e.target.checked })}
            />
            Incluye IVA (19%)
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
            />
            Recurrente
          </label>
          {form.recurring && (
            <select
              value={form.recurringFrequency}
              onChange={(e) => setForm({ ...form, recurringFrequency: e.target.value })}
              style={{ ...inputSm, width: 'auto' }}
            >
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginTop: 12 }}>
          <Label>Notas</Label>
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Observaciones opcionales..."
            style={inputSm}
          />
        </div>

        {/* Calculation preview */}
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: 'var(--bg-tertiary)',
            borderRadius: 10,
            fontSize: 12,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--accent)' }}>
            Calculo Automatico
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {form.currency === 'USD' && (
              <CalcRow
                label="Conversion"
                value={`USD $${form.amountOriginal} x $${usdRate} = $${fmt(amountCLP)}`}
              />
            )}
            <CalcRow label="Monto Total" value={`$${fmt(amountCLP)}`} bold />
            {form.hasIVA && <CalcRow label="Neto" value={`$${fmt(neto)}`} />}
            {form.hasIVA && <CalcRow label="IVA (19%)" value={`$${fmt(iva)}`} color="#3b82f6" />}
            {retencion > 0 && (
              <CalcRow label="Retencion (13.75%)" value={`$${fmt(retencion)}`} color="#f59e0b" />
            )}
            <CalcRow
              label="Deducible"
              value={`$${fmt(deductibleAmount)} (${form.deductiblePercent}%)`}
              color="#22c55e"
            />
            {form.hasIVA && form.documentType === 'factura' && form.type !== 'ingreso' && (
              <CalcRow label="IVA Credito Fiscal" value={`$${fmt(iva)}`} color="#2563eb" bold />
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>
            Cancelar
          </button>
          <button onClick={handleSave} style={btnPrimary}>
            {editing ? 'Actualizar' : 'Registrar Transaccion'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════

async function loadRecurring(
  month: number,
  year: number,
  usdRate: number,
  reload: () => Promise<void>,
  existing: Transaction[]
) {
  let added = 0;
  const promises: Promise<any>[] = [];

  for (const re of KNOWN_RECURRING_EXPENSES) {
    if (re.estimatedAmount <= 0) continue;
    if (re.frequency === 'anual' && month !== 1) continue;
    // Skip if similar already exists this period
    if (
      existing.some((t) =>
        t.provider.toLowerCase().includes(re.provider.toLowerCase().split('/')[0].trim())
      )
    )
      continue;

    const cat = ACCOUNT_CATEGORIES.find((c) => c.key === re.category);
    const amountCLP =
      re.currency === 'USD' ? Math.round(re.estimatedAmount * usdRate) : re.estimatedAmount;
    const { neto, iva } = calculateIVA(amountCLP, re.hasIVA);
    const deductiblePercent = cat?.defaultDeductible || 100;

    const payload = {
      date: `${year}-${String(month).padStart(2, '0')}-01`,
      tx_type: 'egreso',
      category: re.category,
      subcategory: cat?.group || '',
      description: re.description,
      amount_clp: amountCLP,
      amount_usd: re.currency === 'USD' ? re.estimatedAmount : null,
      exchange_rate: re.currency === 'USD' ? usdRate : null,
      currency: re.currency,
      amount_original: re.estimatedAmount,
      provider_name: re.provider,
      provider_rut: null,
      document_number: '',
      document_type:
        re.documentType === 'invoice_internacional' ? 'recibo' : (re.documentType as string),
      tax_deductible: deductiblePercent > 0,
      iva_amount: iva,
      iva_recuperable: re.hasIVA && re.documentType === 'factura',
      retencion: 0,
      deductible_percent: deductiblePercent,
      period_month: month,
      period_year: year,
      recurring: true,
      recurring_frequency: re.frequency,
      payment_method: re.currency === 'USD' ? 'pago_internacional' : 'transferencia',
      notes: re.notes,
      attachment_name: null,
    };
    promises.push(api.createExpense(payload).catch(() => null));
    added++;
  }

  if (added > 0) {
    await Promise.all(promises);
    await reload();
    alert(`${added} gastos recurrentes cargados para ${month}/${year}`);
  } else {
    alert('Todos los gastos recurrentes ya estan cargados para este periodo');
  }
}

function exportCSV(txs: Transaction[], month: number, year: number) {
  const headers = [
    'Fecha',
    'Tipo',
    'Descripcion',
    'Proveedor',
    'RUT Proveedor',
    'Categoria',
    'Documento',
    'N° Doc',
    'Moneda',
    'Monto Original',
    'Tasa Cambio',
    'Monto CLP',
    'Neto',
    'IVA',
    'IVA Recuperable',
    'Retencion',
    'Deducible %',
    'Monto Deducible',
    'Medio Pago',
    'Recurrente',
    'Notas',
  ];
  const rows = txs.map((t) => [
    t.date,
    t.type,
    `"${t.description}"`,
    `"${t.provider}"`,
    t.providerRut || '',
    t.category,
    t.documentType,
    t.documentNumber,
    t.currency,
    t.amountOriginal,
    t.exchangeRate,
    t.amountCLP,
    t.neto,
    t.iva,
    t.ivaRecuperable ? 'SI' : 'NO',
    t.retencion,
    t.deductiblePercent,
    t.deductibleAmount,
    t.paymentMethod,
    t.recurring ? 'SI' : 'NO',
    `"${t.notes}"`,
  ]);
  const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conniku_transacciones_${year}-${String(month).padStart(2, '0')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ═════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═════════════════════════════════════════════════════════════════

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  sub: string;
}) {
  return (
    <div className="card" style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Icon size={14} style={{ color }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>${fmt(value)}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 20,
        border: 'none',
        fontSize: 10,
        fontWeight: 600,
        cursor: 'pointer',
        background: active ? (color ? `${color}20` : 'var(--accent)') : 'var(--bg-secondary)',
        color: active ? color || '#fff' : 'var(--text-muted)',
        textTransform: 'capitalize',
      }}
    >
      {label}
    </button>
  );
}

function EmptyState({
  month,
  year,
  onAdd,
  onLoadRecurring,
}: {
  month: string;
  year: number;
  onAdd: () => void;
  onLoadRecurring: () => void;
}) {
  return (
    <div className="card" style={{ padding: 32, textAlign: 'center' }}>
      <Receipt size={40} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.4 }} />
      <h3 style={{ margin: '0 0 4px' }}>
        Sin transacciones en {month} {year}
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
        Registra tu primera transaccion o carga los gastos recurrentes conocidos.
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={onAdd} style={btnPrimary}>
          <Plus size={14} /> Nueva Transaccion
        </button>
        <button onClick={onLoadRecurring} style={btnSecondary}>
          <RefreshCw size={14} /> Cargar Recurrentes
        </button>
      </div>
    </div>
  );
}

function CalcRow({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 400, color: color || 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        fontSize: 11,
        fontWeight: 600,
        display: 'block',
        marginBottom: 3,
        color: 'var(--text-muted)',
      }}
    >
      {children}
    </label>
  );
}

// Shared inline styles
const inputSm: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: 7,
  border: '1px solid var(--border)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 12,
};
const selectSm: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 12,
};
const sortBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  fontSize: 11,
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  padding: 0,
};
const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  padding: 4,
};
