// ==================== PRODUCT DATA ====================
const products = [
  { id: 1, name: "Mouse Gamer RGB", category: "mouse", price: 120, image: "/imagenes/MouseRGB.jpg" },
  { id: 2, name: "Teclado Mecánico", category: "teclado", price: 250, image: "/imagenes/TecladoMecanico.jpg" },
  { id: 3, name: "Auriculares Inalámbricos", category: "auriculares", price: 300, image: "/imagenes/auriculares1.jpg" },
  { id: 4, name: "Monitor 27'' 144Hz", category: "monitores", price: 950, image: "/imagenes/monitor1.jpg" },
  { id: 5, name: "Mouse Ergonómico", category: "mouse", price: 100, image: "/imagenes/mouseErgonomico.jpg" },
  { id: 6, name: "Teclado Retroiluminado", category: "teclado", price: 180, image: "/imagenes/tecladoRetroiluminado.jpg" },
];

// ==================== VARIABLES ====================
const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const filterBtns = document.querySelectorAll(".filter-btn");

let filteredProducts = [...products];

// ==================== FUNCTIONS ====================
function displayProducts(items) {
  productContainer.innerHTML = "";
  if (items.length === 0) {
    productContainer.innerHTML = "<p>No se encontraron productos.</p>";
    return;
  }
  items.forEach(product => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h4>${product.name}</h4>
        <p>Categoría: ${product.category}</p>
        <div class="price">S/ ${product.price.toFixed(2)}</div>
        <a href="#" class="add-to-cart">Agregar al carrito</a>
      </div>
    `;
    productContainer.appendChild(card);
  });
}

function searchProducts(query) {
  filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );
  applyFiltersAndSort();
}

function filterByCategory(category) {
  if (category === "todos") {
    filteredProducts = [...products];
  } else {
    filteredProducts = products.filter(p => p.category === category);
  }
  applyFiltersAndSort();
}

function sortProducts(option) {
  switch (option) {
    case "priceLowHigh":
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case "priceHighLow":
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      filteredProducts.sort((a, b) => b.id - a.id);
      break;
    default:
      filteredProducts = [...filteredProducts];
  }
  displayProducts(filteredProducts);
}

function applyFiltersAndSort() {
  sortProducts(sortSelect.value);
}

// ==================== EVENTS ====================
searchInput.addEventListener("input", e => searchProducts(e.target.value));
sortSelect.addEventListener("change", e => sortProducts(e.target.value));
filterBtns.forEach(btn =>
  btn.addEventListener("click", () => filterByCategory(btn.dataset.category))
);

// ==================== INIT ====================
displayProducts(products);
