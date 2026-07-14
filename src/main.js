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
  initDesktopCartPanel();
  initMobileCartButtons();
  initBannerSlider();
});

// ==========================================
// BANNER SLIDER
// ==========================================
function initBannerSlider() {
  const slides = document.querySelectorAll('.banner-slide');
  const dots   = document.querySelectorAll('.banner-dot');
  const prev   = document.getElementById('banner-prev');
  const next   = document.getElementById('banner-next');
  if (!slides.length) return;

  let current = 0;
  let timer;

  function goTo(idx) {
    slides[current].classList.remove('active');
    dots[current] && dots[current].classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current] && dots[current].classList.add('active');
  }

  function autoPlay() {
    timer = setInterval(() => goTo(current + 1), 5000);
  }

  function reset() { clearInterval(timer); autoPlay(); }

  if (prev) prev.addEventListener('click', () => { goTo(current - 1); reset(); });
  if (next) next.addEventListener('click', () => { goTo(current + 1); reset(); });
  dots.forEach(d => d.addEventListener('click', () => { goTo(parseInt(d.dataset.index)); reset(); }));

  // "Shop Now" buttons on banner slides
  document.querySelectorAll('.banner-cta-catalog').forEach(btn =>
    btn.addEventListener('click', () => switchView('catalog-view'))
  );

  autoPlay();
}

