import { useEffect, useState } from 'react';
import api from '../services/api';
import ModalCajaMixta from './ModalCajaMixta';
import axios from 'axios';

function FacturaDetalleEditable() {
  const [facturas, setFacturas] = useState([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [filaActiva, setFilaActiva] = useState(null);
  const [modalAwbVisible, setModalAwbVisible] = useState(false);
  const [awbForm, setAwbForm] = useState({ grupo: '', awb: '' });
  const gruposUnicos = [...new Set(detalles.map(d => d.idgrupo).filter(Boolean))]; // solo grupos válidos
  const [modalVisible, setModalVisible] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);


  const [form, setForm] = useState({
    numero_factura: '',
    fecha: '',
    fecha_vuelo: '',
    awb: '',
    hawb: '',
    idcarguera: '',
    iddae: ''
  });

useEffect(() => {
  (async () => {
    try {
      const [facturasRes, catalogoRes, proveedoresRes] = await Promise.all([
        api.get('/facturas-con-clientes'),
        api.get('/catalogo-simple/todo'),
        api.get('/proveedores')
      ]);
      setFacturas(facturasRes.data);
      setCatalogo([...catalogoRes.data, ...proveedoresRes.data]);
    } catch (err) {
      console.error('❌ Error al cargar datos:', err);
    }
    
  })();
  
}, []);


  const handleCrearMix = (fila) => {
  setDetalleSeleccionado(fila);
  setModalVisible(true);
};
  
  const handleSeleccionFactura = async (e) => {
    const idfactura = e.target.value;
    const factura = facturas.find(f => f.idfactura === parseInt(idfactura));
    setFacturaSeleccionada(factura);
    setForm({
      numero_factura: factura.numero_factura || '',
      fecha: factura.fecha?.substring(0, 10) || '',
      fecha_vuelo: factura.fecha_vuelo?.substring(0, 10) || '',
      awb: factura.awb || '',
      hawb: factura.hawb || '',
      idcarguera: factura.idcarguera || '',
      iddae: factura.iddae || ''
    });
    try {
    const response = await api.get(`/factura-detalle/${idfactura}`);
    const detallesConResaltado = response.data.map(item => {
      const idResaltado = localStorage.getItem('resaltarMix');
      return {
        ...item,
        resaltado: item.idmix === parseInt(idResaltado)
      };
  });

  setDetalles(detallesConResaltado);

// Scroll hacia la fila resaltada
setTimeout(() => {
  const fila = document.querySelector('.fila-mix-resaltada');
  if (fila) {
    fila.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  localStorage.removeItem('resaltarMix');
}, 300);

} catch (err) {
  console.error('❌ Error al cargar detalle de factura:', err);
}

  };

 const handleActualizarCampoEncabezado = async (campo, valor) => {
  setForm(prev => ({ ...prev, [campo]: valor }));
  if (!facturaSeleccionada) return;

  try {
    await api.put(`/factura/${facturaSeleccionada.idfactura}`, {
      campo,
      valor
    });

    // 🔄 Volver a cargar la factura actualizada
    const res = await api.get(`/facturas-con-clientes`);
    const nuevasFacturas = res.data;
    setFacturas(nuevasFacturas);

    // ✅ Buscar y actualizar la seleccionada en estado
    const facturaActualizada = nuevasFacturas.find(f => f.idfactura === facturaSeleccionada.idfactura);
    setFacturaSeleccionada(facturaActualizada);
  } catch (err) {
    console.error(`❌ Error al actualizar ${campo}:`, err);
  }
};


  const handleCambioCampo = async (iddetalle, campo, valor) => {
  try {
    await api.put(`/factura-detalle/${iddetalle}`, { campo, valor });
    setDetalles(prev =>
    prev.map(d => d.iddetalle === iddetalle ? { ...d, [campo]: valor } : d)
    );

  } catch (err) {
    console.error('❌ Error al actualizar campo:', err);
  }
};

const renderSelect = (value, categoria, iddetalle, campo) => {
  const opciones = categoria === 'proveedor'
    ? catalogo.filter(c => c.tipo === 'proveedor') // 👈 proveedores deben venir con { id: idtercero, nombre, tipo }
    : catalogo.filter(c => c.categoria === categoria);

  return (
    <select
      key={`${iddetalle}-${campo}`} // ✅ clave única por fila + campo
      value={value || ''}
      onChange={(e) => handleCambioCampo(iddetalle, campo, e.target.value)}
    >
      <option value=''>--</option>
      {opciones.map(item => (
        <option key={`${campo}-${item.id}`} value={item.id}>
          {item.valor || item.nombre}
        </option>
      ))}
    </select>
  );
};

const calcularPesos = async (idfactura) => {
  try {
    await axios.post(`http://localhost:5000/factura-detalle/calcular-pesos/${idfactura}`);
    alert('✅ Pesos calculados correctamente');

    // 🔁 Recargar datos de la factura (si tienes la función disponible)
    refrescarDetalleFactura();
  } catch (error) {
    console.error('❌ Error al calcular pesos:', error);
    alert('❌ Error al calcular pesos');
  }
};

const refrescarDetalleFactura = async () => {
  if (!facturaSeleccionada) return;
  try {
    const response = await api.get(`/factura-detalle/${facturaSeleccionada.idfactura}`);
    const detallesConResaltado = response.data.map(item => ({
      ...item,
      resaltado: item.idmix === parseInt(localStorage.getItem('resaltarMix'))
    }));
    localStorage.removeItem('resaltarMix');
    setDetalles(detallesConResaltado);
  } catch (error) {
    console.error('❌ Error al refrescar detalles:', error);
  }
};

 return (
    <div>
      <div style={{ marginTop: '30px' }}></div>
      <h3>🧾 Consulta y edición de Factura</h3>
      <select onChange={handleSeleccionFactura} value={facturaSeleccionada?.idfactura || ''}>
        <option value=''>-- Selecciona una factura --</option>
        {facturas.map(f => (
          <option key={f.idfactura} value={f.idfactura}>
            {f.numero_factura} | {f.cliente} | {f.fecha?.substring(0, 10)}
          </option>
        ))}
      </select>

      {facturaSeleccionada && (
        <div className='form-card' style={{ marginTop: '1rem' }}>
          <div className="form-group" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={form.numero_factura}
              readOnly
              style={{ backgroundColor: '#f0f0f0' }}
            />
            <input
              type="date"
              value={form.fecha}
              onChange={e => handleActualizarCampoEncabezado('fecha', e.target.value)}
            />
            <input
              type="date"
              value={form.fecha_vuelo}
              onChange={e => handleActualizarCampoEncabezado('fecha_vuelo', e.target.value)}
            />
            <input
              placeholder="AWB"
              value={form.awb}
              onChange={e => handleActualizarCampoEncabezado('awb', e.target.value)}
            />
            <input
              placeholder="HAWB"
              value={form.hawb}
              onChange={e => handleActualizarCampoEncabezado('hawb', e.target.value)}
            />
            <select value={form.idcarguera} onChange={e => handleActualizarCampoEncabezado('idcarguera', e.target.value)}>
              <option value="">-- Carguera --</option>
              {catalogo.filter(c => c.categoria === 'carguera').map(item => (
                <option key={item.id} value={item.id}>{item.valor}</option>
              ))}
            </select>
            <select value={form.iddae} onChange={e => handleActualizarCampoEncabezado('iddae', e.target.value)}>
              <option value="">-- DAE --</option>
              {catalogo.filter(c => c.categoria === 'dae').map(item => (
                <option key={item.id} value={item.id}>{item.valor}</option>
              ))}
            </select>
            <button onClick={() => setModalAwbVisible(true)}>
            ✈️ Asignar AWB por grupo
            </button>
            <button onClick={() => calcularPesos(facturaSeleccionada?.idfactura)}>Calcular Pesos</button>
           </div>
        </div>
      )}

      {detalles.length > 0 && (
        <div className='table-responsive'>
          <table>
            <thead>
              <tr>
                <th>Mix</th>
                <th>Código</th>
                <th>Grupo</th>
                <th>Proveedor</th>
                <th>Producto</th>
                <th>Variedad</th>
                <th>Longitud</th>
                <th>Tipo Caja</th>
                <th>Cant.</th>
                <th>Ramos</th>
                <th>Empaque</th>
                <th>Tallos</th>
                <th>Precio</th>
                <th>Subtotal</th>
                <th>Peso</th>
                <th>Doc. Prov.</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Tipo Pedido</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((d) => (
                <tr
                  key={d.iddetalle}
                  onClick={() => setFilaActiva(d.iddetalle)}
                  className={`${filaActiva === d.iddetalle ? 'fila-activa-factura' : ''} ${d.resaltado ? 'fila-mix-resaltada' : ''}`}
                >
                  <td>
                  <button type="button" onClick={() => handleCrearMix(d)}>🧃</button>
                  </td>
                  <td><input value={d.codigo || ''} onChange={e => handleCambioCampo(d.iddetalle, 'codigo', e.target.value)} /></td>
                  <td>{renderSelect(d.idgrupo, 'grupo', d.iddetalle, 'idgrupo')}</td>
                  <td>{renderSelect(d.idproveedor, 'proveedor', d.iddetalle, 'idproveedor')}</td>
                  <td>{renderSelect(d.idproducto, 'producto', d.iddetalle, 'idproducto')}</td>
                  <td>{renderSelect(d.idvariedad, 'variedad', d.iddetalle, 'idvariedad')}</td>
                  <td>{renderSelect(d.idlongitud, 'longitud', d.iddetalle, 'idlongitud')}</td>
                  <td>{renderSelect(d.idtipocaja, 'tipocaja', d.iddetalle, 'idtipocaja')}</td>
                  <td><input value={d.cantidad} onChange={e => handleCambioCampo(d.iddetalle, 'cantidad', e.target.value)} /></td>
                  <td><input value={d.cantidadRamos} onChange={e => handleCambioCampo(d.iddetalle, 'cantidadRamos', e.target.value)} /></td>
                  <td>{renderSelect(d.idempaque, 'empaque', d.iddetalle, 'idempaque')}</td>
                  <td><input value={d.cantidadTallos} onChange={e => handleCambioCampo(d.iddetalle, 'cantidadTallos', e.target.value)} /></td>
                  <td><input value={d.precio_unitario} onChange={e => handleCambioCampo(d.iddetalle, 'precio_unitario', e.target.value)} /></td>
                  <td><input value={d.subtotal} onChange={e => handleCambioCampo(d.iddetalle, 'subtotal', e.target.value)} /></td>
                  <td>
                    <input
                      type="number"
                      value={d.peso}
                      onChange={(e) => handleCambioCampo(d.iddetalle, 'peso', e.target.value)}
                    />
                  </td>
                  <td><input value={d.documento_proveedor || ''} onChange={e => handleCambioCampo(d.iddetalle, 'documento_proveedor', e.target.value)} /></td>
                  <td>{d.idusuario}</td>
                  <td>{d.fechacompra?.substring(0, 10)}</td>
                  <td>{renderSelect(d.idOrder, 'tipopedido', d.iddetalle, 'idOrder')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                <td colSpan={8} style={{ textAlign: 'right' }}>Totales:</td>
                <td>{detalles.reduce((sum, d) => sum + Number(d.cantidad || 0), 0)}</td>
                <td>{detalles.reduce((sum, d) => sum + Number(d.cantidadRamos || 0), 0)}</td>
                <td></td>
                <td>{detalles.reduce((sum, d) => sum + Number(d.cantidadTallos || 0), 0)}</td>
                <td></td>
                <td>{detalles.reduce((sum, d) => sum + Number(d.subtotal || 0), 0).toFixed(2)}</td>
                <td>{detalles.reduce((sum, d) => sum + Number(d.peso || 0), 0).toFixed(2)}</td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {modalAwbVisible && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Asignar AWB por grupo</h4>
            <input
              type="text"
              placeholder="AWB (ej: 045-2525-2525)"
              value={awbForm.awb}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, ''); // quitar todo excepto números
                let formatted = raw;

                if (raw.length > 3 && raw.length <= 7) {
                  formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
                } else if (raw.length > 7) {
                  formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
                }

                setAwbForm({ ...awbForm, awb: formatted });
              }}
              maxLength={14}
            />
            <select
              value={awbForm.grupo}
              onChange={(e) => setAwbForm({ ...awbForm, grupo: e.target.value })}
            >
              <option value="">-- Selecciona Grupo --</option>
              {gruposUnicos.map(idgrupo => {
                const grupoInfo = catalogo.find(c => c.id === idgrupo && c.categoria === 'grupo');
                return (
                  <option key={idgrupo} value={idgrupo}>
                    {grupoInfo ? grupoInfo.valor : `Grupo ${idgrupo}`}
                  </option>
                );
            })}
            </select>
            <div style={{ marginTop: '1rem' }}>
              <button onClick={async () => {
                try {
                  await api.put('/asignar-awb', {
                    idfactura: facturaSeleccionada.idfactura,
                    grupo: awbForm.grupo,
                    awb: awbForm.awb.replace(/-/g, '') // 👈 esto guarda como 04525252525
                  });
                  const res = await api.get(`/factura-detalle/${facturaSeleccionada.idfactura}`);
                  setDetalles(res.data);

                  alert(`✅ AWB asignado correctamente al grupo ${awbForm.grupo}`);
                  setModalAwbVisible(false);
                } catch (err) {
                  console.error('❌ Error al asignar AWB:', err);
                  alert('❌ Ocurrió un error al asignar el AWB');
                }
              }}>
                Guardar
              </button>
              <button onClick={() => setModalAwbVisible(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {modalVisible && (
  <div className="modal-overlay">
    <ModalCajaMixta
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
      detalleOriginal={detalleSeleccionado}
      refrescar={refrescarDetalleFactura}
    />
  </div>
)}
    </div>
);
}

export default FacturaDetalleEditable;
