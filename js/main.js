// ============================================================================
// PRE-ENTREGA: INTERFAZ DINÁMICA CON DOM Y EVENTOS
// Simulador de Inventario y Cotización — TechCore Hardware & PC
// Desarrollo 100% mediante manipulación del DOM y eventos (sin prompt, alert ni console.log)
// ============================================================================

const TASA_IVA_MEXICO = 0.16;

// ============================================================================
// 1. MODELADO DE DATOS CON CLASE (Continuidad de entregas anteriores)
// ============================================================================

class ProductoHardware {
    constructor(id, nombre, categoria, precio, stock) {
        this.id = id;
        this.nombre = nombre;
        this.categoria = categoria;
        this.precio = Number(precio);
        this.stock = Number(stock);
        this.disponible = this.stock > 0;
    }

    vender(cantidadUnidades = 1) {
        if (cantidadUnidades <= 0 || cantidadUnidades > this.stock) {
            return false;
        }
        this.stock -= cantidadUnidades;
        this.disponible = this.stock > 0;
        return true;
    }

    aplicarDescuento(porcentajeDescuento = 10) {
        if (porcentajeDescuento > 0 && porcentajeDescuento < 100) {
            const factor = 1 - porcentajeDescuento / 100;
            this.precio = Math.round(this.precio * factor * 100) / 100;
        }
        return this.precio;
    }

    calcularPrecioConIva(tasaIva = TASA_IVA_MEXICO) {
        return Math.round(this.precio * (1 + tasaIva) * 100) / 100;
    }
}

// Colección inicial de objetos instanciados a partir de la clase ProductoHardware
const catalogoProductosHardware = [
    new ProductoHardware(1, "Procesador AMD Ryzen 7 7800X3D", "Procesadores", 8400, 8),
    new ProductoHardware(2, "Tarjeta Gráfica NVIDIA RTX 4070 Super", "Tarjetas de Video", 13900, 5),
    new ProductoHardware(3, "Memoria RAM Kit 32GB DDR5 6000MHz", "Memorias RAM", 2450, 12),
    new ProductoHardware(4, "Unidad SSD NVMe M.2 Gen4 2TB", "Almacenamiento", 2850, 15),
    new ProductoHardware(5, "Monitor Gamer 27'' QHD 180Hz IPS", "Monitores", 5600, 6)
];

// Estado de la cotización activa del usuario
let consecutivoIdProducto = 6;
let unidadesCotizadasCliente = 0;
let totalCotizadoConIva = 0;
let terminoBusquedaActual = "";

// ============================================================================
// 2. SELECCIÓN PRECISA DE ELEMENTOS DEL DOM (getElementById y querySelector)
// ============================================================================

const formularioProducto = document.getElementById("formulario-producto");
const inputNombreProducto = document.getElementById("input-nombre");
const selectCategoriaProducto = document.getElementById("select-categoria");
const inputPrecioProducto = document.getElementById("input-precio");
const inputStockProducto = document.getElementById("input-stock");
const botonAgregarProducto = document.getElementById("boton-agregar");

const inputBusquedaTeclado = document.querySelector("#input-busqueda");
const botonReiniciarCotizacion = document.querySelector("#boton-reiniciar-cotizacion");
const contenedorItemsDom = document.getElementById("contenedor-items");
const contadorResultadosDom = document.getElementById("contador-resultados");
const bannerFeedbackDom = document.getElementById("mensaje-feedback");

const metricaTotalModelos = document.getElementById("metrica-total-modelos");
const metricaValorInventario = document.getElementById("metrica-valor-inventario");
const metricaUnidadesCotizadas = document.getElementById("metrica-unidades-cotizadas");
const metricaTotalCotizado = document.getElementById("metrica-total-cotizado");

// ============================================================================
// 3. FUNCIONES DE FEEDBACK VISUAL Y ACTUALIZACIÓN DE MÉTRICAS EN EL DOM
// ============================================================================

const formatearMonedaMxn = (monto) => `$${Number(monto).toLocaleString("es-MX")} MXN`;

function mostrarFeedbackVisual(mensajeTexto, tipoEstado = "exito") {
    bannerFeedbackDom.textContent = mensajeTexto;
    bannerFeedbackDom.className = "banner-feedback";

    if (tipoEstado === "exito") {
        bannerFeedbackDom.classList.add("feedback-exito");
    } else if (tipoEstado === "alerta") {
        bannerFeedbackDom.classList.add("feedback-alerta");
    } else if (tipoEstado === "eliminado") {
        bannerFeedbackDom.classList.add("feedback-eliminado");
    }
}