// Fetch Data from Google Sheets CSV
function getDirectImageUrl(url) {
  if (!url || url.trim() === '') return '/images/cyber_valkyrie.png';
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
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
          const categoryMap = {
            '1': 'anime-figurines', '2': 'car-dashboard', '3': 'katana',
            'anime-figurines': 'anime-figurines', 'car-dashboard': 'car-dashboard', 'katana': 'katana'
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
            stock: row.stock !== undefined ? parseInt(row.stock) : null,  // ← Stock qty from sheet
            inStock: row.inStock ? (row.inStock.toLowerCase() === 'true' || row.inStock.toLowerCase() === 'yes' || row.inStock.toLowerCase() === 'in stock') : true,
            description: `Size: ${row.scale || 'N/A'} | Price: ₹${row.price || 'TBD'}`,
            features: row.features ? row.features.split(';') : ['Highly detailed sculpt', 'Vibrant paint application'],
            image: getDirectImageUrl(row.image),
            cropClass: ''
          }));
        }
        resolve();
      },
      error: function(err) { console.error("Failed to load catalog:", err); resolve(); }
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

    // Check if already in cart
    const inCart = cart.some(i => i.product.id === product.id);
    const cartItem = cart.find(i => i.product.id === product.id);
    const cartQty  = cartItem ? cartItem.quantity : 1;

    card.innerHTML = `
      <div class="product-img-wrapper">
        <div class="product-img${extraClass}" style="background-image: url('${product.image}');" role="img" aria-label="${product.name}"></div>
        <span class="product-scale">${product.scale}</span>
        ${getStockBadgeHTML(product)}
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="product-desc-short">${product.description}</p>

        <!-- Combined cart action row -->
        <div class="cart-action-row" style="${!product.inStock ? 'opacity:0.4;pointer-events:none;' : ''}">
          ${product.inStock ? `
            <!-- Phase 1: Add to Cart button -->
            <button class="btn-primary add-to-cart-btn" style="display:${inCart ? 'none' : 'inline-flex'}; flex:1; justify-content:center; padding:0.5rem; font-size:0.85rem;">
              🛒 Add to Cart
            </button>

            <!-- Phase 2: Qty controls (shown after adding) -->
            <div class="cart-qty-inline${inCart ? ' visible' : ''}">
              <button class="qty-btn qty-minus">−</button>
              <input type="number" class="qty-value-input" value="${cartQty}" min="1" max="1000" style="width: 45px; text-align: center; border: 1.5px solid rgba(255, 102, 0, 0.4); border-radius: 4px; font-family: var(--font-head); font-weight: 700; color: #1a0a00; padding: 2px;">
              <button class="qty-btn qty-plus">+</button>
            </div>
            <button class="go-to-cart-btn${inCart ? ' visible' : ''}">🛒 Cart</button>
          ` : `<button class="btn-primary" disabled style="flex:1;justify-content:center;padding:0.5rem;font-size:0.85rem;opacity:0.5;">Out of Stock</button>`}
        </div>

        <button class="btn-secondary view-details-btn" style="width:100%; justify-content:center; padding:0.45rem; font-size:0.82rem; margin-top:0;">
          Details
        </button>
      </div>
    `;

    // BOTH the image wrapper AND details button open the modal
    card.querySelector('.product-img-wrapper').style.cursor = 'pointer';
    card.querySelector('.product-img-wrapper').addEventListener('click', () => openProductModal(product));
    card.querySelector('.view-details-btn').addEventListener('click', () => openProductModal(product));

    if (product.inStock) {
      const addBtn      = card.querySelector('.add-to-cart-btn');
      const qtyInline   = card.querySelector('.cart-qty-inline');
      const qtyInput    = card.querySelector('.qty-value-input');
      const qtyMinus    = card.querySelector('.qty-minus');
      const qtyPlus     = card.querySelector('.qty-plus');
      const goCartBtn   = card.querySelector('.go-to-cart-btn');

      // Track local qty for new additions (if not yet in cart)
      let pendingQty = 1;

      // When the qty controls are visible they reflect the CART quantity
      function syncQtyFromCart() {
        const ci = cart.find(i => i.product.id === product.id);
        if (ci && qtyInput) qtyInput.value = ci.quantity;
      }

      // Phase-toggle helper
      function showQtyPhase() {
        if (addBtn)    addBtn.style.display    = 'none';
        if (qtyInline) qtyInline.classList.add('visible');
        if (goCartBtn) goCartBtn.classList.add('visible');
        syncQtyFromCart();
      }

      function showAddPhase() {
        if (addBtn)    addBtn.style.display    = 'inline-flex';
        if (qtyInline) qtyInline.classList.remove('visible');
        if (goCartBtn) goCartBtn.classList.remove('visible');
        pendingQty = 1;
        if (qtyInput) qtyInput.value = '1';
      }

      // Start in correct phase
      if (inCart) showQtyPhase();

      // Add to Cart button click
      if (addBtn) {
        addBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          addToCart(product, pendingQty);
          showQtyPhase();
        });
      }
      
      // Manual quantity input
      if (qtyInput) {
        qtyInput.addEventListener('change', (e) => {
          e.stopPropagation();
          const newQty = parseInt(e.target.value, 10);
          if (isNaN(newQty) || newQty <= 0) {
             removeFromCart(product.id);
             showAddPhase();
          } else {
             setCartQty(product.id, newQty);
             syncQtyFromCart();
          }
        });
        qtyInput.addEventListener('click', (e) => e.stopPropagation()); // prevent triggering details view
      }

      // Qty minus: if hits 0, remove from cart and revert to add phase
      if (qtyMinus) {
        qtyMinus.addEventListener('click', (e) => {
          e.stopPropagation();
          const ci = cart.find(i => i.product.id === product.id);
          if (ci) {
            if (ci.quantity <= 1) {
              removeFromCart(product.id);
              showAddPhase();
            } else {
              changeCartQty(product.id, -1);
              syncQtyFromCart();
            }
          } else if (pendingQty > 1) {
            pendingQty--;
            if (qtyInput) qtyInput.value = pendingQty;
          }
        });
      }

      // Qty plus
      if (qtyPlus) {
        qtyPlus.addEventListener('click', (e) => {
          e.stopPropagation();
          const ci = cart.find(i => i.product.id === product.id);
          if (ci) {
             changeCartQty(product.id, 1);
             syncQtyFromCart();
          } else {
             pendingQty++;
             if (qtyInput) qtyInput.value = pendingQty;
          }
        });
      }

      // Go to cart button
      if (goCartBtn) {
        goCartBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          switchView('cart-view');
        });
      }
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

  // Feature bullets
  modalFeatureList.innerHTML = '';
  product.features.forEach(feature => {
    const li = document.createElement('li');
    li.textContent = feature;
    modalFeatureList.appendChild(li);
  });

  // Related figures (same category, different id, max 8)
  const relatedGrid = document.getElementById('modal-related-grid');
  const relatedWrap = document.getElementById('modal-related-wrap');
  if (relatedGrid) {
    const related = products
      .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 8);
    if (related.length > 0) {
      relatedGrid.innerHTML = '';
      related.forEach(rel => {
        const thumb = document.createElement('div');
        thumb.className = 'modal-related-thumb';
        thumb.style.backgroundImage = `url('${rel.image}')`;
        if (rel.cropClass) thumb.style.backgroundPosition = rel.cropClass === 'crop-top' ? 'center top' : 'center bottom';
        thumb.title = rel.name;
        thumb.addEventListener('click', () => openProductModal(rel));
        relatedGrid.appendChild(thumb);
      });
      if (relatedWrap) relatedWrap.style.display = 'block';
    } else {
      if (relatedWrap) relatedWrap.style.display = 'none';
    }
  }

  // Reset tab to Specifications
  tabBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === 'tab-specs') btn.classList.add('active');
    else btn.classList.remove('active');
  });
  tabPanes.forEach(pane => {
    if (pane.id === 'tab-specs') pane.classList.add('active');
    else pane.classList.remove('active');
  });

  modalSuccessAlert.style.display = 'none';
  modalQuoteForm.reset();
  modalQuoteForm.style.display = 'block';

  productModal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Stock Status
  const stockStatusEl = document.getElementById('modal-stock-status');
  if (stockStatusEl) {
    if (product.inStock) {
      const stockNum = (product.stock !== null && product.stock !== undefined) ? ` (${product.stock} left)` : '';
      stockStatusEl.textContent = `In Stock${stockNum}`;
      stockStatusEl.style.background = product.stock !== null && product.stock <= 5 ? '#e67e22' : '#2ecc71';
    } else {
      stockStatusEl.textContent = 'Out of Stock';
      stockStatusEl.style.background = '#e74c3c';
    }
  }

  // Add to Cart button
  const addToCartBtn = document.getElementById('modal-add-to-cart');
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

