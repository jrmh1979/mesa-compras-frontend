import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';

function Sidebar() {
  const [categorias, setCategorias] = useState([]);
  const [adminAbierto, setAdminAbierto] = useState(false);
  const [tercerosAbierto, setTercerosAbierto] = useState(false);
  const [procesoAbierto, setProcesoAbierto] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function cargarCategorias() {
      try {
        const res = await api.get('/catalogo-simple/categorias');
        setCategorias(res.data);
      } catch (err) {
        console.error('❌ Error al cargar categorías:', err);
      }
    }
    cargarCategorias();
  }, []);

  const excluir = ['no_usar', 'interno'];

  const isActive = (pathStart) => location.pathname.startsWith(pathStart);

  return (
    <div className="sidebar">
      <div style={{ marginTop: '2rem' }}></div>
      <h3>📚 Menú</h3>

      {/* Proceso */}
      <button onClick={() => setProcesoAbierto(!procesoAbierto)}>
        📦 Proceso {procesoAbierto ? '▲' : '▼'}
      </button>
      {procesoAbierto && (
        <ul>
          <li><Link className={isActive('/crear-pedido') ? 'active-link' : ''} to="/crear-pedido">📝 Crear Pedido</Link></li>
          <li><Link className={isActive('/pedidos') ? 'active-link' : ''} to="/pedidos">📦 Pedidos</Link></li>
          <li><Link className={isActive('/facturas') ? 'active-link' : ''} to="/facturas">📁 Facturas</Link></li>
        </ul>
      )}

      {/* Terceros */}
      <button onClick={() => setTercerosAbierto(!tercerosAbierto)}>
        👥 Terceros {tercerosAbierto ? '▲' : '▼'}
      </button>
      {tercerosAbierto && (
        <ul>
          <li><Link className={location.search.includes('cliente') ? 'active-link' : ''} to="/terceros?tipo=cliente">🧑‍💼 Clientes</Link></li>
          <li><Link className={location.search.includes('proveedor') ? 'active-link' : ''} to="/terceros?tipo=proveedor">🚛 Proveedores</Link></li>
        </ul>
      )}

      {/* Administración */}
      <button onClick={() => setAdminAbierto(!adminAbierto)}>
        ⚙️ Administración {adminAbierto ? '▲' : '▼'}
      </button>
      {adminAbierto && (
        <ul>
          {categorias
            .filter(cat => !excluir.includes(cat))
            .map(cat => (
              <li key={cat}>
                <Link
                  className={location.search.includes(cat) ? 'active-link' : ''}
                  to={`/catalogo?categoria=${cat}`}
                >
                  📌 {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Link>
              </li>
            ))
          }
        </ul>
      )}

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #444' }}>
        <Link to="/logout">🔓 Cerrar sesión</Link>
      </div>
    </div>
  );
}

export default Sidebar;