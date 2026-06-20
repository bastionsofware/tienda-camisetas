import React, { useState, useEffect, useMemo } from 'react';
import { Shirt, Plus, Search, X, Pencil, Trash2, Package, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ESTADOS_PEDIDO = ['Pendiente', 'En Proceso', 'Listo', 'Entregado', 'Cancelado'];
const ESTADOS_PAGO = ['Sin Pagar', 'Pago Parcial', 'Pagado'];
const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const MODELOS = ['Unisex', 'Masculino', 'Femenino'];
const TIPOS_PRENDA = ['Camiseta', 'Hoodie', 'Blusa Dama', 'Camiseta Niño', 'Otro'];
const TIPOS_ARTICULO = ['Mug', 'Botón', 'Afiche', 'Termo', 'Cuadro', 'Otro'];
const POSICIONES_DISENO = ['Adelante', 'Atrás', 'Ambos'];
const CATEGORIAS_GASTO = [
  'Insumos de impresión', 'Papel y vinilo', 'Telas y prendas en blanco',
  'Tintas y suministros', 'Empaques y envíos', 'Equipos y herramientas',
  'Servicios (luz, internet)', 'Publicidad y marketing', 'Otros',
];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const ESTADO_COLORS = {
  'Pendiente':  { bg: '#FFF0F0', text: '#CC0000', dot: '#CC0000', strip: '#CC0000' },
  'En Proceso': { bg: '#F5F5F5', text: '#333333', dot: '#666666', strip: '#666666' },
  'Listo':      { bg: '#FFE4E4', text: '#990000', dot: '#990000', strip: '#990000' },
  'Entregado':  { bg: '#1a1a1a', text: '#ffffff', dot: '#ffffff', strip: '#1a1a1a' },
  'Cancelado':  { bg: '#EEEEEE', text: '#888888', dot: '#aaaaaa', strip: '#aaaaaa' },
};

const PAGO_COLORS = {
  'Sin Pagar':    { bg: '#FFF0F0', text: '#CC0000' },
  'Pago Parcial': { bg: '#F5F5F5', text: '#555555' },
  'Pagado':       { bg: '#1a1a1a', text: '#ffffff' },
};

const inputClass = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-100 disabled:text-gray-400";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatCOP(value) {
  const n = Number(value) || 0;
  return '$' + Math.round(n).toLocaleString('es-CO');
}

function formatDateDisplay(iso) {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  const mi = parseInt(m, 10) - 1;
  if (mi < 0 || mi > 11) return iso;
  return `${d} ${MESES[mi]} ${y}`;
}

