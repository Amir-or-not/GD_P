// src/js/scroll.js
export default function scroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
  
    const placeholder = document.createElement('div');
    placeholder.style.display = 'none';
    navbar.parentNode.insertBefore(placeholder, navbar);
  
    const updateNavbarMetrics = () => {
      placeholder.style.height = `${navbar.offsetHeight}px`;
    };
  
    const handleScroll = () => {
      const offsetTop = navbar.offsetTop;
      if (window.scrollY > offsetTop) {
        navbar.classList.add('navbar-fixed');
        placeholder.style.display = 'block';
      } else {
        navbar.classList.remove('navbar-fixed');
        placeholder.style.display = 'none';
      }
    };
  
    const handleResize = () => {
      updateNavbarMetrics();
      handleScroll();
    };
  
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
  
    updateNavbarMetrics();
    handleScroll();
  
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
    };
  }