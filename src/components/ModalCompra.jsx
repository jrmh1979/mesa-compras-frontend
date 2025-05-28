import { useEffect, useState } from 'react';
import api from '../services/api';
import { useSession } from '../context/SessionContext';

function ModalCompra({ visible, pedido, onClose, onCompraExitosa }) {
  const { user } = useSession(); // ✅ obtiene el usuario logueado
  const [tiposCaja, setTiposCaja] = useState([]);
  const [form, setForm] = useState({
    idtipocaja: '',
    cantidad: pedido?.cantidad || 0,
    precio_unitario: ''
  });

  useEffect(() => {
    setForm({
      idtipocaja: '',
      cantidad: pedido?.cantidad || 0,
      precio_unitario: ''
    });
  }, [pedido]);

  useEffect(() => {
    const fetchTiposCaja = async () => {
      try {
        // ✅ Corrección aplicada: filtra por categoría en el backend
        const res = await api.get('/catalogo-simple?categoria=tipocaja');
        setTiposCaja(res.data);
      } catch (err) {
        console.error('❌ Error al cargar tipos de caja:', err);
      }
    };

    fetchTiposCaja();
  }, []);

  if (!visible || !pedido) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    const cantidad = parseFloat(form.cantidad);
    const precio_unitario = parseFloat(form.precio_unitario);
    const tallos = parseFloat(pedido.tallos || 0);

    if (!form.idtipocaja || isNaN(cantidad) || cantidad <= 0 || isNaN(precio_unitario)) {
      alert('⚠️ Por favor completa todos los campos correctamente');
      return;
    }

    try {
      // ✅ Corrección aquí: se filtra por categoría empaque para evitar error 400
      const catalogo = await api.get('/catalogo-simple?categoria=empaque');
      const valorEmpaque = catalogo.data.find(c => c.id === pedido.idempaque)?.valor || '1';
      const valorNumericoEmpaque = parseFloat(valorEmpaque.replace(',', '.')) || 1;

      const cantidadTallos = cantidad * tallos;
      const cantidadRamos = cantidadTallos / valorNumericoEmpaque;
      const subtotal = cantidadTallos * precio_unitario;

      const datosCompra = {
        idfactura: pedido.idfactura,
        idpedido: pedido.idpedido,
        codigo: pedido.codigo,
        idproveedor: pedido.idproveedor,
        idproducto: pedido.idproducto,
        idvariedad: pedido.idvariedad,
        idlongitud: pedido.idlongitud,
        idempaque: pedido.idempaque,
        idtipocaja: parseInt(form.idtipocaja),
        cantidad,
        precio_unitario,
        cantidadTallos,
        cantidadRamos,
        subtotal,
        idusuario: user?.idusuario || null,
        fechacompra: new Date().toISOString().slice(0, 19).replace('T', ' '),
        tallos: pedido.tallos
      };

      console.log('📦 Enviando datos de compra:', datosCompra);
      const res = await api.post('/confirmar-compra', datosCompra);

      if (res.data?.success) {
        alert(res.data.message || '✅ Compra registrada');
        onCompraExitosa();
        onClose();
      } else {
        throw new Error('La respuesta no fue exitosa');
      }
    } catch (err) {
      console.error('❌ Error al confirmar compra:', err);
      alert('❌ No se pudo registrar la compra');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Confirmar Compra</h3>

        <label>Tipo de caja:</label>
        <select name="idtipocaja" value={form.idtipocaja} onChange={handleChange}>
          <option value="">-- Selecciona --</option>
          {tiposCaja.map(caja => (
            <option key={caja.id} value={caja.id}>{caja.valor}</option>
          ))}
        </select>

        <label>Cantidad de cajas:</label>
        <input
          type="number"
          name="cantidad"
          value={form.cantidad}
          min={1}
          onChange={handleChange}
          required
        />

        <label>Precio unitario ($):</label>
        <input
          type="number"
          name="precio_unitario"
          value={form.precio_unitario}
          step="0.01"
          onChange={handleChange}
        />

        <div className="modal-buttons">
          <button onClick={handleSubmit}>Guardar</button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default ModalCompra;
