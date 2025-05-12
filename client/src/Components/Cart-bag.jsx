import { useParams } from "react-router-dom";
import { useEffect, useState } from 'react';
// Assuming these are utility functions you might still need or were placeholders.
// If they manipulate the DOM directly outside of React's control, consider refactoring.
// import scroll from '../js/scroll';
// import cart from '../js/cart';
// import payment from '../js/payment';
import Navbar from "./Navbar";
import { useNavigate } from 'react-router-dom';


// Helper function to format card number for display (XXXX XXXX XXXX XXXX)
const formatCardNumberDisplay = (value) => {
  if (!value) return '';
  const cleaned = ('' + value).replace(/\D/g, '');
  const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || '';
  return formatted.slice(0, 19); // Max length for display (e.g., 16 digits + 3 spaces)
};

// Helper function to format expiry date for display (MM / YY)
const formatExpiryDateDisplay = (value) => {
  if (!value) return '';
  const cleaned = ('' + value).replace(/\D/g, '');
  if (cleaned.length > 2) {
    return cleaned.slice(0, 2) + ' / ' + cleaned.slice(2, 4);
  }
  return cleaned.slice(0, 2);
};


const CartBag = () => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // For general errors
  const [formError, setFormError] = useState(null); // For card form specific errors
  const [recommendations, setRecommendations] = useState([]);

  // State for card form inputs
  const [cardNumber, setCardNumber] = useState(''); // Raw card number (digits only)
  const [formattedCardNumber, setFormattedCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState(''); // Raw expiry (MMYY)
  const [formattedExpiryDate, setFormattedExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [saveCardDetails, setSaveCardDetails] = useState(false);

  // Removed useEffect for scroll, cart, payment cleanup as their purpose isn't clear
  // If they are essential, ensure they are imported correctly and handle side effects.

  // Load saved card details from localStorage on component mount
  useEffect(() => {
    const savedCardData = localStorage.getItem('gPlaceSavedCard');
    if (savedCardData) {
      try {
        const card = JSON.parse(savedCardData);
        // IMPORTANT: DO NOT load CVC from localStorage even if it were saved (it shouldn't be).
        if (card) {
          setCardNumber(card.number || '');
          setFormattedCardNumber(formatCardNumberDisplay(card.number || ''));
          setExpiryDate(card.expiry || '');
          setFormattedExpiryDate(formatExpiryDateDisplay(card.expiry || ''));
          setCardholderName(card.name || '');
          setSaveCardDetails(true); // If card data is found, assume user wanted it saved
        }
      } catch (e) {
        console.error("Error parsing saved card data:", e);
        localStorage.removeItem('gPlaceSavedCard'); // Clear corrupted data
      }
    }
  }, []);


  const fetchCartItems = () => {
    setIsLoading(true);
    fetch("http://localhost:8000/cart/", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setCartItems(data.items || []);
        setRecommendations(data.recommendations || []);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Ошибка при получении корзины:", error);
        setError("Failed to load cart items");
        setIsLoading(false);
        setCartItems([
          {
            id: 1,
            name: "Silver Watch",
            image: "/images/ring.png",
            price: 120,
            quantity: 2,
            description: "Elegant silver watch with leather strap"
          },
          {
            id: 2,
            name: "Leather Bracelet",
            image: "/images/bracelet.png",
            price: 45,
            quantity: 1,
            description: "Handcrafted leather bracelet"
          }
        ]);
        setRecommendations([]); // fallback
      });
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const removeFromCart = (itemId) => {
    setError(null); // Clear previous errors
    fetch(`http://localhost:8000/remove-from-cart/${itemId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to remove item from cart");
        }
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return res.json();
        } else {
            return null; // Handle cases where response might not be JSON (e.g., 204 No Content)
        }
      })
      .then(() => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
      })
      .catch((error) => {
        console.error("Error removing item from cart:", error);
        setError("Failed to remove item from cart. Please try again.");
      });
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Input Handlers with Formatting
  const handleCardNumberChange = (e) => {
    const rawValue = e.target.value;
    const cleaned = rawValue.replace(/\D/g, '');
    const limited = cleaned.slice(0, 16); // Limit to 16 digits (typical for Visa/MC)

    setCardNumber(limited);
    setFormattedCardNumber(formatCardNumberDisplay(limited));
  };

  const handleExpiryDateChange = (e) => {
    const rawValue = e.target.value;
    // Allow numbers, space, and slash for easier typing, then clean
    const cleaned = rawValue.replace(/[^0-9]/g, '');
    const limited = cleaned.slice(0, 4); // MMYY format

    setExpiryDate(limited);
    setFormattedExpiryDate(formatExpiryDateDisplay(limited));
  };

  const handleCvcChange = (e) => {
    const rawValue = e.target.value;
    const cleaned = rawValue.replace(/\D/g, '');
    const limited = cleaned.slice(0, 4); // CVC can be 3 or 4 digits
    setCvc(limited);
  };

  const handleCardholderNameChange = (e) => {
    setCardholderName(e.target.value.toUpperCase()); // Often stored in uppercase
  };

  const handleSaveCardToggle = (e) => {
    const checked = e.target.checked;
    setSaveCardDetails(checked);
    if (!checked) {
      // If user unchecks, remove saved card from localStorage immediately
      localStorage.removeItem('gPlaceSavedCard');
      console.log("Saved card details explicitly removed by user.");
    }
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    setFormError(null); // Clear previous form errors

    if (paymentMethod === 'card') {
      // Basic validation
      if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) { // Basic length check
        setFormError("Please enter a valid card number.");
        return;
      }
      if (!expiryDate || expiryDate.length !== 4) {
        setFormError("Please enter a valid expiry date (MMYY).");
        return;
      }
      // You might add more sophisticated validation for month/year range
      if (!cvc || cvc.length < 3 || cvc.length > 4) {
        setFormError("Please enter a valid CVC/CVV.");
        return;
      }
      if (!cardholderName.trim()) {
        setFormError("Please enter the cardholder's name.");
        return;
      }

      if (saveCardDetails) {
        console.warn(
          "SECURITY RISK: Saving card details (excluding CVC) to localStorage for DEMO purposes. " +
          "DO NOT USE THIS IN PRODUCTION. Use a payment gateway and tokenization."
        );
        const cardToSave = {
          number: cardNumber, // Save the raw digits
          expiry: expiryDate, // Save raw MMYY
          name: cardholderName,
          // Consider saving only last4 for display if you must:
          // last4: cardNumber.slice(-4),
          // brand: getCardBrand(cardNumber) // You could add a function to detect brand
        };
        localStorage.setItem('gPlaceSavedCard', JSON.stringify(cardToSave));
        console.log("Card details (DEMO) saved to localStorage.");
      } else {
        // If saveCardDetails was previously true but now false and form submitted,
        // ensure it's removed (already handled by toggle, but good for robustness)
        localStorage.removeItem('gPlaceSavedCard');
      }
    }

    // Navigate to the payment confirmation page, passing method as URL param
    navigate(`/payment/${paymentMethod}`);
  };

  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>GPlace - Cart</title>
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

       <div className="cart-page">
          <div className="main-cart-content">
            <div className="cart-orders">
              <h2>Your Order</h2>
              {isLoading ? (
                <p>Loading your cart...</p>
              ) : error && cartItems.length === 0 ? ( // Show error only if fetch failed AND cart is empty
                <p className="error-message">{error}</p>
              ) : cartItems.length > 0 ? (
                <>
                  {cartItems.map((item) => (
                    <div className="order-item" key={item.id}>
                      <div className="order-item-content">
                        <img src={item.image} alt={item.name} className="order-item-image" />
                        <div className="order-item-details">
                          <h4>{item.name}</h4>
                          <p>Quantity: {item.quantity}</p>
                          <p>Price: {item.price} ₸</p>
                          <p>Total: {item.price * item.quantity} ₸</p>
                        </div>
                        <button
                          className="remove-item-btn"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="order-total">
                    <h3>Total price: {calculateTotal()} ₸</h3>
                  </div>
                  {/* Display general error if cart items are present but fetch had an issue */}
                  {error && <p className="error-message" style={{marginTop: "10px"}}>{error}</p>}
                </>
              ) : (
                <div className="empty-cart-message">
                  <p>Ваша корзина пуста.</p>
                  {error && <p className="error-message" style={{marginTop: "10px"}}>{error}</p>}
                </div>
              )}
            </div>

            <div className="cart-checkout">
              <h2>Checkout</h2>
              <form
                className="checkout-form"
                onSubmit={handleCheckoutSubmit}
              >
                <div className="payment-method-selector">
                  <label>Payment method:</label>
                  <div className="payment-options">
                    {["card", "crypto", "cash"].map((method) => (
                      <div className="payment-radio" key={method}>
                        <input
                          type="radio"
                          id={method}
                          name="payment"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={(e) => {
                            setPaymentMethod(e.target.value);
                            setFormError(null); // Clear form errors when switching method
                          }}
                        />
                        <label htmlFor={method}>
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div className="card-payment-form">
                    <div className="form-group">
                      <label htmlFor="cardNumberInput">Card number:</label>
                      <input
                        type="text" // Use "text" to allow spaces, "tel" for numeric keyboard on mobile
                        id="cardNumberInput"
                        placeholder="XXXX XXXX XXXX XXXX"
                        className="card-input"
                        value={formattedCardNumber}
                        onChange={handleCardNumberChange}
                        maxLength="19" // e.g., 16 digits + 3 spaces
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="expiryDateInput">Expire date:</label>
                        <input
                          type="text" // Use "text" for formatting, "tel" for numeric keyboard
                          id="expiryDateInput"
                          placeholder="MM / YY"
                          className="expiry-input"
                          value={formattedExpiryDate}
                          onChange={handleExpiryDateChange}
                          maxLength="7" // MM / YY
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="cvcInput">CVC/CVV:</label>
                        <input
                          type="password" // Use "password" or "tel" for masking/numeric keyboard
                          id="cvcInput"
                          placeholder="XXX"
                          className="cvc-input"
                          value={cvc}
                          onChange={handleCvcChange}
                          maxLength="4"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="cardholderNameInput">Cardholder:</label>
                      <input
                        type="text"
                        id="cardholderNameInput"
                        placeholder="ILYAS TLEUKHAN"
                        className="name-input"
                        value={cardholderName}
                        onChange={handleCardholderNameChange}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        id="saveCardCheckbox"
                        checked={saveCardDetails}
                        onChange={handleSaveCardToggle}
                        style={{ marginRight: '8px', width: 'auto' }}
                      />
                      <label htmlFor="saveCardCheckbox" style={{ fontWeight: 'normal', fontSize: '0.9em' }}>
                        Save card details for future purchases
                      </label>
                    </div>
                    <p style={{fontSize: '0.8em', color: '#666', marginTop: '5px'}}>
                      <i className="fas fa-shield-alt" style={{marginRight: '5px'}}></i>
                      Secure payment. We do not store your CVC.
                      <br />
                      <span style={{color: 'red', fontWeight: 'bold'}}>DEMO: Card details saved in browser (insecure for production).</span>
                    </p>
                  </div>
                )}

                {paymentMethod === 'crypto' && (
                  <div className="crypto-info">
                    <p>Crypto Address:</p>
                    <div className="crypto-address">
                      <code>5baksovtonfpiethereumbitcoinlitecointetherusdt</code>
                      <button
                        className="copy-address-btn"
                        type="button"
                        onClick={() => navigator.clipboard.writeText('sosisosi5baksovtonfpiethereumbitcoinlitecointetherusdt').then(() => alert('Address copied!'))}
                        aria-label="Copy crypto address"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                    <p className="crypto-note">After transfer press "Confirm payment".</p>
                     <div className="form-group" style={{marginTop: '10px'}}>
                       <label>Transaction ID / Hash (Optional):</label>
                       <input type="text" placeholder="Enter your transaction hash/ID" className="name-input" />
                     </div>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className="cash-info">
                    <p>You picked cash as a payment method.</p>
                    <p>Your product(s) will be delivered on exact delivery address in some days.</p>
                    <p>Please, remember the full amount of money that you need to pay with cash.</p>
                  </div>
                )}

                {formError && paymentMethod === 'card' && <p className="error-message" style={{ color: 'red', marginTop: '15px' }}>{formError}</p>}

                <button
                  type="submit"
                  className="confirm-btn"
                  disabled={cartItems.length === 0 || isLoading}
                >
                  {isLoading ? 'Loading...' :
                   cartItems.length === 0 ? 'Cart is Empty' : 'Confirm payment'}
                </button>
              </form>
            </div>
          </div>
        </div>

      <div className="trending-section">
      <section className="trending-section-v2">
          <h2>Based on your cart</h2>
          <div className="trending-products-v2">
            {recommendations.length === 0 ? (
              <p>No recommendations available.</p>
            ) : (
              recommendations.map((product) => (
                <div className="product-card-v2" key={product.id}>
                  <img src={product.image} alt={product.name} />
                  <div className="product-info-v2">
                    <p className="product-category-v2">Recommended</p>
                    <h3 className="product-name-v2">{product.name}</h3>
                    <p className="product-price-v2">{product.price}₸</p>
                    <span className="product-tag-v2">You may like</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

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

export default CartBag;