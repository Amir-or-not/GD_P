import { useParams } from "react-router-dom";
import { useEffect, useState } from 'react';
import scroll from '../js/scroll';
import Navbar from "./Navbar";
// import cart from '../js/cart';
import LoadingSpinner from "./LoadingSpinner";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [sortBy, setSortBy] = useState('default');
  const [isLoading, setIsLoading] = useState(true); // 👈 добавили состояние загрузки

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: '/images/product-placeholder.png',
    category: 'Charms',
  });

  const categories = [
    'Charms',
    'Bracelets',
    'Necklaces',
    'Rings',
    'Watches',
    'Knifes'
  ];

  const categoryImages = {
    Charms: 'charm.png',
    Bracelets: 'bracelet.png',
    Necklaces: 'necklace.png',
    Rings: 'ring.png',
    Watches: 'wath.png',
    Knives: 'knive.png',
  };

  useEffect(() => {
    fetch("http://localhost:8000/shop/")
      .then((res) => res.json())
      .then((data) => {
        const loadedProducts = data.products || [];
        setProducts(loadedProducts);
        setFilteredProducts(loadedProducts);

        if (loadedProducts.length > 0) {
          const maxProductPrice = Math.max(...loadedProducts.map(p => p.price));
          setPriceRange(prev => ({ ...prev, max: maxProductPrice }));
        }
      })
      .catch((error) => {
        console.error("Ошибка при загрузке товаров:", error);
      })
      .finally(() => {
        setIsLoading(false); // 👈 отключаем спиннер после загрузки
      });
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, priceRange, sortBy, products]);

  const applyFilters = () => {
    let result = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(product =>
        product.category === selectedCategory
      );
    }

    result = result.filter(product =>
      product.price >= priceRange.min &&
      product.price <= priceRange.max
    );

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    setFilteredProducts(result);
  };

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('quantity', quantity);

    const response = await fetch(`http://localhost:8000/add-to-cart/${productId}/`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (response.ok) {
      console.log('Товар добавлен в корзину');
    } else {
      console.error('Ошибка при добавлении товара в корзину');
    }
  };

  const toggleAdminPanel = () => {
    setShowAdminPanel(!showAdminPanel);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value
    });
  };

  const handleAddProduct = (e) => {
    e.preventDefault();

    const newProductWithId = {
      ...newProduct,
      id: Date.now().toString(),
      price: parseFloat(newProduct.price)
    };

    setProducts([...products, newProductWithId]);

    setNewProduct({
      name: '',
      description: '',
      price: '',
      image: '/images/product-placeholder.png',
      category: 'Charms',
    });

    alert('Продукт успешно добавлен!');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category === selectedCategory ? 'all' : category);
  };

  const handlePriceChange = (type, value) => {
    setPriceRange({
      ...priceRange,
      [type]: Number(value)
    });
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  const handleAddToLiked = async (productId) => {
    try {
      const response = await fetch(`http://localhost:8000/add-to-liked/${productId}`, {
        method: "POST",
        credentials: "include"
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log(data.message);
        alert("Товар добавлен в избранное!");
      } else if (response.status === 401) {
        alert("Вы не авторизованы!");
      } else {
        console.error("Ошибка при добавлении в избранное:", await response.text());
      }
    } catch (error) {
      console.error("Ошибка при отправке запроса:", error);
      alert("Ошибка сети или сервера");
    }
  };
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange({ min: 0, max: Math.max(...products.map(p => p.price)) || 1000000 });
    setSortBy('default');
  };

  // useEffect(() => {
  //   const cleanupCart = cart?.();
  //   const cleanupScroll = scroll?.();

  //   return () => {
  //     if (typeof cleanupCart === 'function') cleanupCart();
  //     if (typeof cleanupScroll === 'function') cleanupScroll();
  //   };
  // }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
<>
  <meta charSet="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GPlace</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
  <link
    href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap"
    rel="stylesheet"
  />
  <link rel="stylesheet" href="/static/all.min.css" />
  <link rel="stylesheet" href="/static/styles.css" />
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
  />
  <Navbar />
  {/* баннер */}
  <section className="shop-section">
    <div className="banner2">
      <img src="/images/i.png" alt="banner" />
    </div>
    <div className="content-wrapper">
      <div className="text-content">
        <h2 className="heading">Products</h2>
        <p className="description">
          Watch the GD Catalogue for something you like
        </p>
        <a href="#" className="more-link">
          Something More
        </a>
      </div>
      <div className="categories">
        {categories.map((category) => (
          <div 
            key={category} 
            className={`category ${selectedCategory === category ? 'category-active' : ''}`}
            onClick={() => handleCategorySelect(category)}
          >
            <div className="category-img">
              <img src={`/images/${category.toLowerCase().replace('s', '')}.png`} alt={category} />
            </div>
            <span className="category-name">{category}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
  {/* фильтр и поиск */}
  <section className="filter-section" style={{ position: "relative"}}>
    <div className="nav-container">
      <button className="filter-button" onClick={toggleFilters}>
        <svg
          className="filter-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1={4} y1={6} x2={20} y2={6} />
          <line x1={4} y1={12} x2={20} y2={12} />
          <line x1={4} y1={18} x2={20} y2={18} />
          <line x1={9} y1={3} x2={9} y2={9} />
          <line x1={15} y1={15} x2={15} y2={21} />
        </svg>
        FILTER &amp; SORT
      </button>
      <div
        className="search-container"
        style={{ position: "relative", right: "52.5px" }}
      >
        <input
          type="text"
          className="search-input"
          placeholder="Search for jewelry..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <svg
          className="search-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx={11} cy={11} r={8} />
          <line x1={21} y1={21} x2="16.65" y2="16.65" />
        </svg>
      </div>
    </div>
    
    {/* Expanded filter panel */}
    {showFilters && (
      <div className="expanded-filters">
        <div className="filter-panel">
          <div className="filter-section">
            <h3>Sort By</h3>
            <select value={sortBy} onChange={handleSortChange} className="sort-select">
              <option value="default">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
          
          <div className="filter-section">
            <h3>Price Range</h3>
            <div className="price-inputs">
              <div className="price-input-group">
                <label>Min:</label>
                <input 
                  type="number" 
                  value={priceRange.min} 
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  min="0"
                />
              </div>
              <div className="price-input-group">
                <label>Max:</label>
                <input 
                  type="number" 
                  value={priceRange.max} 
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  min={priceRange.min}
                />
              </div>
            </div>
            <div className="price-slider">
              <input 
                type="range" 
                min="0" 
                max={Math.max(...products.map(p => p.price)) || 1000000}
                value={priceRange.max} 
                onChange={(e) => handlePriceChange('max', e.target.value)}
                className="slider"
              />
            </div>
          </div>
          
          <div className="filter-section">
            <h3>Categories</h3>
            <div className="filter-categories">
              <div 
                className={`filter-category ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </div>
              {categories.map(category => (
                <div 
                  key={category}
                  className={`filter-category ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                </div>
              ))}
            </div>
          </div>
          
          <div className="filter-actions">
            <button className="reset-filters" onClick={resetFilters}>
              Reset Filters
            </button>
            <button className="apply-filters" onClick={toggleFilters}>
              Close Filters
            </button>
          </div>
        </div>
      </div>
    )}
  </section>

  {/* Results summary */}
  <div className="filter-results-summary">
    <p>
      {filteredProducts.length === 0 
        ? "No products found matching your criteria" 
        : `Showing ${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'}`}
      {selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}
      {searchQuery ? ` matching "${searchQuery}"` : ''}
    </p>
  </div>

  {/* Products grid */}
  <div className="products-grid">
    {filteredProducts.map((product) => (
      <div key={product.id} className="product-card">
        <a
          href={`/product/${encodeURIComponent(product.name)}/`}
          style={{ textDecoration: "none" }}
        >
          <img
            src={product.image}
            alt={product.name}
            className="product-image"
          />
          <div className="product-info">
            <div className="product-tags">
              <span className="tag">BEST SELLER</span>
              {product.category && <span className="tag category-tag">{product.category}</span>}
            </div>
            <h3 className="product-title">{product.name}</h3>
            <p className="product-description">{product.description}</p>
            <p className="product-price">{product.price} ₸</p>
          </div>
        </a>

        <div className="product-actions">
          <button onClick={() => handleAddToLiked(product.id)} type="button" className="button-standard">
            <i className="far fa-heart" />
          </button>
          <form onSubmit={(e) => handleAddToCart(e, product.id)} className="add-to-cart-form">
            <input
              type="number"
              value={quantity}
              min={1}
              onChange={(e) => setQuantity(e.target.value)}
              className="quantity-input hidden"
            />
            <button type="submit" className="add-to-cart-button">
              <i className="fas fa-cart-plus" />
            </button>
          </form>
        </div>
      </div>
    ))}
  </div>

  {/* Empty state */}
  {filteredProducts.length === 0 && (
    <div className="empty-products-state">
      <i className="fas fa-search"></i>
      <h3>No products found</h3>
      <p>Try adjusting your filters or search query</p>
      <button className="reset-search-button" onClick={resetFilters}>Reset All Filters</button>
    </div>
  )}

  <footer className="site-footer">
    <div className="footer-container">
      <div className="footer-section about">
        <h2>About Us</h2>
        <p>
          Your go-to destination for luxury watches and accessories. Discover
          timeless elegance and modern design.
        </p>
      </div>
      <div className="footer-section links">
        <h2>Quick Links</h2>
        <ul>
          <li>
            <a href="#">Shop</a>
          </li>
          <li>
            <a href="#">Collections</a>
          </li>
          <li>
            <a href="#">About</a>
          </li>
          <li>
            <a href="#">Contact</a>
          </li>
        </ul>
      </div>
      <div className="footer-section social">
        <h2>Follow Us</h2>
        <div className="social-icons">
          <a href="#">
            <i className="fab fa-instagram" />
          </a>
          <a href="#">
            <i className="fab fa-github" />
          </a>
          <a href="#">
            <i className="fab fa-telegram" />
          </a>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© 2025 GD Accesories. All rights reserved.</p>
    </div>
  </footer>
  
  {/* Admin button */}
  <button 
    className="admin-toggle-button" 
    onClick={toggleAdminPanel}
    title="Admin Panel"
  >
    <i className="fas fa-toolbox"></i>
  </button>
  
  {/* Admin panel */}
  {showAdminPanel && (
    <div className="admin-panel-overlay">
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Product Management</h2>
          <button className="admin-close-button" onClick={toggleAdminPanel}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="admin-panel-content">
          <form className="add-product-form" onSubmit={handleAddProduct}>
            <h3>Add New Product</h3>
            
            <div className="form-group">
              <label htmlFor="productName">Product Name</label>
              <input 
                type="text" 
                id="productName" 
                name="name" 
                value={newProduct.name} 
                onChange={handleProductInputChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="productDescription">Description</label>
              <textarea 
                id="productDescription" 
                name="description" 
                value={newProduct.description} 
                onChange={handleProductInputChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="productPrice">Price (₸)</label>
              <input 
                type="number" 
                id="productPrice" 
                name="price" 
                min="0" 
                step="0.01" 
                value={newProduct.price} 
                onChange={handleProductInputChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="productCategory">Category</label>
              <select 
                id="productCategory" 
                name="category" 
                value={newProduct.category} 
                onChange={handleProductInputChange} 
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="productImage">Image URL</label>
              <input 
                type="text" 
                id="productImage" 
                name="image" 
                value={newProduct.image} 
                onChange={handleProductInputChange} 
                required 
              />
            </div>
            
            <div className="preview-container">
              <h4>Preview</h4>
              <div className="product-preview">
                <img 
                  src={newProduct.image} 
                  alt="Product Preview" 
                  className="preview-image" 
                  onError={(e) => {
                    e.target.src = '/images/g.webp';
                  }}
                />
                <div className="preview-info">
                  <h3>{newProduct.name || 'Product Name'}</h3>
                  <p>{newProduct.description || 'Product description will appear here'}</p>
                  <p className="preview-price">{newProduct.price ? `${newProduct.price} ₸` : '0.00 ₸'}</p>
                  <p className="preview-category">{newProduct.category}</p>
                </div>
              </div>
            </div>
            
            <button type="submit" className="add-product-button">
              <i className="fas fa-plus"></i> Add Product
            </button>
          </form>
        </div>
      </div>
    </div>
  )}
</>
  );
};

export default Shop;