// ── Stock badge helper ──────────────────────────────────────
function getStockBadgeHTML(product) {
  if (!product.inStock) {
    return '<span class="stock-badge out-stock" style="position:absolute;top:auto;bottom:10px;right:10px;left:auto;">Out of Stock</span>';
  }
  if (product.stock !== null && product.stock !== undefined) {
    if (product.stock <= 0) {
      return '<span class="stock-badge out-stock" style="position:absolute;top:auto;bottom:10px;right:10px;left:auto;">Out of Stock</span>';
    }
    if (product.stock <= 5) {
      return `<span class="stock-badge low-stock" style="position:absolute;top:auto;bottom:10px;right:10px;left:auto;">Only ${product.stock} left!</span>`;
    }
    return `<span class="stock-badge in-stock" style="position:absolute;top:auto;bottom:10px;right:10px;left:auto;">Stock: ${product.stock}</span>`;
  }
  return ''; // no stock info, show nothing extra
}

// ── Local Order ID (fallback if Apps Script URL not set) ────
function generateLocalOrderId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'ARG-';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
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
  updateCartUI();
  showToast(`✓ ${allowed}x ${product.name} added to cart!`);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.product.id !== productId);
  updateCartUI();
}

function changeCartQty(productId, delta) {
  const item = cart.find(i => i.product.id === productId);
  if (!item) return;
  const totalOther = cart.reduce((sum, i) => i.product.id === productId ? sum : sum + i.quantity, 0);
  item.quantity = Math.max(1, Math.min(CART_MAX - totalOther, item.quantity + delta));
  updateCartUI();
}

function setCartQty(productId, newQty) {
  const item = cart.find(i => i.product.id === productId);
  if (!item) return;
  const totalOther = cart.reduce((sum, i) => i.product.id === productId ? sum : sum + i.quantity, 0);
  item.quantity = Math.max(1, Math.min(CART_MAX - totalOther, newQty));
  updateCartUI();
}

