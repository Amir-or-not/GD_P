import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import scroll from '../js/scroll';
import cart from '../js/cart';
import Navbar from "./Navbar";
const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    const cleanupCart = cart?.();
    const cleanupScroll = scroll?.();

    return () => {
      if (typeof cleanupCart === 'function') cleanupCart();
      if (typeof cleanupScroll === 'function') cleanupScroll();
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    let valid = true;
    let errors = {};

    if (!formData.name) {
      errors.name = 'Name is required';
      valid = false;
    }

    if (!formData.email) {
      errors.email = 'Email is required';
      valid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      valid = false;
    }

    setErrors(errors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await fetch('http://localhost:8000/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create account');
      }

      // Navigate to the login page upon successful registration
      navigate('/login');
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Registration failed. Please try again.');
    }
  };

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

      <div className="reg-wrapper">
        <h2>Create your account</h2>
        <form id="signupForm" onSubmit={handleSubmit}>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          {errors.name && <span className="error">{errors.name}</span>}

          <input
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          {errors.email && <span className="error">{errors.email}</span>}

          <input
            type="password"
            id="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          {errors.password && <span className="error">{errors.password}</span>}

          <button type="submit">Sign up</button>
        </form>
        <p>
          Already have an account? <a href="/login/">Login here</a>
        </p>
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
          <p>© 2025 GD Accesories. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Register;