function actualizarPanelMetricas() {
    const totalModelos = catalogoProductosHardware.length;
    const valorTotalStock = catalogoProductosHardware.reduce(
        (acumulador, producto) => acumulador + producto.precio * producto.stock,
        0
    );

    metricaTotalModelos.textContent = totalModelos;
    metricaValorInventario.textContent = formatearMonedaMxn(valorTotalStock);
    metricaUnidadesCotizadas.textContent = unidadesCotizadasCliente;
    metricaTotalCotizado.textContent = formatearMonedaMxn(totalCotizadoConIva);
}

// ============================================================================
// 4. RENDERIZADO DINÁMICO DE LA COLECCIÓN DE OBJETOS (innerHTML + backticks)
// ============================================================================

function obtenerProductosFiltrados(terminoFiltro) {
    const terminoLimpio = terminoFiltro.trim().toLowerCase();

    if (terminoLimpio === "") {
        return catalogoProductosHardware;
    }

    return catalogoProductosHardware.filter(
        (producto) =>
            producto.nombre.toLowerCase().includes(terminoLimpio) ||
            producto.categoria.toLowerCase().includes(terminoLimpio)
    );
}

function renderizarCatalogoDom() {
    const listaFiltrada = obtenerProductosFiltrados(terminoBusquedaActual);

    contadorResultadosDom.textContent =
        listaFiltrada.length === 1
            ? "Mostrando 1 componente"
            : `Mostrando ${listaFiltrada.length} componentes`;

    if (listaFiltrada.length === 0) {
        contenedorItemsDom.innerHTML = `
            <div class="estado-vacio">
                <h3>No se encontraron componentes</h3>
                <p>No hay resultados que coincidan con "${terminoBusquedaActual}". Presiona Esc en el buscador o agrega un nuevo producto.</p>
            </div>
        `;
        actualizarPanelMetricas();
        return;
    }

    let htmlTarjetas = "";

    listaFiltrada.forEach((producto) => {
        const precioConIva = producto.calcularPrecioConIva();
        const claseSinStock = producto.stock === 0 ? "tarjeta-item sin-stock" : "tarjeta-item";
        const textoStock =
            producto.stock > 0
                ? `Stock disponible: <strong>${producto.stock}</strong> unidad(es)`
                : `<span class="stock-agotado">AGOTADO (0 unidades)</span>`;
        const atributoDeshabilitado = producto.stock === 0 ? "disabled" : "";

        htmlTarjetas += `
            <article class="${claseSinStock}" data-id="${producto.id}">
                <div class="cabecera-item">
                    <span class="etiqueta-categoria">${producto.categoria}</span>
                    <span class="id-item">ID #${producto.id}</span>
                </div>
                <h3 class="titulo-item">${producto.nombre}</h3>
                <p class="precio-item">${formatearMonedaMxn(producto.precio)}</p>
                <p class="precio-iva">Precio con IVA (16%): ${formatearMonedaMxn(precioConIva)}</p>
                <p class="stock-item">${textoStock}</p>
                <div class="acciones-item">
                    <button
                        type="button"
                        class="boton-cotizar"
                        data-accion="cotizar"
                        data-id="${producto.id}"
                        ${atributoDeshabilitado}
                    >
                        + Cotizar 1 ud.
                    </button>
                    <button
                        type="button"
                        class="boton-descuento"
                        data-accion="descuento"
                        data-id="${producto.id}"
                        title="Aplicar 10% de descuento"
                    >
                        -10%
                    </button>
                    <button
                        type="button"
                        class="boton-eliminar"
                        data-accion="eliminar"
                        data-id="${producto.id}"
                    >
                        Eliminar
                    </button>
                </div>
            </article>
        `;
    });

    contenedorItemsDom.innerHTML = htmlTarjetas;
    actualizarPanelMetricas();
}

// ============================================================================
// 5. LÓGICA DE INTERACCIÓN: AGREGAR, COTIZAR, DESCONTAR Y ELIMINAR OBJETOS
// ============================================================================

function agregarNuevoProductoDesdeFormulario() {
    const nombreIngresado = inputNombreProducto.value.trim();
    const categoriaSeleccionada = selectCategoriaProducto.value;
    const precioIngresado = parseFloat(inputPrecioProducto.value);
    const stockIngresado = parseInt(inputStockProducto.value, 10);

    if (nombreIngresado === "") {
        mostrarFeedbackVisual(
            "Por favor escribe el nombre del componente de hardware antes de agregarlo.",
            "alerta"
        );
        inputNombreProducto.focus();
        return;
    }

    if (isNaN(precioIngresado) || precioIngresado <= 0) {
        mostrarFeedbackVisual(
            "El precio del componente debe ser un número mayor a $0 MXN.",
            "alerta"
        );
        inputPrecioProducto.focus();
        return;
    }

    if (isNaN(stockIngresado) || stockIngresado < 1) {
        mostrarFeedbackVisual(
            "El stock inicial debe ser de al menos 1 unidad.",
            "alerta"
        );
        inputStockProducto.focus();
        return;
    }

    const nuevoObjetoHardware = new ProductoHardware(
        consecutivoIdProducto++,
        nombreIngresado,
        categoriaSeleccionada,
        precioIngresado,
        stockIngresado
    );

    catalogoProductosHardware.push(nuevoObjetoHardware);

    // Limpiar inputs del formulario tras agregar
    inputNombreProducto.value = "";
    inputPrecioProducto.value = "";
    inputStockProducto.value = "5";
    inputNombreProducto.focus();

    renderizarCatalogoDom();
    mostrarFeedbackVisual(
        `Componente agregado: "${nuevoObjetoHardware.nombre}" (${formatearMonedaMxn(nuevoObjetoHardware.precio)}) ya está en la lista.`,
        "exito"
    );
}

