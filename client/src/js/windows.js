// src/js/windows.js
export default function windows() {
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  }

  function showPage(pageId) {
    const profileSection = document.querySelector('.profile-section');
    if (profileSection) profileSection.style.display = 'none';

    const pages = document.querySelectorAll('.page-content-p2');
    pages.forEach(page => page.classList.remove('active'));

    const selectedPage = document.getElementById(pageId);
    if (selectedPage) selectedPage.classList.add('active');
  }

  function showProfilePage() {
    const pages = document.querySelectorAll('.page-content-p2');
    pages.forEach(page => page.classList.remove('active'));

    const profileSection = document.querySelector('.profile-section');
    if (profileSection) {
      profileSection.style.display = 'flex';
      profileSection.style.justifyContent = 'center';
      profileSection.style.alignItems = 'center';
    }
  }

  function saveProfile() {
    alert('Profile updated successfully!');
    closeModal('editProfileModal');
  }

  function changePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    alert('Password updated successfully!');
    closeModal('changePasswordModal');
  }

  function removeFavorite(element) {
    const favoriteItem = element.closest('.favorite-item-p2');
    if (favoriteItem) {
      favoriteItem.style.opacity = '0';
      setTimeout(() => favoriteItem.remove(), 300);
    }
  }

  const setupEventListeners = () => {
    const editProfileBtn = document.querySelector('.profile-actions button:nth-child(1)');
    const changePasswordBtn = document.querySelector('.profile-actions button:nth-child(2)');
    const orderHistoryLink = document.getElementById('orderHistoryLink');
    const favoritesLink = document.getElementById('favoritesLink');
    const addressesLink = document.getElementById('addressesLink');

    const addAddressBtn = document.querySelector('.add-address-btn-p2');
    const editAddressBtns = document.querySelectorAll('.edit-address-p2');
    const closeBtns = document.querySelectorAll('.close-btn-p5');

    const handlers = {
      editProfile: () => openModal('editProfileModal'),
      changePassword: () => openModal('changePasswordModal'),
      orderHistory: (e) => {
        e.preventDefault();
        showPage('orderHistoryPage');
      },
      favorites: (e) => {
        e.preventDefault();
        showPage('favoritesPage');
      },
      addresses: (e) => {
        e.preventDefault();
        showPage('addressesPage');
      },
      addAddress: () => openModal('addressModal'),
      editAddress: (e) => {
        e.preventDefault();
        openModal('addressModal');
      }
    };

    if (editProfileBtn) editProfileBtn.addEventListener('click', handlers.editProfile);
    if (changePasswordBtn) changePasswordBtn.addEventListener('click', handlers.changePassword);
    if (orderHistoryLink) orderHistoryLink.addEventListener('click', handlers.orderHistory);
    if (favoritesLink) favoritesLink.addEventListener('click', handlers.favorites);
    if (addressesLink) addressesLink.addEventListener('click', handlers.addresses);
    if (addAddressBtn) addAddressBtn.addEventListener('click', handlers.addAddress);
    editAddressBtns.forEach(btn => btn.addEventListener('click', handlers.editAddress));

    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-p5');
        if (modal && modal.id) {
          closeModal(modal.id);
        }
      });
    });

    // Cleanup
    return () => {
      if (editProfileBtn) editProfileBtn.removeEventListener('click', handlers.editProfile);
      if (changePasswordBtn) changePasswordBtn.removeEventListener('click', handlers.changePassword);
      if (orderHistoryLink) orderHistoryLink.removeEventListener('click', handlers.orderHistory);
      if (favoritesLink) favoritesLink.removeEventListener('click', handlers.favorites);
      if (addressesLink) addressesLink.removeEventListener('click', handlers.addresses);
      if (addAddressBtn) addAddressBtn.removeEventListener('click', handlers.addAddress);
      editAddressBtns.forEach(btn => btn.removeEventListener('click', handlers.editAddress));
      closeBtns.forEach(btn => btn.removeEventListener('click', closeModal));
    };
  };

  // Make functions globally available
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.showPage = showPage;
  window.showProfilePage = showProfilePage;
  window.saveProfile = saveProfile;
  window.changePassword = changePassword;
  window.removeFavorite = removeFavorite;

  return setupEventListeners();
}