function updateCartUI() {
  const cartCountEl = document.getElementById('cart-count');
  const mobileBadge = document.getElementById('mobile-cart-badge');
  const mfcCount    = document.getElementById('mfc-count');
  const mfcBtn      = document.getElementById('mobile-float-cart');
  const dcpTabCount = document.getElementById('dcp-tab-count');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cartCountEl) {
    // Animate the number rolling
    cartCountEl.style.transform = 'scale(1.4)';
    cartCountEl.style.color = '#ff6600';
    cartCountEl.textContent = `(${totalItems}/${CART_MAX})`;
    setTimeout(() => {
      cartCountEl.style.transform = 'scale(1)';
      cartCountEl.style.color = '';
    }, 300);
  }

  // Mobile badge on cart icon
  if (mobileBadge) {
    if (totalItems > 0) {
      mobileBadge.style.display = 'flex';
      mobileBadge.textContent = totalItems > 99 ? '99+' : totalItems;
    } else {
      mobileBadge.style.display = 'none';
    }
  }

  // Mobile floating "Go to Cart" button
  if (mfcBtn) {
    if (totalItems > 0) {
      mfcBtn.style.display = 'flex';
      if (mfcCount) mfcCount.textContent = totalItems;
    } else {
      mfcBtn.style.display = 'none';
    }
  }

  // Desktop side panel tab count
  if (dcpTabCount) dcpTabCount.textContent = totalItems;

  renderCart();
  renderDesktopCartPanel();
}

