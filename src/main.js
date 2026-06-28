import { categories as defaultCategories, products as defaultProducts } from './data.js';

// ==========================================
// GOOGLE SHEETS INTEGRATION
// ==========================================
// To use Google Sheets as your database:
// 1. Create a Google Sheet with headers: id, categoryId, name, scale, price, image, features
// 2. Click File -> Share -> Publish to Web -> Choose "CSV"
// 3. Paste the provided URL inside the quotes below:
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTEFznVDcaAh0CMr-LkohgGJbrU558T8UznG89QcXmmx9aD6COerjzLNcD2qIN5JJj7sgvWej3f2ILb/pub?output=csv"; 

// DOM Elements
const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const navMenu = document.getElementById('nav-menu');
const navLogoLink = document.getElementById('nav-logo-link');

const catalogFiltersContainer = document.getElementById('catalog-category-filters');
const catalogProductGrid = document.getElementById('catalog-product-grid');

// Carousel Elements
const carouselTrack = document.getElementById('carousel-track');
const carouselIndicators = document.getElementById('carousel-indicators');
const carouselBtnPrev = document.getElementById('carousel-btn-prev');
const carouselBtnNext = document.getElementById('carousel-btn-next');

// CTA Buttons
const heroCtaCatalog = document.getElementById('hero-cta-catalog');
const heroCtaContact = document.getElementById('hero-cta-contact');

// Modal Elements
const productModal = document.getElementById('product-modal-overlay');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductScale = document.getElementById('modal-product-scale');
const modalProductName = document.getElementById('modal-product-name');
const modalProductDesc = document.getElementById('modal-product-desc');
const modalSpecMaterial = document.getElementById('modal-spec-material');
const modalSpecDimensions = document.getElementById('modal-spec-dimensions');
const modalSpecRelease = document.getElementById('modal-spec-release');
const modalFeatureList = document.getElementById('modal-feature-list');
const modalQuoteProductId = document.getElementById('modal-quote-product-id');

// Modal Tabs
const tabBtns = document.querySelectorAll('.modal-tab-btn');
const tabPanes = document.querySelectorAll('.modal-tab-pane');

// Forms
const generalInquiryForm = document.getElementById('general-inquiry-form');
const contactSuccessAlert = document.getElementById('contact-success-alert');
const modalQuoteForm = document.getElementById('modal-quote-form');
const modalSuccessAlert = document.getElementById('modal-success-alert');

// App State
let categories = defaultCategories;
let products = defaultProducts;

let currentCategoryFilter = 'all';
let currentCarouselIndex = 0;
let carouselAutoPlayInterval;

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  if (GOOGLE_SHEETS_CSV_URL && GOOGLE_SHEETS_CSV_URL.trim() !== "") {
    await fetchCatalogFromGoogleSheets();
  }

  initNavigation();
  renderCarousel();
  renderCatalogFilters();
  renderProducts();
  initModalEvents();
  initFormEvents();
  initCarouselControls();
  startCarouselAutoPlay();
});

// Fetch Data from Google Sheets CSV
async function fetchCatalogFromGoogleSheets() {
  return new Promise((resolve) => {
    Papa.parse(GOOGLE_SHEETS_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        if (results.data && results.data.length > 0) {
          products = results.data.map(row => ({
            id: row.id || Math.random().toString(),
            categoryId: row.categoryId || 'ar-enterprises',
            name: row.name || 'Unknown Product',
            scale: row.scale || 'Assorted',
            material: row.material || 'Premium PVC/ABS',
            dimensions: row.dimensions || row.scale || 'Standard',
            releaseDate: row.releaseDate || 'Available Now',
            price: row.price || 'TBD',
            description: `Size: ${row.scale || 'N/A'} | Price: ₹${row.price || 'TBD'}`,
            features: row.features ? row.features.split(';') : ['Highly detailed sculpt', 'Vibrant paint application'],
            image: row.image || '/images/cyber_valkyrie.png',
            cropClass: '' // Real uploaded photos don't need CSS cropping!
          }));
        }
        resolve();
      },
      error: function(err) {
        console.error("Failed to load catalog from Google Sheets:", err);
        resolve();
      }
    });
  });
}

// Navigation Controller
function initNavigation() {
  // Mobile Hamburger toggle
  mobileMenuToggle.addEventListener('click', () => {
    const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
    mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
    navMenu.classList.toggle('active');
  });

  // Main Nav Items clicking
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');
      switchView(targetView);

      // Close mobile menu if open
      navMenu.classList.remove('active');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Footer navigation items
  document.querySelectorAll('.footer-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');
      switchView(targetView);
    });
  });

  // Logo link click (returns to home)
  navLogoLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('home-view');
  });

  // Hero section CTA buttons
  heroCtaCatalog.addEventListener('click', () => {
    switchView('catalog-view');
  });
  heroCtaContact.addEventListener('click', () => {
    switchView('contact-view');
  });
}

