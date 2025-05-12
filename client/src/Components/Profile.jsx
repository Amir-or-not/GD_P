import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import LoadingSpinner from "./LoadingSpinner";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    avatar: null
  });
  const [archive, setArchive] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [activePageId, setActivePageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const mapRef = useRef(null);
  const placemarkRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);

  // Group orders by order_id
  const groupedArchive = archive.reduce((acc, item) => {
    const orderId = String(item.order_id);
    if (!acc[orderId]) {
      acc[orderId] = {
        date: item.purchase_date,
        products: [],
        total: 0
      };
    }
    acc[orderId].products.push(item);
    acc[orderId].total += item.price * item.quantity;
    return acc;
  }, {});

  useEffect(() => {
    if (activePageId === 'addressesPage') {
      fetchAddresses();
    }
  }, [activePageId]);
  axios.defaults.withCredentials = true;

  // Функции для работы с адресами
  // Получение адресов
  const fetchAddresses = async () => {
    try {
      const response = await axios.get('http://localhost:8000/addresses/');
      console.log('Full API response:', response);
      console.log('Response data:', response.data);
      
      if (Array.isArray(response.data)) {
        setAddresses(response.data);
      } else {
        throw new Error(`Expected array but got: ${typeof response.data}`);
      }
    } catch (err) {
      console.error('API Error:', err.response?.data || err.message);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Получаем координаты из карты
      const coords = placemarkRef.current.geometry.getCoordinates();
      
      // Формируем payload
      const payload = {
        label: document.getElementById('addressLabel').value.trim(),
        details: document.getElementById('addressDetails').value.trim(),
        latitude: coords[0],
        longitude: coords[1]
      };
  
      console.log("Отправка данных:", payload);
  
      // Отправляем запрос
      const response = await axios.post(
        'http://localhost:8000/addresses/',
        payload,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
  
      // Обработка успешного ответа
      if (response.data?.status === "success") {
        alert(`Адрес сохранен! ID: ${response.data.id}`);
        fetchAddresses(); // Обновляем список адресов
        closeModal('addressModal');
      } else {
        throw new Error("Неожиданный формат ответа от сервера");
      }
    } catch (error) {
      console.error("Детали ошибки:", {
        request: error.config?.data,
        response: error.response?.data,
        stack: error.stack
      });
      
      // Формируем понятное сообщение об ошибке
      let errorMessage = "Неизвестная ошибка";
      if (error.response) {
        errorMessage = error.response.data?.detail || 
                      error.response.statusText || 
                      `HTTP ошибка ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Ошибка при сохранении адреса: ${errorMessage}`);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const response = await axios.delete(
        `http://localhost:8000/addresses/${addressId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Delete error:', error.response?.data || error.message);
      throw error;
    }
  };
  
  const handleAddAddress = () => {
    setEditingAddress(null);
    openModal('addressModal');
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    openModal('addressModal');
  };

  

  const openModal = (modalId) => {
    if (modalId === 'editProfileModal') {
      setEditProfileVisible(true);
    } else if (modalId === 'changePasswordModal') {
      setChangePasswordVisible(true);
    } else if (modalId === 'addressModal') {
      setAddressModalVisible(true);
      // Инициализируем карту после того, как модальное окно отобразится
      setTimeout(() => {
        initializeYandexMap();
        // Если редактируем адрес - устанавливаем метку на карте
        if (editingAddress) {
          setAddressOnMap(editingAddress);
        }
      }, 100);
    }
  };
  
  const closeModal = (modalId) => {
    if (modalId === 'editProfileModal') {
      setEditProfileVisible(false);  
    } else if (modalId === 'changePasswordModal') {
      setChangePasswordVisible(false);
    } else if (modalId === 'addressModal') {
      setAddressModalVisible(false);
      setEditingAddress(null);
      // Уничтожаем карту при закрытии модального окна
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        placemarkRef.current = null;
      }
    }
  };
  
  const showPage = (pageId) => {
    setActivePageId(pageId);
    
    if (pageId === 'addressesPage') {
      // Переинициализируем скролл при каждом переходе на страницу
      setTimeout(() => {
        initScrollFunctionality();
      }, 100);
    }
  };
  
  const showProfilePage = () => {
    setActivePageId(null);
    initScrollFunctionality();
  };
  
  const handleEditProfileClick = () => {
    // Заполняем форму текущими данными пользователя перед открытием
    setFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      avatar: null
    });
    openModal('editProfileModal');
  };
  
  const handleChangePasswordClick = () => {
    openModal('changePasswordModal');
  };
  
  const removeFavorite = async (favoriteId) => {
    try {
      await axios.delete(`http://localhost:8000/liked/${favoriteId}/`, {
        withCredentials: true
      });
      setFavorites(favorites.filter(item => item.id !== favoriteId));
      alert('Товар удален из избранного');
    } catch (error) {
      console.error('Ошибка при удалении из избранного:', error);
      alert('Не удалось удалить товар из избранного');
    }
  };
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('username', e.target.username.value);
    formData.append('email', e.target.email.value);
    formData.append('full_name', e.target.full_name.value);
    formData.append('phone', e.target.phone.value);
    
    if (e.target.avatar.files[0]) {
      formData.append('avatar', e.target.avatar.files[0]);
    }
    
    try {
      const response = await axios.put(
        "http://localhost:8000/profile/",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );
  
      if (response.status === 200) {
        alert("Профиль успешно обновлен");
        setEditProfileVisible(false);
        // Обновляем состояние пользователя
        setUser(prev => ({
          ...prev,
          username: formData.get('username'),
          email: formData.get('email'),
          full_name: formData.get('full_name'),
          phone: formData.get('phone'),
          // Обновляем аватар только если он был изменен
          avatar: response.data.user.avatar || prev.avatar
        }));
      }
    } catch (error) {
      console.error("Ошибка при обновлении профиля:", error);
      if (error.response) {
        alert(`Ошибка: ${error.response.data.detail || 'Неизвестная ошибка'}`);
      }
    }
  };
  
  const setAddressOnMap = (address) => {
    if (!window.ymaps || !mapInstanceRef.current || !placemarkRef.current) return;
    
    const coords = [address.latitude, address.longitude];
    placemarkRef.current.geometry.setCoordinates(coords);
    mapInstanceRef.current.setCenter(coords, 15);
    
    placemarkRef.current.properties.set('balloonContent', address.details);
    
    const addressDetailsField = document.getElementById('addressDetails');
    const addressLabelField = document.getElementById('addressLabel');
    
    if (addressDetailsField) addressDetailsField.value = address.details;
    if (addressLabelField) addressLabelField.value = address.label;
  };
  
  const initializeYandexMap = () => {
    if (!window.ymaps) {
      console.error('Yandex Maps API not loaded');
      return;
    }
  
    if (mapInstanceRef.current) {
      mapInstanceRef.current.destroy();
      mapInstanceRef.current = null;
      placemarkRef.current = null;
    }
  
    window.ymaps.ready(() => {
      const mapContainer = document.getElementById('map');
      if (!mapContainer) return;
  
      const initialCoords = editingAddress ? 
        [editingAddress.latitude, editingAddress.longitude] : 
        [51.08, 71.26];
      
      const myMap = new window.ymaps.Map("map", {
        center: initialCoords,
        zoom: editingAddress ? 15 : 10,
        controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
      });
      
      mapInstanceRef.current = myMap;
  
      let searchControl = new window.ymaps.control.SearchControl({
        options: {
          provider: 'yandex#search',
          float: 'right',
          noPlacemark: true
        }
      });
      myMap.controls.add(searchControl);
  
      let placemark = new window.ymaps.Placemark(initialCoords, {
        balloonContent: editingAddress ? editingAddress.details : 'Укажите местоположение'
      }, {
        preset: 'islands#redDotIcon',
        draggable: true
      });
      
      myMap.geoObjects.add(placemark);
      placemarkRef.current = placemark;
  
      myMap.events.add('click', (e) => {
        const coords = e.get('coords');
        placemark.geometry.setCoordinates(coords);
        
        window.ymaps.geocode(coords).then((res) => {
          let firstGeoObject = res.geoObjects.get(0);
          if (firstGeoObject) {
            placemark.properties.set('balloonContent', firstGeoObject.getAddressLine());
            
            const addressDetailsField = document.getElementById('addressDetails');
            if (addressDetailsField) {
              addressDetailsField.value = firstGeoObject.getAddressLine();
            }
            
            placemark.balloon.open();
          }
        });
      });
  
      placemark.events.add('dragend', () => {
        const coords = placemark.geometry.getCoordinates();
        
        window.ymaps.geocode(coords).then((res) => {
          let firstGeoObject = res.geoObjects.get(0);
          if (firstGeoObject) {
            placemark.properties.set('balloonContent', firstGeoObject.getAddressLine());
            
            const addressDetailsField = document.getElementById('addressDetails');
            if (addressDetailsField) {
              addressDetailsField.value = firstGeoObject.getAddressLine();
            }
            
            placemark.balloon.open();
          }
        });
      });
  
      if (editingAddress) {
        placemark.properties.set('balloonContent', editingAddress.details);
      }
    });
  };
  
  const initScrollFunctionality = () => {
    const smoothScroll = (target, duration) => {
      const targetElement = document.querySelector(target);
      if (!targetElement) return;
      
      const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
      const startPosition = window.pageYOffset;
      const distance = targetPosition - startPosition;
      let startTime = null;
      
      const animation = (currentTime) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
      };
      
      const ease = (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
      };
      
      requestAnimationFrame(animation);
    };
    
    const smoothScrollHandler = (e) => {
      const href = e.currentTarget.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        smoothScroll(href, 1000);
      }
    };
  
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };
  
    const handleScroll = () => {
      const backToTopBtn = document.querySelector('.back-to-top');
      if (!backToTopBtn) return;
      
      if (window.pageYOffset > 300) {
        backToTopBtn.style.display = 'block';
      } else {
        backToTopBtn.style.display = 'none';
      }
    };
  
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
      link.addEventListener('click', smoothScrollHandler);
    });
  
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', scrollToTop);
      window.addEventListener('scroll', handleScroll);
      handleScroll();
    }
  };
  
  const initCartFunctionality = () => {
    const cartIcon = document.querySelector('.cart-icon');
    const cartDropdown = document.querySelector('.cart-dropdown');
    
    if (cartIcon && cartDropdown) {
      const showCart = () => {
        cartDropdown.style.display = 'block';
      };
      
      const hideCart = () => {
        cartDropdown.style.display = 'none';
      };
      
      cartIcon.addEventListener('mouseenter', showCart);
      cartIcon.addEventListener('mouseleave', () => {
        setTimeout(() => {
          if (!cartDropdown.matches(':hover')) {
            hideCart();
          }
        }, 200);
      });
      
      cartDropdown.addEventListener('mouseleave', hideCart);
    }
    
    const removeFromCart = async (itemId) => {
      try {
        await axios.delete(`http://localhost:8000/cart/${itemId}/`, {
          withCredentials: true
        });
        
        setCartItems(prev => prev.filter(item => item.id !== itemId));
        alert('Товар удален из корзины');
      } catch (error) {
        console.error('Error removing item from cart:', error);
        alert('Не удалось удалить товар из корзины');
      }
    };
  
    document.querySelectorAll('.remove-item').forEach(button => {
      button.addEventListener('click', (e) => {
        const itemId = e.target.closest('.cart-item').dataset.id;
        removeFromCart(itemId);
      });
    });
  };

  useEffect(() => {
    const loadYandexMaps = () => {
      return new Promise((resolve, reject) => {
        if (window.ymaps) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Yandex Maps API'));
        document.body.appendChild(script);
      });
    };

    const fetchData = async () => {
      try {
        const [profileResponse, likedResponse, archiveResponse, cartResponse] = await Promise.all([
          axios.get('http://localhost:8000/profile/', { withCredentials: true }),
          axios.get('http://localhost:8000/liked/', { withCredentials: true }),
          axios.get('http://localhost:8000/archive/', { withCredentials: true }),
          axios.get('http://localhost:8000/cart/', { withCredentials: true })
        ]);

        if (profileResponse.data?.user) {
          setUser(profileResponse.data.user);
        }

        if (likedResponse.data?.items) {
          setFavorites(likedResponse.data.items);
        }

        if (archiveResponse.data?.items) {
          setArchive(archiveResponse.data.items);
        }

        setCartItems(cartResponse.data.items || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    const init = async () => {
      try {
        await loadYandexMaps();
        await fetchData();
      } catch (error) {
        console.error('Error initializing:', error);
      }
    };

    init();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        placemarkRef.current = null;
      }
    };
  }, []);

  if (loading) return <LoadingSpinner />;

  if (!user) {
    return <div>Пользователь не найден</div>;
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
    < Navbar />
      
      {/* Profile Main Section - Only visible when no page is active */}
      {!activePageId && (
        <section className="profile-section">
          <div className="profile-card">
            <h2>Welcome, {user.username}</h2>
            <div className="profile-info">
              <div>
                <p><strong>Name:</strong> {user.username}</p>
                <p><strong>Full Name:</strong> {user.full_name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phone}</p>
              </div>
              <div className="bonus-block">
                <h3>Bonus Points</h3>
                <p>{user.bonus}</p>
              </div>
            </div>
            <div className="profile-actions">
              <button onClick={handleEditProfileClick}>Edit Profile</button>
              <button onClick={handleChangePasswordClick}>Change Password</button>
            </div>

            <div className="profile-links">
              <a href="#" onClick={(e) => { e.preventDefault(); showPage('orderHistoryPage'); }}>
                View Order History
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); showPage('favoritesPage'); }}>
                Favorites
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); showPage('addressesPage'); }}>
                Delivery Addresses
              </a>
              <a href="/logout">Logout</a>
            </div>
          </div>
        </section>
      )}

      {/* Edit Profile Modal */}
      {editProfileVisible && (
  <div id="editProfileModal" className="modal-p2" style={{ display: 'flex' }}>
    <div className="modal-content-p2">
      <span className="close-modal-p2" onClick={() => setEditProfileVisible(false)}>×</span>
      <h2>Edit Profile</h2>
      <form onSubmit={async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target); // автоматически собирает все поля формы

        try {
          const response = await axios.put('http://localhost:8000/profile/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            withCredentials: true
          });

          if (response.status === 200) {
            alert('Profile updated successfully');
            setUser(prev => ({
              ...prev,
              username: formData.get('username'),
              email: formData.get('email'),
              full_name: formData.get('full_name'),
              phone: formData.get('phone')
            }));
            setEditProfileVisible(false);
          }
        } catch (error) {
          console.error('Error updating profile:', error);
          alert(error.response?.data?.detail || 'Error updating profile');
        }
      }}>
        <div className="form-group-p2">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            defaultValue={user.username}
            required
          />
        </div>
        <div className="form-group-p2">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={user.email}
            required
          />
        </div>
        <div className="form-group-p2">
          <label htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="full_name"
            defaultValue={user.full_name}
          />
        </div>
        <div className="form-group-p2">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            defaultValue={user.phone}
          />
        </div>
        <div className="modal-actions-p2">
          <button
            type="button"
            className="modal-btn-p2 cancel-btn-p2"
            onClick={() => setEditProfileVisible(false)}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="modal-btn-p2 save-btn-p2"
            disabled={!user.username || !user.email}
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
)}


      {/* Change Password Modal */}
      {changePasswordVisible && (
        <div id="changePasswordModal" className="modal-p2" style={{ display: 'flex' }}>
          <div className="modal-content-p2">
            <span className="close-modal-p2" onClick={() => closeModal('changePasswordModal')}>
              ×
            </span>
            <h2>Change Password</h2>
            <form id="changePasswordForm" method="POST" action="/change-password/">
              <div className="form-group-p2">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  required
                />
              </div>
              <div className="form-group-p2">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  required
                />
              </div>
              <div className="form-group-p2">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                />
              </div>
              <div className="modal-actions-p2">
                <button
                  type="button"
                  className="modal-btn-p2 cancel-btn-p2"
                  onClick={() => closeModal('changePasswordModal')}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn-p2 save-btn-p2">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order History Page - Only visible when the appropriate page is active */}
      {activePageId === 'orderHistoryPage' && (
        <div id="orderHistoryPage" className="page-content-p2 active">
          <div className="page-header-p2">
            <h1>Order History</h1>
            <a href="#" className="back-to-profile-p2" onClick={(e) => { e.preventDefault(); showProfilePage(); }}>
              <i className="fas fa-arrow-left" /> Back to Profile
            </a>
          </div>
          
          <div className="order-list-p2">
            {Object.entries(groupedArchive).length === 0 ? (
              <p>No orders found</p>
            ) : (
              Object.entries(groupedArchive).map(([orderId, order]) => {
                const total = order.products.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                );
                
                const formattedDate = new Date(order.date);
                const dateDisplay = !isNaN(formattedDate.getTime())
                  ? formattedDate.toLocaleDateString() 
                  : 'Invalid Date';

                return (
                  <div className="order-item-p2" key={orderId}>
                    <div className="order-header-p2">
                      <div>
                        <h3>Order #{orderId}</h3>
                        {/* <p>{dateDisplay}</p> */}
                        <p>May 6  2025</p>
                      </div>
                      <div>
                        <p>
                          <strong>Status:</strong> Delivered
                        </p>
                        <p>
                          <strong>Total:</strong> {total.toFixed(2)} ₸
                        </p>
                      </div>
                    </div>

                    <div className="order-products-p2">
                      {order.products.map((item, i) => (
                        <div className="order-product-p2" key={i}>
                          <img
                            src={item.image || "/images/default.png"}
                            alt={item.name}
                            className="order-product-image-p2"
                          />
                          <div>
                            <h4>{item.name}</h4>
                            <p>{item.price} ₸</p>
                            <p>Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Favorites Page - Only visible when the appropriate page is active */}
      {activePageId === 'favoritesPage' && (
        <div id="favoritesPage" className="page-content-p2 active">
          <div className="page-header-p2">
            <h1>Your Favorites</h1>
            <a href="#" className="back-to-profile-p2" onClick={(e) => { e.preventDefault(); showProfilePage(); }}>
              <i className="fas fa-arrow-left" /> Back to Profile
            </a>
          </div>
          <div className="favorites-grid-p2">
            {favorites.length === 0 ? (
              <p>No favorite products.</p>
            ) : (
              favorites.map((item) => (
                <div className="favorite-item-p2" key={item.id}>
                  <span className="remove-favorite-p2" onClick={() => removeFavorite(item.id)}>
                    <i className="fas fa-times" />
                  </span>
                  <img
                    src={item.image || "/images/default.png"}
                    alt={item.name}
                    className="favorite-image-p2"
                  />
                  <div className="favorite-info-p2">
                    <h3 className="favorite-name-p2">{item.name}</h3>
                    <p className="favorite-price-p2">${item.price}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Addresses Page - Only visible when the appropriate page is active */}
      {activePageId === 'addressesPage' && (
  <div id="addressesPage" className="page-content-p2 active">
    <div className="page-header-p2">
      <h1>Delivery Addresses</h1>
      <a href="#" className="back-to-profile-p2" onClick={(e) => { e.preventDefault(); showProfilePage(); }}>
        <i className="fas fa-arrow-left" /> Back to Profile
      </a>
    </div>
    
    <div className="address-list-p2">
      {addresses.map((address) => (
        <div key={address.id} className="address-item-p2">
          {address.is_default && (
            <span className="default-badge-p2">Default</span>
          )}
          <h3>{address.label}</h3>
          <p>{address.details}</p>
          <p>Coordinates: {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}</p>
          <div className="address-actions-p2">
            <button 
              className="address-btn-p2 edit-address-p2" 
              onClick={() => handleEditAddress(address)}
            >
              Edit
            </button>
            <button 
              className="address-btn-p2 delete-address-p2" 
              onClick={async () => {
                try {
                  await handleDeleteAddress(address.id);
                  const updatedAddresses = addresses.filter(a => a.id !== address.id);
                  setAddresses(updatedAddresses);
                } catch (error) {
                  console.error('Failed to delete address:', error);
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      
      {addresses.length === 0 && (
        <div className="no-addresses-p2">
          <p>No addresses saved yet</p>
        </div>
      )}
    </div>
    
    <button 
      className="add-address-btn-p2" 
      onClick={handleAddAddress}
    >
      <i className="fas fa-plus" /> Add New Address
    </button>
  </div>
)}

{addressModalVisible && (
  <div id="addressModal" className="modal-p5" style={{ display: "flex" }}>
    <div className="modal-content-p5">
      <span className="close-btn-p5" onClick={() => closeModal('addressModal')}>
        ×
      </span>
      <h2 className="modal-title-p5">
        {editingAddress ? 'Edit Address' : 'Add New Address'}
      </h2>
      <form id="addressForm" onSubmit={handleAddressSubmit}>
        <div className="form-group-p5">
          <label htmlFor="addressLabel" className="label-p5">
            Label *
          </label>
          <input
            type="text"
            id="addressLabel"
            name="label"
            className="input-p5"
            placeholder="Home, Work..."
            defaultValue={editingAddress?.label || ''}
            required
          />
        </div>
        
        <div className="form-group-p5">
          <label htmlFor="addressDetails" className="label-p5">
            Full Address *
          </label>
          <textarea
            id="addressDetails"
            name="details"
            className="textarea-p5"
            placeholder="Street, building, apartment..."
            defaultValue={editingAddress?.details || ''}
            required
          />
        </div>
        
        <div className="form-group-p5">
          <label className="label-p5">
            Select on Map *
          </label>
          <div 
            id="map" 
            className="map-container-p5"
            style={{ height: '300px', width: '100%' }}
          />
        </div>
        
        <input type="hidden" id="latitude" name="latitude" />
        <input type="hidden" id="longitude" name="longitude" />
        
        <div className="form-actions-p5">
          <button 
            type="button" 
            className="btn-p5 secondary"
            onClick={() => closeModal('addressModal')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-p5 primary"
          >
            {editingAddress ? 'Update Address' : 'Save Address'}
          </button>
        </div>
      </form>
    </div>
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
    </>
  );
};

export default Profile;