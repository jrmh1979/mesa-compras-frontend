import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

function CatalogoFormulario() {
  const [searchParams] = useSearchParams();
  const categoria = searchParams.get('categoria');

  const [registros, setRegistros] = useState([]);
  const [nuevo, setNuevo] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [valorEditado, setValorEditado] = useState('');

  useEffect(() => {
    if (!categoria) return;
    api.get(`/catalogo-simple?categoria=${categoria}`)
      .then(res => setRegistros(res.data))
      .catch(err => console.error('❌ Error al cargar registros:', err));
  }, [categoria]);

  const agregarRegistro = async () => {
    if (!nuevo.trim()) return;
    try {
      await api.post('/catalogo-simple', { categoria, valor: nuevo });
      setNuevo('');
      const res = await api.get(`/catalogo-simple?categoria=${categoria}`);
      setRegistros(res.data);
    } catch (err) {
      console.error('❌ Error al agregar:', err);
    }
  };

  const eliminarRegistro = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      await api.delete(`/catalogo-simple/${id}`);
      setRegistros(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('❌ Error al eliminar:', err);
    }
  };

  const guardarEdicion = async (id) => {
    try {
      await api.put(`/catalogo-simple/${id}`, { campo: 'valor', valor: valorEditado });
      setEditandoId(null);
      const res = await api.get(`/catalogo-simple?categoria=${categoria}`);
      setRegistros(res.data);
    } catch (err) {
      console.error('❌ Error al editar:', err);
    }
  };

  const nombreCapitalizado = categoria?.charAt(0).toUpperCase() + categoria?.slice(1);

  return (
    <div className="form-card">
      <h3>📚 Catálogo de {nombreCapitalizado || '...'}</h3>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          placeholder="Nuevo valor"
          value={nuevo}
          onChange={e => setNuevo(e.target.value)}
        />
        <button onClick={agregarRegistro}>➕ Agregar</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Valor</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>
                {editandoId === r.id ? (
                  <input
                    value={valorEditado}
                    onChange={e => setValorEditado(e.target.value)}
                    autoFocus
                  />
                ) : (
                  r.valor
                )}
              </td>
              <td>
                {editandoId === r.id ? (
                  <>
                    <button onClick={() => guardarEdicion(r.id)}>💾</button>
                    <button onClick={() => setEditandoId(null)}>❌</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => {
                      setEditandoId(r.id);
                      setValorEditado(r.valor);
                    }}>✏️</button>
                    <button onClick={() => eliminarRegistro(r.id)}>🗑</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CatalogoFormulario;