function switchView(viewId) {
  // Toggle active class on view sections
  views.forEach(view => {
    if (view.id === viewId) {
      view.classList.add('active');
      window.scrollTo(0, 0);
    } else {
      view.classList.remove('active');
    }
  });

  // Update navbar items state
  navItems.forEach(item => {
    if (item.getAttribute('data-view') === viewId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// Render carousel for featured products on home page
function renderCarousel() {
  if (!carouselTrack || !carouselIndicators) return;
  carouselTrack.innerHTML = '';
  carouselIndicators.innerHTML = '';

  // Display all products in carousel
  products.forEach((product, index) => {
    // Create carousel slide
    const slide = document.createElement('div');
    slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
    slide.style.minWidth = '100%';

    const extraClass = product.cropClass ? ` ${product.cropClass}` : '';

    slide.innerHTML = `
      <div class="carousel-content">
        <div class="carousel-image">
          <div class="carousel-img${extraClass}" style="background-image: url('${product.image}');" role="img" aria-label="${product.name}"></div>
          <span class="carousel-scale">${product.scale}</span>
        </div>
        <div class="carousel-details">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <button class="btn-primary view-carousel-details" style="justify-content: center;">
            View Details & Request Quote
          </button>
        </div>
      </div>
    `;

    // View Details button handler
    slide.querySelector('.view-carousel-details').addEventListener('click', () => {
      openProductModal(product);
    });

    carouselTrack.appendChild(slide);

    // Create indicator dot
    const indicator = document.createElement('button');
    indicator.className = `carousel-indicator ${index === 0 ? 'active' : ''}`;
    indicator.setAttribute('data-index', index);
    indicator.setAttribute('aria-label', `Go to product ${index + 1}`);

    indicator.addEventListener('click', () => {
      stopCarouselAutoPlay();
      goToCarouselSlide(index);
      startCarouselAutoPlay();
    });

    carouselIndicators.appendChild(indicator);
  });
}

// Carousel control functions
function initCarouselControls() {
  if (carouselBtnPrev) {
    carouselBtnPrev.addEventListener('click', () => {
      stopCarouselAutoPlay();
      previousCarouselSlide();
      startCarouselAutoPlay();
    });
  }

  if (carouselBtnNext) {
    carouselBtnNext.addEventListener('click', () => {
      stopCarouselAutoPlay();
      nextCarouselSlide();
      startCarouselAutoPlay();
    });
  }
}

function nextCarouselSlide() {
  currentCarouselIndex = (currentCarouselIndex + 1) % products.length;
  updateCarouselPosition();
}

function previousCarouselSlide() {
  currentCarouselIndex = (currentCarouselIndex - 1 + products.length) % products.length;
  updateCarouselPosition();
}

function goToCarouselSlide(index) {
  currentCarouselIndex = index;
  updateCarouselPosition();
}

function updateCarouselPosition() {
  // Update slide position
  const slides = carouselTrack.querySelectorAll('.carousel-slide');
  slides.forEach((slide, index) => {
    slide.classList.toggle('active', index === currentCarouselIndex);
  });

  // Update indicators
  const indicators = carouselIndicators.querySelectorAll('.carousel-indicator');
  indicators.forEach((indicator, index) => {
    indicator.classList.toggle('active', index === currentCarouselIndex);
  });

  // Animate track
  const translateValue = -currentCarouselIndex * 100;
  carouselTrack.style.transform = `translateX(${translateValue}%)`;
}

function startCarouselAutoPlay() {
  if (carouselAutoPlayInterval) return;
  carouselAutoPlayInterval = setInterval(() => {
    nextCarouselSlide();
  }, 5000); // Change slide every 5 seconds
}

function stopCarouselAutoPlay() {
  if (carouselAutoPlayInterval) {
    clearInterval(carouselAutoPlayInterval);
    carouselAutoPlayInterval = null;
  }
}

// Render dynamic elements
function renderCatalogFilters() {
  if (!catalogFiltersContainer) return;
  catalogFiltersContainer.innerHTML = '';

  // "Show All" button
  const allBtn = document.createElement('button');
  allBtn.className = `filter-btn ${currentCategoryFilter === 'all' ? 'active' : ''}`;
  allBtn.textContent = 'All Products';
  allBtn.addEventListener('click', () => {
    currentCategoryFilter = 'all';
    updateCatalogFilterButtons();
    renderProducts();
  });
  catalogFiltersContainer.appendChild(allBtn);

  // Category filter buttons
  categories.forEach(category => {
    const btn = document.createElement('button');
    btn.className = `filter-btn ${currentCategoryFilter === category.id ? 'active' : ''}`;
    btn.textContent = category.name;

    if (category.comingSoon) {
      btn.innerHTML += ' <span style="font-size: 0.7rem; opacity: 0.6;">(Soon)</span>';
    }

    btn.addEventListener('click', () => {
      if (category.comingSoon) {
        alert(`${category.name} collection is coming soon! Feel free to contact us for previews.`);
        return;
      }
      currentCategoryFilter = category.id;
      updateCatalogFilterButtons();
      renderProducts();
    });

    catalogFiltersContainer.appendChild(btn);
  });
}

function updateCatalogFilterButtons() {
  const buttons = catalogFiltersContainer.querySelectorAll('.filter-btn');
  buttons.forEach((btn, index) => {
    // Index 0 is "Show All"
    if (index === 0) {
      if (currentCategoryFilter === 'all') btn.classList.add('active');
      else btn.classList.remove('active');
    } else {
      const category = categories[index - 1];
      if (currentCategoryFilter === category.id) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
}

// Render product list
function renderProducts() {
  if (!catalogProductGrid) return;
  catalogProductGrid.innerHTML = '';

  // Filter products
  const filteredProducts = currentCategoryFilter === 'all'
    ? products
    : products.filter(p => p.categoryId === currentCategoryFilter);

  // If no products match, display empty state
  if (filteredProducts.length === 0) {
    catalogProductGrid.innerHTML = `
      <div class="empty-catalog" style="grid-column: 1 / -1;">
        <div class="empty-icon">📦</div>
        <h3>No collectibles to show</h3>
        <p>We are currently working on developing products for this category. Stay tuned for announcements!</p>
      </div>
    `;
    return;
  }

  // Render product cards
  filteredProducts.forEach(product => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const extraClass = product.cropClass ? ` ${product.cropClass}` : '';

    card.innerHTML = `
      <div class="product-img-wrapper">
        <div class="product-img${extraClass}" style="background-image: url('${product.image}');" role="img" aria-label="${product.name}"></div>
        <span class="product-scale">${product.scale}</span>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="product-desc-short">${product.description}</p>
        <button class="btn-secondary view-details-btn" style="width: 100%; justify-content: center; margin-top: auto;">
          View Masterpiece Details
        </button>
      </div>
    `;

    // View Details button handler
    card.querySelector('.view-details-btn').addEventListener('click', () => {
      openProductModal(product);
    });

    catalogProductGrid.appendChild(card);
  });
}

// Modal Controllers
function initModalEvents() {
  // Close Modal
  modalCloseBtn.addEventListener('click', closeProductModal);

  // Close Modal when clicking background overlay
  productModal.addEventListener('click', (e) => {
    if (e.target === productModal) {
      closeProductModal();
    }
  });

  // Modal Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Set active button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Set active pane
      tabPanes.forEach(pane => {
        if (pane.id === targetTab) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });
    });
  });
}

function openProductModal(product) {
  // Populate details
  modalProductImage.style.backgroundImage = `url('${product.image}')`;
  modalProductImage.className = 'modal-img' + (product.cropClass ? ` ${product.cropClass}` : '');
  modalProductImage.setAttribute('aria-label', product.name);
  modalProductScale.textContent = product.scale;
  modalProductName.textContent = product.name;
  modalProductDesc.textContent = product.description;

  modalSpecMaterial.textContent = product.material;
  modalSpecDimensions.textContent = product.dimensions;
  modalSpecRelease.textContent = product.releaseDate;
  modalQuoteProductId.value = product.id;

  // Build feature bullet points
  modalFeatureList.innerHTML = '';
  product.features.forEach(feature => {
    const li = document.createElement('li');
    li.textContent = feature;
    modalFeatureList.appendChild(li);
  });

  // Reset tab to Specifications
  tabBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === 'tab-specs') btn.classList.add('active');
    else btn.classList.remove('active');
  });
  tabPanes.forEach(pane => {
    if (pane.id === 'tab-specs') pane.classList.add('active');
    else pane.classList.remove('active');
  });

  // Reset success alert and forms
  modalSuccessAlert.style.display = 'none';
  modalQuoteForm.reset();
  modalQuoteForm.style.display = 'block';

  // Open overlay
  productModal.classList.add('active');
  document.body.style.overflow = 'hidden'; // stop page scrolling in background
}

function closeProductModal() {
  productModal.classList.remove('active');
  document.body.style.overflow = 'auto'; // restore page scrolling
}

// Form Handlers
function initFormEvents() {
  // General Contact Inquiry
  if (generalInquiryForm) {
    generalInquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Fake submission response
      contactSuccessAlert.style.display = 'block';
      generalInquiryForm.reset();

      // Hide alert after 5 seconds
      setTimeout(() => {
        contactSuccessAlert.style.display = 'none';
      }, 5000);
    });
  }

  // Modal Quote Request
  if (modalQuoteForm) {
    modalQuoteForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Fake submission response
      modalSuccessAlert.style.display = 'block';
      modalQuoteForm.style.display = 'none';

      // Close modal drawer automatically after 3 seconds
      setTimeout(() => {
        closeProductModal();
      }, 3000);
    });
  }
}