function renderCart() {
  const cartContainer = document.getElementById('cart-items-container');
  const cartTotalEl   = document.getElementById('cart-total-price');
  const checkoutBtn   = document.getElementById('checkout-btn');
  const progressEl    = document.getElementById('min-order-progress');
  const labelEl       = document.getElementById('min-order-label');
  const msgEl         = document.getElementById('min-order-msg');
  const MIN_ORDER     = 5000;

  if (!cartContainer || !cartTotalEl) return;

  if (cart.length === 0) {
    cartContainer.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:2rem 0;">Your cart is currently empty. Add items from the Catalog!</p>';
    cartTotalEl.textContent = '₹0';
    if (progressEl) progressEl.style.width = '0%';
    if (labelEl)    labelEl.textContent = '₹0 / ₹5,000';
    if (msgEl)      msgEl.textContent = 'Add items to start your wholesale order.';
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = '0.45';
      checkoutBtn.style.cursor = 'not-allowed';
      checkoutBtn.textContent = '🔒 Min ₹5,000 Required';
    }
    return;
  }

  let total = 0;
  cartContainer.innerHTML = '';
  cart.forEach(item => {
    const priceNum = parseFloat(String(item.product.price).replace(/[^0-9.]/g, '') || 0);
    const itemTotal = item.quantity * priceNum;
    total += itemTotal;

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid rgba(255,153,0,0.12);gap:1rem;flex-wrap:wrap;';

    row.innerHTML = `
      <div style="display:flex;align-items:center;gap:1rem;flex:1;min-width:0;">
        <div style="width:55px;height:55px;min-width:55px;background-image:url('${item.product.image}');background-size:cover;background-position:center top;border-radius:8px;border:1px solid rgba(255,153,0,0.2);"></div>
        <div style="min-width:0;">
          <h4 style="margin:0;font-family:var(--font-head);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.product.name}</h4>
          <p style="margin:0;font-size:0.85rem;color:var(--text-secondary);">₹${item.product.price} each</p>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;flex-shrink:0;">
        <button class="cart-qty-btn cart-minus" data-id="${item.product.id}"
          style="width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,102,0,0.4);background:rgba(255,102,0,0.1);color:#ff6600;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;">−</button>
        <input type="number" class="cart-qty-input" data-id="${item.product.id}" value="${item.quantity}" min="1" max="1000" style="width: 50px; text-align: center; border: 1.5px solid rgba(255, 102, 0, 0.4); border-radius: 4px; font-family: var(--font-head); font-weight: 700; color: #1a0a00; padding: 2px;">
        <button class="cart-qty-btn cart-plus" data-id="${item.product.id}"
          style="width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,102,0,0.4);background:rgba(255,102,0,0.1);color:#ff6600;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;">+</button>
        <span style="min-width:65px;text-align:right;font-weight:700;color:#ff6600;">₹${itemTotal}</span>
        <button class="remove-item-btn btn-secondary" data-id="${item.product.id}"
          style="padding:0.25rem 0.7rem;font-size:0.8rem;border-radius:20px;">✕</button>
      </div>
    `;
    cartContainer.appendChild(row);
  });

  // Update total
  cartTotalEl.textContent = `₹${total.toLocaleString('en-IN')}`;

  // Update progress bar
  const pct = Math.min(100, (total / MIN_ORDER) * 100);
  if (progressEl) progressEl.style.width = `${pct}%`;
  if (labelEl)    labelEl.textContent = `₹${total.toLocaleString('en-IN')} / ₹5,000`;

  const remaining = MIN_ORDER - total;
  if (msgEl) {
    if (total >= MIN_ORDER) {
      msgEl.textContent = '✅ Minimum order reached! You can proceed to checkout.';
      msgEl.style.color = '#2ecc71';
    } else {
      msgEl.textContent = `Add ₹${remaining.toLocaleString('en-IN')} more to unlock checkout.`;
      msgEl.style.color = 'var(--text-secondary)';
    }
  }

  // Enable / disable checkout button
  if (checkoutBtn) {
    if (total >= MIN_ORDER) {
      checkoutBtn.disabled = false;
      checkoutBtn.style.opacity = '1';
      checkoutBtn.style.cursor = 'pointer';
      checkoutBtn.innerHTML = '✅ Proceed to Checkout';
    } else {
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = '0.45';
      checkoutBtn.style.cursor = 'not-allowed';
      checkoutBtn.innerHTML = `🔒 Add ₹${remaining.toLocaleString('en-IN')} more`;
    }
  }

  document.querySelectorAll('.cart-minus').forEach(btn => {
    btn.addEventListener('click', () => changeCartQty(btn.getAttribute('data-id'), -1));
  });
  document.querySelectorAll('.cart-plus').forEach(btn => {
    btn.addEventListener('click', () => changeCartQty(btn.getAttribute('data-id'), 1));
  });
  document.querySelectorAll('.cart-qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const newQty = parseInt(e.target.value, 10);
      const id = e.target.getAttribute('data-id');
      if (isNaN(newQty) || newQty <= 0) {
        removeFromCart(id);
      } else {
        setCartQty(id, newQty);
      }
    });
  });
  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.getAttribute('data-id')));
  });

  // Checkout button → go to checkout view
  if (checkoutBtn && !checkoutBtn._listenerAdded) {
    checkoutBtn._listenerAdded = true;
    checkoutBtn.addEventListener('click', () => {
      if (!checkoutBtn.disabled) openCheckoutView();
    });
  }
}

