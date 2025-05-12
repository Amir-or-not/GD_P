import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import scroll from "../js/scroll";
import cart from "../js/cart";
import Navbar from "./Navbar";
import LoadingSpinner from "./LoadingSpinner";

const ProductDetail = () => {
  const { name } = useParams();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [colors, setColors] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false); 
  const [editColorName, setEditColorName] = useState("");
  const [editColorValue, setEditColorValue] = useState("");
  const [editColors, setEditColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: '/images/product-placeholder.png',
    color: '#000000',
  });
  
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const cleanupCart = cart?.();
    const cleanupScroll = scroll?.();
  
    return () => {
      if (typeof cleanupCart === 'function') cleanupCart();
      if (typeof cleanupScroll === 'function') cleanupScroll();
    };
  }, []);

  useEffect(() => {
    setLoading(true); 
    
    fetch(`http://localhost:8000/product/${encodeURIComponent(name)}/`, {
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.product) {
          setProduct(data.product);
          setColors(data.colors);
          setSimilar(data.similar_products);
          setSelectedImage(
            data.colors.length > 0 
              ? data.colors[0].image 
              : data.product.image
          );
          
          setTimeout(() => {
            setLoading(false);
          }, 800);
        }
      })
      .catch((err) => {
        console.error("Ошибка загрузки товара:", err);
        setLoading(false);
      });
  }, [name]);

  const handleColorClick = (colorName) => {
    const color = colors.find((c) => c.color === colorName);
    if (color) setSelectedImage(color.image);
  };

  const handleAddToCart = () => {
    if (!product) return;

    const formData = new FormData();
    formData.append("quantity", 1);

    fetch(`http://localhost:8000/add-to-cart/${product.id}`, {
      method: "POST",
      body: formData,
      credentials: "include",
    })    
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка");
        return res.json();
      })
      .then((data) => {
        alert("Добавлено в корзину!");
      })
      .catch((err) => {
        console.error(err);
        alert("Ошибка при добавлении в корзину. Войдите в аккаунт.");
      });
  };

  const handleFavoriteClick = () => {
    setIsFavorite(!isFavorite);
  };

  const toggleAdminPanel = () => {
    setShowAdminPanel(!showAdminPanel);
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
      color: '#000000',
    });
    
    alert('Продукт успешно добавлен!');
  };
  
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!product) return;
  
    const formData = new FormData();
    const name = document.getElementById("editProductName").value;
    const description = document.getElementById("editProductDescription").value;
    const price = document.getElementById("editProductPrice").value;
    const image = product.image; 
  
    formData.append("product_id", product.id);
    formData.append("product_name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("image", image);
    editColors.forEach((color) => {
      formData.append("colors", color.name);
      formData.append("color_images", color.value); 
    });
  
    try {
      const res = await fetch("http://localhost:8000/update-product/", {
        method: "POST",
        body: formData,
      });
  
      const data = await res.json();
  
      if (!res.ok) throw new Error(data.error || "Ошибка при обновлении");
  
      alert("Продукт успешно обновлён");
      window.location.reload();
    } catch (err) {
      console.error("Ошибка обновления:", err);
      alert("Ошибка при обновлении товара");
    }
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
      } else if (response.status === 401) {
      } else {
        console.error("Ошибка при добавлении в избранное:", await response.text());
      }
    } catch (error) {
      console.error("Ошибка при отправке запроса:", error);
      alert("Ошибка сети или сервера ------>  ХОТЯ СКОРЕЕ ВСЕГО ВЫ ПРОСТО И ТАК ДОБАВИЛИ ТОВАР В ИЗБРАННЫЕ");
    }
  };
  
  const handleDeleteProduct = () => {
    if (!product) return;
    
    if (window.confirm(`Вы уверены, что хотите удалить товар "${product.name}"?`)) {
      alert(`Продукт ${product.name} удален!`);
    }
  };

  const handleAddColor = () => {
    if (!editColorName.trim()) {
      alert('Пожалуйста, введите название цвета');
      return;
    }
  
    setEditColors(prev => [
      ...prev,
      { name: editColorName.trim(), value: editColorValue }
    ]);
  
    setEditColorName('');
    setEditColorValue('#000000');
  };

  const handleRemoveColor = (index) => {
    setEditColors(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) return <LoadingSpinner />;
  
  if (!product) return <div className="error-message">Товар не найден или произошла ошибка при загрузке</div>;

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
      
      <style>
        {`
          .heart-icon {
            transition: color 0.3s ease;
          }
          
          .heart-icon.active {
            color: #ff6b9d;
          }
          
          .icon-button-v4:hover .heart-icon {
            transform: scale(1.1);
          }
          
          .icon-button-v4:active .heart-icon {
            transform: scale(0.9);
          }
          
          .error-message {
            text-align: center;
            padding: 2rem;
            font-size: 1.2rem;
            color: #ff6b6b;
            background-color: #ffe6e6;
            border-radius: 8px;
            margin: 2rem auto;
            max-width: 600px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .product-container-v4 {
            animation: fadeIn 0.5s ease-out;
          }
          
          .product-details-v4 {
            animation: fadeIn 0.5s ease-out 0.2s;
            animation-fill-mode: both;
          }
          
          .trending-section-v2 {
            animation: fadeIn 0.5s ease-out 0.4s;
            animation-fill-mode: both;
          }
        `}
      </style>
      
      <Navbar />
      <section className="product-section-v4">
        <div className="product-container-v4">
          <div className="product-image-v4">
            <img 
              src={selectedImage || product.image} 
              alt={product.name}
              className="product-detail-image"
            />
          </div>

          <div className="product-info-v4">
            <h1 className="product-name-v4">{product.name}</h1>
            <p className="product-description-v4">{product.description}</p>
            <ul className="product-params-v4">
              <li>
                <strong>Price:</strong> {product.price} ₸
              </li>
            </ul>

            <div className="product-colors-v4">
              <div className="color-options-v4">
                {colors && colors.length > 0 ? (
                  colors.map((color, index) => (
                    <div key={index} className="color-item">
                      <span
                        className={`color-dot-v4 color-${color.color}`}
                        title={`${product.name} - ${color.color}`}
                        onClick={() => handleColorClick(color.color)}
                        style={{
                          cursor: "pointer",
                          backgroundColor: color.color,
                          width: "30px",
                          height: "30px",
                          display: "inline-block",
                          marginRight: "10px",
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <p></p>
                )}
              </div>
            </div>

            <div className="product-actions-v4">
              <button className="buy-button-v4" onClick={handleAddToCart}>Buy</button>
              <button className="icon-button-v4" onClick={handleAddToCart}>
                <i className="fas fa-cart-plus" />
              </button>
              <button 
                className={`icon-button-v4 ${isFavorite ? 'favorite-active' : ''}`}
                onClick={() => {
                  handleAddToLiked(product.id);
                  handleFavoriteClick();
                }}
                aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
              >
                <i className={`${isFavorite ? 'fas' : 'far'} fa-heart heart-icon ${isFavorite ? 'active' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="product-details-v4">
          <h2>More About This Product</h2>
          <p>
            {product.description || "This product features high-quality materials and craftsmanship."}
          </p>
          <ul className="product-extra-info-v4">
            <li><i className="fas fa-stopwatch icon-v4" /> Premium Quality</li>
            <li><i className="fas fa-shield-alt icon-v4" /> 1 Year Warranty</li>
            <li><i className="fas fa-tint icon-v4" /> Water Resistant</li>
            <li><i className="fas fa-gift icon-v4" /> Gift Packaging Available</li>
          </ul>
        </div>
      </section>

      <section className="trending-section-v2">
        <h2>Similar Products</h2>
        <div className="trending-products-v2">
          {similar.map((item) => (
            <a href={`/product/${encodeURIComponent(item.product_name)}/`} style={{ textDecoration: "none" }} key={item.product_id}>
              <div className="product-card-v2">
                <img src={item.image} alt={item.product_name} />
                <div className="product-info-v2">
                  <p className="product-category-v2">Similar Product</p>
                  <h3 className="product-name-v2">{item.product_name}</h3>
                  <p className="product-price-v2">{item.price} ₸</p>
                  <span className="product-tag-v2">AI Picked</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

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
                                <a href="/shop/">Shop</a>
                            </li>
                            <li>
                                <a href="/collections/">Collections</a>
                            </li>
                            <li>
                                <a href="/About/">About</a>
                            </li>
                            <li>
                                <a href="/profile/">Profile</a>
                            </li>
                        </ul>
                    </div>
                    <div className="footer-section social">
                        <h2>Follow Us</h2>
                        <div className="social-icons">
                            <a href="https://www.instagram.com/aituc06?igsh=YXlodDh1N2E5Nml1">
                                <i className="fab fa-instagram" />
                            </a>
                            <a href="https://github.com/Amir-or-not/GD">
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
  
      {/* Admin toggle button */}
      <button 
        className="admin-toggle-button" 
        onClick={toggleAdminPanel}
        title="Admin Panel"
      >
        <i className="fas fa-toolbox"></i>
      </button>
  
      {/* Admin Panel */}
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
              <div className="admin-tabs">
                <div className="admin-tab active">Edit Current Product</div>
                <div className="admin-tab">Add New Product</div>
              </div>
              
              {/* Edit Product Form */}
              <form className="edit-product-form" onSubmit={handleUpdateProduct}>
                <h3>Edit Product: {product.name}</h3>
                
                <div className="form-group">
                  <label htmlFor="editProductName">Product Name</label>
                  <input 
                    type="text" 
                    id="editProductName" 
                    name="editName" 
                    defaultValue={product.name} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editProductDescription">Description</label>
                  <textarea 
                    id="editProductDescription" 
                    name="editDescription" 
                    defaultValue={product.description} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editProductPrice">Price (₸)</label>
                  <input 
                    type="number" 
                    id="editProductPrice" 
                    name="editPrice" 
                    min="0" 
                    step="0.01" 
                    defaultValue={product.price} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editProductColor">Product Color</label>
                  <div className="color-picker-container">
                    <input 
                      type="color" 
                      id="editProductColor" 
                      name="editColor" 
                      value={editColorValue}
                      onChange={(e) => setEditColorValue(e.target.value)}
                      defaultValue="#000000" 
                    />
                    <input 
                      type="text" 
                      id="editColorName" 
                      name="editColorName" 
                      placeholder="Color name (e.g. Red, Blue)" 
                      value={editColorName}
                      onChange={(e) => setEditColorName(e.target.value)}
                      required 
                    />
                    <button type="button" className="add-color-button" onClick={handleAddColor}>
                      <i className="fas fa-plus"></i> Add Color
                    </button>
                  </div>
                  
                  <div className="product-colors-admin">
                    {editColors.length > 0 ? (
                      editColors.map((color, index) => (
                        <div key={index} className="color-item-admin">
                          <span
                            className="color-dot-admin"
                            style={{
                              backgroundColor: color.value,
                              width: "25px",
                              height: "25px",
                              display: "inline-block",
                            }}
                          />
                          <span className="color-name">{color.name}</span>
                          <button 
                            type="button" 
                            className="remove-color-button"
                            onClick={() => handleRemoveColor(index)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      ))
                    ) : colors && colors.length > 0 ? (
                      colors.map((color, index) => (
                        <div key={index} className="color-item-admin">
                          <span
                            className="color-dot-admin"
                            style={{
                              backgroundColor: color.color,
                              width: "25px",
                              height: "25px",
                              display: "inline-block",
                            }}
                          />
                          <span className="color-name">{color.color}</span>
                          <button type="button" className="remove-color-button">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      ))
                    ) : (
                      <p>No colors added yet</p>
                    )}
                  </div>
                </div>
                
                <div className="admin-action-buttons">
                  <button type="submit" className="update-product-button">
                    <i className="fas fa-save"></i> Update Product
                  </button>
                  <button 
                    type="button" 
                    className="delete-product-button" 
                    onClick={handleDeleteProduct}
                  >
                    <i className="fas fa-trash"></i> Delete Product
                  </button>
                </div>
              </form>
              
              {/* Add Product Form (hidden by default) */}
              <form className="add-product-form hidden" onSubmit={handleAddProduct}>
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
                
                <div className="form-group">
                  <label htmlFor="productColor">Product Color</label>
                  <div className="color-picker-container">
                    <input 
                      type="color" 
                      id="productColor" 
                      name="color" 
                      value={newProduct.color} 
                      onChange={handleProductInputChange} 
                    />
                    <input 
                      type="text" 
                      id="colorName" 
                      name="colorName" 
                      placeholder="Color name (e.g. Red, Blue)" 
                      required 
                    />
                    <button type="button" className="add-color-button">
                      <i className="fas fa-plus"></i> Add Color
                    </button>
                  </div>
                </div>
                
                <div className="preview-container">
                  <h4>Preview</h4>
                  <div className="product-preview">
                    <img 
                      src={newProduct.image} 
                      className="preview-image" 
                      onError={(e) => {
                        e.target.src = '/images/product-placeholder.png';
                      }}
                      alt="Product preview"
                    />
                    <div className="preview-info">
                      <h3>{newProduct.name || 'Product Name'}</h3>
                      <p>{newProduct.description || 'Product description will appear here'}</p>
                      <p className="preview-price">{newProduct.price ? `${newProduct.price} ₸` : '0.00 ₸'}</p>
                      <div className="preview-color" style={{
                        backgroundColor: newProduct.color,
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        display: "inline-block"
                      }}></div>
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

export default ProductDetail;