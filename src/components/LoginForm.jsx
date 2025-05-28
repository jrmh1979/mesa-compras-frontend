// src/components/LoginForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import api from '../services/api';

function LoginForm() {
  const [form, setForm] = useState({ correo: '', contrasena: '' });
  const { login } = useSession();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/login', form);
      login(res.data); // ✅ Guarda { idusuario, nombre }
      navigate('/dashboard');
    } catch (err) {
      alert('❌ Error al iniciar sesión: ' + (err.response?.data || err.message));
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <img src="/logo.png" alt="Logo" className="logo" /> {/* ✅ Logo arriba */}
        <h2>Iniciar Sesión</h2>

        <input
          className="login-input"
          type="email"
          name="correo"
          placeholder="Correo"
          value={form.correo}
          onChange={handleChange}
          required
        />
        <input
          className="login-input"
          type="password"
          name="contrasena"
          placeholder="Contraseña"
          value={form.contrasena}
          onChange={handleChange}
          required
        />
        <button className="login-card-button" type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default LoginForm;
