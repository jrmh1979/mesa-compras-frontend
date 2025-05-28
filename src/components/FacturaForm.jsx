import { useState, useEffect } from 'react';
import api from '../services/api';
import ImportadorExcel from './ImportadorExcel';
import ImportadorVilnius from './ImportadorVilnius';

function FacturaForm() {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({
    numero_factura: '',
    idcliente: '',
    fecha: '',
    fecha_vuelo: ''
  });
  const [idFacturaCreada, setIdFacturaCreada] = useState(null);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await api.get('/terceros?tipo=cliente');
        const clientesConId = res.data.map(c => ({
          ...c,
          idtercero: c.idtercero || c.id
        }));
        setClientes(clientesConId);
      } catch (err) {
        console.error('❌ Error al cargar clientes:', err);
      }
    };

    fetchClientes();
  }, []);

  useEffect(() => {
    const asignarNumeroFactura = async () => {
      if (form.idcliente && (!form.numero_factura || form.numero_factura === '0')) {
        try {
          const res = await api.get('/factura/max-numero');
          const siguiente = (res.data.max || 0) + 1;
          setForm(prev => ({ ...prev, numero_factura: siguiente }));
        } catch (err) {
          console.error('❌ Error al obtener número de factura:', err);
        }
      }
    };

    asignarNumeroFactura();
  }, [form.idcliente, form.numero_factura]); // ✅ se agregó form.numero_factura para eliminar el warning

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      idcliente: parseInt(form.idcliente),
    };

    try {
      const res = await api.post('/factura', payload);
      alert(res.data.message);
      setIdFacturaCreada(res.data.idFactura);

      setForm({
        numero_factura: '',
        idcliente: '',
        fecha: '',
        fecha_vuelo: ''
      });
    } catch (err) {
      console.error('❌ Error al registrar factura:', err);
      alert('❌ Error al registrar factura');
    }
  };

  return (
    <>
      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Crear Solicitud de Pedido</h2>
        <div className="form-group">
          <input
            type="number"
            name="numero_factura"
            placeholder="Número de pedido"
            value={form.numero_factura}
            onChange={handleChange}
            required
          />

          <select name="idcliente" value={form.idcliente} onChange={handleChange} required>
            <option value="">-- Selecciona Cliente --</option>
            {clientes.map(c => (
              <option key={`cliente-${c.idtercero}`} value={c.idtercero}>{c.nombre}</option>
            ))}
          </select>

          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            required
          />

          <input
            type="date"
            name="fecha_vuelo"
            value={form.fecha_vuelo}
            onChange={handleChange}
          />

          <button type="submit">Guardar</button>
        </div>
      </form>

      {idFacturaCreada && (
        <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
          <div style={{ flex: 1 }}>
            <ImportadorExcel idfactura={idFacturaCreada} />
          </div>
          <div style={{ flex: 1 }}>
            <ImportadorVilnius idfactura={idFacturaCreada} />
          </div>
        </div>
      )}
    </>
  );
}

export default FacturaForm;
