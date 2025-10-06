const resumenCarrito = document.getElementById("resumenCarrito");
const checkoutForm = document.getElementById("checkoutForm");
const carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function renderResumen() {
  if (carrito.length === 0) {
    resumenCarrito.innerHTML = "<p>No hay productos en el carrito.</p>";
    return;
  }

  let html = "";
  let total = 0;

  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    html += `
      <div class="resumen-item">
        <span>${item.nombre} x${item.cantidad}</span>
        <span>S/ ${subtotal.toFixed(2)}</span>
      </div>
    `;
  });

  html += `<div class="resumen-total">Total: S/ ${total.toFixed(2)}</div>`;
  resumenCarrito.innerHTML = html;
}

checkoutForm.addEventListener("submit", e => {
  e.preventDefault();

  const datosCliente = {
    nombre: checkoutForm.nombre.value,
    apellido: checkoutForm.apellido.value,
    correo: checkoutForm.correo.value,
    telefono: checkoutForm.telefono.value,
    direccion: checkoutForm.direccion.value
  };

  const pedido = {
    cliente: datosCliente,
    productos: carrito,
    total: carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0),
    fecha: new Date().toISOString(),
    estado: "pendiente"
  };

  console.log("Pedido generado:", pedido);
  alert("Pedido confirmado. Gracias por tu compra!");

  localStorage.removeItem("carrito");
  window.location.href = "catalogo.html";
});

renderResumen();
