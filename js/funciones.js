/**
 * 
 */

function togglePassword() {
    var pass = document.getElementById("password");
    if (pass.type === "password") {
        pass.type = "text";
    } else {
        pass.type = "password";
    }
}


/* Categoria.jsp */
document.addEventListener("DOMContentLoaded", function () {
    const filtroEstado = document.getElementById("filtroEstado");
    const buscarNombre = document.getElementById("buscarNombre");
    const filas = document.querySelectorAll("#tablaCategorias tbody tr");

    function filtrarTabla() {
        const filtro = filtroEstado.value;
        const texto = buscarNombre.value.toLowerCase();

        filas.forEach(fila => {
            const estado = fila.getAttribute("data-estado");
            const nombre = fila.cells[0].textContent.toLowerCase();

            let visible = true;

            if (filtro !== "todos" && estado !== filtro) {
                visible = false;
            }

            if (!nombre.includes(texto)) {
                visible = false;
            }

            fila.style.display = visible ? "" : "none";
        });
    }

    filtroEstado.addEventListener("change", filtrarTabla);
    buscarNombre.addEventListener("keyup", filtrarTabla);
});


/* Editar categoria */
document.addEventListener("DOMContentLoaded", () => {
        const formEditar = document.getElementById("formEditarCategoria");
        const inputEditar = document.getElementById("editarNombreCategoria");
        let filaSeleccionada = null;

        // Detectar clic en botón editar
        document.querySelectorAll(".btn-editar").forEach(boton => {
            boton.addEventListener("click", (e) => {
                filaSeleccionada = e.target.closest("tr");
                const nombre = boton.getAttribute("data-nombre");
                inputEditar.value = nombre;
            });
        });

        // Guardar cambios
        formEditar.addEventListener("submit", (e) => {
            e.preventDefault();
            if (filaSeleccionada) {
                filaSeleccionada.querySelector("td").textContent = inputEditar.value;
            }
            const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditarCategoria"));
           modal.hide();
        });
    });
	
	
	
	// ========== FILTRO DE PROVEEDORES ==========
	document.addEventListener("DOMContentLoaded", function () {
	    const buscarNombre = document.getElementById("buscarNombre");
	    const buscarTelefono = document.getElementById("buscarTelefono");
	    const filtroEstado = document.getElementById("filtroEstado");
	    const tablaProveedores = document.getElementById("tablaProveedores").getElementsByTagName("tbody")[0];

	    function filtrarProveedores() {
	        const nombreFiltro = buscarNombre.value.toLowerCase();
	        const telefonoFiltro = buscarTelefono.value.toLowerCase();
	        const estadoFiltro = filtroEstado.value;

	        const filas = tablaProveedores.getElementsByTagName("tr");

	        for (let fila of filas) {
	            const nombre = fila.cells[0].textContent.toLowerCase();
	            const telefono = fila.cells[2].textContent.toLowerCase();
	            const estado = fila.getAttribute("data-estado"); // activo / inactivo

	            let coincideNombre = nombre.includes(nombreFiltro);
	            let coincideTelefono = telefono.includes(telefonoFiltro);
	            let coincideEstado = (estadoFiltro === "todos" || estado === estadoFiltro);

	            if (coincideNombre && coincideTelefono && coincideEstado) {
	                fila.style.display = "";
	            } else {
	                fila.style.display = "none";
	            }
	        }
	    }

	    // Eventos de búsqueda
	    buscarNombre.addEventListener("input", filtrarProveedores);
	    buscarTelefono.addEventListener("input", filtrarProveedores);
	    filtroEstado.addEventListener("change", filtrarProveedores);
	});