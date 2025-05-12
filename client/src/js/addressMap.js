// src/js/addressMap.js
export default function addressMap() {
    let map, placemark;
    
    function initMap() {
      // Make sure there's a map container
      const mapContainer = document.getElementById("map");
      if (!mapContainer) {
        console.error("Map container not found");
        return;
      }
      
      // Initialize the map
      map = new window.ymaps.Map("map", {
        center: [51.18, 71.44],
        zoom: 10
      });
  
      // Add click event to the map
      map.events.add("click", function (e) {
        const coords = e.get('coords');
  
        if (!placemark) {
          placemark = new window.ymaps.Placemark(coords, {}, { draggable: true });
          map.geoObjects.add(placemark);
        } else {
          placemark.geometry.setCoordinates(coords);
        }
  
        const latInput = document.getElementById('latitude');
        const lngInput = document.getElementById('longitude');
        
        if (latInput) latInput.value = coords[0];
        if (lngInput) lngInput.value = coords[1];
      });
      
      // Add drag event to placemark if needed
      if (placemark) {
        placemark.events.add('dragend', function () {
          const coords = placemark.geometry.getCoordinates();
          const latInput = document.getElementById('latitude');
          const lngInput = document.getElementById('longitude');
          
          if (latInput) latInput.value = coords[0];
          if (lngInput) lngInput.value = coords[1];
        });
      }
    }
  
    // Store event handler references for cleanup
    const handlers = {
      addBtnClick: function() {
        const openModal = window.openModal || function(){};
        openModal('addressModal');
        setTimeout(() => {
          if (window.ymaps && window.ymaps.ready) {
            window.ymaps.ready(initMap);
          }
        }, 300);
      },
      
      formSubmit: function(e) {
        e.preventDefault();
        const closeModal = window.closeModal || function(){};
        closeModal('addressModal');
        alert("Address saved!");
        // Here you can send data via fetch to server
      }
    };
    
    // Setup event listeners
    function setupEventListeners() {
      const addBtn = document.querySelector('.add-address-btn-p2');
      const editBtns = document.querySelectorAll('.edit-address-p2');
      const addressForm = document.getElementById("addressForm");
  
      if (addBtn) {
        addBtn.addEventListener('click', handlers.addBtnClick);
      }
  
      if (editBtns && editBtns.length) {
        editBtns.forEach(btn => {
          btn.addEventListener('click', handlers.addBtnClick);
        });
      }
  
      if (addressForm) {
        addressForm.addEventListener("submit", handlers.formSubmit);
      }
      
      // Return cleanup function
      return function cleanup() {
        if (addBtn) {
          addBtn.removeEventListener('click', handlers.addBtnClick);
        }
        
        if (editBtns && editBtns.length) {
          editBtns.forEach(btn => {
            btn.removeEventListener('click', handlers.addBtnClick);
          });
        }
        
        if (addressForm) {
          addressForm.removeEventListener("submit", handlers.formSubmit);
        }
        
        // Destroy map if it exists
        if (map) {
          map.destroy();
          map = null;
          placemark = null;
        }
      };
    }
    
    // Make initMap available globally if needed
    window.initAddressMap = initMap;
    
    // Setup listeners and return cleanup function
    return setupEventListeners();
  }