function formatMonthLabel(ym) {
  const [y, m] = ym.split('-');
  return `${MESES[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}

function emptyForm() {
  return {
    cliente: '',
    telefono: '',
    descripcion: '',
    fecha: todayISO(),
    estadoPedido: 'Pendiente',
    estadoPago: 'Sin Pagar',
    montoPagado: '',
    notas: '',
    prendas: [{ id: uid(), tipo: 'Camiseta', talla: 'M', color: '', modelo: 'Unisex', diseno: '', posicionDiseno: 'Adelante', valor: '', costo: '' }],
  };
}

function emptyItemForm() {
  return {
    cliente: '',
    telefono: '',
    descripcion: '',
    fecha: todayISO(),
    estadoPedido: 'Pendiente',
    estadoPago: 'Sin Pagar',
    montoPagado: '',
    notas: '',
    articulos: [{ id: uid(), tipo: 'Mug', cantidad: '1', valor: '', costo: '' }],
  };
}

function emptyGastoForm() {
  return {
    descripcion: '',
    categoria: 'Insumos de impresión',
    valor: '',
    fecha: todayISO(),
    notas: '',
  };
}

function EstadoTag({ estado }) {
  const c = ESTADO_COLORS[estado] || ESTADO_COLORS['Pendiente'];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold tracking-wide whitespace-nowrap"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {estado}
    </span>
  );
}

function PagoTag({ estado }) {
  const c = PAGO_COLORS[estado] || PAGO_COLORS['Sin Pagar'];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold tracking-wide whitespace-nowrap"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {estado}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</span>
        <Icon size={16} style={{ color: accent, flexShrink: 0 }} />
      </div>
      <div className="text-xl sm:text-2xl font-bold tabular-nums truncate" style={{ color: accent }}>{value}</div>
      {sub ? <div className="text-xs text-gray-400">{sub}</div> : null}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function OrderCard({ order, isConfirmingDelete, onEdit, onRequestDelete, onCancelDelete, onConfirmDelete, onQuickEstado }) {
  const saldo = Math.max((Number(order.precioVenta) || 0) - (Number(order.montoPagado) || 0), 0);
  const strip = (ESTADO_COLORS[order.estadoPedido] || ESTADO_COLORS['Pendiente']).strip;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex">
      <div className="w-1.5 shrink-0" style={{ backgroundColor: strip }} />
      <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 truncate">{order.cliente}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{order.descripcion}</p>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{formatDateDisplay(order.fecha)}</span>
        </div>

        {order.prendas && order.prendas.length > 0 ? (
          <div className="flex flex-col gap-1">
            {order.prendas.map((p, i) => (
              <div key={p.id || i} className="text-[11px] px-2 py-1 rounded bg-gray-100 text-gray-600 flex items-center justify-between gap-2">
                <span className="truncate">
                  <span className="font-semibold">{p.tipo || 'Camiseta'}</span> · {p.talla} · {p.color || 'sin color'} · {p.modelo}
                  {p.diseno ? <> · {p.diseno} ({p.posicionDiseno || 'Adelante'})</> : null}
                </span>
                <span className="font-semibold whitespace-nowrap shrink-0">{formatCOP(p.valor)}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-end justify-between gap-2 flex-wrap">
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-bold text-gray-800 tabular-nums">{formatCOP(order.precioVenta)}</span>
            <span className="text-xs text-gray-400">x{order.cantidad}</span>
          </div>
          {saldo > 0 ? (
            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: '#990000' }}>
              Por cobrar: {formatCOP(saldo)}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <EstadoTag estado={order.estadoPedido} />
          <PagoTag estado={order.estadoPago} />
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 flex-wrap">
          <select
            value={order.estadoPedido}
            onChange={(e) => onQuickEstado(order.id, e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 bg-gray-50"
          >
            {ESTADOS_PEDIDO.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {!isConfirmingDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(order)} className="p-1.5 rounded text-gray-500 hover:bg-gray-100" aria-label="Editar pedido">
                <Pencil size={15} />
              </button>
              <button onClick={() => onRequestDelete(order.id)} className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label="Eliminar pedido">
                <Trash2 size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">¿Eliminar?</span>
              <button onClick={() => onConfirmDelete(order.id)} className="font-semibold text-red-600">Sí</button>
              <button onClick={onCancelDelete} className="font-semibold text-gray-500">No</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemOrderCard({ order, isConfirmingDelete, onEdit, onRequestDelete, onCancelDelete, onConfirmDelete, onQuickEstado }) {
  const saldo = Math.max((Number(order.precioVenta) || 0) - (Number(order.montoPagado) || 0), 0);
  const strip = (ESTADO_COLORS[order.estadoPedido] || ESTADO_COLORS['Pendiente']).strip;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex">
      <div className="w-1.5 shrink-0" style={{ backgroundColor: strip }} />
      <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 truncate">{order.cliente}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{order.descripcion}</p>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{formatDateDisplay(order.fecha)}</span>
        </div>

        {order.articulos && order.articulos.length > 0 ? (
          <div className="flex flex-col gap-1">
            {order.articulos.map((a, i) => {
              const subtotal = (Number(a.cantidad) || 0) * (Number(a.valor) || 0);
              const subCosto = (Number(a.cantidad) || 0) * (Number(a.costo) || 0);
              return (
                <div key={a.id || i} className="text-[11px] px-2 py-1 rounded bg-gray-100 text-gray-600 flex items-center justify-between gap-2">
                  <span className="truncate">
                    <span className="font-semibold">{a.tipo || 'Mug'}</span> · x{a.cantidad} · Ganancia: {formatCOP(subtotal - subCosto)}
                  </span>
                  <span className="font-semibold whitespace-nowrap shrink-0">{formatCOP(subtotal)}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="flex items-end justify-between gap-2 flex-wrap">
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-bold text-gray-800 tabular-nums">{formatCOP(order.precioVenta)}</span>
            <span className="text-xs text-gray-400">x{order.cantidad}</span>
          </div>
          {saldo > 0 ? (
            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: '#990000' }}>
              Por cobrar: {formatCOP(saldo)}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <EstadoTag estado={order.estadoPedido} />
          <PagoTag estado={order.estadoPago} />
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 flex-wrap">
          <select
            value={order.estadoPedido}
            onChange={(e) => onQuickEstado(order.id, e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 bg-gray-50"
          >
            {ESTADOS_PEDIDO.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {!isConfirmingDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(order)} className="p-1.5 rounded text-gray-500 hover:bg-gray-100" aria-label="Editar pedido">
                <Pencil size={15} />
              </button>
              <button onClick={() => onRequestDelete(order.id)} className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label="Eliminar pedido">
                <Trash2 size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">¿Eliminar?</span>
              <button onClick={() => onConfirmDelete(order.id)} className="font-semibold text-red-600">Sí</button>
              <button onClick={onCancelDelete} className="font-semibold text-gray-500">No</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResumenView({ stats, chartData, pendientesEntregaList, pendientesPagoList, onAddPrenda, onAddArticulo, onGoPedidos }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} label="Ventas totales" value={formatCOP(stats.ventasTotales)} accent="#1a1a1a" />
        <StatCard icon={Wallet} label="Ganancia neta" value={formatCOP(stats.gananciaNeta)} accent="#CC0000" />
        <StatCard icon={AlertCircle} label="Por cobrar" value={formatCOP(stats.porCobrar)} accent="#990000" />
        <StatCard icon={Package} label="Pend. de entrega" value={stats.pendientesEntrega} accent="#555555" sub={`${stats.entregados} entregados`} />
      </div>

      {chartData.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Ventas y ganancia por mes</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v) => formatCOP(v)} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="ventas" name="Ventas" fill="#1a1a1a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="ganancia" name="Ganancia" fill="#CC0000" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600">Pendientes de entrega</h3>
            <button onClick={onGoPedidos} className="text-xs font-semibold" style={{ color: '#CC0000' }}>Ver todos</button>
          </div>
          {pendientesEntregaList.length === 0 ? (
            <p className="text-sm text-gray-400">No tienes pedidos pendientes de entrega.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pendientesEntregaList.map((o) => (
                <li key={o.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="text-gray-700 truncate">{o.cliente}{o._origen ? <span className="text-gray-400 font-normal"> · {o._origen}</span> : null}</span>
                  <EstadoTag estado={o.estadoPedido} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600">Pendientes de pago</h3>
            <button onClick={onGoPedidos} className="text-xs font-semibold" style={{ color: '#CC0000' }}>Ver todos</button>
          </div>
          {pendientesPagoList.length === 0 ? (
            <p className="text-sm text-gray-400">No tienes saldos pendientes por cobrar.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pendientesPagoList.map((o) => (
                <li key={o.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="text-gray-700 truncate">{o.cliente}{o._origen ? <span className="text-gray-400 font-normal"> · {o._origen}</span> : null}</span>
                  <span className="font-semibold tabular-nums whitespace-nowrap" style={{ color: '#990000' }}>
                    {formatCOP(Math.max((Number(o.precioVenta) || 0) - (Number(o.montoPagado) || 0), 0))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onAddPrenda}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white text-sm"
          style={{ backgroundColor: '#CC0000' }}
        >
          <Plus size={16} /> Nuevo pedido de prendas
        </button>
        <button
          onClick={onAddArticulo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm border"
          style={{ borderColor: '#1a1a1a', color: '#1a1a1a' }}
        >
          <Plus size={16} /> Nuevo pedido de artículos
        </button>
      </div>
    </div>
  );
}

function PedidosView({
  orders, search, setSearch, filterEstado, setFilterEstado, onAdd, onEdit,
  deleteConfirmId, onRequestDelete, onCancelDelete, onConfirmDelete, onQuickEstado, totalCount,
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente o pedido..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white text-sm shrink-0"
          style={{ backgroundColor: '#CC0000' }}
        >
          <Plus size={16} /> Nuevo pedido
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['Todos', ...ESTADOS_PEDIDO].map((s) => (
          <button
            key={s}
            onClick={() => setFilterEstado(s)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border"
            style={
              filterEstado === s
                ? { backgroundColor: '#1a1a1a', color: 'white', borderColor: '#1a1a1a' }
                : { backgroundColor: 'white', color: '#6B7280', borderColor: '#E5E7EB' }
            }
          >
            {s}
          </button>
        ))}
      </div>

      {totalCount === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">Aún no has registrado pedidos.</p>
          <p className="text-gray-400 text-xs mt-1">Crea el primero con el botón "Nuevo pedido".</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">No hay pedidos que coincidan con el filtro o la búsqueda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              isConfirmingDelete={deleteConfirmId === o.id}
              onEdit={onEdit}
              onRequestDelete={onRequestDelete}
              onCancelDelete={onCancelDelete}
              onConfirmDelete={onConfirmDelete}
              onQuickEstado={onQuickEstado}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArticulosView({
  orders, search, setSearch, filterEstado, setFilterEstado, onAdd, onEdit,
  deleteConfirmId, onRequestDelete, onCancelDelete, onConfirmDelete, onQuickEstado, totalCount,
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente o pedido..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white text-sm shrink-0"
          style={{ backgroundColor: '#CC0000' }}
        >
          <Plus size={16} /> Nuevo pedido
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['Todos', ...ESTADOS_PEDIDO].map((s) => (
          <button
            key={s}
            onClick={() => setFilterEstado(s)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border"
            style={
              filterEstado === s
                ? { backgroundColor: '#1a1a1a', color: 'white', borderColor: '#1a1a1a' }
                : { backgroundColor: 'white', color: '#6B7280', borderColor: '#E5E7EB' }
            }
          >
            {s}
          </button>
        ))}
      </div>

      {totalCount === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">Aún no has registrado pedidos de artículos.</p>
          <p className="text-gray-400 text-xs mt-1">Crea el primero con el botón "Nuevo pedido".</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">No hay pedidos que coincidan con el filtro o la búsqueda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <ItemOrderCard
              key={o.id}
              order={o}
              isConfirmingDelete={deleteConfirmId === o.id}
              onEdit={onEdit}
              onRequestDelete={onRequestDelete}
              onCancelDelete={onCancelDelete}
              onConfirmDelete={onConfirmDelete}
              onQuickEstado={onQuickEstado}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderFormModal({ formData, formError, isEditing, onField, onSubmit, onClose }) {
  const totalVenta = formData.prendas.reduce((sum, p) => sum + (Number(p.valor) || 0), 0);
  const totalCosto = formData.prendas.reduce((sum, p) => sum + (Number(p.costo) || 0), 0);

  function handlePagoChange(value) {
    onField('estadoPago', value);
    if (value === 'Pagado') {
      onField('montoPagado', totalVenta || 0);
    } else if (value === 'Sin Pagar') {
      onField('montoPagado', 0);
    }
  }

  function updatePrenda(id, key, value) {
    onField('prendas', formData.prendas.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
  }
  function addPrenda() {
    onField('prendas', [...formData.prendas, { id: uid(), tipo: 'Camiseta', talla: 'M', color: '', modelo: 'Unisex', diseno: '', posicionDiseno: 'Adelante', valor: '', costo: '' }]);
  }
  function removePrenda(id) {
    if (formData.prendas.length <= 1) return;
    onField('prendas', formData.prendas.filter((p) => p.id !== id));
  }

  const montoPagadoDisplay =
    formData.estadoPago === 'Sin Pagar' ? 0 :
    formData.estadoPago === 'Pagado' ? (totalVenta || 0) :
    formData.montoPagado;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(17,24,39,0.5)' }}>
      <div className="bg-white rounded-xl w-full max-w-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-gray-800">{isEditing ? 'Editar pedido' : 'Nuevo pedido'}</h2>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:bg-gray-100" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4" style={{ overflowY: 'auto', height: '70vh', WebkitOverflowScrolling: 'touch' }}>
          {formError ? (
            <div className="px-3 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
              {formError}
            </div>
          ) : null}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Cliente *">
              <input value={formData.cliente} onChange={(e) => onField('cliente', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Teléfono">
              <input value={formData.telefono} onChange={(e) => onField('telefono', e.target.value)} className={inputClass} />
            </Field>
          </div>

          <Field label="Descripción del pedido *">
            <textarea
              value={formData.descripcion}
              onChange={(e) => onField('descripcion', e.target.value)}
              rows={2}
              className={inputClass + ' resize-none'}
              placeholder="Ej: Camisetas estampadas diseño retro"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha">
              <input type="date" value={formData.fecha} onChange={(e) => onField('fecha', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Estado">
              <select value={formData.estadoPedido} onChange={(e) => onField('estadoPedido', e.target.value)} className={inputClass}>
                {ESTADOS_PEDIDO.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500">Prendas del pedido *</span>
            <div className="flex flex-col gap-3">
              {formData.prendas.map((p, idx) => (
                <div key={p.id} className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">Prenda {idx + 1}</span>
                    {formData.prendas.length > 1 ? (
                      <button type="button" onClick={() => removePrenda(p.id)} className="text-gray-400 hover:text-red-600" aria-label="Quitar prenda">
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Tipo de prenda">
                      <select value={p.tipo} onChange={(e) => updatePrenda(p.id, 'tipo', e.target.value)} className={inputClass}>
                        {TIPOS_PRENDA.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Talla">
                      <select value={p.talla} onChange={(e) => updatePrenda(p.id, 'talla', e.target.value)} className={inputClass}>
                        {TALLAS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Color">
                      <input value={p.color} onChange={(e) => updatePrenda(p.id, 'color', e.target.value)} className={inputClass} placeholder="Ej: Negro" />
                    </Field>
                    <Field label="Modelo">
                      <select value={p.modelo} onChange={(e) => updatePrenda(p.id, 'modelo', e.target.value)} className={inputClass}>
                        {MODELOS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Diseño">
                      <input value={p.diseno} onChange={(e) => updatePrenda(p.id, 'diseno', e.target.value)} className={inputClass} placeholder="Ej: Calavera floral" />
                    </Field>
                    <Field label="Posición del diseño">
                      <select value={p.posicionDiseno} onChange={(e) => updatePrenda(p.id, 'posicionDiseno', e.target.value)} className={inputClass}>
                        {POSICIONES_DISENO.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Valor de venta (COP)">
                      <input type="text" inputMode="numeric" placeholder="Ej: 35000" value={p.valor} onChange={(e) => updatePrenda(p.id, 'valor', e.target.value.replace(/[^\d]/g, ''))} className={inputClass} />
                    </Field>
                    <Field label="Costo (COP)">
                      <input type="text" inputMode="numeric" placeholder="Ej: 15000" value={p.costo} onChange={(e) => updatePrenda(p.id, 'costo', e.target.value.replace(/[^\d]/g, ''))} className={inputClass} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addPrenda} className="self-start flex items-center gap-1.5 text-sm font-semibold mt-1" style={{ color: '#1a1a1a' }}>
              <Plus size={15} /> Agregar prenda
            </button>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500">{formData.prendas.length} {formData.prendas.length === 1 ? 'prenda' : 'prendas'}</span>
              <span className="font-semibold text-gray-700">Venta: {formatCOP(totalVenta)} · Costo: {formatCOP(totalCosto)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Estado de pago">
              <select value={formData.estadoPago} onChange={(e) => handlePagoChange(e.target.value)} className={inputClass}>
                {ESTADOS_PAGO.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Monto pagado (COP)">
              <input
                type="text"
                inputMode="numeric"
                disabled={formData.estadoPago !== 'Pago Parcial'}
                value={montoPagadoDisplay}
                onChange={(e) => onField('montoPagado', e.target.value.replace(/[^\d]/g, ''))}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Notas">
            <textarea
              value={formData.notas}
              onChange={(e) => onField('notas', e.target.value)}
              rows={2}
              className={inputClass + ' resize-none'}
              placeholder="Opcional"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">
            Cancelar
          </button>
          <button type="button" onClick={onSubmit} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#1a1a1a' }}>
            {isEditing ? 'Guardar cambios' : 'Crear pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemFormModal({ formData, formError, isEditing, onField, onSubmit, onClose }) {
  const totalVenta = formData.articulos.reduce((sum, a) => sum + (Number(a.cantidad) || 0) * (Number(a.valor) || 0), 0);
  const totalCosto = formData.articulos.reduce((sum, a) => sum + (Number(a.cantidad) || 0) * (Number(a.costo) || 0), 0);

  function handlePagoChange(value) {
    onField('estadoPago', value);
    if (value === 'Pagado') {
      onField('montoPagado', totalVenta || 0);
    } else if (value === 'Sin Pagar') {
      onField('montoPagado', 0);
    }
  }

  function updateArticulo(id, key, value) {
    onField('articulos', formData.articulos.map((a) => (a.id === id ? { ...a, [key]: value } : a)));
  }
  function addArticulo() {
    onField('articulos', [...formData.articulos, { id: uid(), tipo: 'Mug', cantidad: '1', valor: '', costo: '' }]);
  }
  function removeArticulo(id) {
    if (formData.articulos.length <= 1) return;
    onField('articulos', formData.articulos.filter((a) => a.id !== id));
  }

  const montoPagadoDisplay =
    formData.estadoPago === 'Sin Pagar' ? 0 :
    formData.estadoPago === 'Pagado' ? (totalVenta || 0) :
    formData.montoPagado;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(17,24,39,0.5)' }}>
      <div className="bg-white rounded-xl w-full max-w-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-gray-800">{isEditing ? 'Editar pedido' : 'Nuevo pedido de artículos'}</h2>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:bg-gray-100" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4" style={{ overflowY: 'auto', height: '70vh', WebkitOverflowScrolling: 'touch' }}>
          {formError ? (
            <div className="px-3 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
              {formError}
            </div>
          ) : null}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Cliente *">
              <input value={formData.cliente} onChange={(e) => onField('cliente', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Teléfono">
              <input value={formData.telefono} onChange={(e) => onField('telefono', e.target.value)} className={inputClass} />
            </Field>
          </div>

          <Field label="Descripción del pedido *">
            <textarea
              value={formData.descripcion}
              onChange={(e) => onField('descripcion', e.target.value)}
              rows={2}
              className={inputClass + ' resize-none'}
              placeholder="Ej: Mugs personalizados para evento"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha">
              <input type="date" value={formData.fecha} onChange={(e) => onField('fecha', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Estado">
              <select value={formData.estadoPedido} onChange={(e) => onField('estadoPedido', e.target.value)} className={inputClass}>
                {ESTADOS_PEDIDO.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500">Artículos del pedido *</span>
            <div className="flex flex-col gap-3">
              {formData.articulos.map((a, idx) => {
                const gananciaLinea = ((Number(a.cantidad) || 0) * (Number(a.valor) || 0)) - ((Number(a.cantidad) || 0) * (Number(a.costo) || 0));
                return (
                  <div key={a.id} className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">Artículo {idx + 1}</span>
                      {formData.articulos.length > 1 ? (
                        <button type="button" onClick={() => removeArticulo(a.id)} className="text-gray-400 hover:text-red-600" aria-label="Quitar artículo">
                          <X size={14} />
                        </button>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Tipo de artículo">
                        <select value={a.tipo} onChange={(e) => updateArticulo(a.id, 'tipo', e.target.value)} className={inputClass}>
                          {TIPOS_ARTICULO.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </Field>
                      <Field label="Cantidad">
                        <input type="text" inputMode="numeric" value={a.cantidad} onChange={(e) => updateArticulo(a.id, 'cantidad', e.target.value.replace(/[^\d]/g, ''))} className={inputClass} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Valor unitario (COP)">
                        <input type="text" inputMode="numeric" placeholder="Ej: 15000" value={a.valor} onChange={(e) => updateArticulo(a.id, 'valor', e.target.value.replace(/[^\d]/g, ''))} className={inputClass} />
                      </Field>
                      <Field label="Costo unitario (COP)">
                        <input type="text" inputMode="numeric" placeholder="Ej: 6000" value={a.costo} onChange={(e) => updateArticulo(a.id, 'costo', e.target.value.replace(/[^\d]/g, ''))} className={inputClass} />
                      </Field>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      Ganancia de esta línea: <span className="font-semibold text-gray-700">{formatCOP(gananciaLinea)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={addArticulo} className="self-start flex items-center gap-1.5 text-sm font-semibold mt-1" style={{ color: '#1a1a1a' }}>
              <Plus size={15} /> Agregar artículo
            </button>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500">{formData.articulos.reduce((s, a) => s + (Number(a.cantidad) || 0), 0)} unidades</span>
              <span className="font-semibold text-gray-700">Venta: {formatCOP(totalVenta)} · Ganancia: {formatCOP(totalVenta - totalCosto)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Estado de pago">
              <select value={formData.estadoPago} onChange={(e) => handlePagoChange(e.target.value)} className={inputClass}>
                {ESTADOS_PAGO.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Monto pagado (COP)">
              <input
                type="text"
                inputMode="numeric"
                disabled={formData.estadoPago !== 'Pago Parcial'}
                value={montoPagadoDisplay}
                onChange={(e) => onField('montoPagado', e.target.value.replace(/[^\d]/g, ''))}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Notas">
            <textarea
              value={formData.notas}
              onChange={(e) => onField('notas', e.target.value)}
              rows={2}
              className={inputClass + ' resize-none'}
              placeholder="Opcional"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">
            Cancelar
          </button>
          <button type="button" onClick={onSubmit} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#1a1a1a' }}>
            {isEditing ? 'Guardar cambios' : 'Crear pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}

function GastosView({ gastos, gastosMes, gananciasMes, fechaDesde, setFechaDesde, fechaHasta, setFechaHasta, onAdd, onEdit, onRequestDelete, onConfirmDelete, onCancelDelete, deleteConfirmId }) {
  const totalMes = gastosMes.reduce((s, g) => s + (Number(g.valor) || 0), 0);
  const balance = gananciasMes - totalMes;

  // Atajos de período
  function setMesActual() {
    const hoy = todayISO();
    setFechaDesde(hoy.slice(0, 7) + '-01');
    setFechaHasta(hoy);
  }
  function setMesAnterior() {
    const hoy = new Date();
    const y = hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear();
    const m = hoy.getMonth() === 0 ? 12 : hoy.getMonth();
    const pad = (n) => String(n).padStart(2, '0');
    const ultimo = new Date(y, m, 0).getDate();
    setFechaDesde(`${y}-${pad(m)}-01`);
    setFechaHasta(`${y}-${pad(m)}-${ultimo}`);
  }
  function setEsteAnio() {
    const y = new Date().getFullYear();
    setFechaDesde(`${y}-01-01`);
    setFechaHasta(`${y}-12-31`);
  }

  const labelPeriodo = fechaDesde === fechaHasta
    ? formatDateDisplay(fechaDesde)
    : `${formatDateDisplay(fechaDesde)} – ${formatDateDisplay(fechaHasta)}`;

  return (
    <div className="flex flex-col gap-4">
      {/* selector de rango */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Período</span>
          <div className="flex gap-2 flex-wrap">
            {[['Este mes', setMesActual], ['Mes anterior', setMesAnterior], ['Este año', setEsteAnio]].map(([label, fn]) => (
              <button key={label} onClick={fn}
                className="px-2.5 py-1 rounded text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
          </div>
        </div>
      </div>

      {/* botón nuevo gasto */}
      <div className="flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white text-sm" style={{ backgroundColor: '#CC0000' }}>
          <Plus size={16} /> Registrar gasto
        </button>
      </div>

      {/* tarjetas resumen del período */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Gastos del período</span>
          <span className="text-xl font-bold tabular-nums" style={{ color: '#CC0000' }}>{formatCOP(totalMes)}</span>
          <span className="text-xs text-gray-400">{gastosMes.length} registros</span>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Ganancias del período</span>
          <span className="text-xl font-bold tabular-nums" style={{ color: '#1a1a1a' }}>{formatCOP(gananciasMes)}</span>
          <span className="text-xs text-gray-400">ventas − costos</span>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Balance neto</span>
          <span className="text-xl font-bold tabular-nums" style={{ color: balance >= 0 ? '#1a1a1a' : '#CC0000' }}>{formatCOP(balance)}</span>
          <span className="text-xs text-gray-400">{balance >= 0 ? 'Positivo ✓' : 'Negativo ✗'}</span>
        </div>
      </div>

      {/* lista de gastos */}
      {gastosMes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">No hay gastos registrados este mes.</p>
          <p className="text-gray-400 text-xs mt-1">Dale a "Registrar gasto" para añadir uno.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {gastosMes.map((g) => (
            <div key={g.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden flex">
              <div className="w-1.5 shrink-0" style={{ backgroundColor: '#CC0000' }} />
              <div className="flex-1 px-4 py-3 flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{g.descripcion}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-500">{g.categoria}</span>
                    <span className="text-[11px] text-gray-400">{formatDateDisplay(g.fecha)}</span>
                  </div>
                  {g.notas ? <p className="text-xs text-gray-400 mt-0.5 truncate">{g.notas}</p> : null}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold tabular-nums text-sm" style={{ color: '#CC0000' }}>{formatCOP(g.valor)}</span>
                  {deleteConfirmId !== g.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(g)} className="p-1.5 rounded text-gray-400 hover:bg-gray-100"><Pencil size={14} /></button>
                      <button onClick={() => onRequestDelete(g.id)} className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">¿Eliminar?</span>
                      <button onClick={() => onConfirmDelete(g.id)} className="font-semibold text-red-600">Sí</button>
                      <button onClick={onCancelDelete} className="font-semibold text-gray-500">No</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* total al pie */}
          <div className="flex justify-between items-center px-4 py-3 rounded-lg border border-dashed border-gray-300 bg-white mt-1">
            <span className="text-sm font-semibold text-gray-600">Total gastos — {labelPeriodo}</span>
            <span className="text-lg font-bold tabular-nums" style={{ color: '#CC0000' }}>{formatCOP(totalMes)}</span>
          </div>
        </div>
      )}

      {/* resumen por categoría */}
      {gastosMes.length > 0 && (() => {
        const porCat = {};
        gastosMes.forEach((g) => {
          porCat[g.categoria] = (porCat[g.categoria] || 0) + (Number(g.valor) || 0);
        });
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Resumen por categoría</h3>
            <div className="flex flex-col gap-2">
              {Object.entries(porCat).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
                <div key={cat} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 truncate">{cat}</span>
                      <span className="font-semibold text-gray-700 ml-2 shrink-0">{formatCOP(total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.round((total / totalMes) * 100)}%`, backgroundColor: '#CC0000' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function GastoFormModal({ formData, formError, isEditing, onField, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(17,24,39,0.5)' }}>
      <div className="bg-white rounded-xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-gray-800">{isEditing ? 'Editar gasto' : 'Registrar gasto'}</h2>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:bg-gray-100" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {formError ? (
            <div className="px-3 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#FFF0F0', color: '#CC0000' }}>
              {formError}
            </div>
          ) : null}

          <Field label="Descripción *">
            <input
              value={formData.descripcion}
              onChange={(e) => onField('descripcion', e.target.value)}
              className={inputClass}
              placeholder="Ej: Papel transfer A3 × 100 hojas"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoría">
              <select value={formData.categoria} onChange={(e) => onField('categoria', e.target.value)} className={inputClass}>
                {CATEGORIAS_GASTO.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Fecha">
              <input type="date" value={formData.fecha} onChange={(e) => onField('fecha', e.target.value)} className={inputClass} />
            </Field>
          </div>

          <Field label="Valor (COP) *">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ej: 45000"
              value={formData.valor}
              onChange={(e) => onField('valor', e.target.value.replace(/[^\d]/g, ''))}
              className={inputClass}
            />
          </Field>

          <Field label="Notas">
            <textarea
              value={formData.notas}
              onChange={(e) => onField('notas', e.target.value)}
              rows={2}
              className={inputClass + ' resize-none'}
              placeholder="Opcional"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">
            Cancelar
          </button>
          <button type="button" onClick={onSubmit} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#CC0000' }}>
            {isEditing ? 'Guardar cambios' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientesView({ clientes, searchCliente, setSearchCliente }) {
  const filtrados = clientes.filter((c) => {
    const q = searchCliente.trim().toLowerCase();
    if (!q) return true;
    return c.nombre.toLowerCase().includes(q) || (c.telefono || '').includes(q);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchCliente}
            onChange={(e) => setSearchCliente(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <span className="text-xs text-gray-400 shrink-0">{clientes.length} clientes registrados</span>
      </div>

      {clientes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">Aún no tienes clientes registrados.</p>
          <p className="text-gray-400 text-xs mt-1">Se agregan automáticamente al crear pedidos con nombre y teléfono.</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">No hay clientes que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map((c) => (
            <div key={c.nombre + c.telefono} className="bg-white rounded-lg border border-gray-200 overflow-hidden flex">
              <div className="w-1.5 shrink-0" style={{ backgroundColor: '#1a1a1a' }} />
              <div className="flex-1 px-4 py-3 flex items-center justify-between gap-4 min-w-0 flex-wrap">
                <div className="min-w-0">
                  <p className="font-bold text-gray-800">{c.nombre}</p>
                  {c.telefono ? (
                    <a href={`tel:${c.telefono}`} className="text-sm text-gray-500 hover:underline">{c.telefono}</a>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sin teléfono</p>
                  )}
                </div>
                <div className="flex gap-4 text-right shrink-0 flex-wrap justify-end">
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Pedidos</span>
                    <span className="text-lg font-bold text-gray-800">{c.totalPedidos}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total compras</span>
                    <span className="text-lg font-bold tabular-nums" style={{ color: '#CC0000' }}>{formatCOP(c.totalCompras)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Último pedido</span>
                    <span className="text-sm font-semibold text-gray-600">{formatDateDisplay(c.ultimoPedido)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── CALENDARIO ─────────────────────────── */
function CalendarioView({ orders, itemOrders }) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes]   = useState(hoy.getMonth()); // 0-11

  const primerDia = new Date(anio, mes, 1).getDay(); // 0=dom
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const celdas    = primerDia + diasEnMes; // total celdas necesarias

  const todosActivos = useMemo(() =>
    [...orders, ...itemOrders].filter((o) =>
      ['Pendiente', 'En Proceso', 'Listo'].includes(o.estadoPedido)
    ), [orders, itemOrders]);

  // agrupar pedidos por fecha ISO del mes visible
  const porDia = useMemo(() => {
    const map = {};
    todosActivos.forEach((o) => {
      if (!o.fecha) return;
      const [y, m, d] = o.fecha.split('-').map(Number);
      if (y === anio && m - 1 === mes) {
        if (!map[d]) map[d] = [];
        map[d].push(o);
      }
    });
    return map;
  }, [todosActivos, anio, mes]);

  // pedidos próximos 7 días
  const proximos = useMemo(() => {
    const desde = new Date(); desde.setHours(0,0,0,0);
    const hasta = new Date(); hasta.setDate(hasta.getDate() + 7); hasta.setHours(23,59,59,999);
    return todosActivos
      .filter((o) => { const f = new Date(o.fecha + 'T00:00:00'); return f >= desde && f <= hasta; })
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [todosActivos]);

  function prevMes() { if (mes === 0) { setMes(11); setAnio(a => a - 1); } else setMes(m => m - 1); }
  function nextMes() { if (mes === 11) { setMes(0); setAnio(a => a + 1); } else setMes(m => m + 1); }

  const todayStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;

  return (
    <div className="flex flex-col gap-4">
      {/* próximos 7 días */}
      {proximos.length > 0 && (
        <div className="rounded-lg border p-4 bg-white" style={{ borderColor: '#CC0000' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#CC0000' }}>⚠ Entregas próximos 7 días ({proximos.length})</h3>
          <div className="flex flex-col gap-2">
            {proximos.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm gap-2 flex-wrap">
                <span className="font-semibold text-gray-800">{o.cliente}</span>
                <div className="flex items-center gap-2">
                  <EstadoTag estado={o.estadoPedido} />
                  <span className="text-xs text-gray-500">{formatDateDisplay(o.fecha)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* cabecera del mes */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMes} className="p-2 rounded hover:bg-gray-100 text-gray-600 font-bold text-lg">‹</button>
          <h3 className="font-bold text-gray-800">{MESES[mes]} {anio}</h3>
          <button onClick={nextMes} className="p-2 rounded hover:bg-gray-100 text-gray-600 font-bold text-lg">›</button>
        </div>

        {/* días de la semana */}
        <div className="grid grid-cols-7 mb-1">
          {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((d) => (
            <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* celdas del calendario */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: Math.ceil(celdas / 7) * 7 }).map((_, i) => {
            const dia = i - primerDia + 1;
            const valido = dia >= 1 && dia <= diasEnMes;
            const isoFecha = valido ? `${anio}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}` : null;
            const pedidosDia = valido ? (porDia[dia] || []) : [];
            const esHoy = isoFecha === todayStr;

            return (
              <div key={i} className={`min-h-[56px] rounded-lg p-1 flex flex-col gap-0.5 ${!valido ? 'bg-gray-50' : esHoy ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-100'}`}>
                {valido && (
                  <>
                    <span className={`text-[11px] font-bold leading-none mb-0.5 ${esHoy ? 'text-red-600' : 'text-gray-500'}`}>{dia}</span>
                    {pedidosDia.slice(0, 2).map((o) => {
                      const c = ESTADO_COLORS[o.estadoPedido] || ESTADO_COLORS['Pendiente'];
                      return (
                        <div key={o.id} title={`${o.cliente} — ${o.estadoPedido}`}
                          className="text-[10px] px-1 rounded truncate font-semibold leading-tight"
                          style={{ backgroundColor: c.bg, color: c.text }}>
                          {o.cliente}
                        </div>
                      );
                    })}
                    {pedidosDia.length > 2 && (
                      <span className="text-[10px] text-gray-400 px-1">+{pedidosDia.length - 2} más</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* lista del mes */}
      {Object.keys(porDia).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Todos los pedidos de {MESES[mes]}</h3>
          <div className="flex flex-col gap-2">
            {Object.entries(porDia).sort((a,b) => Number(a[0]) - Number(b[0])).map(([dia, lista]) => (
              <div key={dia}>
                <p className="text-xs font-bold text-gray-400 mb-1">{dia} de {MESES[mes]}</p>
                {lista.map((o) => (
                  <div key={o.id} className="flex items-center justify-between text-sm gap-2 pl-2 py-1 flex-wrap">
                    <span className="text-gray-700 font-semibold">{o.cliente}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{o.descripcion}</span>
                      <EstadoTag estado={o.estadoPedido} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── INVENTARIO ─────────────────────────── */
const CATEGORIAS_INV = ['Prendas en blanco', 'Tintas e insumos', 'Papel y vinilo', 'Artículos en blanco', 'Empaques', 'Equipos', 'Otros'];
const UNIDADES_INV   = ['unidades', 'hojas', 'metros', 'litros', 'ml', 'kg', 'gramos', 'rollos'];

function emptyInvForm() {
  return { nombre: '', categoria: 'Prendas en blanco', cantidad: '', unidad: 'unidades', minimo: '', notas: '' };
}

function InventarioView({ items, invSearch, setInvSearch, onAdd, onEdit, onAjustar, onRequestDelete, onConfirmDelete, onCancelDelete, deleteConfirmId }) {
  const agotados  = items.filter((i) => Number(i.cantidad) <= 0);
  const bajos     = items.filter((i) => Number(i.cantidad) > 0 && Number(i.minimo) > 0 && Number(i.cantidad) <= Number(i.minimo));
  const filtrados = items.filter((i) => {
    const q = invSearch.trim().toLowerCase();
    return !q || i.nombre.toLowerCase().includes(q) || i.categoria.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-4">
      {/* alertas */}
      {(agotados.length > 0 || bajos.length > 0) && (
        <div className="rounded-lg border p-4 bg-white flex flex-col gap-2" style={{ borderColor: '#CC0000' }}>
          <h3 className="text-sm font-bold" style={{ color: '#CC0000' }}>⚠ Alertas de stock</h3>
          {agotados.map((i) => (
            <p key={i.id} className="text-xs text-red-700 font-semibold">• <span className="font-bold">{i.nombre}</span> — AGOTADO</p>
          ))}
          {bajos.map((i) => (
            <p key={i.id} className="text-xs text-orange-700">• <span className="font-bold">{i.nombre}</span> — Stock bajo ({i.cantidad} {i.unidad}, mínimo {i.minimo})</p>
          ))}
        </div>
      )}

      {/* barra superior */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={invSearch} onChange={(e) => setInvSearch(e.target.value)} placeholder="Buscar insumo..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
        </div>
        <button onClick={onAdd} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white text-sm shrink-0" style={{ backgroundColor: '#1a1a1a' }}>
          <Plus size={16} /> Agregar insumo
        </button>
      </div>

      {/* lista */}
      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">No tienes insumos registrados aún.</p>
          <p className="text-gray-400 text-xs mt-1">Agrega tus materiales con el botón de arriba.</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">Ningún insumo coincide con la búsqueda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map((item) => {
            const cant = Number(item.cantidad) || 0;
            const min  = Number(item.minimo)   || 0;
            const agotado = cant <= 0;
            const bajo    = !agotado && min > 0 && cant <= min;
            const stripColor = agotado ? '#CC0000' : bajo ? '#D97706' : '#1a1a1a';

            return (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden flex">
                <div className="w-1.5 shrink-0" style={{ backgroundColor: stripColor }} />
                <div className="flex-1 px-4 py-3 flex items-center justify-between gap-3 min-w-0 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate">{item.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-500">{item.categoria}</span>
                      {agotado && <span className="text-[11px] px-2 py-0.5 rounded font-bold" style={{ backgroundColor: '#FFF0F0', color: '#CC0000' }}>AGOTADO</span>}
                      {bajo    && <span className="text-[11px] px-2 py-0.5 rounded font-bold" style={{ backgroundColor: '#FFF7ED', color: '#C2410C' }}>Stock bajo</span>}
                    </div>
                    {item.notas ? <p className="text-xs text-gray-400 mt-0.5 truncate">{item.notas}</p> : null}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xl font-bold tabular-nums" style={{ color: agotado ? '#CC0000' : '#1a1a1a' }}>{cant}</p>
                      <p className="text-[11px] text-gray-400">{item.unidad}{min > 0 ? ` · mín. ${min}` : ''}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onAjustar(item, 1)}  className="w-7 h-7 rounded text-sm font-bold flex items-center justify-center" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>+</button>
                        <button onClick={() => onAjustar(item, -1)} className="w-7 h-7 rounded text-sm font-bold flex items-center justify-center border border-gray-300 text-gray-600 hover:bg-gray-50">−</button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(item)} className="p-1 rounded text-gray-400 hover:bg-gray-100"><Pencil size={13} /></button>
                        {deleteConfirmId !== item.id ? (
                          <button onClick={() => onRequestDelete(item.id)} className="p-1 rounded text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={13} /></button>
                        ) : (
                          <div className="flex items-center gap-1 text-xs">
                            <button onClick={() => onConfirmDelete(item.id)} className="font-semibold text-red-600">Sí</button>
                            <button onClick={onCancelDelete} className="font-semibold text-gray-400">No</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InvFormModal({ formData, formError, isEditing, onField, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(17,24,39,0.5)' }}>
      <div className="bg-white rounded-xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-gray-800">{isEditing ? 'Editar insumo' : 'Agregar insumo'}</h2>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {formError ? <div className="px-3 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#FFF0F0', color: '#CC0000' }}>{formError}</div> : null}
          <Field label="Nombre del insumo *">
            <input value={formData.nombre} onChange={(e) => onField('nombre', e.target.value)} className={inputClass} placeholder="Ej: Papel transfer A3" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoría">
              <select value={formData.categoria} onChange={(e) => onField('categoria', e.target.value)} className={inputClass}>
                {CATEGORIAS_INV.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Unidad de medida">
              <select value={formData.unidad} onChange={(e) => onField('unidad', e.target.value)} className={inputClass}>
                {UNIDADES_INV.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cantidad actual *">
              <input type="text" inputMode="numeric" placeholder="Ej: 100" value={formData.cantidad} onChange={(e) => onField('cantidad', e.target.value.replace(/[^\d]/g, ''))} className={inputClass} />
            </Field>
            <Field label="Stock mínimo (alerta)">
              <input type="text" inputMode="numeric" placeholder="Ej: 20" value={formData.minimo} onChange={(e) => onField('minimo', e.target.value.replace(/[^\d]/g, ''))} className={inputClass} />
            </Field>
          </div>
          <Field label="Notas">
            <textarea value={formData.notas} onChange={(e) => onField('notas', e.target.value)} rows={2} className={inputClass + ' resize-none'} placeholder="Opcional" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancelar</button>
          <button type="button" onClick={onSubmit} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#1a1a1a' }}>
            {isEditing ? 'Guardar cambios' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── PENDIENTES ─────────────────────────── */
const CATEGORIAS_TAREA = ['Por hacer', 'Compras', 'Llamadas', 'Propuestas', 'Entregas', 'Diseños', 'Otro'];
const PRIORIDADES = ['Alta', 'Media', 'Baja'];
const PRIORIDAD_COLORS = {
  'Alta':  { bg: '#FFF0F0', text: '#CC0000', dot: '#CC0000' },
  'Media': { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  'Baja':  { bg: '#F5F5F5', text: '#555555', dot: '#9CA3AF' },
};

function emptyTareaForm() {
  return { titulo: '', categoria: 'Por hacer', prioridad: 'Media', fecha: '', notas: '' };
}

function PendientesView({ tareas, onAdd, onToggle, onEdit, onRequestDelete, onConfirmDelete, onCancelDelete, deleteConfirmId }) {
  const [filtro, setFiltro] = useState('Todas');
  const [mostrarCompletadas, setMostrarCompletadas] = useState(false);

  const pendientes  = tareas.filter((t) => !t.completada);
  const completadas = tareas.filter((t) =>  t.completada);

  const filtradas = pendientes.filter((t) => filtro === 'Todas' || t.categoria === filtro);
  const ordenadas = [...filtradas].sort((a, b) => {
    const pOrd = { Alta: 0, Media: 1, Baja: 2 };
    if (pOrd[a.prioridad] !== pOrd[b.prioridad]) return pOrd[a.prioridad] - pOrd[b.prioridad];
    if (a.fecha && b.fecha) return a.fecha.localeCompare(b.fecha);
    if (a.fecha) return -1;
    if (b.fecha) return 1;
    return 0;
  });

  // agrupar por categoría para mostrar secciones
  const porCategoria = {};
  ordenadas.forEach((t) => {
    if (!porCategoria[t.categoria]) porCategoria[t.categoria] = [];
    porCategoria[t.categoria].push(t);
  });

  const vencidas = pendientes.filter((t) => t.fecha && t.fecha < todayISO());

  return (
    <div className="flex flex-col gap-4">
      {/* alertas de vencidas */}
      {vencidas.length > 0 && (
        <div className="rounded-lg border p-3 flex items-center gap-2" style={{ borderColor: '#CC0000', backgroundColor: '#FFF0F0' }}>
          <span className="text-sm font-bold" style={{ color: '#CC0000' }}>⚠ {vencidas.length} {vencidas.length === 1 ? 'tarea vencida' : 'tareas vencidas'}</span>
          <span className="text-xs text-gray-500">— revísalas pronto</span>
        </div>
      )}

      {/* barra superior */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-wrap">
          {['Todas', ...CATEGORIAS_TAREA].map((cat) => {
            const count = cat === 'Todas' ? pendientes.length : pendientes.filter((t) => t.categoria === cat).length;
            return (
              <button key={cat} onClick={() => setFiltro(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border flex items-center gap-1"
                style={filtro === cat
                  ? { backgroundColor: '#1a1a1a', color: 'white', borderColor: '#1a1a1a' }
                  : { backgroundColor: 'white', color: '#6B7280', borderColor: '#E5E7EB' }}>
                {cat} {count > 0 && <span className="rounded-full px-1.5 text-[10px]"
                  style={filtro === cat ? { backgroundColor: '#CC0000', color: 'white' } : { backgroundColor: '#F3F4F6', color: '#555' }}>
                  {count}</span>}
              </button>
            );
          })}
        </div>
        <button onClick={onAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white text-sm shrink-0"
          style={{ backgroundColor: '#CC0000' }}>
          <Plus size={16} /> Nueva tarea
        </button>
      </div>

      {/* lista de tareas pendientes */}
      {ordenadas.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">{filtro === 'Todas' ? '¡Todo al día! No tienes tareas pendientes.' : `No hay tareas en "${filtro}".`}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(porCategoria).map(([cat, lista]) => (
            <div key={cat} className="flex flex-col gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">{cat} ({lista.length})</h3>
              {lista.map((t) => {
                const pc = PRIORIDAD_COLORS[t.prioridad] || PRIORIDAD_COLORS['Media'];
                const vencida = t.fecha && t.fecha < todayISO();
                const hoy = t.fecha === todayISO();
                return (
                  <div key={t.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden flex">
                    <div className="w-1.5 shrink-0" style={{ backgroundColor: pc.dot }} />
                    <div className="flex-1 px-4 py-3 flex items-start gap-3 min-w-0">
                      {/* checkbox */}
                      <button onClick={() => onToggle(t.id)}
                        className="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                        style={{ borderColor: pc.dot }}>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">{t.titulo}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[11px] px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: pc.bg, color: pc.text }}>
                            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: pc.dot }} />
                            {t.prioridad}
                          </span>
                          {t.fecha && (
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${vencida ? 'bg-red-100 text-red-700' : hoy ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                              {vencida ? '⚠ Vencida · ' : hoy ? '🔔 Hoy · ' : ''}{formatDateDisplay(t.fecha)}
                            </span>
                          )}
                        </div>
                        {t.notas ? <p className="text-xs text-gray-400 mt-1">{t.notas}</p> : null}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {deleteConfirmId !== t.id ? (
                          <>
                            <button onClick={() => onEdit(t)} className="p-1.5 rounded text-gray-400 hover:bg-gray-100"><Pencil size={13} /></button>
                            <button onClick={() => onRequestDelete(t.id)} className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={13} /></button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">¿Eliminar?</span>
                            <button onClick={() => onConfirmDelete(t.id)} className="font-semibold text-red-600">Sí</button>
                            <button onClick={onCancelDelete} className="font-semibold text-gray-500">No</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* completadas */}
      {completadas.length > 0 && (
        <div className="flex flex-col gap-2">
          <button onClick={() => setMostrarCompletadas((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-600 self-start">
            {mostrarCompletadas ? '▾' : '▸'} Completadas ({completadas.length})
          </button>
          {mostrarCompletadas && completadas.map((t) => (
            <div key={t.id} className="bg-white rounded-lg border border-gray-100 overflow-hidden flex opacity-60">
              <div className="w-1.5 shrink-0 bg-gray-300" />
              <div className="flex-1 px-4 py-3 flex items-center gap-3 min-w-0">
                <button onClick={() => onToggle(t.id)}
                  className="w-5 h-5 rounded border-2 border-gray-400 flex items-center justify-center shrink-0 bg-gray-400">
                  <span className="text-white text-[10px] font-bold">✓</span>
                </button>
                <p className="text-sm text-gray-400 line-through truncate flex-1">{t.titulo}</p>
                <button onClick={() => onRequestDelete(t.id)} className="p-1 rounded text-gray-300 hover:text-red-400 shrink-0"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TareaFormModal({ formData, formError, isEditing, onField, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(17,24,39,0.5)' }}>
      <div className="bg-white rounded-xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-gray-800">{isEditing ? 'Editar tarea' : 'Nueva tarea'}</h2>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {formError ? <div className="px-3 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#FFF0F0', color: '#CC0000' }}>{formError}</div> : null}
          <Field label="Tarea *">
            <input value={formData.titulo} onChange={(e) => onField('titulo', e.target.value)} className={inputClass} placeholder="Ej: Llamar a proveedor de tintas" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoría">
              <select value={formData.categoria} onChange={(e) => onField('categoria', e.target.value)} className={inputClass}>
                {CATEGORIAS_TAREA.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Prioridad">
              <select value={formData.prioridad} onChange={(e) => onField('prioridad', e.target.value)} className={inputClass}>
                {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Fecha límite (opcional)">
            <input type="date" value={formData.fecha} onChange={(e) => onField('fecha', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Notas">
            <textarea value={formData.notas} onChange={(e) => onField('notas', e.target.value)} rows={3} className={inputClass + ' resize-none'} placeholder="Detalles, contacto, links..." />
          </Field>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancelar</button>
          <button type="button" onClick={onSubmit} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#CC0000' }}>
            {isEditing ? 'Guardar cambios' : 'Crear tarea'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TiendaCamisetas() {
  const [orders, setOrders] = useState([]);
  const [itemOrders, setItemOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [shopName, setShopName] = useState('Mi Tienda de Camisetas');
  const [editingShopName, setEditingShopName] = useState(false);
  const [tab, setTab] = useState('resumen');
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [itemSearch, setItemSearch] = useState('');
  const [itemFilterEstado, setItemFilterEstado] = useState('Todos');
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemEditingId, setItemEditingId] = useState(null);
  const [itemFormData, setItemFormData] = useState(emptyItemForm());
  const [itemFormError, setItemFormError] = useState('');
  const [itemDeleteConfirmId, setItemDeleteConfirmId] = useState(null);

  const [gastos, setGastos] = useState([]);
  const [gastoFormOpen, setGastoFormOpen] = useState(false);
  const [gastoEditingId, setGastoEditingId] = useState(null);
  const [gastoFormData, setGastoFormData] = useState(emptyGastoForm());
  const [gastoFormError, setGastoFormError] = useState('');
  const [gastoDeleteConfirmId, setGastoDeleteConfirmId] = useState(null);

  // Rango de fechas: por defecto el mes en curso
  const hoy = todayISO();
  const primerDiaMes = hoy.slice(0, 7) + '-01';
  const [fechaDesde, setFechaDesde] = useState(primerDiaMes);
  const [fechaHasta, setFechaHasta] = useState(hoy);
  const [searchCliente, setSearchCliente] = useState('');
  const [invItems, setInvItems] = useState([]);
  const [invSearch, setInvSearch] = useState('');
  const [invFormOpen, setInvFormOpen] = useState(false);
  const [invEditingId, setInvEditingId] = useState(null);
  const [invFormData, setInvFormData] = useState(emptyInvForm());
  const [invFormError, setInvFormError] = useState('');
  const [invDeleteConfirmId, setInvDeleteConfirmId] = useState(null);

  const [tareas, setTareas] = useState([]);
  const [tareaFormOpen, setTareaFormOpen] = useState(false);
  const [tareaEditingId, setTareaEditingId] = useState(null);
  const [tareaFormData, setTareaFormData] = useState(emptyTareaForm());
  const [tareaFormError, setTareaFormError] = useState('');
  const [tareaDeleteConfirmId, setTareaDeleteConfirmId] = useState(null);

  // Carga inicial desde localStorage
  useEffect(() => {
    try { const v = localStorage.getItem('tc_orders'); if (v) setOrders(JSON.parse(v)); } catch (e) {}
    try { const v = localStorage.getItem('tc_itemOrders'); if (v) setItemOrders(JSON.parse(v)); } catch (e) {}
    try { const v = localStorage.getItem('tc_gastos'); if (v) setGastos(JSON.parse(v)); } catch (e) {}
    try { const v = localStorage.getItem('tc_invItems'); if (v) setInvItems(JSON.parse(v)); } catch (e) {}
    try { const v = localStorage.getItem('tc_tareas'); if (v) setTareas(JSON.parse(v)); } catch (e) {}
    try { const v = localStorage.getItem('tc_shopName'); if (v) setShopName(v); } catch (e) {}
    setLoaded(true);
  }, []);

  // Guardado automático en localStorage
  useEffect(() => { if (!loaded) return; try { localStorage.setItem('tc_orders', JSON.stringify(orders)); } catch (e) {} }, [orders, loaded]);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem('tc_itemOrders', JSON.stringify(itemOrders)); } catch (e) {} }, [itemOrders, loaded]);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem('tc_gastos', JSON.stringify(gastos)); } catch (e) {} }, [gastos, loaded]);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem('tc_invItems', JSON.stringify(invItems)); } catch (e) {} }, [invItems, loaded]);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem('tc_tareas', JSON.stringify(tareas)); } catch (e) {} }, [tareas, loaded]);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem('tc_shopName', shopName); } catch (e) {} }, [shopName, loaded]);

  const stats = useMemo(() => {
    const activos = [...orders, ...itemOrders].filter((o) => o.estadoPedido !== 'Cancelado');
    const ventasTotales = activos.reduce((sum, o) => sum + (Number(o.precioVenta) || 0), 0);
    const costosTotales = activos.reduce((sum, o) => sum + (Number(o.costo) || 0), 0);
    const gananciaNeta = ventasTotales - costosTotales;
    const porCobrar = activos.reduce((sum, o) => {
      if (o.estadoPago === 'Pagado') return sum;
      const saldo = (Number(o.precioVenta) || 0) - (Number(o.montoPagado) || 0);
      return sum + Math.max(saldo, 0);
    }, 0);
    const pendientesEntrega = activos.filter((o) => ['Pendiente', 'En Proceso', 'Listo'].includes(o.estadoPedido)).length;
    const entregados = activos.filter((o) => o.estadoPedido === 'Entregado').length;
    return { ventasTotales, costosTotales, gananciaNeta, porCobrar, pendientesEntrega, entregados };
  }, [orders, itemOrders]);

  const chartData = useMemo(() => {
    const map = {};
    [...orders, ...itemOrders].filter((o) => o.estadoPedido !== 'Cancelado').forEach((o) => {
      const mes = (o.fecha || '').slice(0, 7);
      if (!mes) return;
      if (!map[mes]) map[mes] = { mes, ventas: 0, ganancia: 0 };
      map[mes].ventas += Number(o.precioVenta) || 0;
      map[mes].ganancia += (Number(o.precioVenta) || 0) - (Number(o.costo) || 0);
    });
    return Object.values(map)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-6)
      .map((d) => ({ ...d, mesLabel: formatMonthLabel(d.mes) }));
  }, [orders, itemOrders]);

  const filteredOrders = useMemo(() => {
    let list = [...orders];
    if (filterEstado !== 'Todos') list = list.filter((o) => o.estadoPedido === filterEstado);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o) => (o.cliente || '').toLowerCase().includes(q) || (o.descripcion || '').toLowerCase().includes(q));
    }
    return list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [orders, filterEstado, search]);

  const itemFilteredOrders = useMemo(() => {
    let list = [...itemOrders];
    if (itemFilterEstado !== 'Todos') list = list.filter((o) => o.estadoPedido === itemFilterEstado);
    if (itemSearch.trim()) {
      const q = itemSearch.trim().toLowerCase();
      list = list.filter((o) => (o.cliente || '').toLowerCase().includes(q) || (o.descripcion || '').toLowerCase().includes(q));
    }
    return list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [itemOrders, itemFilterEstado, itemSearch]);

  const pendientesEntregaList = useMemo(() => {
    const combined = [
      ...orders.map((o) => ({ ...o, _origen: 'Prendas' })),
      ...itemOrders.map((o) => ({ ...o, _origen: 'Artículos' })),
    ];
    return combined
      .filter((o) => ['Pendiente', 'En Proceso', 'Listo'].includes(o.estadoPedido))
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
      .slice(0, 5);
  }, [orders, itemOrders]);

  const pendientesPagoList = useMemo(() => {
    const combined = [
      ...orders.map((o) => ({ ...o, _origen: 'Prendas' })),
      ...itemOrders.map((o) => ({ ...o, _origen: 'Artículos' })),
    ];
    return combined
      .filter((o) => o.estadoPago !== 'Pagado' && o.estadoPedido !== 'Cancelado')
      .sort((a, b) => ((b.precioVenta || 0) - (b.montoPagado || 0)) - ((a.precioVenta || 0) - (a.montoPagado || 0)))
      .slice(0, 5);
  }, [orders, itemOrders]);

  const mesesDisponibles = useMemo(() => {
    const meses = new Set();
    meses.add(todayISO().slice(0, 7));
    gastos.forEach((g) => { if (g.fecha) meses.add(g.fecha.slice(0, 7)); });
    [...orders, ...itemOrders].forEach((o) => { if (o.fecha) meses.add(o.fecha.slice(0, 7)); });
    return Array.from(meses).sort((a, b) => b.localeCompare(a));
  }, [gastos, orders, itemOrders]);

  const gastosMes = useMemo(() =>
    gastos
      .filter((g) => {
        const f = g.fecha || '';
        return f >= fechaDesde && f <= fechaHasta;
      })
      .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')),
  [gastos, fechaDesde, fechaHasta]);

  const gananciasMes = useMemo(() => {
    const activos = [...orders, ...itemOrders].filter((o) => {
      const f = o.fecha || '';
      return o.estadoPedido !== 'Cancelado' && f >= fechaDesde && f <= fechaHasta;
    });
    return activos.reduce((s, o) => s + (Number(o.precioVenta) || 0) - (Number(o.costo) || 0), 0);
  }, [orders, itemOrders, fechaDesde, fechaHasta]);

  const clientes = useMemo(() => {
    const map = {};
    [...orders, ...itemOrders].forEach((o) => {
      const nombre = (o.cliente || '').trim();
      if (!nombre) return;
      if (!map[nombre]) {
        map[nombre] = { nombre, telefono: o.telefono || '', totalPedidos: 0, totalCompras: 0, ultimoPedido: '' };
      }
      if (o.telefono && !map[nombre].telefono) map[nombre].telefono = o.telefono;
      if (o.estadoPedido !== 'Cancelado') {
        map[nombre].totalPedidos += 1;
        map[nombre].totalCompras += Number(o.precioVenta) || 0;
      }
      if ((o.fecha || '') > (map[nombre].ultimoPedido || '')) map[nombre].ultimoPedido = o.fecha;
    });
    return Object.values(map).sort((a, b) => (b.ultimoPedido || '').localeCompare(a.ultimoPedido || ''));
  }, [orders, itemOrders]);

  function handleOpenAddGasto() {
    setGastoFormData(emptyGastoForm());
    setGastoEditingId(null);
    setGastoFormError('');
    setGastoFormOpen(true);
  }
  function handleOpenEditGasto(g) {
    setGastoFormData({ ...g });
    setGastoEditingId(g.id);
    setGastoFormError('');
    setGastoFormOpen(true);
  }
  function handleGastoFormField(field, value) {
    setGastoFormData((prev) => ({ ...prev, [field]: value }));
  }
  function handleSubmitGasto() {
    if (!gastoFormData.descripcion.trim()) { setGastoFormError('Ingresa una descripción.'); return; }
    const valor = Number(gastoFormData.valor);
    if (!valor || valor <= 0) { setGastoFormError('Ingresa un valor válido.'); return; }
    const cleaned = { ...gastoFormData, valor };
    if (gastoEditingId) {
      setGastos((prev) => prev.map((g) => (g.id === gastoEditingId ? { ...cleaned, id: gastoEditingId } : g)));
    } else {
      setGastos((prev) => [...prev, { ...cleaned, id: uid() }]);
    }
    setGastoFormOpen(false);
  }

  function handleOpenAddTarea() {
    setTareaFormData(emptyTareaForm());
    setTareaEditingId(null);
    setTareaFormError('');
    setTareaFormOpen(true);
  }
  function handleOpenEditTarea(t) {
    setTareaFormData({ ...t });
    setTareaEditingId(t.id);
    setTareaFormError('');
    setTareaFormOpen(true);
  }
  function handleTareaFormField(field, value) { setTareaFormData((prev) => ({ ...prev, [field]: value })); }
  function handleSubmitTarea() {
    if (!tareaFormData.titulo.trim()) { setTareaFormError('Escribe el título de la tarea.'); return; }
    const cleaned = { ...tareaFormData, completada: false };
    if (tareaEditingId) {
      setTareas((prev) => prev.map((t) => (t.id === tareaEditingId ? { ...cleaned, id: tareaEditingId, completada: prev.find((x) => x.id === tareaEditingId)?.completada || false } : t)));
    } else {
      setTareas((prev) => [...prev, { ...cleaned, id: uid() }]);
    }
    setTareaFormOpen(false);
  }
  function handleToggleTarea(id) {
    setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, completada: !t.completada } : t)));
  }

  function handleOpenAddInv() {
    setInvFormData(emptyInvForm());
    setInvEditingId(null);
    setInvFormError('');
    setInvFormOpen(true);
  }
  function handleOpenEditInv(item) {
    setInvFormData({ ...item, cantidad: String(item.cantidad), minimo: String(item.minimo || '') });
    setInvEditingId(item.id);
    setInvFormError('');
    setInvFormOpen(true);
  }
  function handleInvFormField(field, value) { setInvFormData((prev) => ({ ...prev, [field]: value })); }
  function handleSubmitInv() {
    if (!invFormData.nombre.trim()) { setInvFormError('Ingresa el nombre del insumo.'); return; }
    if (invFormData.cantidad === '' || isNaN(Number(invFormData.cantidad))) { setInvFormError('Ingresa una cantidad válida.'); return; }
    const cleaned = { ...invFormData, cantidad: Number(invFormData.cantidad), minimo: Number(invFormData.minimo) || 0 };
    if (invEditingId) {
      setInvItems((prev) => prev.map((i) => (i.id === invEditingId ? { ...cleaned, id: invEditingId } : i)));
    } else {
      setInvItems((prev) => [...prev, { ...cleaned, id: uid() }]);
    }
    setInvFormOpen(false);
  }
  function handleAjustarInv(item, delta) {
    setInvItems((prev) => prev.map((i) =>
      i.id === item.id ? { ...i, cantidad: Math.max(0, (Number(i.cantidad) || 0) + delta) } : i
    ));
  }

  function handleOpenAdd() {
    setFormData(emptyForm());
    setEditingId(null);
    setFormError('');
    setFormOpen(true);
  }

  function handleOpenEdit(order) {
    const prendas = order.prendas && order.prendas.length > 0
      ? order.prendas.map((p) => ({
          id: p.id || uid(),
          tipo: p.tipo || 'Camiseta',
          talla: p.talla || 'M',
          color: p.color || '',
          modelo: p.modelo || 'Unisex',
          diseno: p.diseno || '',
          posicionDiseno: p.posicionDiseno || 'Adelante',
          valor: String(p.valor || ''),
          costo: String(p.costo || ''),
        }))
      : [{ id: uid(), tipo: 'Camiseta', talla: 'M', color: '', modelo: 'Unisex', diseno: '', posicionDiseno: 'Adelante', valor: String(order.precioVenta || ''), costo: String(order.costo || '') }];
    setFormData({ ...order, prendas });
    setEditingId(order.id);
    setFormError('');
    setFormOpen(true);
  }

  function handleFormField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmitForm(e) {
    e.preventDefault();
    if (!formData.cliente.trim()) { setFormError('Ingresa el nombre del cliente.'); return; }
    if (!formData.descripcion.trim()) { setFormError('Describe el pedido.'); return; }
    const totalVenta = formData.prendas.reduce((sum, p) => sum + (Number(p.valor) || 0), 0);
    const totalCosto = formData.prendas.reduce((sum, p) => sum + (Number(p.costo) || 0), 0);
    if (!totalVenta || totalVenta <= 0) { setFormError('Ingresa el valor de venta de al menos una prenda.'); return; }

    let montoPagadoFinal;
    if (formData.estadoPago === 'Sin Pagar') montoPagadoFinal = 0;
    else if (formData.estadoPago === 'Pagado') montoPagadoFinal = totalVenta;
    else montoPagadoFinal = Number(formData.montoPagado) || 0;

    const cleaned = {
      ...formData,
      prendas: formData.prendas.map((p) => ({ ...p, valor: Number(p.valor) || 0, costo: Number(p.costo) || 0 })),
      cantidad: formData.prendas.length,
      precioVenta: totalVenta,
      costo: totalCosto,
      montoPagado: montoPagadoFinal,
    };

    if (editingId) {
      setOrders((prev) => prev.map((o) => (o.id === editingId ? { ...cleaned, id: editingId } : o)));
    } else {
      setOrders((prev) => [...prev, { ...cleaned, id: uid() }]);
    }
    setFormOpen(false);
  }

  function handleQuickEstado(id, value) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, estadoPedido: value } : o)));
  }

  function handleRequestDelete(id) { setDeleteConfirmId(id); }
  function handleCancelDelete() { setDeleteConfirmId(null); }
  function handleConfirmDelete(id) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setDeleteConfirmId(null);
  }

  function handleOpenAddItem() {
    setItemFormData(emptyItemForm());
    setItemEditingId(null);
    setItemFormError('');
    setItemFormOpen(true);
  }

  function handleOpenEditItem(order) {
    const articulos = order.articulos && order.articulos.length > 0
      ? order.articulos.map((a) => ({
          id: a.id || uid(),
          tipo: a.tipo || 'Mug',
          cantidad: String(a.cantidad || 1),
          valor: String(a.valor || ''),
          costo: String(a.costo || ''),
        }))
      : [{ id: uid(), tipo: 'Mug', cantidad: String(order.cantidad || 1), valor: String(order.precioVenta || ''), costo: String(order.costo || '') }];
    setItemFormData({ ...order, articulos });
    setItemEditingId(order.id);
    setItemFormError('');
    setItemFormOpen(true);
  }

  function handleItemFormField(field, value) {
    setItemFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmitItemForm(e) {
    e.preventDefault();
    if (!itemFormData.cliente.trim()) { setItemFormError('Ingresa el nombre del cliente.'); return; }
    if (!itemFormData.descripcion.trim()) { setItemFormError('Describe el pedido.'); return; }
    const totalVenta = itemFormData.articulos.reduce((sum, a) => sum + (Number(a.cantidad) || 0) * (Number(a.valor) || 0), 0);
    const totalCosto = itemFormData.articulos.reduce((sum, a) => sum + (Number(a.cantidad) || 0) * (Number(a.costo) || 0), 0);
    if (!totalVenta || totalVenta <= 0) { setItemFormError('Ingresa el valor de venta de al menos un artículo.'); return; }

    let montoPagadoFinal;
    if (itemFormData.estadoPago === 'Sin Pagar') montoPagadoFinal = 0;
    else if (itemFormData.estadoPago === 'Pagado') montoPagadoFinal = totalVenta;
    else montoPagadoFinal = Number(itemFormData.montoPagado) || 0;

    const cantidadTotal = itemFormData.articulos.reduce((sum, a) => sum + (Number(a.cantidad) || 0), 0);

    const cleaned = {
      ...itemFormData,
      articulos: itemFormData.articulos.map((a) => ({ ...a, cantidad: Number(a.cantidad) || 1, valor: Number(a.valor) || 0, costo: Number(a.costo) || 0 })),
      cantidad: cantidadTotal,
      precioVenta: totalVenta,
      costo: totalCosto,
      montoPagado: montoPagadoFinal,
    };

    if (itemEditingId) {
      setItemOrders((prev) => prev.map((o) => (o.id === itemEditingId ? { ...cleaned, id: itemEditingId } : o)));
    } else {
      setItemOrders((prev) => [...prev, { ...cleaned, id: uid() }]);
    }
    setItemFormOpen(false);
  }

  function handleQuickEstadoItem(id, value) {
    setItemOrders((prev) => prev.map((o) => (o.id === id ? { ...o, estadoPedido: value } : o)));
  }

  function handleRequestDeleteItem(id) { setItemDeleteConfirmId(id); }
  function handleCancelDeleteItem() { setItemDeleteConfirmId(null); }
  function handleConfirmDeleteItem(id) {
    setItemOrders((prev) => prev.filter((o) => o.id !== id));
    setItemDeleteConfirmId(null);
  }

  if (!loaded) {
    return <div className="min-h-[300px] flex items-center justify-center text-gray-400 text-sm">Cargando pedidos...</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="rounded-t-xl px-5 py-4 flex items-center justify-between gap-3" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#CC0000' }}>
            <Shirt size={20} color="white" />
          </div>
          {editingShopName ? (
            <input
              autoFocus
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              onBlur={() => setEditingShopName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingShopName(false)}
              className="bg-transparent text-white font-bold text-lg border-b border-white/40 focus:outline-none min-w-0"
            />
          ) : (
            <h1
              onClick={() => setEditingShopName(true)}
              className="text-white font-bold text-lg cursor-pointer truncate"
              title="Clic para editar el nombre"
            >
              {shopName}
            </h1>
          )}
        </div>
        <span className="text-xs text-white/60 hidden sm:block shrink-0">{orders.length + itemOrders.length} pedidos registrados</span>
      </div>

      <div className="bg-white border-b border-gray-200 flex px-2">
        {[['resumen','Resumen'],['pedidos','Pedidos Prendas'],['articulos','Pedidos Artículos'],['gastos','Gastos'],['clientes','Clientes'],['calendario','Calendario'],['inventario','Inventario'],['pendientes','Pendientes']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-3 text-sm font-semibold border-b-2 transition-colors"
            style={tab === key ? { borderColor: '#CC0000', color: '#1a1a1a' } : { borderColor: 'transparent', color: '#9CA3AF' }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-gray-50 rounded-b-xl p-4 sm:p-5">
        {tab === 'resumen' ? (
          <ResumenView
            stats={stats}
            chartData={chartData}
            pendientesEntregaList={pendientesEntregaList}
            pendientesPagoList={pendientesPagoList}
            onAddPrenda={handleOpenAdd}
            onAddArticulo={handleOpenAddItem}
            onGoPedidos={() => setTab('pedidos')}
          />
        ) : tab === 'pedidos' ? (
          <PedidosView
            orders={filteredOrders}
            search={search}
            setSearch={setSearch}
            filterEstado={filterEstado}
            setFilterEstado={setFilterEstado}
            onAdd={handleOpenAdd}
            onEdit={handleOpenEdit}
            deleteConfirmId={deleteConfirmId}
            onRequestDelete={handleRequestDelete}
            onCancelDelete={handleCancelDelete}
            onConfirmDelete={handleConfirmDelete}
            onQuickEstado={handleQuickEstado}
            totalCount={orders.length}
          />
        ) : tab === 'articulos' ? (
          <ArticulosView
            orders={itemFilteredOrders}
            search={itemSearch}
            setSearch={setItemSearch}
            filterEstado={itemFilterEstado}
            setFilterEstado={setItemFilterEstado}
            onAdd={handleOpenAddItem}
            onEdit={handleOpenEditItem}
            deleteConfirmId={itemDeleteConfirmId}
            onRequestDelete={handleRequestDeleteItem}
            onCancelDelete={handleCancelDeleteItem}
            onConfirmDelete={handleConfirmDeleteItem}
            onQuickEstado={handleQuickEstadoItem}
            totalCount={itemOrders.length}
          />
        ) : tab === 'gastos' ? (
          <GastosView
            gastos={gastos}
            gastosMes={gastosMes}
            gananciasMes={gananciasMes}
            fechaDesde={fechaDesde}
            setFechaDesde={setFechaDesde}
            fechaHasta={fechaHasta}
            setFechaHasta={setFechaHasta}
            onAdd={handleOpenAddGasto}
            onEdit={handleOpenEditGasto}
            onRequestDelete={(id) => setGastoDeleteConfirmId(id)}
            onConfirmDelete={(id) => { setGastos((prev) => prev.filter((g) => g.id !== id)); setGastoDeleteConfirmId(null); }}
            onCancelDelete={() => setGastoDeleteConfirmId(null)}
            deleteConfirmId={gastoDeleteConfirmId}
          />
        ) : tab === 'clientes' ? (
          <ClientesView clientes={clientes} searchCliente={searchCliente} setSearchCliente={setSearchCliente} />
        ) : tab === 'calendario' ? (
          <CalendarioView orders={orders} itemOrders={itemOrders} />
        ) : tab === 'inventario' ? (
          <InventarioView
            items={invItems}
            invSearch={invSearch}
            setInvSearch={setInvSearch}
            onAdd={handleOpenAddInv}
            onEdit={handleOpenEditInv}
            onAjustar={handleAjustarInv}
            onRequestDelete={(id) => setInvDeleteConfirmId(id)}
            onConfirmDelete={(id) => { setInvItems((prev) => prev.filter((i) => i.id !== id)); setInvDeleteConfirmId(null); }}
            onCancelDelete={() => setInvDeleteConfirmId(null)}
            deleteConfirmId={invDeleteConfirmId}
          />
        ) : (
          <PendientesView
            tareas={tareas}
            onAdd={handleOpenAddTarea}
            onToggle={handleToggleTarea}
            onEdit={handleOpenEditTarea}
            onRequestDelete={(id) => setTareaDeleteConfirmId(id)}
            onConfirmDelete={(id) => { setTareas((prev) => prev.filter((t) => t.id !== id)); setTareaDeleteConfirmId(null); }}
            onCancelDelete={() => setTareaDeleteConfirmId(null)}
            deleteConfirmId={tareaDeleteConfirmId}
          />
        )}
      </div>

      {formOpen ? (
        <OrderFormModal
          formData={formData}
          formError={formError}
          isEditing={!!editingId}
          onField={handleFormField}
          onSubmit={handleSubmitForm}
          onClose={() => setFormOpen(false)}
        />
      ) : null}

      {itemFormOpen ? (
        <ItemFormModal
          formData={itemFormData}
          formError={itemFormError}
          isEditing={!!itemEditingId}
          onField={handleItemFormField}
          onSubmit={handleSubmitItemForm}
          onClose={() => setItemFormOpen(false)}
        />
      ) : null}

      {gastoFormOpen ? (
        <GastoFormModal
          formData={gastoFormData}
          formError={gastoFormError}
          isEditing={!!gastoEditingId}
          onField={handleGastoFormField}
          onSubmit={handleSubmitGasto}
          onClose={() => setGastoFormOpen(false)}
        />
      ) : null}

      {invFormOpen ? (
        <InvFormModal
          formData={invFormData}
          formError={invFormError}
          isEditing={!!invEditingId}
          onField={handleInvFormField}
          onSubmit={handleSubmitInv}
          onClose={() => setInvFormOpen(false)}
        />
      ) : null}

      {tareaFormOpen ? (
        <TareaFormModal
          formData={tareaFormData}
          formError={tareaFormError}
          isEditing={!!tareaEditingId}
          onField={handleTareaFormField}
          onSubmit={handleSubmitTarea}
          onClose={() => setTareaFormOpen(false)}
        />
      ) : null}
    </div>
  );
}
