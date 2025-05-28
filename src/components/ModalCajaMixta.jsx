// ModalCajaMixta.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ModalCajaMixta = ({ visible, onClose, detalleOriginal, refrescar }) => {
  const [filas, setFilas] = useState([]);
  const [catalogos, setCatalogos] = useState({ productos: [], variedades: [], longitudes: [], empaques: [] });

  useEffect(() => {
    if (visible) {
      setFilas([]); // iniciar vacío
      fetchCatalogos();
    }
  }, [visible]);

  const fetchCatalogos = async () => {
    const [productos, variedades, longitudes, empaques] = await Promise.all([
      api.get('/catalogo-simple?categoria=producto'),
      api.get('/catalogo-simple?categoria=variedad'),
      api.get('/catalogo-simple?categoria=longitud'),
      api.get('/catalogo-simple?categoria=empaque'),
    ]);
    setCatalogos({
      productos: productos.data,
      variedades: variedades.data,
      longitudes: longitudes.data,
      empaques: empaques.data,
    });
  };

  const agregarFila = () => {
    setFilas([...filas, {
      idproducto: '', idvariedad: '', idlongitud: '', idempaque: '',
      cantidad: 1, cantidadRamos: 1, precio_unitario: 0, precio_venta: 0
    }]);
  };

  const eliminarFila = (index) => {
    const nuevasFilas = [...filas];
    nuevasFilas.splice(index, 1);
    setFilas(nuevasFilas);
  };

  const actualizarCampo = (index, campo, valor) => {
    const nuevasFilas = [...filas];
    nuevasFilas[index][campo] = valor;
    setFilas(nuevasFilas);
  };

  const valorEmpaque = (idempaque) => {
    const e = catalogos.empaques.find(emp => emp.id === parseInt(idempaque));
    return e ? parseFloat(e.valor) : 1;
  };

  const calcularTotales = (fila) => {
    const cantidad = parseFloat(fila.cantidad || 0);
    const cantidadRamos = parseFloat(fila.cantidadRamos || 0);
    const precio_unitario = parseFloat(fila.precio_unitario || 0);
    const empaqueValor = valorEmpaque(fila.idempaque);
    const cantidadTallos = cantidad * cantidadRamos * empaqueValor;
    const subtotal = cantidadTallos * precio_unitario;
    return { cantidadTallos, subtotal };
  };

  const guardarMix = async () => {
    const mixItems = filas.map(fila => {
      const { cantidadTallos, subtotal } = calcularTotales(fila);
      return {
        ...fila,
        idfactura: detalleOriginal.idfactura,
        codigo: detalleOriginal.codigo,
        idpedido: detalleOriginal.iddetalle,
        idgrupo: detalleOriginal.idgrupo || 5,
        idproveedor: detalleOriginal.idproveedor,
        tipo_caja_variedad: detalleOriginal.idtipocaja,
        documento_proveedor: detalleOriginal.documento_proveedor,
        idusuario: detalleOriginal.idusuario,
        fechacompra: detalleOriginal.fechacompra,
        cantidadTallos,
        subtotal
      };
    });

    try {
      await api.post('/factura-detalle/crear-mixta', {
        iddetalle_original: detalleOriginal.iddetalle,
        mixItems
      });

      localStorage.setItem('resaltarMix', detalleOriginal.iddetalle);
      alert('✅ Caja mixta guardada correctamente.');
      await refrescar();
      onClose();
    } catch (error) {
      console.error('❌ Error al guardar mix:', error);
      alert('❌ Error al guardar la caja mixta');
    }
  };

  if (!visible) return null;

  return (
    <div className="modal mix">
      <h3>Crear Caja Mixta</h3>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Variedad</th>
            <th>Longitud</th>
            <th>Empaque</th>
            <th>Cajas</th>
            <th>Ramos</th>
            <th>Precio U.</th>
            <th>Total Tallos</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, index) => {
            const { cantidadTallos, subtotal } = calcularTotales(fila);
            return (
              <tr key={index}>
                <td>
                  <select value={fila.idproducto} onChange={e => actualizarCampo(index, 'idproducto', e.target.value)}>
                    <option value="">--</option>
                    {catalogos.productos.map(p => (
                      <option key={p.id} value={p.id}>{p.valor}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select value={fila.idvariedad} onChange={e => actualizarCampo(index, 'idvariedad', e.target.value)}>
                    <option value="">--</option>
                    {catalogos.variedades.map(v => (
                      <option key={v.id} value={v.id}>{v.valor}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select value={fila.idlongitud} onChange={e => actualizarCampo(index, 'idlongitud', e.target.value)}>
                    <option value="">--</option>
                    {catalogos.longitudes.map(l => (
                      <option key={l.id} value={l.id}>{l.valor}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select value={fila.idempaque} onChange={e => actualizarCampo(index, 'idempaque', e.target.value)}>
                    <option value="">--</option>
                    {catalogos.empaques.map(em => (
                      <option key={em.id} value={em.id}>{em.valor}</option>
                    ))}
                  </select>
                </td>
                <td><input type="number" value={fila.cantidad} onChange={e => actualizarCampo(index, 'cantidad', e.target.value)} /></td>
                <td><input type="number" value={fila.cantidadRamos} onChange={e => actualizarCampo(index, 'cantidadRamos', e.target.value)} /></td>
                <td><input type="number" value={fila.precio_unitario} onChange={e => actualizarCampo(index, 'precio_unitario', e.target.value)} /></td>
                <td>{cantidadTallos}</td>
                <td>{subtotal.toFixed(2)}</td>
                <td><button type="button" onClick={() => eliminarFila(index)}>🗑️</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button type="button" onClick={agregarFila}>+ Agregar Variedad</button>
      <button type="button" onClick={guardarMix}>Guardar Mix</button>
      <button type="button" onClick={onClose}>Cerrar</button>
    </div>
  );
};

export default ModalCajaMixta;