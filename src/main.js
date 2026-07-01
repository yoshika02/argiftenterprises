import { categories as defaultCategories, products as defaultProducts } from './data.js';

// ==========================================
// GOOGLE SHEETS INTEGRATION
// ==========================================
// To use Google Sheets as your database:
// 1. Create a Google Sheet with headers: id, categoryId, name, scale, price, image, features
// 2. Click File -> Share -> Publish to Web -> Choose "CSV"
// 3. Paste the provided URL inside the quotes below:
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/1TjVX-4f6B039tb4URvacKMPDgy8C6Z5p_bz07qlRN9k/export?format=csv"; 

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

// Cart State
let cart = [];

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
  renderCart();
});

// Fetch Data from Google Sheets CSV
function getDirectImageUrl(url) {
  if (!url || url.trim() === '') return '/images/cyber_valkyrie.png';
  
  // Extract Google Drive file ID from any Google Drive URL format:
  // - https://drive.google.com/file/d/FILE_ID/view
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    // lh3.googleusercontent.com is the most reliable way to embed Drive images
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  }
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }
  
  // Already a direct link or unknown format — use as-is
  return url;
}

async function fetchCatalogFromGoogleSheets() {
  return new Promise((resolve) => {
    Papa.parse(GOOGLE_SHEETS_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        if (results.data && results.data.length > 0) {
          // Map numeric category IDs (1,2,3) from the sheet to our string IDs
          const categoryMap = {
            '1': 'anime-figurines',
            '2': 'car-dashboard',
            '3': 'katana',
            'anime-figurines': 'anime-figurines',
            'car-dashboard': 'car-dashboard',
            'katana': 'katana'
          };
          products = results.data.map(row => ({
            id: row.id || Math.random().toString(),
            categoryId: categoryMap[String(row.categoryId || '').trim()] || 'anime-figurines',
            name: row.name || 'Unknown Product',
            scale: row.scale || 'Assorted',
            material: row.material || 'Premium PVC/ABS',
            dimensions: row.dimensions || row.scale || 'Standard',
            releaseDate: row.releaseDate || 'Available Now',
            price: row.price || 'TBD',
            inStock: row.inStock ? (row.inStock.toLowerCase() === 'true' || row.inStock.toLowerCase() === 'yes' || row.inStock.toLowerCase() === 'in stock') : true,
            description: `Size: ${row.scale || 'N/A'} | Price: ₹${row.price || 'TBD'}`,
            features: row.features ? row.features.split(';') : ['Highly detailed sculpt', 'Vibrant paint application'],
            image: getDirectImageUrl(row.image),
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

// Render carousel for featured products on home page (max 6)
function renderCarousel() {
  if (!carouselTrack || !carouselIndicators) return;
  carouselTrack.innerHTML = '';
  carouselIndicators.innerHTML = '';

  // Show only first 6 products on the home page carousel
  const featuredProducts = products.slice(0, 6);
  featuredProducts.forEach((product, index) => {
    // Create carousel slide
    const slide = document.createElement('div');
    slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
    slide.style.minWidth = '100%';

    const extraClass = product.cropClass ? ` ${product.cropClass}` : '';

    slide.innerHTML = `
      <div class="carousel-content">
        <div class="carousel-image">
          <div class="carousel-img-wrap" style="width:100%;height:100%;overflow:hidden;border-radius:12px;">
            <img src="${product.image}" alt="${product.name}"
              style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;"
              onerror="this.style.display='none'" />
          </div>
          <span class="carousel-scale">${product.scale}</span>
        </div>
        <div class="carousel-details">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <button class="btn-primary view-carousel-details" style="justify-content: center;">
            View Details &amp; Request Quote
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
  const slideCount = carouselTrack.querySelectorAll('.carousel-slide').length;
  currentCarouselIndex = (currentCarouselIndex + 1) % slideCount;
  updateCarouselPosition();
}

function previousCarouselSlide() {
  const slideCount = carouselTrack.querySelectorAll('.carousel-slide').length;
  currentCarouselIndex = (currentCarouselIndex - 1 + slideCount) % slideCount;
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

  // Sort categories by number, then render filter buttons
  const sorted = [...categories].sort((a, b) => (a.number || 99) - (b.number || 99));
  sorted.forEach(category => {
    const btn = document.createElement('button');
    btn.className = `filter-btn ${currentCategoryFilter === category.id ? 'active' : ''}`;
    const numLabel = category.number ? `${category.number}. ` : '';
    btn.innerHTML = `${numLabel}${category.name}`;

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
        ${!product.inStock ? '<span class="product-scale" style="top: auto; bottom: 10px; right: 10px; left: auto; background: #e74c3c;">Out of Stock</span>' : ''}
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="product-desc-short">${product.description}</p>
        <div class="qty-row" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; ${!product.inStock ? 'opacity:0.4;pointer-events:none;' : ''}">
          <button class="qty-btn qty-minus" style="width:32px;height:32px;border-radius:50%;border:1px solid var(--border-light);background:rgba(255,255,255,0.05);color:#fff;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>
          <span class="qty-value" style="min-width:36px;text-align:center;font-family:var(--font-head);font-weight:700;font-size:1rem;">1</span>
          <button class="qty-btn qty-plus" style="width:32px;height:32px;border-radius:50%;border:1px solid var(--border-light);background:rgba(255,255,255,0.05);color:#fff;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>
          <span style="font-size:0.8rem;color:var(--text-secondary);margin-left:auto;">max 1000</span>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-secondary view-details-btn" style="flex: 1; justify-content: center; padding: 0.5rem;">
            Details
          </button>
          <button class="btn-primary add-to-cart-btn" style="flex: 1; justify-content: center; padding: 0.5rem;" ${!product.inStock ? 'disabled' : ''}>
            ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    `;

    // View Details button handler
    card.querySelector('.view-details-btn').addEventListener('click', () => {
      openProductModal(product);
    });

    // Quantity +/- handlers
    let qty = 1;
    const qtyValueEl = card.querySelector('.qty-value');
    card.querySelector('.qty-minus').addEventListener('click', (e) => {
      e.stopPropagation();
      if (qty > 1) { qty--; qtyValueEl.textContent = qty; }
    });
    card.querySelector('.qty-plus').addEventListener('click', (e) => {
      e.stopPropagation();
      if (qty < 1000) { qty++; qtyValueEl.textContent = qty; }
    });

    // Add to cart handler (uses selected qty)
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    if (product.inStock && addToCartBtn) {
      addToCartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(product, qty);
        qty = 1;
        qtyValueEl.textContent = '1';
      });
    }

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
  
  // Stock Status
  const stockStatusEl = document.getElementById('modal-stock-status');
  if (stockStatusEl) {
    if (product.inStock) {
      stockStatusEl.textContent = 'In Stock';
      stockStatusEl.style.background = '#2ecc71';
    } else {
      stockStatusEl.textContent = 'Out of Stock';
      stockStatusEl.style.background = '#e74c3c';
    }
  }

  // Setup Add to Cart button
  const addToCartBtn = document.getElementById('modal-add-to-cart');
  // Remove old listeners
  const newAddToCartBtn = addToCartBtn.cloneNode(true);
  addToCartBtn.parentNode.replaceChild(newAddToCartBtn, addToCartBtn);
  
  if (!product.inStock) {
    newAddToCartBtn.disabled = true;
    newAddToCartBtn.style.opacity = '0.5';
    newAddToCartBtn.style.cursor = 'not-allowed';
    newAddToCartBtn.textContent = 'Out of Stock';
  } else {
    newAddToCartBtn.disabled = false;
    newAddToCartBtn.style.opacity = '1';
    newAddToCartBtn.style.cursor = 'pointer';
    newAddToCartBtn.textContent = 'Add to Cart';
    newAddToCartBtn.addEventListener('click', () => {
      addToCart(product);
      closeProductModal();
    });
  }
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

// Cart Functionality
const CART_MAX = 1000;
const CART_RESERVATION_SECONDS = 15 * 60; // 15 minutes
let cartCountdownInterval = null;
let cartCountdownSeconds = 0;

function startCartCountdown() {
  // Reset to 15 minutes whenever something is added
  cartCountdownSeconds = CART_RESERVATION_SECONDS;
  const countdownEl = document.getElementById('cart-countdown');
  if (countdownEl) countdownEl.style.display = 'inline';

  // Clear any existing interval
  if (cartCountdownInterval) clearInterval(cartCountdownInterval);

  cartCountdownInterval = setInterval(() => {
    cartCountdownSeconds--;
    const mins = Math.floor(cartCountdownSeconds / 60);
    const secs = cartCountdownSeconds % 60;
    const display = `⏳ ${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;

    if (countdownEl) {
      countdownEl.textContent = display;
      // Turn red in last 2 minutes
      countdownEl.style.color = cartCountdownSeconds <= 120 ? '#e74c3c' : '#ff6600';
      countdownEl.style.borderColor = cartCountdownSeconds <= 120 ? 'rgba(231,76,60,0.4)' : 'rgba(255,102,0,0.3)';
    }

    if (cartCountdownSeconds <= 0) {
      clearInterval(cartCountdownInterval);
      cartCountdownInterval = null;
      // Cart expired — clear it
      cart = [];
      updateCartUI();
      if (countdownEl) countdownEl.style.display = 'none';
      showToast('⏰ Cart reservation expired! Items have been removed.');
    }
  }, 1000);
}

function stopCartCountdown() {
  if (cartCountdownInterval) {
    clearInterval(cartCountdownInterval);
    cartCountdownInterval = null;
  }
  const countdownEl = document.getElementById('cart-countdown');
  if (countdownEl) countdownEl.style.display = 'none';
}

function showToast(message) {
  let toast = document.getElementById('cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.style.cssText = `
      position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
      background: linear-gradient(135deg, #cc3300, #ff6600);
      color: #fff; font-family: var(--font-head); font-weight: 700;
      padding: 0.9rem 1.8rem; border-radius: 50px;
      box-shadow: 0 4px 20px rgba(255,102,0,0.5);
      opacity: 0; transform: translateY(20px);
      transition: all 0.3s ease; pointer-events: none;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
  }, 2500);
}

function addToCart(product, qty = 1) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (totalItems >= CART_MAX) {
    showToast('Cart is full! Maximum 1000 items.');
    return;
  }
  const allowed = Math.min(qty, CART_MAX - totalItems);
  const existingItem = cart.find(item => item.product.id === product.id);
  if (existingItem) {
    existingItem.quantity += allowed;
  } else {
    cart.push({ product, quantity: allowed });
  }
  startCartCountdown(); // start/reset 15-min reservation timer
  updateCartUI();
  showToast(`✓ ${allowed}x ${product.name} added to cart!`);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.product.id !== productId);
  if (cart.length === 0) stopCartCountdown(); // stop timer when cart is empty
  updateCartUI();
}

function changeCartQty(productId, delta) {
  const item = cart.find(i => i.product.id === productId);
  if (!item) return;
  const totalOther = cart.reduce((sum, i) => i.product.id === productId ? sum : sum + i.quantity, 0);
  item.quantity = Math.max(1, Math.min(CART_MAX - totalOther, item.quantity + delta));
  updateCartUI();
}

function updateCartUI() {
  const cartCountEl = document.getElementById('cart-count');
  if (cartCountEl) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    // Animate the number rolling
    cartCountEl.style.transform = 'scale(1.4)';
    cartCountEl.style.color = '#ff6600';
    cartCountEl.textContent = `(${totalItems}/${CART_MAX})`;
    setTimeout(() => {
      cartCountEl.style.transform = 'scale(1)';
      cartCountEl.style.color = '';
    }, 300);
  }
  renderCart();
}

function renderCart() {
  const cartContainer = document.getElementById('cart-items-container');
  const cartTotalEl = document.getElementById('cart-total-price');
  if (!cartContainer || !cartTotalEl) return;

  if (cart.length === 0) {
    cartContainer.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:2rem;">Your cart is currently empty.</p>';
    cartTotalEl.textContent = '₹0';
    return;
  }

  let total = 0;
  cartContainer.innerHTML = '';
  cart.forEach(item => {
    const priceNum = parseFloat(String(item.product.price).replace(/[^0-9.]/g, '') || 0);
    const itemTotal = item.quantity * priceNum;
    total += itemTotal;

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid rgba(255,255,255,0.1);gap:1rem;flex-wrap:wrap;';

    row.innerHTML = `
      <div style="display:flex; align-items:center; gap: 1rem; flex:1; min-width:0;">
        <div style="width:55px;height:55px;min-width:55px;background-image:url('${item.product.image}');background-size:cover;background-position:center;border-radius:8px;border:1px solid var(--border-light);"></div>
        <div style="min-width:0;">
          <h4 style="margin:0;font-family:var(--font-head);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.product.name}</h4>
          <p style="margin:0;font-size:0.85rem;color:var(--text-secondary);">₹${item.product.price} each</p>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;flex-shrink:0;">
        <button class="cart-qty-btn cart-minus" data-id="${item.product.id}"
          style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border-light);background:rgba(255,255,255,0.05);color:#fff;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>
        <span style="min-width:28px;text-align:center;font-family:var(--font-head);font-weight:700;">${item.quantity}</span>
        <button class="cart-qty-btn cart-plus" data-id="${item.product.id}"
          style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border-light);background:rgba(255,255,255,0.05);color:#fff;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>
        <span style="min-width:60px;text-align:right;font-weight:700;">₹${itemTotal}</span>
        <button class="remove-item-btn btn-secondary" data-id="${item.product.id}"
          style="padding:0.25rem 0.65rem;font-size:0.75rem;border-radius:20px;">✕</button>
      </div>
    `;
    cartContainer.appendChild(row);
  });

  cartTotalEl.textContent = `₹${total}`;

  document.querySelectorAll('.cart-minus').forEach(btn => {
    btn.addEventListener('click', () => changeCartQty(btn.getAttribute('data-id'), -1));
  });
  document.querySelectorAll('.cart-plus').forEach(btn => {
    btn.addEventListener('click', () => changeCartQty(btn.getAttribute('data-id'), 1));
  });
  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.getAttribute('data-id')));
  });
}
