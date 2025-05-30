// src/components/ImportadorExcel.jsx
import { useState, useRef } from 'react';
import api from '../services/api';

function ImportadorExcel({ idfactura }) {
  const [mensaje, setMensaje] = useState('');
  const inputRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const archivo = inputRef.current.files[0];

    if (!archivo || !idfactura) {
      alert('Selecciona un archivo y asegúrate de tener una factura activa.');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('idfactura', idfactura);

    try {
      const res = await api.post('/importar-pedidos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMensaje(res.data);
      inputRef.current.value = '';
    } catch (err) {
      setMensaje('❌ Error al importar pedidos: ' + (err.response?.data || err.message));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
      <h3>📥 Importar archivo de pedidos (.xlsx)</h3>
      <input type="file" accept=".xlsx" ref={inputRef} required />
      <button type="submit">Subir y migrar</button>
      {mensaje && <p>{mensaje}</p>}
    </form>
  );
}

export default ImportadorExcel;