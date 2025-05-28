import { useEffect, useState } from 'react';
import api from '../services/api';
import ModalCompra from './ModalCompra';

function PedidosLista() {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState({ id: '', idcliente: '' });
  const [modoPegado, setModoPegado] = useState(false);
  const [textoPegado, setTextoPegado] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [idPedidoResaltado, setIdPedidoResaltado] = useState(null);



  const [filtros, setFiltros] = useState({
    idfactura: '',
    idproducto: '',
    idvariedad: '',
    idlongitud: '',
  });

  const fetchData = async () => {
    try {
      const [pedidosRes, clientesRes, proveedoresRes, catalogoRes, facturasRes] = await Promise.all([
        api.get('/pedidos'),
        api.get('/clientes'),
        api.get('/proveedores'),
        api.get('/catalogo-simple/todo'),
        api.get('/facturas-con-clientes')
      ]);
      setPedidos(pedidosRes.data);
      setClientes(clientesRes.data.map(c => ({ ...c, idtercero: c.id })));
      setProveedores(proveedoresRes.data.map(p => ({ ...p, idtercero: p.id })));
      setCatalogo(catalogoRes.data);
      setFacturas(facturasRes.data);
    } catch (err) {
      console.error('Error al obtener datos:', err);
    }

  };

  //modal compras
  const abrirModalCompra = (pedido) => {
  setPedidoSeleccionado(pedido);
  setIdPedidoResaltado(pedido.idpedido);
  const campos = {
    'proveedor': pedido.idproveedor,
    'producto': pedido.idproducto,
    'variedad': pedido.idvariedad,
    'longitud': pedido.idlongitud,
    'empaque': pedido.idempaque,
    'tipo pedido': pedido.idOrder
  };

  const faltantes = Object.entries(campos)
    .filter(([nombre, valor]) => valor === null || valor === '')
    .map(([nombre]) => nombre);

  if (faltantes.length > 0) {
    alert(`⚠️ Debes completar los siguientes campos antes de confirmar compra:\n- ${faltantes.join('\n- ')}`);
    return;
  }

  console.log('✅ Abriendo modal con pedido:', pedido);
  setPedidoSeleccionado(pedido);
  setIdPedidoResaltado(pedido.idpedido);
  setModalVisible(true);
};


  useEffect(() => {
    fetchData();
  }, []);

  const obtenerIdCatalogo = (valor, categoria) =>
    catalogo.find(c =>
      c.valor.trim().toLowerCase() === valor.trim().toLowerCase() &&
      c.categoria === categoria
    )?.id || null;

const procesarPegado = async () => {
  if (!textoPegado.trim()) {
    alert('⚠️ El área de texto está vacía.');
    return;
  }

  if (!facturaSeleccionada.id || !facturaSeleccionada.idcliente) {
    alert('⚠️ Debes seleccionar una factura válida antes de pegar.');
    return;
  }

  const filas = textoPegado.trim().split('\n');

  const registros = filas
    .map((linea, index) => {
      console.log(`🟠 Línea ${index + 1}:`, linea);

      const columnas = linea.trim().split(/\t|,{1}|\s{2,}/);
      console.log(`🔹 Columnas ${index + 1}:`, columnas);

      if (columnas.length < 10) {
        console.warn(`⚠️ Línea ${index + 1} ignorada: menos de 10 columnas`);
        return null;
      }

      const [
        clientCode,
        productText,
        variedadText,
        longitudText,
        farmText,
        boxes,
        _x,
        stems,
        stemsxbunch,
        totalStems
      ] = columnas.map(col => col.trim());

      const producto = catalogo.find(c => c.categoria === 'producto' && c.valor.toLowerCase() === productText.toLowerCase());
      const variedad = catalogo.find(c => c.categoria === 'variedad' && c.valor.toLowerCase() === variedadText.toLowerCase());
      const longitud = catalogo.find(c => c.categoria === 'longitud' && c.valor.toLowerCase() === longitudText.toLowerCase());
      const empaque = catalogo.find(c => c.categoria === 'empaque' && c.valor.toLowerCase() === stemsxbunch.toLowerCase());

      const proveedor = proveedores.find(p =>
        p.nombre.toLowerCase().includes(farmText.toLowerCase())
      );

      const cantidad = parseFloat(boxes) || 0;
      const tallos = parseFloat(stems) || 0;
      const total = cantidad * tallos || parseFloat(totalStems) || 0;

      return {
        idfactura: facturaSeleccionada.id,
        idcliente: facturaSeleccionada.idcliente,
        codigo: clientCode || null,
        idproducto: producto?.id || null,
        idvariedad: variedad?.id || null,
        idlongitud: longitud?.id || null,
        idempaque: empaque?.id || null,
        cantidad,
        tallos,
        totaltallos: total,
        idproveedor: proveedor?.idtercero || null,
        observaciones: `${variedadText} | ${farmText}`
      };
    })
    .filter(Boolean);

  console.log('🔍 Registros que se enviarán:', registros);

  try {
    const respuestas = await Promise.all(
      registros.map(reg => api.post('/pedidos', reg))
    );
    alert(`✅ ${respuestas.length} registros guardados exitosamente`);
    setTextoPegado('');
    setModoPegado(false);
    fetchData();
  } catch (err) {
    console.error('❌ Error al guardar registros:', err);
    alert('❌ Error al guardar uno o más registros.');
  }
};

  const obtenerNombreCliente = (idcliente) => {
    const cliente = clientes.find(c => Number(c.idtercero) === Number(idcliente));
    return cliente ? cliente.nombre : '-';
  };

  const handleCambioCampo = async (idpedido, campo, nuevoValor) => {
  try {
    await api.put(`/pedidos/${idpedido}`, { campo, valor: nuevoValor });
    // alert('✅ Pedido actualizado correctamente'); // ❌ Eliminado
    fetchData(); // ✅ Mantiene la recarga
  } catch (err) {
    alert('❌ Error al actualizar el pedido');
    console.error(err);
  }
};

  const renderSelect = (id, categoria, idpedido, campo) => (
    <select value={id || ''} onChange={(e) => handleCambioCampo(idpedido, campo, e.target.value)}>
      <option value=''>-</option>
      {catalogo.filter(c => c.categoria === categoria).sort((a, b) => a.valor.localeCompare(b.valor)).map(item => (
        <option key={item.id} value={item.id}>{item.valor}</option>
      ))}
    </select>
  );

  const renderSelectProveedor = (idproveedor, idpedido) => (
    <select value={idproveedor || ''} onChange={(e) => handleCambioCampo(idpedido, 'idproveedor', e.target.value)}>
      <option value=''>-- Selecciona proveedor --</option>
      {proveedores.sort((a, b) => a.nombre.localeCompare(b.nombre)).map(prov => (
        <option key={prov.idtercero} value={prov.idtercero}>{prov.nombre}</option>
      ))}
    </select>
  );

  const toggleSeleccion = (id) => {
    setSeleccionados(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleSeleccionTodos = () => {
    if (seleccionados.length === pedidosFiltrados.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(pedidosFiltrados.map(p => p.idpedido));
    }
  };

  const eliminarSeleccionados = async () => {
    if (seleccionados.length === 0) {
      alert('⚠️ No has seleccionado ningún registro');
      return;
    }
    const confirmar = window.confirm(`¿Seguro que deseas eliminar ${seleccionados.length} registros? Esta acción no se puede deshacer.`);
    if (!confirmar) return;
    try {
      await api.delete('/pedidos-multiples', { data: { ids: seleccionados } });
      alert('✅ Registros eliminados');
      setSeleccionados([]);
      fetchData();
    } catch (err) {
      console.error('❌ Error al eliminar registros:', err);
      alert('❌ No se pudieron eliminar los registros');
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
  const matchFactura = filtros.idfactura === '' || String(p.idfactura) === filtros.idfactura;
  const matchProducto = filtros.idproducto === '' || String(p.idproducto) === filtros.idproducto;
  const matchVariedad = filtros.idvariedad === '' || String(p.idvariedad) === filtros.idvariedad;
  const matchLongitud = filtros.idlongitud === '' || String(p.idlongitud) === filtros.idlongitud;

  const saldoCajas = parseFloat(p.cantidad || 0);
  const saldoTallos = parseFloat(p.totaltallos || 0);

  // ✅ solo mostrar pedidos con saldo positivo
  return (
    matchFactura &&
    matchProducto &&
    matchVariedad &&
    matchLongitud &&
    saldoCajas > 0 &&
    saldoTallos > 0
  );
});

    
  return (
    
    <div>
      <div style={{ marginTop: '30px' }}></div>
<h3>📋 Pedidos migrados</h3>

{/* BOTONES + SELECTOR DE FACTURA AL MISMO NIVEL */}
<div style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  flexWrap: 'wrap', 
  gap: '1rem',
  marginBottom: '1rem'
}}>
  <div style={{ display: 'flex', gap: '1rem' }}>
    <button onClick={() => setModoPegado(!modoPegado)}>
      📋 Pegar múltiples registros
    </button>
    <button onClick={eliminarSeleccionados} style={{ backgroundColor: '#e74c3c' }}>
      🗑 Eliminar seleccionados
    </button>
  </div>

  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <label><strong>Factura:</strong></label>
    <select
      value={facturaSeleccionada.id}
      onChange={(e) => {
        const id = e.target.value;
        const factura = facturas.find(f => String(f.idfactura) === id);
        setFacturaSeleccionada({ id, idcliente: factura?.idcliente || '' });
      }}
    >
      <option value="">-- Selecciona factura --</option>
      {facturas.map(f => (
        <option key={f.idfactura} value={f.idfactura}>
          {f.idfactura} - {f.cliente}
        </option>
      ))}
    </select>
  </div>
</div>

  <div className="filtros-card">
  <div className="filtros-horizontal">
  <div>
    <label>Pedido:</label>
    <input
      type='text'
      value={filtros.idfactura}
      onChange={(e) => setFiltros({ ...filtros, idfactura: e.target.value })}
    />
  </div>

  <div>
    <label>Producto:</label>
    <select
      value={filtros.idproducto}
      onChange={(e) => setFiltros({ ...filtros, idproducto: e.target.value })}
    >
      <option value=''>-- Todos --</option>
      {catalogo.filter(c => c.categoria === 'producto')
        .sort((a, b) => a.valor.localeCompare(b.valor))
        .map(item => (
          <option key={item.id} value={item.id}>{item.valor}</option>
        ))}
    </select>
  </div>

  <div>
    <label>Variedad:</label>
    <select
      value={filtros.idvariedad}
      onChange={(e) => setFiltros({ ...filtros, idvariedad: e.target.value })}
    >
      <option value=''>-- Todas --</option>
      {catalogo.filter(c => c.categoria === 'variedad')
        .sort((a, b) => a.valor.localeCompare(b.valor))
        .map(item => (
          <option key={item.id} value={item.id}>{item.valor}</option>
        ))}
    </select>
  </div>

  <div>
    <label>Longitud:</label>
    <select
      value={filtros.idlongitud}
      onChange={(e) => setFiltros({ ...filtros, idlongitud: e.target.value })}
    >
      <option value=''>-- Todas --</option>
      {catalogo.filter(c => c.categoria === 'longitud')
        .sort((a, b) => a.valor.localeCompare(b.valor))
        .map(item => (
          <option key={item.id} value={item.id}>{item.valor}</option>
        ))}
    </select>
  </div>
</div>

      </div>

      {modoPegado && (
        <div className="filtros-card" style={{ marginBottom: '1rem' }}>
          <p><strong>Formato esperado (desde Excel, columnas):</strong></p>
          <code>Product, Variety, Length, ..., Stems, Stems x bunch</code>
          <textarea
            rows={8}
            style={{ width: '100%', fontFamily: 'monospace' }}
            placeholder="Pega aquí los registros..."
            value={textoPegado}
            onChange={(e) => setTextoPegado(e.target.value)}
          />
          <button onClick={procesarPegado}>📨 Guardar registros pegados</button>
        </div>
      )}

<div className="table-responsive">
  <table>
    <thead>
  <tr>
    <th>
      <input
        type="checkbox"
        onChange={toggleSeleccionTodos}
        checked={seleccionados.length === pedidosFiltrados.length && pedidosFiltrados.length > 0}
      />
    </th>
    <th>#</th>
    <th style={{ width: '40px', textAlign: 'center' }}>🛒</th>
    <th>Pedido</th>
    <th>Código</th>
    <th>Cliente</th>
    <th>Observaciones</th>
    <th>Proveedor</th>
    <th>Producto</th>
    <th>Variedad</th>
    <th>Longitud</th>
    <th>Empaque</th>
    <th>Cantidad</th>
    <th>Tallos</th>
    <th>Total tallos</th>
    <th>Tipo pedido</th>
  </tr>
</thead>

    <tbody>
  {pedidosFiltrados.map((p, i) => (
      <tr key={p.idpedido} className={idPedidoResaltado === p.idpedido ? 'fila-activa' : ''}>
      <td>
        <input
          type="checkbox"
          checked={seleccionados.includes(p.idpedido)}
          onChange={() => toggleSeleccion(p.idpedido)}
        />
      </td>
      <td>{i + 1}</td>
      <td className="accion-compra">
  <button className="carrito-btn" onClick={() => abrirModalCompra(p)} title="Confirmar compra">
    🛒
  </button>
</td>

      <td>{p.idfactura}</td>
      <td>{p.codigo}</td>
      <td>{obtenerNombreCliente(p.idcliente)}</td>
      <td>{p.observaciones}</td>
      <td>{renderSelectProveedor(p.idproveedor, p.idpedido)}</td>
      <td>{renderSelect(p.idproducto, 'producto', p.idpedido, 'idproducto')}</td>
      <td>{renderSelect(p.idvariedad, 'variedad', p.idpedido, 'idvariedad')}</td>
      <td>{renderSelect(p.idlongitud, 'longitud', p.idpedido, 'idlongitud')}</td>
      <td>{renderSelect(p.idempaque, 'empaque', p.idpedido, 'idempaque')}</td>
      <td>{p.cantidad}</td>
      <td>{p.tallos}</td>
      <td>{p.totaltallos}</td>
      <td>{renderSelect(p.idOrder, 'tipopedido', p.idpedido, 'idOrder')}</td>
    </tr>
  ))}
</tbody>
<tfoot>
  <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
    <td colSpan={12} style={{ textAlign: 'right' }}>Totales:</td>
    <td>
      {pedidosFiltrados.reduce((sum, p) => sum + Number(p.cantidad || 0), 0)}
    </td>
    <td>
      {pedidosFiltrados.reduce((sum, p) => sum + Number(p.tallos || 0), 0)}
    </td>
    <td>
      {pedidosFiltrados.reduce((sum, p) => sum + Number(p.totaltallos || 0), 0)}
    </td>
    <td></td>
  </tr>
</tfoot>


  </table>
</div>
{modalVisible && pedidoSeleccionado && (
  <ModalCompra
    visible={modalVisible}
    pedido={pedidoSeleccionado}
    catalogo={catalogo}
    onClose={() => {
      setModalVisible(false);
      // No se borra la selección
    }}
    onCompraExitosa={() => {
      setModalVisible(false);
      fetchData().then(() => {
        // Vuelve a marcar la fila tras recargar pedidos
        if (pedidoSeleccionado) {
          setIdPedidoResaltado(pedidoSeleccionado.idpedido);
        }
      });
    }}
  />
)}

</div>
  );
}

export default PedidosLista;
