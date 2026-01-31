import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "https://arpy-backend.vercel.app";

function calcular(costo, porcentaje) {
  const precio = costo * (1 + porcentaje / 100);
  return Math.round(precio);
}

function redondearDecenaMil(precio) {
  // Redondea hacia arriba a la decena de mil más cercana
  return Math.ceil(precio / 10000) * 10000;
}

function App() {
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState([]);
  const [resumenGeneral, setResumenGeneral] = useState(null);
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [vistaActual, setVistaActual] = useState("dashboard");
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensajeCarga, setMensajeCarga] = useState("");
  const [descuentoListaPrecios, setDescuentoListaPrecios] = useState(0);
  
  // Estados para modales
  const [modal, setModal] = useState({
    tipo: null, // 'alert', 'confirm', 'prompt', 'entrada'
    mensaje: '',
    onConfirm: null,
    inputValue: '',
    mostrar: false
  });
  
  // Estado para la venta actual
  const [ventaActual, setVentaActual] = useState({
    cliente_id: null,
    metodo_pago: 'contado',
    productos: [],
    fecha_venta: new Date().toISOString().slice(0, 16) // formato: YYYY-MM-DDTHH:mm
  });
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    telefono: '',
    direccion: ''
  });
  const [form, setForm] = useState({
    codigo: "",
    detalle: "",
    costo: "",
    porc_contado: "",
    porc_3_4: "",
    porc_6_7: "",
    porc_10: ""
  });

  useEffect(() => {
    cargarProductos();
    cargarClientes();
    if (vistaActual === 'historial-ventas') {
      cargarVentas();
    }
    if (vistaActual === 'cuentas-cobrar') {
      cargarCuentasPorCobrar();
    }
    if (vistaActual === 'dashboard') {
      cargarResumen();
    }
  }, [vistaActual]);

  useEffect(() => {
    const cerrarDropdown = (e) => {
      if (!e.target.closest('.autocomplete-wrapper')) {
        setMostrarListaClientes(false);
      }
    };
    document.addEventListener('click', cerrarDropdown);
    return () => document.removeEventListener('click', cerrarDropdown);
  }, []);

  const cargarProductos = async () => {
    try {
      setCargando(true);
      setMensajeCarga("Cargando productos...");
      const res = await fetch(`${API_URL}/productos`);
      const data = await res.json();
      setProductos(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
      mostrarAlerta("Error al cargar productos");
    } finally {
      setCargando(false);
    }
  };

  const cargarClientes = async () => {
    try {
      const res = await fetch(`${API_URL}/clientes`);
      const data = await res.json();
      setClientes(data);
    } catch (error) {
      console.error("Error cargando clientes:", error);
    }
  };

  const cargarVentas = async () => {
    try {
      setCargando(true);
      setMensajeCarga("Cargando historial de ventas...");
      const res = await fetch(`${API_URL}/ventas`);
      const data = await res.json();
      setVentas(data);
    } catch (error) {
      console.error("Error cargando ventas:", error);
      mostrarAlerta("Error al cargar ventas");
    } finally {
      setCargando(false);
    }
  };

  const cargarCuentasPorCobrar = async () => {
    try {
      setCargando(true);
      setMensajeCarga("Cargando cuentas por cobrar...");
      const res = await fetch(`${API_URL}/cuentas-por-cobrar`);
      const data = await res.json();
      setCuentasPorCobrar(data);
    } catch (error) {
      console.error("Error cargando cuentas:", error);
      mostrarAlerta("Error al cargar cuentas por cobrar");
    } finally {
      setCargando(false);
    }
  };

  const cargarResumen = async () => {
    try {
      setCargando(true);
      setMensajeCarga("Cargando resumen...");
      const res = await fetch(`${API_URL}/reportes/resumen`);
      const data = await res.json();
      setResumenGeneral(data);
    } catch (error) {
      console.error("Error cargando resumen:", error);
      mostrarAlerta("Error al cargar resumen");
    } finally {
      setCargando(false);
    }
  };

  const verDetalleVenta = async (id) => {
    try {
      setCargando(true);
      setMensajeCarga("Cargando detalle de venta...");
      const res = await fetch(`${API_URL}/ventas/${id}`);
      const data = await res.json();
      setVentaDetalle(data);
    } catch (error) {
      console.error("Error cargando detalle:", error);
      mostrarAlerta("Error al cargar detalle de venta");
    } finally {
      setCargando(false);
    }
  };

  const registrarPago = (ventaId) => {
    mostrarPromptEntrada(
      "¿Cuánto desea abonar?",
      async (monto) => {
        if (!monto || isNaN(monto) || monto <= 0) {
          mostrarAlerta("Monto inválido");
          return;
        }

        try {
          setCargando(true);
          setMensajeCarga("Registrando pago...");

          const response = await fetch(`${API_URL}/ventas/${ventaId}/pago`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              monto: Number(monto),
              metodo_pago: 'efectivo'
            })
          });

          const result = await response.json();

          if (!response.ok) {
            mostrarAlerta("Error: " + (result.error || "No se pudo registrar el pago"));
            return;
          }

          mostrarAlerta("Pago registrado exitosamente");
          cargarCuentasPorCobrar();
          if (ventaDetalle && ventaDetalle.id === ventaId) {
            verDetalleVenta(ventaId);
          }
        } catch (error) {
          mostrarAlerta("Error registrando pago");
          console.error(error);
        } finally {
          setCargando(false);
        }
      }
    );
  };

  const imprimirFactura = (venta) => {
    const ventanaImpresion = window.open('', '', 'width=800,height=600');
    ventanaImpresion.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Factura #${venta.id}</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #667eea; color: white; }
          .total { font-size: 20px; font-weight: bold; text-align: right; }
          .info { margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>FACTURA #${venta.id}</h1>
        <div class="info">
          <p><strong>Fecha:</strong> ${new Date(venta.created_at).toLocaleString('es-CO')}</p>
          <p><strong>Cliente:</strong> ${venta.cliente_nombre || 'Cliente General'}</p>
          <p><strong>Método de Pago:</strong> ${
            venta.metodo_pago === 'contado' ? 'Contado' :
            venta.metodo_pago === '3_4' ? '3-4 meses' :
            venta.metodo_pago === '6_7' ? '6-7 meses' : '10 meses'
          }</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${venta.productos.map(p => `
              <tr>
                <td>${p.codigo}</td>
                <td>${p.producto_detalle}</td>
                <td>${p.cantidad}</td>
                <td>${Number(p.precio_unitario).toLocaleString()}</td>
                <td>${Number(p.subtotal).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="total">TOTAL: ${Number(venta.total).toLocaleString()}</p>
        ${venta.estado_pago !== 'pagado' ? `
          <p><strong>Total Pagado:</strong> ${Number(venta.total_pagado).toLocaleString()}</p>
          <p><strong>Saldo Pendiente:</strong> ${Number(venta.saldo_pendiente).toLocaleString()}</p>
        ` : ''}
      </body>
      </html>
    `);
    ventanaImpresion.document.close();
    ventanaImpresion.print();
  };

  // Funciones para modales
  const mostrarAlerta = (mensaje) => {
    setModal({
      tipo: 'alert',
      mensaje,
      mostrar: true,
      onConfirm: () => cerrarModal()
    });
  };

  const mostrarConfirm = (mensaje, onConfirm) => {
    setModal({
      tipo: 'confirm',
      mensaje,
      mostrar: true,
      onConfirm
    });
  };

  const mostrarPromptEntrada = (titulo, onConfirm) => {
    setModal({
      tipo: 'entrada',
      mensaje: titulo,
      mostrar: true,
      inputValue: '',
      onConfirm
    });
  };

  const cerrarModal = () => {
    setModal({
      tipo: null,
      mensaje: '',
      onConfirm: null,
      inputValue: '',
      mostrar: false
    });
  };

  const handleModalConfirm = () => {
    if (modal.onConfirm) {
      if (modal.tipo === 'entrada') {
        modal.onConfirm(modal.inputValue);
      } else {
        modal.onConfirm();
      }
    }
    cerrarModal();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };

  const limpiarFormulario = () => {
    setForm({
      codigo: "",
      detalle: "",
      costo: "",
      porc_contado: "",
      porc_3_4: "",
      porc_6_7: "",
      porc_10: ""
    });
    setEditando(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.codigo || !form.detalle || !form.costo) {
      mostrarAlerta("Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      setCargando(true);
      setMensajeCarga(editando ? "Actualizando producto..." : "Guardando producto...");

      const data = {
        codigo: form.codigo,
        detalle: form.detalle,
        costo: Number(form.costo),
        porc_contado: Number(form.porc_contado) || 0,
        porc_3_4: Number(form.porc_3_4) || 0,
        porc_6_7: Number(form.porc_6_7) || 0,
        porc_10: Number(form.porc_10) || 0
      };

      let response;
      if (editando) {
        response = await fetch(`${API_URL}/productos/${editando}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
      } else {
        response = await fetch(`${API_URL}/productos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
      }

      const result = await response.json();

      if (!response.ok) {
        mostrarAlerta("Error: " + (result.error || "No se pudo guardar el producto"));
        return;
      }

      mostrarAlerta(editando ? "Producto actualizado exitosamente" : "Producto creado exitosamente");
      limpiarFormulario();
      cargarProductos();
      setVistaActual("inventario");
    } catch (error) {
      mostrarAlerta("Error guardando producto");
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const editarProducto = (producto) => {
    setForm({
      codigo: producto.codigo,
      detalle: producto.detalle,
      costo: producto.costo,
      porc_contado: producto.porc_contado,
      porc_3_4: producto.porc_3_4,
      porc_6_7: producto.porc_6_7,
      porc_10: producto.porc_10
    });
    setEditando(producto.id);
    setVistaActual("formulario");
  };

  const eliminarProducto = async (id) => {
    mostrarConfirm("¿Estás seguro de eliminar este producto?", async () => {
      try {
        setCargando(true);
        setMensajeCarga("Eliminando producto...");
        await fetch(`${API_URL}/productos/${id}`, {
          method: "DELETE"
        });
        mostrarAlerta("Producto eliminado exitosamente");
        cargarProductos();
      } catch (error) {
        mostrarAlerta("Error eliminando producto");
        console.error(error);
      } finally {
        setCargando(false);
      }
    });
  };

  const nuevoProducto = () => {
    limpiarFormulario();
    setVistaActual("formulario");
  };

  const registrarMovimiento = async (id, tipo) => {
    mostrarPromptEntrada(
      `¿Cuántas unidades deseas ${tipo === 'entrada' ? 'añadir' : 'vender'}?`,
      async (cantidad) => {
        if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
          mostrarAlerta("Cantidad inválida");
          return;
        }

        try {
          setCargando(true);
          setMensajeCarga(tipo === 'entrada' ? "Registrando entrada..." : "Registrando venta...");

          const response = await fetch(`${API_URL}/productos/${id}/${tipo}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cantidad: Number(cantidad) })
          });

          const result = await response.json();

          if (!response.ok) {
            mostrarAlerta("Error: " + (result.error || "No se pudo registrar el movimiento"));
            return;
          }

          mostrarAlerta(`${tipo === 'entrada' ? 'Entrada' : 'Venta'} registrada exitosamente`);
          cargarProductos();
        } catch (error) {
          mostrarAlerta("Error en el movimiento");
          console.error(error);
        } finally {
          setCargando(false);
        }
      }
    );
  };

  // Funciones para la venta
  const agregarProductoVenta = (producto) => {
    const yaExiste = ventaActual.productos.find(p => p.producto_id === producto.id);
    
    if (yaExiste) {
      mostrarAlerta("Este producto ya está en la venta. Edita la cantidad desde el detalle.");
      return;
    }

    const precioSegunMetodo = ventaActual.metodo_pago === 'contado' 
      ? producto.precio_contado
      : ventaActual.metodo_pago === '3_4'
      ? producto.precio_3_4
      : ventaActual.metodo_pago === '6_7'
      ? producto.precio_6_7
      : producto.precio_10;

    const nuevoItem = {
      producto_id: producto.id,
      codigo: producto.codigo,
      detalle: producto.detalle,
      cantidad: 1,
      precio_unitario: precioSegunMetodo,
      subtotal: precioSegunMetodo,
      stock_disponible: producto.stock
    };

    setVentaActual({
      ...ventaActual,
      productos: [...ventaActual.productos, nuevoItem]
    });
  };

  const actualizarCantidadVenta = (index, nuevaCantidad) => {
    const nuevosProductos = [...ventaActual.productos];
    const producto = nuevosProductos[index];
    
    if (nuevaCantidad > producto.stock_disponible) {
      mostrarAlerta(`Stock insuficiente. Disponible: ${producto.stock_disponible}`);
      return;
    }

    if (nuevaCantidad <= 0) {
      eliminarProductoVenta(index);
      return;
    }

    producto.cantidad = nuevaCantidad;
    producto.subtotal = producto.precio_unitario * nuevaCantidad;

    setVentaActual({
      ...ventaActual,
      productos: nuevosProductos
    });
  };

  const eliminarProductoVenta = (index) => {
    const nuevosProductos = ventaActual.productos.filter((_, i) => i !== index);
    setVentaActual({
      ...ventaActual,
      productos: nuevosProductos
    });
  };

  const cambiarMetodoPago = (nuevoMetodo) => {
    const productosActualizados = ventaActual.productos.map(item => {
      const producto = productos.find(p => p.id === item.producto_id);
      
      const nuevoPrecio = nuevoMetodo === 'contado' 
        ? producto.precio_contado
        : nuevoMetodo === '3_4'
        ? producto.precio_3_4
        : nuevoMetodo === '6_7'
        ? producto.precio_6_7
        : producto.precio_10;

      return {
        ...item,
        precio_unitario: nuevoPrecio,
        subtotal: nuevoPrecio * item.cantidad
      };
    });

    setVentaActual({
      ...ventaActual,
      metodo_pago: nuevoMetodo,
      productos: productosActualizados
    });
  };

  const crearCliente = async () => {
    if (!nuevoCliente.nombre) {
      alert("El nombre es obligatorio");
      return;
    }

    try {
      setCargando(true);
      setMensajeCarga("Creando cliente...");

      const response = await fetch(`${API_URL}/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoCliente)
      });

      const cliente = await response.json();

      if (!response.ok) {
        alert("Error creando cliente");
        return;
      }

      setClientes([...clientes, cliente]);
      setVentaActual({ ...ventaActual, cliente_id: cliente.id });
      setNuevoCliente({ nombre: '', telefono: '', direccion: '' });
      setMostrarFormCliente(false);
      alert("Cliente creado exitosamente");
    } catch (error) {
      alert("Error creando cliente");
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

 const finalizarVenta = async () => {
  if (ventaActual.productos.length === 0) {
    mostrarAlerta("Debe agregar al menos un producto");
    return;
  }

  mostrarConfirm(
    `¿Confirmar venta por $${calcularTotalVenta().toLocaleString()}?`,
    async () => {
      try {
        setCargando(true);
        setMensajeCarga("Registrando venta...");

        const response = await fetch(`${API_URL}/ventas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ventaActual)
        });

        const result = await response.json();

        if (!response.ok) {
          mostrarAlerta("Error: " + (result.error || "No se pudo completar la venta"));
          return;
        }

        // Limpiar venta
        setVentaActual({
          cliente_id: null,
          metodo_pago: 'contado',
          productos: [],
          fecha_venta: new Date().toISOString().slice(0, 16)
        });

        cargarProductos();

        // Mostrar alerta y solo cuando se cierre, abrir el detalle
        // Esto evita que dos modals se monten al mismo tiempo
        const ventaId = result.venta_id;
        setModal({
          tipo: 'alert',
          mensaje: `¡Venta #${ventaId} registrada exitosamente!`,
          mostrar: true,
          onConfirm: () => {
            cerrarModal();
            setTimeout(() => verDetalleVenta(ventaId), 0);
          }
        });

      } catch (error) {
        console.error(error);
        mostrarAlerta("Error finalizando venta");
      } finally {
        setCargando(false);
      }
    }
  );
};


  const calcularTotalVenta = () => {
    return ventaActual.productos.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const productosFiltrados = productos.filter((p) => 
    p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.detalle.toLowerCase().includes(busqueda.toLowerCase())
  );

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    (c.telefono && c.telefono.includes(busquedaCliente))
  );

  const seleccionarCliente = (cliente) => {
    setVentaActual({ ...ventaActual, cliente_id: cliente.id });
    setBusquedaCliente(cliente.nombre);
    setMostrarListaClientes(false);
  };

  const limpiarCliente = () => {
    setVentaActual({ ...ventaActual, cliente_id: null });
    setBusquedaCliente('');
    setMostrarListaClientes(false);
  };

  return (
    <div className="app-container">
      {/* PANTALLA DE CARGA */}
      {cargando && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{mensajeCarga}</p>
          </div>
        </div>
      )}

      {/* MENÚ LATERAL */}
      <aside className={`sidebar ${menuAbierto ? 'open' : 'closed'}`}>
        <button 
          className="toggle-menu"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          {menuAbierto ? '✕' : '☰'}
        </button>
        
        <div className="sidebar-header">
          <h2>📦 Sistema</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${vistaActual === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setVistaActual('dashboard');
              setMenuAbierto(false);
            }}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-item ${vistaActual === 'inventario' ? 'active' : ''}`}
            onClick={() => {
              setVistaActual('inventario');
              setMenuAbierto(false);
            }}
          >
            📋 Inventario
          </button>
          <button 
            className={`nav-item ${vistaActual === 'entradas' ? 'active' : ''}`}
            onClick={() => {
              setVistaActual('entradas');
              setMenuAbierto(false);
            }}
          >
            📥 Entradas
          </button>
          <button 
            className={`nav-item ${vistaActual === 'ventas' ? 'active' : ''}`}
            onClick={() => {
              setVistaActual('ventas');
              setMenuAbierto(false);
            }}
          >
            💰 Nueva Venta
          </button>
          <button 
            className={`nav-item ${vistaActual === 'cuentas-cobrar' ? 'active' : ''}`}
            onClick={() => {
              setVistaActual('cuentas-cobrar');
              setMenuAbierto(false);
            }}
          >
            💳 Cuentas por Cobrar
          </button>
          <button 
            className={`nav-item ${vistaActual === 'historial-ventas' ? 'active' : ''}`}
            onClick={() => {
              setVistaActual('historial-ventas');
              setMenuAbierto(false);
            }}
          >
            📜 Historial Ventas
          </button>
          <button 
            className={`nav-item ${vistaActual === 'lista-precios' ? 'active' : ''}`}
            onClick={() => {
              setVistaActual('lista-precios');
              setMenuAbierto(false);
            }}
          >
            📋 Lista de Precios
          </button>
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-content">
        <header className="header">
          <h1>
            {vistaActual === 'dashboard' && '📊 Dashboard - Resumen General'}
            {vistaActual === 'inventario' && '📦 Gestión de Inventario y Precios'}
            {vistaActual === 'entradas' && '📥 Registrar Entradas'}
            {vistaActual === 'ventas' && '💰 Nueva Venta / Facturación'}
            {vistaActual === 'cuentas-cobrar' && '💳 Cuentas por Cobrar'}
            {vistaActual === 'historial-ventas' && '📜 Historial de Ventas'}
            {vistaActual === 'lista-precios' && '📋 Lista de Precios - Para Imprimir'}
            {vistaActual === 'formulario' && (editando ? '✏️ Editar Producto' : '➕ Nuevo Producto')}
          </h1>
        </header>

        <div className="content">
          {/* VISTA DASHBOARD */}
          {vistaActual === "dashboard" && resumenGeneral && (
            <div>
              <div className="dashboard-grid">
                {/* Tarjetas de resumen */}
                <div className="dashboard-card card-blue">
                  <h3>Ventas Hoy</h3>
                  <div className="card-value">${Number(resumenGeneral.hoy.total).toLocaleString()}</div>
                  <div className="card-subtitle">{resumenGeneral.hoy.cantidad} ventas</div>
                </div>

                <div className="dashboard-card card-green">
                  <h3>Ventas del Mes</h3>
                  <div className="card-value">${Number(resumenGeneral.mes.total).toLocaleString()}</div>
                  <div className="card-subtitle">{resumenGeneral.mes.cantidad} ventas</div>
                </div>

                <div className="dashboard-card card-orange">
                  <h3>Por Cobrar</h3>
                  <div className="card-value">${Number(resumenGeneral.porCobrar.total_pendiente).toLocaleString()}</div>
                  <div className="card-subtitle">{resumenGeneral.porCobrar.ventas_pendientes} ventas pendientes</div>
                </div>

                <div className="dashboard-card card-purple">
                  <h3>Cobrado del Mes</h3>
                  <div className="card-value">${Number(resumenGeneral.mes.cobrado).toLocaleString()}</div>
                  <div className="card-subtitle">
                    {((resumenGeneral.mes.cobrado / resumenGeneral.mes.total) * 100).toFixed(1)}% del total
                  </div>
                </div>
              </div>

              {/* Top Productos */}
              <div className="dashboard-section">
                <h2>📈 Productos Más Vendidos del Mes</h2>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Unidades Vendidas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumenGeneral.topProductos.map((p, index) => (
                        <tr key={index}>
                          <td><strong>{p.codigo}</strong></td>
                          <td>{p.detalle}</td>
                          <td className="precio">{p.total_vendido}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VISTA INVENTARIO */}
          {vistaActual === "inventario" && (
            <div>
              <div className="toolbar">
                <button className="btn btn-primary" onClick={nuevoProducto}>
                  ➕ Nuevo Producto
                </button>
                <button className="btn btn-secondary" onClick={cargarProductos}>
                  🔄 Recargar
                </button>
                <input
                  type="text"
                  placeholder="🔍 Buscar por código o detalle..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="search-input"
                />
              </div>

              {productos.length === 0 ? (
                <div className="empty-state">
                  <p>No hay productos registrados</p>
                  <button className="btn btn-primary" onClick={nuevoProducto}>
                    Crear primer producto
                  </button>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Detalle</th>
                        <th>Costo</th>
                        <th>Stock</th>
                        <th>Contado</th>
                        <th>3-4 meses</th>
                        <th>6-7 meses</th>
                        <th>10 meses</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map((p) => (
                        <tr key={p.id}>
                          <td><strong>{p.codigo}</strong></td>
                          <td>{p.detalle}</td>
                          <td>${p.costo.toLocaleString()}</td>
                          <td>
                            <span className={`stock-badge ${p.stock <= 0 ? 'stock-zero' : p.stock < 5 ? 'stock-low' : 'stock-ok'}`}>
                              {p.stock}
                            </span>
                          </td>
                          <td className="precio-cell">
                            ${p.precio_contado?.toLocaleString()}
                            <div className="utilidad-tooltip">
                              <strong>Utilidad:</strong> ${p.utilidad_contado?.toLocaleString()}
                            </div>
                          </td>
                          <td className="precio-cell">
                            ${p.precio_3_4?.toLocaleString()}
                            <div className="utilidad-tooltip">
                              <strong>Utilidad:</strong> ${p.utilidad_3_4?.toLocaleString()}
                            </div>
                          </td>
                          <td className="precio-cell">
                            ${p.precio_6_7?.toLocaleString()}
                            <div className="utilidad-tooltip">
                              <strong>Utilidad:</strong> ${p.utilidad_6_7?.toLocaleString()}
                            </div>
                          </td>
                          <td className="precio-cell">
                            ${p.precio_10?.toLocaleString()}
                            <div className="utilidad-tooltip">
                              <strong>Utilidad:</strong> ${p.utilidad_10?.toLocaleString()}
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => editarProducto(p)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => eliminarProducto(p.id)}
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VISTA ENTRADAS */}
          {vistaActual === "entradas" && (
            <div>
              <div className="toolbar">
                <input
                  type="text"
                  placeholder="🔍 Buscar producto..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Detalle</th>
                      <th>Stock Actual</th>
                      <th>Total Entradas</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.codigo}</strong></td>
                        <td>{p.detalle}</td>
                        <td>
                          <span className="stock-badge stock-ok">{p.stock}</span>
                        </td>
                        <td>{p.entradas}</td>
                        <td>
                          <button
                            className="btn btn-primary"
                            onClick={() => registrarMovimiento(p.id, 'entrada')}
                          >
                            ➕ Registrar Entrada
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA VENTAS / FACTURACIÓN */}
          {vistaActual === "ventas" && (
            <div className="venta-container">
              {/* SELECTOR DE CLIENTE Y MÉTODO DE PAGO */}
              <div className="venta-header">
                <div className="form-row">
                  <div className="form-group">
                    <label>Cliente</label>
                    <div className="cliente-selector">
                      <div className="autocomplete-wrapper">
                        <input
                          type="text"
                          placeholder="🔍 Buscar cliente..."
                          value={busquedaCliente}
                          onChange={(e) => {
                            setBusquedaCliente(e.target.value);
                            setMostrarListaClientes(true);
                          }}
                          onFocus={() => setMostrarListaClientes(true)}
                          className="autocomplete-input"
                        />
                        {busquedaCliente && (
                          <button
                            className="clear-button"
                            onClick={limpiarCliente}
                          >
                            ✕
                          </button>
                        )}
                        
                        {mostrarListaClientes && (
                          <div className="autocomplete-dropdown">
                            <div
                              className="autocomplete-item"
                              onClick={() => {
                                limpiarCliente();
                              }}
                            >
                              <strong>Cliente General</strong>
                            </div>
                            {clientesFiltrados.length > 0 ? (
                              clientesFiltrados.map(c => (
                                <div
                                  key={c.id}
                                  className={`autocomplete-item ${ventaActual.cliente_id === c.id ? 'selected' : ''}`}
                                  onClick={() => seleccionarCliente(c)}
                                >
                                  <strong>{c.nombre}</strong>
                                  {c.telefono && <span className="cliente-info"> - {c.telefono}</span>}
                                </div>
                              ))
                            ) : (
                              <div className="autocomplete-item empty">
                                No se encontraron clientes
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        className="btn btn-secondary btn-nuevo-cliente"
                        onClick={() => {
                          setMostrarFormCliente(!mostrarFormCliente);
                          setMostrarListaClientes(false);
                        }}
                      >
                        ➕
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Método de Pago</label>
                    <select
                      value={ventaActual.metodo_pago}
                      onChange={(e) => cambiarMetodoPago(e.target.value)}
                    >
                      <option value="contado">Contado</option>
                      <option value="3_4">3-4 meses</option>
                      <option value="6_7">6-7 meses</option>
                      <option value="10">10 meses</option>
                    </select>
                  </div>
                </div>

                {mostrarFormCliente && (
                  <div className="nuevo-cliente-form">
                    <h3>Nuevo Cliente</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nombre *</label>
                        <input
                          type="text"
                          value={nuevoCliente.nombre}
                          onChange={(e) => setNuevoCliente({
                            ...nuevoCliente,
                            nombre: e.target.value
                          })}
                          placeholder="Nombre del cliente"
                        />
                      </div>
                      <div className="form-group">
                        <label>Cedula</label>
                        <input
                          type="text"
                          value={nuevoCliente.telefono}
                          onChange={(e) => setNuevoCliente({
                            ...nuevoCliente,
                            telefono: e.target.value
                          })}
                          placeholder="Cedula"
                        />
                      </div>
                      <div className="form-group">
                        <label>Telefono</label>
                        <input
                          type="text"
                          value={nuevoCliente.direccion}
                          onChange={(e) => setNuevoCliente({
                            ...nuevoCliente,
                            direccion: e.target.value
                          })}
                          placeholder="Telefono"
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <button className="btn btn-success" onClick={crearCliente}>
                        Guardar Cliente
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setMostrarFormCliente(false);
                          setNuevoCliente({ nombre: '', telefono: '', direccion: '' });
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="venta-content">
                {/* LISTA DE PRODUCTOS PARA AGREGAR */}
                <div className="productos-disponibles">
                  <h3>Productos Disponibles</h3>
                  <input
                    type="text"
                    placeholder="🔍 Buscar producto..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="search-input"
                    style={{ marginBottom: '15px' }}
                  />
                  
                  <div className="productos-grid">
                    {productosFiltrados.map((p) => (
                      <div key={p.id} className="producto-card">
                        <div className="producto-info">
                          <strong>{p.codigo}</strong>
                          <p>{p.detalle}</p>
                          <div className="producto-precio">
                            ${(ventaActual.metodo_pago === 'contado' 
                              ? p.precio_contado
                              : ventaActual.metodo_pago === '3_4'
                              ? p.precio_3_4
                              : ventaActual.metodo_pago === '6_7'
                              ? p.precio_6_7
                              : p.precio_10
                            ).toLocaleString()}
                          </div>
                          <span className={`stock-badge ${p.stock <= 0 ? 'stock-zero' : p.stock < 5 ? 'stock-low' : 'stock-ok'}`}>
                            Stock: {p.stock}
                          </span>
                        </div>
                        <button
                          className="btn btn-primary btn-agregar"
                          onClick={() => agregarProductoVenta(p)}
                          disabled={p.stock <= 0}
                        >
                          ➕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DETALLE DE LA VENTA */}
                <div className="venta-detalle">
                  <h3>Detalle de Venta</h3>
                  
                  {ventaActual.productos.length === 0 ? (
                    <div className="empty-state">
                      <p>No hay productos en la venta</p>
                      <p style={{ fontSize: '14px' }}>Selecciona productos de la lista</p>
                    </div>
                  ) : (
                    <>
                      <div className="venta-items">
                        {ventaActual.productos.map((item, index) => (
                          <div key={index} className="venta-item">
                            <div className="venta-item-info">
                              <strong>{item.codigo}</strong>
                              <p>{item.detalle}</p>
                              <span className="precio-unitario">
                                ${item.precio_unitario.toLocaleString()} c/u
                              </span>
                            </div>
                            <div className="venta-item-actions">
                              <input
                                type="number"
                                value={item.cantidad}
                                onChange={(e) => actualizarCantidadVenta(index, Number(e.target.value))}
                                min="1"
                                max={item.stock_disponible}
                                className="cantidad-input"
                              />
                              <div className="subtotal">
                                ${item.subtotal.toLocaleString()}
                              </div>
                              <button
                                className="btn-icon btn-delete"
                                onClick={() => eliminarProductoVenta(index)}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="venta-total">
                        <h2>Total: ${calcularTotalVenta().toLocaleString()}</h2>
                        <button
                          className="btn btn-success btn-large"
                          onClick={finalizarVenta}
                        >
                          ✅ Finalizar Venta
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VISTA CUENTAS POR COBRAR */}
          {vistaActual === "cuentas-cobrar" && (
            <div>
              <div className="toolbar">
                <button className="btn btn-secondary" onClick={cargarCuentasPorCobrar}>
                  🔄 Recargar
                </button>
              </div>

              {cuentasPorCobrar.length === 0 ? (
                <div className="empty-state">
                  <p>✅ No hay cuentas pendientes de cobro</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Total</th>
                        <th>Pagado</th>
                        <th>Saldo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuentasPorCobrar.map((v) => (
                        <tr key={v.id}>
                          <td><strong>#{v.id}</strong></td>
                          <td>{new Date(v.created_at).toLocaleDateString('es-CO')}</td>
                          <td>{v.cliente_nombre || 'Cliente General'}</td>
                          <td>${Number(v.total).toLocaleString()}</td>
                          <td className="precio">${Number(v.total_pagado).toLocaleString()}</td>
                          <td>
                            <span className={`stock-badge ${v.saldo_pendiente > 0 ? 'stock-zero' : 'stock-ok'}`}>
                              ${Number(v.saldo_pendiente).toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-estado ${v.estado_pago}`}>
                              {v.estado_pago === 'pendiente' ? '⏳ Pendiente' : '🔄 Parcial'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-success"
                              onClick={() => registrarPago(v.id)}
                            >
                              💰 Abonar
                            </button>
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => verDetalleVenta(v.id)}
                              title="Ver detalle"
                            >
                              👁️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VISTA HISTORIAL DE VENTAS */}
          {vistaActual === "historial-ventas" && (
            <div>
              <div className="toolbar">
                <button className="btn btn-primary" onClick={() => setVistaActual('ventas')}>
                  ➕ Nueva Venta
                </button>
                <button className="btn btn-secondary" onClick={cargarVentas}>
                  🔄 Recargar
                </button>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Método de Pago</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((v) => (
                      <tr key={v.id}>
                        <td><strong>#{v.id}</strong></td>
                        <td>{new Date(v.created_at).toLocaleString('es-CO')}</td>
                        <td>{v.cliente_nombre || 'Cliente General'}</td>
                        <td>
                          {v.metodo_pago === 'contado' ? 'Contado' :
                           v.metodo_pago === '3_4' ? '3-4 meses' :
                           v.metodo_pago === '6_7' ? '6-7 meses' : '10 meses'}
                        </td>
                        <td className="precio">${Number(v.total).toLocaleString()}</td>
                        <td>
                          <span className={`badge-estado ${v.estado_pago || 'pagado'}`}>
                            {v.estado_pago === 'pagado' ? '✅ Pagado' :
                             v.estado_pago === 'parcial' ? '🔄 Parcial' : '⏳ Pendiente'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => verDetalleVenta(v.id)}
                            title="Ver detalle"
                          >
                            👁️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA FORMULARIO */}
          {vistaActual === "formulario" && (
            <div>
              <div className="toolbar">
                <button className="btn btn-secondary" onClick={() => {
                  setVistaActual("inventario");
                  limpiarFormulario();
                }}>
                  ← Volver al inventario
                </button>
              </div>

              <div className="form-card">
                <form onSubmit={handleSubmit}>
                  <div className="form-section">
                    <h3>Información Básica</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Código *</label>
                        <input
                          type="text"
                          name="codigo"
                          value={form.codigo}
                          onChange={handleChange}
                          placeholder="Ej: A001"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Costo *</label>
                        <input
                          type="text"
                          name="costo"
                          value={form.costo ? '$' + Number(form.costo).toLocaleString('es-CO') : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setForm({ ...form, costo: value });
                          }}
                          onWheel={(e) => e.target.blur()}
                          placeholder="$0"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Detalle / Descripción *</label>
                      <textarea
                        name="detalle"
                        value={form.detalle}
                        onChange={handleChange}
                        placeholder="Descripción del producto"
                        rows="3"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Porcentajes de Ganancia</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>% Contado</label>
                        <input
                          type="number"
                          name="porc_contado"
                          value={form.porc_contado}
                          onChange={handleChange}
                          onWheel={(e) => e.target.blur()}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div className="form-group">
                        <label>% 3-4 meses</label>
                        <input
                          type="number"
                          name="porc_3_4"
                          value={form.porc_3_4}
                          onChange={handleChange}
                          onWheel={(e) => e.target.blur()}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div className="form-group">
                        <label>% 6-7 meses</label>
                        <input
                          type="number"
                          name="porc_6_7"
                          value={form.porc_6_7}
                          onChange={handleChange}
                          onWheel={(e) => e.target.blur()}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div className="form-group">
                        <label>% 10 meses</label>
                        <input
                          type="number"
                          name="porc_10"
                          value={form.porc_10}
                          onChange={handleChange}
                          onWheel={(e) => e.target.blur()}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {form.costo && (
                    <div className="preview-section">
                      <h3>Vista Previa de Precios</h3>
                      <div className="preview-grid">
                        <div className="preview-card">
                          <div className="preview-label">Contado</div>
                          <div className="preview-value">
                            ${calcular(Number(form.costo), Number(form.porc_contado) || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="preview-card">
                          <div className="preview-label">3-4 meses</div>
                          <div className="preview-value">
                            ${calcular(Number(form.costo), Number(form.porc_3_4) || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="preview-card">
                          <div className="preview-label">6-7 meses</div>
                          <div className="preview-value">
                            ${calcular(Number(form.costo), Number(form.porc_6_7) || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="preview-card">
                          <div className="preview-label">10 meses</div>
                          <div className="preview-value">
                            ${calcular(Number(form.costo), Number(form.porc_10) || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary btn-large">
                      {editando ? "💾 Actualizar Producto" : "✅ Guardar Producto"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-large"
                      onClick={() => {
                        setVistaActual("inventario");
                        limpiarFormulario();
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VISTA LISTA DE PRECIOS */}
          {vistaActual === "lista-precios" && (
            <div className="lista-precios-container">
              <div className="toolbar no-print">
                <div className="toolbar-left">
                  <div className="descuento-control">
                    <label>Descuento en Contado (%)</label>
                    <input
                      type="number"
                      value={descuentoListaPrecios === 0 ? '' : descuentoListaPrecios}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDescuentoListaPrecios(val === '' ? 0 : Number(val));
                      }}
                      min="0"
                      max="100"
                      step="0.5"
                      onWheel={(e) => e.target.blur()}
                      placeholder="0"
                      className="descuento-input"
                    />
                  </div>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => window.print()}
                >
                  🖨️ Imprimir Lista de Precios
                </button>
              </div>

              <div className="lista-precios-print">
                <div className="lista-header">
                  <h2>LISTA DE PRECIOS</h2>
                  <p className="fecha-impresion">
                    Fecha: {new Date().toLocaleDateString('es-CO', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  {descuentoListaPrecios > 0 && (
                    <p className="nota-descuento">
                      * Precio de contado incluye {descuentoListaPrecios}% de descuento
                    </p>
                  )}
                </div>

                <table className="tabla-lista-precios">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Producto</th>
                      <th>Precio Contado</th>
                      {descuentoListaPrecios > 0 && (
                        <th>Contado c/Dto. ({descuentoListaPrecios}%)</th>
                      )}
                      <th>3-4 Meses</th>
                      <th>6-7 Meses</th>
                      <th>10 Meses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos
                      .filter(p => busqueda === "" || 
                        p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
                        p.detalle.toLowerCase().includes(busqueda.toLowerCase())
                      )
                      .sort((a, b) => a.codigo.localeCompare(b.codigo))
                      .map((p) => {
                        const precioContado = redondearDecenaMil(calcular(p.costo, p.porc_contado));
                        const precioConDescuento = redondearDecenaMil(precioContado * (1 - descuentoListaPrecios / 100));
                        const precio34 = redondearDecenaMil(calcular(p.costo, p.porc_3_4));
                        const precio67 = redondearDecenaMil(calcular(p.costo, p.porc_6_7));
                        const precio10 = redondearDecenaMil(calcular(p.costo, p.porc_10));

                        return (
                          <tr key={p.id}>
                            <td className="codigo-cell"><strong>{p.codigo}</strong></td>
                            <td className="detalle-cell">{p.detalle}</td>
                            <td className="precio-cell">${precioContado.toLocaleString()}</td>
                            {descuentoListaPrecios > 0 && (
                              <td className="precio-cell precio-destacado">
                                ${precioConDescuento.toLocaleString()}
                              </td>
                            )}
                            <td className="precio-cell">${precio34.toLocaleString()}</td>
                            <td className="precio-cell">${precio67.toLocaleString()}</td>
                            <td className="precio-cell">${precio10.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                <div className="lista-footer">
                  <p>Total de productos: {productos.length}</p>
                  <p className="nota-pie">Precios sujetos a cambio sin previo aviso</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DETALLE DE VENTA */}
      {ventaDetalle && (
        <div className="modal-overlay" onClick={() => setVentaDetalle(null)}>
          <div className="modal-detalle-venta" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-detalle">
              <h2>Factura #{ventaDetalle.id}</h2>
              <button className="close-button" onClick={() => setVentaDetalle(null)}>✕</button>
            </div>

            <div className="modal-body-detalle">
              <div className="info-venta">
                <p><strong>Fecha:</strong> {new Date(ventaDetalle.created_at).toLocaleString('es-CO')}</p>
                <p><strong>Cliente:</strong> {ventaDetalle.cliente_nombre || 'Cliente General'}</p>
                {ventaDetalle.cliente_telefono && (
                  <p><strong>Cedula:</strong> {ventaDetalle.cliente_telefono}</p>
                )}
                <p><strong>Método de Pago:</strong> {
                  ventaDetalle.metodo_pago === 'contado' ? 'Contado' :
                  ventaDetalle.metodo_pago === '3_4' ? '3-4 meses' :
                  ventaDetalle.metodo_pago === '6_7' ? '6-7 meses' : '10 meses'
                }</p>
              </div>

              <h3>Productos</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {ventaDetalle.productos.map((p, i) => (
                    <tr key={i}>
                      <td><strong>{p.codigo}</strong></td>
                      <td>{p.producto_detalle}</td>
                      <td>{p.cantidad}</td>
                      <td>${Number(p.precio_unitario).toLocaleString()}</td>
                      <td className="precio">${Number(p.subtotal).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="totales-venta">
                <div className="total-row">
                  <strong>TOTAL:</strong>
                  <span>${Number(ventaDetalle.total).toLocaleString()}</span>
                </div>
                {ventaDetalle.estado_pago !== 'pagado' && (
                  <>
                    <div className="total-row">
                      <strong>Pagado:</strong>
                      <span className="text-green">${Number(ventaDetalle.total_pagado).toLocaleString()}</span>
                    </div>
                    <div className="total-row saldo">
                      <strong>Saldo Pendiente:</strong>
                      <span className="text-red">${Number(ventaDetalle.saldo_pendiente).toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => imprimirFactura(ventaDetalle)}>
                🖨️ Imprimir Factura
              </button>
              {ventaDetalle.estado_pago !== 'pagado' && (
                <button className="btn btn-success" onClick={() => {
                  const id = ventaDetalle.id;
                  setVentaDetalle(null);
                  registrarPago(id);
                }}>
                  💰 Registrar Pago
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setVentaDetalle(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERSONALIZADO */}
      {modal.mostrar && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modal.tipo === 'alert' && '💬'}
                {modal.tipo === 'confirm' && '❓'}
                {modal.tipo === 'entrada' && '📝'}
              </h3>
            </div>
            <div className="modal-body">
              <p>{modal.mensaje}</p>
              {modal.tipo === 'entrada' && (
  <input
    type="text"
    value={
      modal.inputValue
        ? '$' + Number(modal.inputValue).toLocaleString('es-CO')
        : ''
    }
    onChange={(e) => {
      const value = e.target.value.replace(/\D/g, '');
      setModal({ ...modal, inputValue: value });
    }}
    onWheel={(e) => e.target.blur()}
    placeholder="$0"
    autoFocus
    className="modal-input"
  />
)}

            </div>
            <div className="modal-footer">
              {modal.tipo === 'alert' ? (
                <button className="btn btn-primary" onClick={() => {
                  if (modal.onConfirm) modal.onConfirm();
                  else cerrarModal();
                }}>
                  Aceptar
                </button>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={cerrarModal}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary" onClick={handleModalConfirm}>
                    Confirmar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;