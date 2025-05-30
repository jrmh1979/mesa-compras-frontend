import { useEffect, useState } from 'react';
import api from '../services/api';
import { useSession } from '../context/SessionContext';

function ModalCompraLote({ visible, pedidosSeleccionados, onClose, onCompraExitosa }) {
  const { user } = useSession();
  const [tiposCaja, setTiposCaja] = useState([]);
  const [registros, setRegistros] = useState([]);

  useEffect(() => {
    if (visible && pedidosSeleccionados.length > 0) {
      const copia = pedidosSeleccionados.map(p => ({
        ...p,
        precio_unitario: '',
        cantidad: p.cantidad || 1,
        cantidadAnterior: p.cantidad || 1,
        idtipocaja: p.idtipocaja || ''
      }));
      setRegistros(copia);
    }
  }, [visible, pedidosSeleccionados]);

  useEffect(() => {
    const fetchTiposCaja = async () => {
      try {
        const res = await api.get('/catalogo-simple?categoria=tipocaja');
        setTiposCaja(res.data);
      } catch (err) {
        console.error('❌ Error al cargar tipos de caja:', err);
      }
    };
    fetchTiposCaja();
  }, []);

  const handleChange = (index, campo, valor) => {
    setRegistros(prev => {
      const actualizados = [...prev];
      const registro = { ...actualizados[index] };

      if (campo === 'cantidad') {
        const nuevaCantidad = parseFloat(valor);
        if (isNaN(nuevaCantidad) || nuevaCantidad <= 0) return prev;

        if (nuevaCantidad > registro.cantidadAnterior) {
          alert('⚠️ No puedes comprar más cajas de las pedidas.');
          registro.cantidad = registro.cantidadAnterior;
        } else {
          registro.cantidad = nuevaCantidad;
        }
      } else {
        registro[campo] = valor;
      }

      actualizados[index] = registro;
      return actualizados;
    });
  };

  const handleGuardar = async () => {
    try {
      const catalogoEmpaque = await api.get('/catalogo-simple?categoria=empaque');

      const compras = registros.map(p => {
        const valorEmpaque = catalogoEmpaque.data.find(c => c.id === p.idempaque)?.valor || '1';
        const valorNumericoEmpaque = parseFloat(valorEmpaque.replace(',', '.')) || 1;

        const cantidadTallos = p.cantidad * p.tallos;
        const cantidadRamos = cantidadTallos / valorNumericoEmpaque;
        const subtotal = cantidadTallos * parseFloat(p.precio_unitario);

        return {
          idfactura: p.idfactura,
          idpedido: p.idpedido,
          codigo: p.codigo,
          idproveedor: p.idproveedor,
          idproducto: p.idproducto,
          idvariedad: p.idvariedad,
          idlongitud: p.idlongitud,
          idempaque: p.idempaque,
          idtipocaja: parseInt(p.idtipocaja),
          cantidad: p.cantidad,
          precio_unitario: parseFloat(p.precio_unitario),
          cantidadTallos,
          cantidadRamos,
          subtotal,
          idusuario: user?.idusuario || null,
          fechacompra: new Date().toISOString().slice(0, 19).replace('T', ' '),
          tallos: p.tallos
        };
      });

      const res = await api.post('/comprar-multiple', { compras });

      if (res.data?.success) {
        alert(res.data.message || '✅ Compras registradas');
        onCompraExitosa();
        onClose();
      } else {
        throw new Error('La respuesta no fue exitosa');
      }
    } catch (err) {
      console.error('❌ Error al guardar compras múltiples:', err);
      alert('❌ No se pudo registrar la compra múltiple');
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-xl">
        <h3>Compra por selección</h3>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Variedad</th>
              <th>Long.</th>
              <th>Emp.</th>
              <th>T. Caja</th>
              <th>Cant.</th>
              <th>Precio ($)</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((p, index) => (
              <tr key={p.idpedido}>
                <td>{p.producto}</td>
                <td>{p.variedad}</td>
                <td>{p.longitud}</td>
                <td>{p.empaque}</td>
                <td>
                  <select
                    value={p.idtipocaja}
                    onChange={e => handleChange(index, 'idtipocaja', e.target.value)}
                  >
                    <option value=''>--</option>
                    {tiposCaja.map(tc => (
                      <option key={tc.id} value={tc.id}>{tc.valor}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={p.cantidad}
                    onChange={e => handleChange(index, 'cantidad', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={p.precio_unitario}
                    onChange={e => handleChange(index, 'precio_unitario', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="modal-buttons">
          <button onClick={handleGuardar}>Guardar compras</button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default ModalCompraLote;