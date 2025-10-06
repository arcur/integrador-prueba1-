const productos = [
  {
    nombre: "Computadora Gamer",
    precio: 2500,
    categoria: "computadoras",
    imagen: "assets/img/catalogo/computadora.jpg"
  },
  {
    nombre: "Teclado Mecánico RGB",
    precio: 180,
    categoria: "teclados",
    imagen: "assets/img/catalogo/teclado.jpg"
  },
  {
    nombre: "Laptop Profesional",
    precio: 3200,
    categoria: "laptops",
    imagen: "assets/img/catalogo/laptop.jpg"
  },
  {
    nombre: "Impresora Multifunción",
    precio: 450,
    categoria: "impresoras",
    imagen: "assets/img/catalogo/impresora.jpg"
  },
  {
    nombre: "Mouse Gamer RGB",
    precio: 120,
    categoria: "mouse",
    imagen: "assets/img/catalogo/mouse.jpg"
  },
  {
    nombre: "Auriculares Bluetooth",
    precio: 85,
    categoria: "auriculares",
    imagen: "assets/img/catalogo/auriculares.jpg"
  },
  {
    nombre: "Monitor Curvo 144Hz",
    precio: 950,
    categoria: "monitores",
    imagen: "assets/img/catalogo/monitor.jpg"
  },
  {
    nombre: "Soporte Ajustable para Monitor",
    precio: 75,
    categoria: "monitores",
    imagen: "assets/img/catalogo/soporte-monitor.jpg"
  },
  {
    nombre: "Alfombrilla Gamer XL",
    precio: 45,
    categoria: "mouse",
    imagen: "assets/img/catalogo/alfombrilla.jpg"
  }
];


const container = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const filterButtons = document.querySelectorAll(".filter-btn");

let categoriaActual = "todos";

function renderProductos(lista) {
  container.innerHTML = "";
  if (lista.length === 0) {
    container.innerHTML = "<p>No se encontraron productos.</p>";
    return;
  }

  lista.forEach(prod => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.innerHTML = `
      <img src="${prod.imagen}" alt="${prod.nombre}">
      <div class="product-info">
        <h4>${prod.nombre}</h4>
        <p>Categoría: ${prod.categoria}</p>
        <div class="price">S/ ${prod.precio.toFixed(2)}</div>
        <a href="producto.html" class="add-to-cart" onclick="guardarProducto(${JSON.stringify(prod).replace(/"/g, '&quot;')})">Ver más</a>
      </div>
    `;
    container.appendChild(card);
  });
}

function filtrarYOrdenar() {
  let resultado = productos.filter(p => 
    categoriaActual === "todos" || p.categoria === categoriaActual
  );

  const busqueda = searchInput.value.toLowerCase();
  if (busqueda) {
    resultado = resultado.filter(p => p.nombre.toLowerCase().includes(busqueda));
  }

  const orden = sortSelect.value;
  if (orden === "precio-asc") {
    resultado.sort((a, b) => a.precio - b.precio);
  } else if (orden === "precio-desc") {
    resultado.sort((a, b) => b.precio - a.precio);
  } else if (orden === "nombre") {
    resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  renderProductos(resultado);
}

searchInput.addEventListener("input", filtrarYOrdenar);
sortSelect.addEventListener("change", filtrarYOrdenar);
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    categoriaActual = btn.dataset.category;
    filtrarYOrdenar();
  });
});

renderProductos(productos);

function guardarProducto(producto) {
  localStorage.setItem("productoSeleccionado", JSON.stringify(producto));
}
