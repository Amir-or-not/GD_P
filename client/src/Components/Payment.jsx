import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from "./Navbar";

const formatExpiryForDisplay = (rawExpiry) => {
  if (rawExpiry && rawExpiry.length === 4) {
    return rawExpiry.slice(0, 2) + ' / ' + rawExpiry.slice(2, 4);
  }
  return rawExpiry; 
};


const PaymentConfirmationPage = () => { 
  const { method } = useParams();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [cartError, setCartError] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(''); // '', 'success', 'error'

  // Состояние для отображения деталей карты, если метод 'card'
  const [displayCardInfo, setDisplayCardInfo] = useState(null);

  // Загрузка данных корзины
  useEffect(() => {
    const fetchCartItems = () => {
      setIsLoadingCart(true);
      setCartError(null);
      fetch("http://localhost:8000/cart/", {
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setCartItems(data.items || []);
          setIsLoadingCart(false);
        })
        .catch((error) => {
          console.error("Ошибка при получении корзины:", error);
          setCartError("Не удалось загрузить корзину. Отображаются демонстрационные данные.");
          setIsLoadingCart(false);
          setCartItems([
            { id: 1, name: "Silver Watch", image: "/images/ring.png", price: 120, quantity: 2 },
            { id: 2, name: "Leather Bracelet", image: "/images/bracelet.png", price: 45, quantity: 1 }
          ]);
        });
    };
    fetchCartItems();
  }, []);

  // Загрузка информации о сохраненной карте для отображения, если метод 'card'
  useEffect(() => {
    if (method === 'card') {
      const savedCardData = localStorage.getItem('gPlaceSavedCard');
      if (savedCardData) {
        try {
          const card = JSON.parse(savedCardData);
          // Убедимся, что есть номер и срок действия
          if (card && card.number && card.expiry) {
            setDisplayCardInfo({
              last4: card.number.slice(-4),
              expiry: formatExpiryForDisplay(card.expiry),
              name: card.name || "Cardholder" // Имя владельца, если есть
            });
          }
        } catch (e) {
          console.error("Ошибка чтения сохраненных данных карты для отображения:", e);
          // Если данные повреждены, можно их удалить, но CartBag также управляет этим
          // localStorage.removeItem('gPlaceSavedCard');
        }
      }
    }
  }, [method]);


  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentStatus('');
    setCartError(null); // Сбрасываем предыдущие ошибки корзины/платежа перед новой попыткой

    let paymentPayload = {
      paymentMethod: method,
      orderItems: cartItems.map(item => ({ id: item.id, quantity: item.quantity })),
      totalAmount: calculateTotal(),
    };

    if (method === 'card') {
      // Для демонстрации: если метод 'card', попытаемся прочитать данные карты из localStorage.
      // В реальном приложении здесь должен быть токен платежа.
      const savedCardData = localStorage.getItem('gPlaceSavedCard');
      if (savedCardData) {
        try {
          const cardDetails = JSON.parse(savedCardData);
          // НЕ ВКЛЮЧАЙТЕ CVC В ЗАПРОС НА СЕРВЕР, ДАЖЕ ЕСЛИ ОН БЫЛ СОХРАНЕН
          // Здесь мы добавляем эти детали в payload для "отправки" на бэкенд (демонстрация)
          paymentPayload.cardInfo = {
             numberLast4: cardDetails.number ? cardDetails.number.slice(-4) : 'N/A', // Только последние 4 цифры для лога
             expiry: cardDetails.expiry,
             name: cardDetails.name
          };
           console.warn(
            "SECURITY RISK (DEMO): 'Sending' card details (excluding CVC) read from localStorage to backend. " +
            "This is highly insecure for production. Use tokenization."
          );
        } catch (parseError) {
          console.error("Error parsing card details from localStorage during payment confirmation:", parseError);
        }
      } else {
          console.log("Card details not found in localStorage for payment processing.");
          // В реальном сценарии, если карта не сохранена, токен должен был быть сгенерирован
          // в CartBag и передан сюда (например, через navigation state).
      }
    }

    console.log(`Подтверждение платежа. Отправляемые данные (симуляция):`, paymentPayload);

    // --- Начало симуляции API запроса ---
    await new Promise(resolve => setTimeout(resolve, 2500));

    const success = Math.random() > 0.1; // 90% шанс успеха

    if (success) {
      setPaymentStatus('success');
      console.log('Платеж (симуляция) успешно обработан.');
      // Очистка корзины на клиенте после успешной оплаты
      setCartItems([]);
      // В реальном приложении здесь также может быть запрос на сервер для очистки корзины в сессии/БД
      // fetch('http://localhost:8000/api/cart/clear', { method: 'POST', credentials: 'include' });
      setTimeout(() => {
        navigate('/order-successful'); // Или на страницу с деталями заказа
      }, 3000);
    } else {
      setPaymentStatus('error');
      setCartError('Не удалось обработать платеж. Пожалуйста, попробуйте снова или свяжитесь со службой поддержки.');
      console.error('Ошибка платежа (симуляция).');
    }
    setIsProcessing(false);
    // --- Конец симуляции API запроса ---
  };

  const renderPaymentMethodInstructions = () => {
    const currencySymbol = "₸";

    switch (method) {
      case 'card':
        return (
          <div className="payment-instructions">
            <h3>Payment confirm via card</h3>
            {displayCardInfo ? (
              <p>
                Вы собираетесь оплатить картой: <br/>
                <i className="fas fa-credit-card" style={{marginRight: '5px'}}></i>
                Карта •••• {displayCardInfo.last4}, срок действия {displayCardInfo.expiry}.<br/>
                <span style={{fontSize: '0.9em'}}>Владелец: {displayCardInfo.name}</span>
              </p>
            ) : (
              <p>Данные вашей карты были введены на предыдущем шаге.</p>
            )}
            <p>Пожалуйста, проверьте сводку заказа ниже. Нажатие кнопки "Подтвердить и оплатить" инициирует попытку списания средств.</p>
             <p style={{fontSize: '0.8em', color: '#666', marginTop: '10px'}}>
                <i className="fas fa-shield-alt" style={{marginRight: '5px'}}></i>
                Безопасный платеж. Мы не храним ваш CVC/CVV код.
            </p>
          </div>
        );
      case 'crypto':
        return (
          <div className="payment-instructions">
            <h3>Подтверждение оплаты криптовалютой</h3>
            <p>Вы выбрали оплату криптовалютой.</p>
            <p>Убедитесь, что вы отправили корректную сумму на указанный ранее крипто-адрес.</p>
            <p>Если вы указали ID транзакции на предыдущем шаге, мы используем его для ускорения проверки.</p>
            <p>Нажмите "Подтвердить совершение платежа", чтобы уведомить нас о переводе.</p>
          </div>
        );
      case 'cash':
        return (
          <div className="payment-instructions">
            <h3>Подтверждение заказа (оплата наличными)</h3>
            <p>Вы выбрали оплату наличными при получении.</p>
            <p>Пожалуйста, проверьте сводку заказа. Нажимая "Подтвердить заказ", ваши товары будут подготовлены к отправке.</p>
            <p>Ожидайте звонка от нашего менеджера для уточнения деталей доставки.</p>
          </div>
        );
      default:
        return (
          <div className="payment-instructions error-message" style={{ color: 'red', border: '1px solid red', padding: '10px', borderRadius: '4px' }}>
            <h3>Неверный метод оплаты</h3>
            <p>Выбранный метод оплаты "{method}" не распознан или не поддерживается.</p>
            <button onClick={() => navigate('/cart')} className="btn btn-secondary" style={{ marginTop: '10px' }}>Вернуться в корзину</button>
          </div>
        );
    }
  };

  // Методы оплаты, которые обрабатывает CartBag.jsx
  const isValidMethod = ['card', 'crypto', 'cash'].includes(method);
  const totalAmount = calculateTotal();

  if (isLoadingCart) {
    return (
      <>
        <Navbar />
        <div className="payment-page" style={{ padding: '20px', textAlign: 'center' }}>
          <p>Загрузка информации о заказе...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="payment-page" style={{ padding: '20px', maxWidth: '700px', margin: '40px auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Payment confirm</h1>

        {cartItems.length > 0 ? (
          <div className="payment-summary" style={{ border: '1px solid #ddd', padding: '15px 20px', marginBottom: '30px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <h2 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Full check</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {cartItems.map(item => (
                <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #eee' }}>
                  <span>{item.name} (x{item.quantity})</span>
                  <span>{item.price * item.quantity} ₸</span>
                </li>
              ))}
            </ul>
            <p className="total" style={{ textAlign: 'right', fontSize: '1.3em', fontWeight: 'bold', marginTop: '20px', color: '#333' }}>
              Total: <strong>{totalAmount} ₸</strong>
            </p>
          </div>
        ) : (
          !cartError && !isProcessing && paymentStatus !== 'success' &&
          <p style={{ textAlign: 'center', color: 'orange', marginBottom: '30px' }}>
            Your cart is empty. Please add items to your cart before proceeding with payment.
          </p>
        )}

        {cartError && <p className="error-message" style={{ color: 'red', border: '1px solid red', padding: '10px', borderRadius: '4px', marginBottom: '20px', textAlign: 'center' }}>{cartError}</p>}

        {!cartError && isValidMethod && renderPaymentMethodInstructions()}

        {isProcessing && <p style={{ textAlign: 'center', margin: '25px 0', fontSize: '1.1em' }}><i className="fas fa-spinner fa-spin" style={{marginRight: '8px'}}></i>Обработка, пожалуйста подождите...</p>}

        {!isProcessing && paymentStatus === 'success' && (
          <div style={{ color: 'green', padding: '20px', border: '1px solid green', borderRadius: '8px', backgroundColor: '#e6ffe6', marginTop: '25px', textAlign: 'center' }}>
            <h4 style={{marginTop: 0}}>
              <i className="fas fa-check-circle" style={{marginRight: '8px'}}></i>
              {method === 'cash' ? 'Заказ успешно оформлен!' : 'Платеж успешно выполнен!'}
            </h4>
            <p>Спасибо! Ваш заказ принят в обработку. Вы будете перенаправлены через несколько секунд...</p>
          </div>
        )}

        {!isProcessing && paymentStatus === 'error' && !cartError && (
          <div style={{ color: 'red', padding: '20px', border: '1px solid red', borderRadius: '8px', backgroundColor: '#ffe6e6', marginTop: '25px', textAlign: 'center' }}>
            <h4 style={{marginTop: 0}}>
              <i className="fas fa-exclamation-triangle" style={{marginRight: '8px'}}></i>
              {method === 'cash' ? 'Ошибка оформления заказа!' : 'Ошибка платежа!'}
            </h4>
            <p>Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте снова или свяжитесь со службой поддержки, если проблема не устранена.</p>
            <button
              onClick={() => { setPaymentStatus(''); setCartError(null); }} // Сбрасываем статус для повторной попытки
              style={{ marginTop: '15px', padding: '10px 20px' }}
              className="btn btn-primary"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {!isProcessing && !paymentStatus && isValidMethod && cartItems.length > 0 && (
          <div className="confirmation-actions" style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/cart')}
              className="btn btn-secondary"
              disabled={isProcessing}
              style={{ padding: '12px 25px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              <i className="fas fa-arrow-left" style={{marginRight: '8px'}}></i>
              Назад в корзину
            </button>
            <button
              onClick={handleConfirmPayment}
              className="btn btn-primary confirm-pay-btn"
              disabled={isProcessing || cartItems.length === 0}
              style={{ padding: '12px 25px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1.1em' }}
            >
              {isProcessing ? 'Обработка...' :
                (method === 'cash' ? 'Подтвердить заказ' :
                `Подтвердить и оплатить ${totalAmount} ₸`)}
                {isProcessing && <i className="fas fa-spinner fa-spin" style={{marginLeft: '8px'}}></i>}
                {!isProcessing && method !== 'cash' && <i className="fas fa-lock" style={{marginLeft: '8px'}}></i>}
                {!isProcessing && method === 'cash' && <i className="fas fa-check" style={{marginLeft: '8px'}}></i>}
            </button>
          </div>
        )}
        {!isValidMethod && !cartError && (
             <p style={{textAlign: 'center', marginTop: '20px'}}>Please select the payment method.</p>
        )}

      </div>

      <footer className="site-footer" style={{marginTop: "80px"}}>
        {/* ... ваш футер ... */}
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
              <li><a href="#">Shop</a></li>
              <li><a href="#">Collections</a></li>
              <li><a href="#">About</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="footer-section social">
            <h2>Follow Us</h2>
            <div className="social-icons">
              <a href="#"><i className="fab fa-instagram" /></a>
              <a href="#"><i className="fab fa-github" /></a>
              <a href="#"><i className="fab fa-telegram" /></a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 GD Accessories. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default PaymentConfirmationPage; // или export default Payment, если имя файла Payment.jsx