// =============================================
// DESKTOP SIDE CART PANEL RENDERING
// =============================================
function renderDesktopCartPanel() {
  const panel    = document.getElementById('desktop-cart-panel');
  const itemsEl  = document.getElementById('dcp-items');
  const totalEl  = document.getElementById('dcp-total');
  const fillEl   = document.getElementById('dcp-progress-fill');
  const msgEl    = document.getElementById('dcp-progress-msg');
  const chkBtn   = document.getElementById('dcp-checkout-btn');
  const MIN_ORDER = 5000;

  if (!panel || !itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="dcp-empty">Your cart is empty.<br>Add items from the catalog!</p>';
    if (totalEl) totalEl.textContent = '₹0';
    if (fillEl)  fillEl.style.width = '0%';
    if (msgEl)   msgEl.textContent = 'Min ₹5,000 for checkout';
    if (chkBtn) {
      chkBtn.disabled = true;
      chkBtn.style.opacity = '0.5';
      chkBtn.style.cursor = 'not-allowed';
      chkBtn.innerHTML = '🔒 Min ₹5,000 Required';
    }
    return;
  }

  let total = 0;
  itemsEl.innerHTML = '';
  cart.forEach(item => {
    const priceNum  = parseFloat(String(item.product.price).replace(/[^0-9.]/g, '') || 0);
    const itemTotal = item.quantity * priceNum;
    total += itemTotal;

    const div = document.createElement('div');
    div.className = 'dcp-item';
    div.innerHTML = `
      <div class="dcp-item-img" style="background-image:url('${item.product.image}');"></div>
      <div class="dcp-item-info">
        <div class="dcp-item-name">${item.product.name}</div>
        <div class="dcp-item-price">₹${item.product.price} × ${item.quantity} = <strong style="color:#ff6600;">₹${itemTotal.toLocaleString('en-IN')}</strong></div>
      </div>
      <div class="dcp-item-controls">
        <button class="dcp-qty-btn dcp-minus" data-id="${item.product.id}">−</button>
        <input type="number" class="dcp-qty-input" data-id="${item.product.id}" value="${item.quantity}" min="1" max="1000" style="width: 40px; text-align: center; border: 1.5px solid rgba(255, 102, 0, 0.4); border-radius: 4px; font-family: var(--font-head); font-weight: 700; color: #1a0a00; padding: 2px; font-size: 0.85rem;">
        <button class="dcp-qty-btn dcp-plus" data-id="${item.product.id}">+</button>
        <button class="dcp-remove" data-id="${item.product.id}">✕</button>
      </div>
    `;
    itemsEl.appendChild(div);
  });

  if (totalEl) totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;

  const pct = Math.min(100, (total / MIN_ORDER) * 100);
  if (fillEl) fillEl.style.width = `${pct}%`;
  if (msgEl) {
    if (total >= MIN_ORDER) {
      msgEl.textContent = '✅ Ready to checkout!';
      msgEl.style.color = '#2ecc71';
    } else {
      const rem = (MIN_ORDER - total).toLocaleString('en-IN');
      msgEl.textContent = `Add ₹${rem} more to checkout`;
      msgEl.style.color = 'var(--text-secondary)';
    }
  }

  if (chkBtn) {
    if (total >= MIN_ORDER) {
      chkBtn.disabled = false;
      chkBtn.style.opacity = '1';
      chkBtn.style.cursor = 'pointer';
      chkBtn.innerHTML = '✅ Proceed to Checkout';
    } else {
      chkBtn.disabled = true;
      chkBtn.style.opacity = '0.5';
      chkBtn.style.cursor = 'not-allowed';
      chkBtn.innerHTML = `🔒 Add ₹${(MIN_ORDER - total).toLocaleString('en-IN')} more`;
    }
  }

  // Attach panel controls
  panel.querySelectorAll('.dcp-minus').forEach(btn => {
    btn.addEventListener('click', () => { changeCartQty(btn.getAttribute('data-id'), -1); });
  });
  panel.querySelectorAll('.dcp-plus').forEach(btn => {
    btn.addEventListener('click', () => { changeCartQty(btn.getAttribute('data-id'), 1); });
  });
  panel.querySelectorAll('.dcp-qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const newQty = parseInt(e.target.value, 10);
      const id = e.target.getAttribute('data-id');
      if (isNaN(newQty) || newQty <= 0) {
        removeFromCart(id);
      } else {
        setCartQty(id, newQty);
      }
    });
  });
  panel.querySelectorAll('.dcp-remove').forEach(btn => {
    btn.addEventListener('click', () => { removeFromCart(btn.getAttribute('data-id')); });
  });
}

