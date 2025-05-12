// src/js/yamaps.js
export default function yamaps() {
    // Check if ymaps is available
    if (!window.ymaps) {
      console.error('Yandex Maps API not loaded');
      return null;
    }
    
    // Make sure ymaps is ready before proceeding
    const initYandexMap = () => {
      return new Promise((resolve) => {
        window.ymaps.ready(() => {
          const cleanup = setupMap();
          resolve(cleanup);
        });
      });
    };
    
    // Return the initialization promise
    return initYandexMap();
    
    function setupMap() {
      // Map initialization
      let myMap = new window.ymaps.Map("map", {
        center: [51.08, 71.26],
        zoom: 10,
        controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
      });
  
      // Search control
      let searchControl = new window.ymaps.control.SearchControl({
        options: {
          provider: 'yandex#search',
          float: 'right',
          noPlacemark: true
        }
      });
      myMap.controls.add(searchControl);
  
      // Placemark
      let placemark = new window.ymaps.Placemark([51.08, 71.26], {
        balloonContent: 'Астана'
      }, {
        preset: 'islands#redDotIcon',
        draggable: true
      });
      myMap.geoObjects.add(placemark);
  
      // Search function
      function searchLocation() {
        const searchInput = document.getElementById('search');
        if (!searchInput) return;
        
        const address = searchInput.value;
        if (!address) return;
  
        // Use Yandex Maps geocoder
        window.ymaps.geocode(address).then(function(res) {
          let firstGeoObject = res.geoObjects.get(0);
          
          if (firstGeoObject) {
            // Get coordinates of found object
            let coords = firstGeoObject.geometry.getCoordinates();
            
            // Move map to found object
            myMap.setCenter(coords, 15);
            
            // Move placemark
            placemark.geometry.setCoordinates(coords);
            
            // Display balloon with information
            placemark.properties.set('balloonContent', firstGeoObject.getAddressLine());
            placemark.balloon.open();
          } else {
            alert('Место не найдено');
          }
        }).catch(function(error) {
          console.error('Ошибка геокодирования:', error);
          alert('Произошла ошибка при поиске');
        });
      }
  
      // Event handlers
      const handlers = {
        searchButtonClick: () => searchLocation(),
        searchInputKeypress: (e) => {
          if (e.key === 'Enter') {
            searchLocation();
          }
        },
        mapClick: (e) => {
          const coords = e.get('coords');
          
          // Move placemark
          placemark.geometry.setCoordinates(coords);
          
          // Get information about the place by coordinates
          window.ymaps.geocode(coords).then(function(res) {
            let firstGeoObject = res.geoObjects.get(0);
            if (firstGeoObject) {
              placemark.properties.set('balloonContent', firstGeoObject.getAddressLine());
              placemark.balloon.open();
            } else {
              placemark.properties.set('balloonContent', 'Координаты: ' + coords[0].toFixed(5) + ', ' + coords[1].toFixed(5));
              placemark.balloon.open();
            }
          });
        },
        placemarkDragend: () => {
          const coords = placemark.geometry.getCoordinates();
          
          window.ymaps.geocode(coords).then(function(res) {
            let firstGeoObject = res.geoObjects.get(0);
            if (firstGeoObject) {
              placemark.properties.set('balloonContent', firstGeoObject.getAddressLine());
              placemark.balloon.open();
            }
          });
        }
      };
  
      // Add event listeners
      const searchButton = document.getElementById('searchButton');
      const searchInput = document.getElementById('search');
      
      if (searchButton) {
        searchButton.addEventListener('click', handlers.searchButtonClick);
      }
      
      if (searchInput) {
        searchInput.addEventListener('keypress', handlers.searchInputKeypress);
      }
      
      myMap.events.add('click', handlers.mapClick);
      placemark.events.add('dragend', handlers.placemarkDragend);
  
      // Make search function available globally if needed
      window.searchYandexMapLocation = searchLocation;
  
      // Return cleanup function to remove event listeners and destroy map
      return function cleanup() {
        if (searchButton) {
          searchButton.removeEventListener('click', handlers.searchButtonClick);
        }
        
        if (searchInput) {
          searchInput.removeEventListener('keypress', handlers.searchInputKeypress);
        }
        
        if (myMap) {
          myMap.events.remove('click', handlers.mapClick);
          
          if (placemark) {
            placemark.events.remove('dragend', handlers.placemarkDragend);
          }
          
          myMap.destroy();
        }
      };
    }
  }