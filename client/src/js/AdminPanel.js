// Функция для инициализации админ-панели
const initAdminPanel = () => {
    // Получаем элементы
    const adminToggleButton = document.querySelector('.admin-toggle-button');
    const adminPanelOverlay = document.querySelector('.admin-panel-overlay');
    const adminCloseButton = document.querySelector('.admin-close-button');
    const productForm = document.querySelector('.add-product-form');
    
    // Проверяем, существуют ли элементы на странице
    if (!adminToggleButton) return;
    
    // Обработчик открытия/закрытия панели
    adminToggleButton.addEventListener('click', () => {
      if (adminPanelOverlay) {
        adminPanelOverlay.style.display = adminPanelOverlay.style.display === 'none' ? 'flex' : 'none';
      }
    });
    
    // Обработчик закрытия панели через кнопку закрытия
    if (adminCloseButton) {
      adminCloseButton.addEventListener('click', () => {
        if (adminPanelOverlay) {
          adminPanelOverlay.style.display = 'none';
        }
      });
    }
    
    // Закрытие панели при клике на оверлей (вне панели)
    if (adminPanelOverlay) {
      adminPanelOverlay.addEventListener('click', (e) => {
        if (e.target === adminPanelOverlay) {
          adminPanelOverlay.style.display = 'none';
        }
      });
    }
    
    // Обработка отправки формы
    if (productForm) {
      productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Получаем данные формы
        const formData = new FormData(productForm);
        const productData = {
          name: formData.get('name'),
          description: formData.get('description'),
          price: parseFloat(formData.get('price')),
          image: formData.get('image')
        };
        
        // В реальном приложении здесь будет отправка на сервер
        console.log('Отправка данных о новом продукте:', productData);
        
        // Эмуляция успешного добавления
        alert('Продукт успешно добавлен!');
        
        // Сброс формы
        productForm.reset();
        
        // Обновление предпросмотра
        updateProductPreview({
          name: '',
          description: '',
          price: '',
          image: '/images/product-placeholder.png'
        });
      });
      
      // Живой предпросмотр при вводе данных
      const inputs = productForm.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.addEventListener('input', () => {
          const currentData = {
            name: productForm.querySelector('#productName').value,
            description: productForm.querySelector('#productDescription').value,
            price: productForm.querySelector('#productPrice').value,
            image: productForm.querySelector('#productImage').value || '/images/product-placeholder.png'
          };
          
          updateProductPreview(currentData);
        });
      });
    }
  };
  
  // Функция для обновления предпросмотра продукта
  const updateProductPreview = (data) => {
    const previewImage = document.querySelector('.preview-image');
    const previewName = document.querySelector('.preview-info h3');
    const previewDescription = document.querySelector('.preview-info p:not(.preview-price)');
    const previewPrice = document.querySelector('.preview-price');
    
    if (previewImage) previewImage.src = data.image;
    if (previewName) previewName.textContent = data.name || 'Product Name';
    if (previewDescription) previewDescription.textContent = data.description || 'Product description will appear here';
    if (previewPrice) previewPrice.textContent = data.price ? `${data.price} ₸` : '0.00 ₸';
    
    // Обработка ошибки загрузки изображения
    if (previewImage) {
      previewImage.onerror = () => {
        previewImage.src = '/images/product-placeholder.png';
      };
    }
  };
  
