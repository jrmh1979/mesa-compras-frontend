import { useEffect, useState } from 'react';
import api from '../services/api';
import { useLocation } from 'react-router-dom';

function TercerosForm() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const tipo = query.get('tipo') || 'cliente';

  const [terceros, setTerceros] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditar, setIdEditar] = useState(null);

  const cargarTerceros = async () => {
    try {
      const res = await api.get(`/terceros?tipo=${tipo}`);
      setTerceros(res.data);
    } catch (err) {
      console.error(`Error al cargar ${tipo}s:`, err);
    }
  };

  useEffect(() => {
    cargarTerceros();
  }, [tipo, location.search]);

  const guardarTercero = async () => {
    if (!nombre.trim()) {
      alert('⚠️ Ingresa un nombre válido');
      return;
    }

    try {
      if (modoEdicion) {
        await api.put(`/terceros/${idEditar}`, { nombre, telefono, correo });
      } else {
        await api.post('/terceros', { nombre, telefono, correo, tipo });
      }
      setNombre('');
      setTelefono('');
      setCorreo('');
      setModoEdicion(false);
      setIdEditar(null);
      cargarTerceros();
    } catch (err) {
      console.error('❌ Error al guardar tercero:', err);
      alert('❌ Error al guardar tercero');
    }
  };

  const editar = (tercero) => {
    setNombre(tercero.nombre || '');
    setTelefono(tercero.telefono || '');
    setCorreo(tercero.correo || '');
    setModoEdicion(true);
    setIdEditar(tercero.idtercero);
  };

  const filtrados = terceros.filter(t =>
    t.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div style={{ padding: '1rem' }}>
      <h2>{tipo === 'cliente' ? '👤 Clientes' : '🚚 Proveedores'}</h2>

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <table border={1} cellPadding={5}>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Correo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((t, i) => (
            <tr key={t.idtercero}>
              <td>{i + 1}</td>
              <td>{t.nombre}</td>
              <td>{t.telefono}</td>
              <td>{t.correo}</td>
              <td>
                <button onClick={() => editar(t)}>✏️ Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <h3>{modoEdicion ? 'Editar' : 'Agregar'} {tipo}</h3>
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      /><br />
      <input
        type="text"
        placeholder="Teléfono"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
      /><br />
      <input
        type="email"
        placeholder="Correo"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
      /><br />

      <button onClick={guardarTercero}>
        {modoEdicion ? 'Actualizar' : 'Agregar'}
      </button>
    </div>
  );
}

export default TercerosForm;
