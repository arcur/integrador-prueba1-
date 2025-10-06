// 📦 Recuperar producto seleccionado
const productoInfo = document.getElementById("productoInfo");
const recomendadosGrid = document.getElementById("recomendadosGrid");
const producto = JSON.parse(localStorage.getItem("productoSeleccionado"));

// 🧩 Catálogo completo para recomendaciones
const productosCatalogo = [
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

// 🖼️ Mostrar producto principal
if (!producto) {
  productoInfo.innerHTML = "<p>No se ha seleccionado ningún producto.</p>";
} else {
  productoInfo.innerHTML = `
    <div class="producto-box">
      <img src="${producto.imagen}" alt="${producto.nombre}" />
      <div class="info">
        <h1>${producto.nombre}</h1>
        <p class="categoria">Categoría: ${producto.categoria}</p>
        <p class="descripcion">Este periférico está diseñado para ofrecer rendimiento, estilo y durabilidad. Ideal para setups exigentes.</p>
        <p class="precio">S/ ${producto.precio.toFixed(2)}</p>
        <button class="btn-agregar">Agregar al carrito</button>
      </div>
    </div>
  `;
}

// 🎯 Generar recomendaciones aleatorias
function generarRecomendados() {
  const otros = productosCatalogo.filter(p => p.nombre !== producto?.nombre);
  const seleccionados = otros.sort(() => 0.5 - Math.random()).slice(0, 4);

  seleccionados.forEach(p => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <img src="${p.imagen}" alt="${p.nombre}">
      <h3>${p.nombre}</h3>
      <p>S/ ${p.precio.toFixed(2)}</p>
    `;
    recomendadosGrid.appendChild(card);
  });
}

generarRecomendados();

document.querySelector(".btn-agregar").addEventListener("click", () => {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  const existente = carrito.find(p => p.nombre === producto.nombre);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  alert("Producto agregado al carrito");
});
