const carritoContainer = document.getElementById("carritoContainer");
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function renderCarrito() {
  carritoContainer.innerHTML = "";

  if (carrito.length === 0) {
    carritoContainer.innerHTML = "<p>Tu carrito está vacío.</p>";
    return;
  }

  let tabla = document.createElement("table");
  tabla.classList.add("carrito-table");

  tabla.innerHTML = `
    <thead>
      <tr>
        <th>Producto</th>
        <th>Nombre</th>
        <th>Precio</th>
        <th>Cantidad</th>
        <th>Subtotal</th>
        <th>Eliminar</th>
      </tr>
    </thead>
    <tbody>
      ${carrito.map((item, index) => `
        <tr>
          <td><img src="${item.imagen}" alt="${item.nombre}"></td>
          <td>${item.nombre}</td>
          <td>S/ ${item.precio.toFixed(2)}</td>
          <td>
            <input type="number" min="1" value="${item.cantidad}" onchange="actualizarCantidad(${index}, this.value)">
          </td>
          <td id="subtotal-${index}">S/ ${(item.precio * item.cantidad).toFixed(2)}</td>
          <td><button class="btn-eliminar" onclick="eliminarProducto(${index})">Eliminar</button></td>
        </tr>
      `).join("")}
    </tbody>
  `;

  carritoContainer.appendChild(tabla);

  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const totalDiv = document.createElement("div");
  totalDiv.classList.add("total");
  totalDiv.textContent = `Total: S/ ${total.toFixed(2)}`;
  carritoContainer.appendChild(totalDiv);

  const finalizarBtn = document.createElement("button");
  finalizarBtn.classList.add("btn-finalizar");
  finalizarBtn.textContent = "Finalizar compra";
  finalizarBtn.onclick = () => {
  window.location.href = "checkout.html";
};

  carritoContainer.appendChild(finalizarBtn);
}

function eliminarProducto(index) {
  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCarrito();
}

function actualizarCantidad(index, nuevaCantidad) {
  const cantidad = parseInt(nuevaCantidad);
  if (cantidad >= 1) {
    carrito[index].cantidad = cantidad;
    localStorage.setItem("carrito", JSON.stringify(carrito));
    document.getElementById(`subtotal-${index}`).textContent = `S/ ${(carrito[index].precio * cantidad).toFixed(2)}`;
    actualizarTotal();
  }
}

function actualizarTotal() {
  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  document.querySelector(".total").textContent = `Total: S/ ${total.toFixed(2)}`;
}

renderCarrito();