// Init desktop panel tab trigger + open/close
function initDesktopCartPanel() {
  const panel   = document.getElementById('desktop-cart-panel');
  const closeBtn = document.getElementById('dcp-close-btn');
  const goBtn   = document.getElementById('dcp-go-cart-btn');
  const chkBtn  = document.getElementById('dcp-checkout-btn');

  // Create the vertical tab trigger button
  const trigger = document.createElement('button');
  trigger.className = 'dcp-tab-trigger';
  trigger.id = 'dcp-tab-trigger';
  trigger.setAttribute('aria-label', 'Open cart');
  trigger.innerHTML = `🛒 Cart <span class="dcp-tab-count" id="dcp-tab-count">0</span>`;
  document.body.appendChild(trigger);

  trigger.addEventListener('click', () => {
    panel.classList.add('open');
    trigger.style.display = 'none';
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel.classList.remove('open');
      trigger.style.display = 'flex';
    });
  }

  if (goBtn) {
    goBtn.addEventListener('click', () => {
      panel.classList.remove('open');
      trigger.style.display = 'flex';
      switchView('cart-view');
    });
  }

  if (chkBtn && !chkBtn._listenerAdded) {
    chkBtn._listenerAdded = true;
    chkBtn.addEventListener('click', () => {
      if (!chkBtn.disabled) {
        panel.classList.remove('open');
        trigger.style.display = 'flex';
        openCheckoutView();
      }
    });
  }
}

// Init mobile cart button & floating button
function initMobileCartButtons() {
  const mobileCartBtn   = document.getElementById('mobile-cart-btn');
  const mobileFloatCart = document.getElementById('mobile-float-cart');

  if (mobileCartBtn) {
    mobileCartBtn.addEventListener('click', () => {
      navMenu.classList.remove('active');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
      switchView('cart-view');
    });
  }

  if (mobileFloatCart) {
    mobileFloatCart.addEventListener('click', () => {
      switchView('cart-view');
    });
  }
}

// ==========================================
// GOOGLE APPS SCRIPT — ORDER SUBMISSION
// ==========================================
// SETUP INSTRUCTIONS:
// 1. Go to script.google.com → New project
// 2. Paste the Apps Script code from the guide below
// 3. Deploy as Web App (Anyone can access)
// 4. Replace the URL below with your deployed Apps Script URL
const ORDERS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbytHRWoz1_aCIzAag9n0aKP3NHGZhuf63CWjqHdPVl8xphQ7HDFCDFNHXSINfIe2rG_/exec"; // ← PASTE YOUR APPS SCRIPT WEB APP URL HERE

async function submitOrderToSheet(orderData) {
  if (!ORDERS_SCRIPT_URL || ORDERS_SCRIPT_URL.trim() === "") {
    console.warn("ORDERS_SCRIPT_URL not set — skipping sheet submission");
    return { success: true, skipped: true, orderId: null };
  }
  try {
    const formData = new FormData();
    Object.entries(orderData).forEach(([k, v]) => formData.append(k, v));
    const res  = await fetch(ORDERS_SCRIPT_URL, { method: 'POST', body: formData });
    const text = await res.text();
    let parsed = {};
    try { parsed = JSON.parse(text); } catch(_) {}
    return { success: true, response: text, orderId: parsed.orderId || null };
  } catch (err) {
    console.error("Sheet submission failed:", err);
    return { success: false, error: err.message, orderId: null };
  }
}