function gestionarAccionEnTarjeta(idObjeto, tipoAccion) {
    const indiceEncontrado = catalogoProductosHardware.findIndex(
        (producto) => producto.id === idObjeto
    );

    if (indiceEncontrado === -1) {
        return;
    }

    const productoObjetivo = catalogoProductosHardware[indiceEncontrado];

    if (tipoAccion === "cotizar") {
        const operacionExitosa = productoObjetivo.vender(1);
        if (operacionExitosa) {
            unidadesCotizadasCliente += 1;
            totalCotizadoConIva =
                Math.round((totalCotizadoConIva + productoObjetivo.calcularPrecioConIva()) * 100) / 100;
            renderizarCatalogoDom();
            mostrarFeedbackVisual(
                `Se cotizó 1x "${productoObjetivo.nombre}". Stock restante: ${productoObjetivo.stock} unidad(es).`,
                "exito"
            );
        }
    } else if (tipoAccion === "descuento") {
        const precioAnterior = productoObjetivo.precio;
        const nuevoPrecio = productoObjetivo.aplicarDescuento(10);
        renderizarCatalogoDom();
        mostrarFeedbackVisual(
            `Descuento del 10% aplicado a "${productoObjetivo.nombre}": pasó de ${formatearMonedaMxn(precioAnterior)} a ${formatearMonedaMxn(nuevoPrecio)}.`,
            "exito"
        );
    } else if (tipoAccion === "eliminar") {
        const nombreEliminado = productoObjetivo.nombre;
        catalogoProductosHardware.splice(indiceEncontrado, 1);
        renderizarCatalogoDom();
        mostrarFeedbackVisual(
            `Componente eliminado del inventario: "${nombreEliminado}".`,
            "eliminado"
        );
    }
}

// ============================================================================
// 6. REGISTRO DE EVENTOS (Click, Submit y Eventos de Teclado)
// ============================================================================

// Evento click en el botón "+ Agregar"
botonAgregarProducto.addEventListener("click", () => {
    agregarNuevoProductoDesdeFormulario();
});

// Evento submit del formulario (por si el usuario presiona Enter en un input)
formularioProducto.addEventListener("submit", (evento) => {
    evento.preventDefault();
    agregarNuevoProductoDesdeFormulario();
});

// Evento click delegado en el contenedor para los botones de cada ítem ("Cotizar", "-10%", "Eliminar")
contenedorItemsDom.addEventListener("click", (evento) => {
    const botonAccion = evento.target.closest("button[data-accion]");
    if (!botonAccion) {
        return;
    }

    const idProducto = parseInt(botonAccion.dataset.id, 10);
    const accionSolicitada = botonAccion.dataset.accion;

    gestionarAccionEnTarjeta(idProducto, accionSolicitada);
});

// Evento de teclado (keyup) para filtrar en tiempo real la lista de objetos
inputBusquedaTeclado.addEventListener("keyup", (evento) => {
    if (evento.key === "Escape") {
        inputBusquedaTeclado.value = "";
        terminoBusquedaActual = "";
        renderizarCatalogoDom();
        mostrarFeedbackVisual("Filtro de búsqueda limpiado con la tecla Escape.", "exito");
        return;
    }

    terminoBusquedaActual = evento.target.value;
    renderizarCatalogoDom();

    const totalCoincidencias = obtenerProductosFiltrados(terminoBusquedaActual).length;
    if (terminoBusquedaActual.trim() !== "") {
        mostrarFeedbackVisual(
            `Filtrando por "${terminoBusquedaActual}": ${totalCoincidencias} coincidencia(s) encontrada(s).`,
            totalCoincidencias > 0 ? "exito" : "alerta"
        );
    }
});

// Evento click para reiniciar el acumulador de cotización
botonReiniciarCotizacion.addEventListener("click", () => {
    unidadesCotizadasCliente = 0;
    totalCotizadoConIva = 0;
    actualizarPanelMetricas();
    mostrarFeedbackVisual("El contador de cotización del cliente ha sido reiniciado a $0 MXN.", "alerta");
});

// Renderizado inicial al cargar el DOM
renderizarCatalogoDom();
