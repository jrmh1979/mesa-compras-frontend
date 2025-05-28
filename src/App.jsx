import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider, useSession } from './context/SessionContext';
import LoginForm from './components/LoginForm';
import Dashboard from './pages/Dashboard';
import PedidosLista from './components/PedidosLista';
import TercerosForm from './components/TercerosForm';
import CatalogoFormulario from './components/CatalogoFormulario';
import FacturaForm from './components/FacturaForm';
import FacturaDetalleEditable from './components/FacturaDetalleEditable';
import Layout from './components/Layout';
import './assets/style.css';

function ProtectedRoute({ children }) {
  const { user } = useSession();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <SessionProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/crear-pedido" element={
            <ProtectedRoute>
              <FacturaForm />
            </ProtectedRoute>
          } />

          <Route path="/pedidos" element={
            <ProtectedRoute>
              <PedidosLista />
            </ProtectedRoute>
          } />

          <Route path="/facturas" element={
            <ProtectedRoute>
              <FacturaDetalleEditable />
            </ProtectedRoute>
          } />

          <Route path="/terceros" element={
            <ProtectedRoute>
              <TercerosForm />
            </ProtectedRoute>
          } />

          <Route path="/catalogo" element={
            <ProtectedRoute>
              <CatalogoFormulario />
            </ProtectedRoute>
          } />

          {/* Redirige cualquier ruta desconocida al login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </SessionProvider>
  );
}

export default App;
