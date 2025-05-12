// src/js/cart.js
export default function cart() {
  const cartIcon = document.querySelector('.cart-icon');

  if (cartIcon) {
    const dropdown = cartIcon.querySelector('.cart-dropdown');

    const handleClick = (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
    };

    const handleDoubleClick = () => {
      window.location.href = '/cart/';
    };

    const handleOutsideClick = (e) => {
      if (!cartIcon.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    };

    cartIcon.addEventListener('click', handleClick);
    cartIcon.addEventListener('dblclick', handleDoubleClick);
    document.addEventListener('click', handleOutsideClick);

    // 🔁 Важно: возвращаем функцию очистки при размонтировании компонента
    return () => {
      cartIcon.removeEventListener('click', handleClick);
      cartIcon.removeEventListener('dblclick', handleDoubleClick);
      document.removeEventListener('click', handleOutsideClick);
    };
  }
}