// ==========================================
// CHECKOUT FLOW
// ==========================================
function openCheckoutView() {
  // Populate checkout cart summary
  const listEl   = document.getElementById('checkout-items-list');
  const totalEl  = document.getElementById('checkout-total-display');
  if (listEl) {
    let total = 0;
    listEl.innerHTML = cart.map(item => {
      const price = parseFloat(String(item.product.price).replace(/[^0-9.]/g, '') || 0);
      const sub = price * item.quantity;
      total += sub;
      return `<div style="display:flex;justify-content:space-between;">
        <span>${item.product.name} × ${item.quantity}</span>
        <span style="color:#ff6600;font-weight:600;">₹${sub.toLocaleString('en-IN')}</span>
      </div>`;
    }).join('');
    if (totalEl) totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
  }
  switchView('checkout-view');

  // Back to cart button
  const backBtn = document.getElementById('back-to-cart-btn');
  if (backBtn && !backBtn._listenerAdded) {
    backBtn._listenerAdded = true;
    backBtn.addEventListener('click', () => switchView('cart-view'));
  }

  // Order form submit
  const orderForm = document.getElementById('order-form');
  if (orderForm && !orderForm._listenerAdded) {
    orderForm._listenerAdded = true;
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const placeBtn = document.getElementById('place-order-btn');
      placeBtn.textContent = '⏳ Sending...';
      placeBtn.disabled = true;

      const name     = document.getElementById('order-name').value.trim();
      const phone    = document.getElementById('order-phone').value.trim();
      const email    = (document.getElementById('order-email') || {}).value?.trim() || '';
      const business = document.getElementById('order-business').value.trim();
      const city     = document.getElementById('order-city').value.trim();
      const notes    = document.getElementById('order-notes').value.trim();

      // Build order summary string
      let total = 0;
      const itemLines = cart.map(item => {
        const price = parseFloat(String(item.product.price).replace(/[^0-9.]/g, '') || 0);
        const sub = price * item.quantity;
        total += sub;
        return `${item.product.name} x${item.quantity} = ₹${sub.toLocaleString('en-IN')}`;
      });
      const orderSummary = itemLines.join(' | ');
      const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      const orderData = {
        Timestamp:    timestamp,
        Name:         name,
        Phone:        phone,
        WhatsApp:     phone,
        Email:        email,
        Business:     business || '—',
        City:         city,
        Notes:        notes || '—',
        OrderItems:   orderSummary,
        OrderTotal:   `₹${total.toLocaleString('en-IN')}`,
      };

      const sheetResult = await submitOrderToSheet(orderData);
      const orderId = sheetResult.orderId || generateLocalOrderId();

      showConfirmationPage(name, total, orderId, email);

      cart = [];
      updateCartUI();

      placeBtn.textContent = '✅ Pay Now & Complete Order';
      placeBtn.disabled = false;
    });
  }
}

function showConfirmationPage(name, total, orderId, customerEmail) {
  orderId = orderId || generateLocalOrderId();
  const confirmItems = document.getElementById('confirm-items');
  const confirmTotal = document.getElementById('confirm-total');
  const confirmMsg   = document.getElementById('confirm-message');
  const confirmIdEl  = document.getElementById('confirm-order-id');
  const qrWrap       = document.getElementById('confirm-qr-wrap');
  const qrImg        = document.getElementById('confirm-qr-img');

  if (confirmMsg) confirmMsg.textContent = `Thank you, ${name}! Our team will contact you on WhatsApp shortly to confirm your order.`;
  if (confirmTotal) confirmTotal.textContent = `\u20b9${total.toLocaleString('en-IN')}`;
  if (confirmIdEl) confirmIdEl.textContent = orderId;

  // QR code — encodes order ID + total
  if (qrWrap && qrImg) {
    const qrData = encodeURIComponent(`Order:${orderId} Total:₹${total.toLocaleString('en-IN')} Customer:${name}`);
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;
    qrWrap.style.display = 'block';
    if (customerEmail) {
      qrImg.nextElementSibling && (qrImg.nextElementSibling.textContent = `QR code + full details emailed to ${customerEmail}`);
    }
  }

  if (confirmItems) {
    const cartSnapshot = [...cart]; // cart cleared after this
    confirmItems.innerHTML = cartSnapshot.length > 0 ? cartSnapshot.map(item => {
      const price = parseFloat(String(item.product.price).replace(/[^0-9.]/g, '') || 0);
      const sub = price * item.quantity;
      return `<div style="display:flex;justify-content:space-between;">
        <span>${item.product.name} \u00d7 ${item.quantity}</span>
        <span style="color:#ff6600;font-weight:600;">\u20b9${sub.toLocaleString('en-IN')}</span>
      </div>`;
    }).join('') : '<p style="color:#a07050;">Order submitted successfully.</p>';
  }

  switchView('confirmation-view');

  const continueBtn = document.getElementById('continue-shopping-btn');
  if (continueBtn && !continueBtn._listenerAdded) {
    continueBtn._listenerAdded = true;
    continueBtn.addEventListener('click', () => switchView('catalog-view'));
  }
}
