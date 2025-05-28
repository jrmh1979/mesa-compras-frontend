import { useSession } from '../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from '../components/Sidebar';

function Dashboard() {
  const { user, logout } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Botón hamburguesa flotante */}
      <button
        className="sidebar-toggle"
        onClick={() => {
          const sidebar = document.querySelector('.sidebar');
          if (sidebar) sidebar.classList.toggle('hidden');
        }}
      >
        ☰
      </button>

      <div className="dashboard-container">
        <Sidebar onLogout={handleLogout} />

        <main className="dashboard-main">
          <h2>Bienvenido, {user?.nombre || 'Usuario'}</h2>
          <p>Usa el menú lateral para comenzar.</p>
        </main>
      </div>
    </>
  );
}

export default Dashboard;
