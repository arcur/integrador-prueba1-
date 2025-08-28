document.addEventListener('DOMContentLoaded', () => {

    const products = [
        { 
            name: "Teclado Mecánico RGB", 
            price: "$85.00", 
            image: "imagenes/teclado-colores.jpg" // <-- ¡Aquí está la URL!
        },
        { 
            name: "Mouse Gaming Inalámbrico", 
            price: "$50.00", 
            image: "imagenes/Mouse Gaming Inalámbrico.jpg" 
        },
        { name: "Auriculares con Micrófono", price: "$65.00", image: "imagenes/Auriculares con Micrófono.jpg" },
        { name: "Webcam Full HD", price: "$75.00", image: "imagenes/Webcam Full HD.jpg" },
    ];

    const productContainer = document.querySelector('.product-container');

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');

        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="price">${product.price}</p>
        `;

        // AQUÍ es donde debes pegar el nuevo código
        productCard.addEventListener('click', () => {
            const productData = {
                name: product.name,
                price: product.price
            };

            // Simulación de envío de datos a un servidor
            fetch('https://tu-servidor-de-ejemplo.com/add-to-cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            })
            .then(response => {
                // Simulación de que el servidor responde con éxito
                if (response.ok) {
                    alert(`El producto '${product.name}' se agregó al carrito.`);
                } else {
                    alert('Hubo un error al agregar el producto.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('No se pudo conectar con el servidor.');
            });
        });

        productContainer.appendChild(productCard);
    });

});