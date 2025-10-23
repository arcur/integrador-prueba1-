// Espera a que todo el HTML esté cargado
document.addEventListener('DOMContentLoaded', () => {

  // --- BASE DE DATOS DE PRODUCTOS (EJEMPLO) ---
  const allProducts = [
    {
      id: 1,
      name: "Mouse Gamer RGB",
      category: "mouse",
      price: 120.00,
      originalPrice: 150.00, // Precio para mostrar descuento
      image: "https://via.placeholder.com/300x200/555/fff?text=Mouse+Gamer" // Reemplaza con tu imagen
    },
    {
      id: 2,
      name: "Teclado Mecánico",
      category: "teclado",
      price: 250.00,
      originalPrice: 300.00,
      image: "https://via.placeholder.com/300x200/555/fff?text=Teclado" // Reemplaza con tu imagen
    },
    {
      id: 3,
      name: "Auriculares Inalámbricos",
      category: "auriculares",
      price: 300.00,
      originalPrice: 350.00,
      image: "https://via.placeholder.com/300x200/555/fff?text=Auriculares" // Reemplaza con tu imagen
    },
    {
      id: 4,
      name: "Monitor Curvo 27\"",
      category: "monitores",
      price: 850.00,
      originalPrice: 950.00,
      image: "https://via.placeholder.com/300x200/555/fff?text=Monitor" // Reemplaza con tu imagen
    },
    {
      id: 5,
      name: "Mousepad XL",
      category: "mouse",
      price: 80.00,
      originalPrice: 90.00,
      image: "https://via.placeholder.com/300x200/555/fff?text=Mousepad" // Reemplaza con tu imagen
    }
  ];

  // --- ESTADO DE LA APLICACIÓN ---
  let cart = [];
  let currentFilter = {
    category: 'todos',
    searchTerm: '',
    sort: 'default'
  };

  // --- REFERENCIAS AL DOM ---
  const productContainer = document.getElementById('productContainer');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  // --- REFERENCIAS AL CARRITO ---
  const modal = document.getElementById('added-item-modal');
  const fullCart = document.getElementById('full-cart-page');
  const cartIconButton = document.getElementById('cart-icon-button');
  const goToCartButton = document.getElementById('go-to-cart-btn');
  const cartCount = document.getElementById('cart-count');
  const fullCartItemsContainer = document.getElementById('full-cart-item-container');
  const closeButtons = document.querySelectorAll('.close-btn, .continue-shopping');
  const modalTitle = document.getElementById('modal-title');
  const modalItemPlaceholder = document.getElementById('modal-item-placeholder');

  // --- LÓGICA DE RENDERIZADO DE PRODUCTOS ---

  function renderProducts() {
    // 1. Filtrar
    let productsToRender = allProducts.filter(product => {
      const matchesCategory = currentFilter.category === 'todos' || product.category === currentFilter.category;
      const matchesSearch = product.name.toLowerCase().includes(currentFilter.searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // 2. Ordenar
    switch (currentFilter.sort) {
      case 'priceLowHigh':
        productsToRender.sort((a, b) => a.price - b.price);
        break;
      case 'priceHighLow':
        productsToRender.sort((a, b) => b.price - a.price);
        break;
      // 'newest' se podría implementar si los productos tienen fecha
    }

    // 3. Renderizar
    productContainer.innerHTML = ''; // Limpiar contenedor
    if (productsToRender.length === 0) {
      productContainer.innerHTML = '<p>No se encontraron productos que coincidan con tu búsqueda.</p>';
      return;
    }

    productsToRender.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      productCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h4>${product.name}</h4>
          <p>Categoría: ${product.category}</p>
          <div class="price">S/ ${product.price.toFixed(2)}</div>
          <button class="add-to-cart" data-id="${product.id}">Añadir al carrito</button>
        </div>
      `;
      productContainer.appendChild(productCard);
    });
  }

  // --- LÓGICA DEL CARRITO ---

  function showAddedModal() {
    modal.style.display = 'flex';
  }

  function showFullCart() {
    modal.style.display = 'none';
    fullCart.style.display = 'flex';
    updateFullCartUI();
  }

  function hideOverlay(targetId) {
    document.getElementById(targetId).style.display = 'none';
  }

  function handleAddToCart(productId) {
    // 1. Encontrar el producto en la "base de datos"
    const productToAdd = allProducts.find(p => p.id === productId);
    if (!productToAdd) return;
    
    // 2. Añadir al carrito
    // (Opcional: puedes revisar si ya existe y solo aumentar la cantidad)
    cart.push({ ...productToAdd, cartId: Date.now() }); // Usamos cartId para borrar duplicados
    
    // 3. Actualizar la UI
    updateCartUI();
    
    // 4. Mostrar el modal de confirmación con el item
    modalTitle.textContent = `Cesta (${cart.length} artículo${cart.length > 1 ? 's' : ''})`;
    modalItemPlaceholder.innerHTML = `
      <div class="cart-item">
        <img src="${productToAdd.image}" alt="${productToAdd.name}">
        <div class="item-details">
          <h4>${productToAdd.name}</h4>
          <p>PC</p>
        </div>
        <div class="item-price">
          <p>S/ ${productToAdd.price.toFixed(2)}</p>
        </div>
      </div>
    `;
    showAddedModal();
  }

  function handleRemoveItem(cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    updateCartUI();
    updateFullCartUI();
  }

  function updateCartUI() {
    // Actualizar contador
    cartCount.textContent = cart.length;
    goToCartButton.textContent = `Ir a la cesta (${cart.length})`;

    // Calcular totales
    let subtotal = 0;
    let discount = 0;
    let total = 0;

    cart.forEach(item => {
      subtotal += item.originalPrice;
      discount += (item.originalPrice - item.price);
      total += item.price;
    });

    // Actualizar totales en todos los modales
    document.getElementById('modal-total').textContent = `S/ ${total.toFixed(2)}`;
    document.getElementById('summary-subtotal').textContent = `S/ ${subtotal.toFixed(2)}`;
    document.getElementById('summary-discount').textContent = `S/ -${discount.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `S/ ${total.toFixed(2)}`;
  }

  function updateFullCartUI() {
    fullCartItemsContainer.innerHTML = ''; // Limpiar

    if (cart.length === 0) {
      fullCartItemsContainer.innerHTML = '<p>Tu cesta está vacía.</p>';
      return;
    }

    cart.forEach(item => {
      const itemHTML = `
        <div class="cart-item" data-id="${item.cartId}">
          <img src="${item.image}" alt="${item.name}">
          <div class="item-details">
            <h4>${item.name}</h4>
            <p>Categoría: ${item.category}</p>
          </div>
          <div class="item-actions">
            <select>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
            <button class="remove-item-btn"><i class="fas fa-trash-alt"></i></button>
            <p>S/ ${item.price.toFixed(2)}</p>
          </div>
        </div>
      `;
      fullCartItemsContainer.innerHTML += itemHTML;
    });
    
    addRemoveListeners();
  }

  function addRemoveListeners() {
    document.querySelectorAll('.remove-item-btn').forEach(button => {
      // Evitar duplicar listeners
      button.onclick = (e) => { 
        const itemElement = e.currentTarget.closest('.cart-item');
        const cartId = parseInt(itemElement.dataset.id);
        handleRemoveItem(cartId);
      };
    });
  }

  // --- EVENT LISTENERS ---

  // 1. Listeners de Filtros
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Estilo visual
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      // Lógica
      currentFilter.category = button.dataset.category;
      renderProducts();
    });
  });

  // 2. Listener de Búsqueda
  searchInput.addEventListener('input', (e) => {
    currentFilter.searchTerm = e.target.value;
    renderProducts();
  });

  // 3. Listener de Ordenar
  sortSelect.addEventListener('change', (e) => {
    currentFilter.sort = e.target.value;
    renderProducts();
  });

  // 4. Listener de "Añadir al carrito" (Usando delegación de eventos)
  productContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart')) {
      const productId = parseInt(e.target.dataset.id);
      handleAddToCart(productId);
    }
  });

  // 5. Listeners de botones del Carrito
  cartIconButton.addEventListener('click', showFullCart);
  goToCartButton.addEventListener('click', showFullCart);

  closeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const targetId = e.currentTarget.dataset.target;
      hideOverlay(targetId);
    });
  });

  // --- INICIALIZACIÓN ---
  renderProducts(); // Renderiza los productos al cargar la página
});