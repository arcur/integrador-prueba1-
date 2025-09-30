let slideIndex = 0;
const slidesContainer = document.querySelector(".slides");
const dotsContainer = document.querySelector(".dots");
const prev = document.querySelector(".prev");
const next = document.querySelector(".next");

// 📌 Array con tus imágenes y textos (puedes agregar más)
const data = [
  { src: "imagenes/perifericos.jpg", texto: "" },
  { src: "imagenes/Teclado.jpg", texto: "Ofertas en teclados" },
  { src: "imagenes/setup.jpg", texto: "Renueva tu setup" }
];

// 🔹 Generar dinámicamente los slides
data.forEach((item, i) => {
  const slide = document.createElement("div");
  slide.classList.add("slide");
  if (i === 0) slide.classList.add("active");

  slide.innerHTML = `
    <img src="${item.src}" alt="">
    ${item.texto ? `<div class="texto"><h2>${item.texto}</h2></div>` : ""}
  `;

  slidesContainer.appendChild(slide);

  // Crear también los puntos
  const dot = document.createElement("span");
  dot.classList.add("dot");
  if (i === 0) dot.classList.add("active");
  dotsContainer.appendChild(dot);
});

const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");

function showSlide(n) {
  if (n >= slides.length) slideIndex = 0;
  if (n < 0) slideIndex = slides.length - 1;

  slides.forEach((slide, i) => {
    slide.style.display = "none";
    dots[i].classList.remove("active");
  });

  slides[slideIndex].style.display = "block";
  dots[slideIndex].classList.add("active");
}

function nextSlide() {
  slideIndex++;
  showSlide(slideIndex);
}

function prevSlide() {
  slideIndex--;
  showSlide(slideIndex);
}

next.addEventListener("click", nextSlide);
prev.addEventListener("click", prevSlide);

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    slideIndex = index;
    showSlide(slideIndex);
  });
});

// Auto-slide cada 5s
setInterval(nextSlide, 5000);

// Mostrar el primero al inicio
showSlide(slideIndex);