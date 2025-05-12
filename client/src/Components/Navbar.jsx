import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

// SearchBox component extracted from the second file
function SearchBox({ searchRef }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [allProducts, setAllProducts] = useState([]);
    const timeoutRef = useRef(null);
    
    useEffect(() => {
        const fetchAllProducts = async () => {
            try {
                setIsSearching(true);
                
                const response = await fetch("http://localhost:8000/shop/");
                
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    console.log("Received products data:", data);
                    
                    if (data && Array.isArray(data.products)) {
                        setAllProducts(data.products);
                        setHasError(false);
                    } else {
                        console.error("Invalid data format:", data);
                        setHasError(true);
                        createTestProducts();
                    }
                } else {
                    console.error("Server did not return JSON:", contentType);
                    const textResponse = await response.text();
                    console.log("Response preview:", textResponse.substring(0, 200));
                    
                    setHasError(true);
                    createTestProducts();
                }
            } catch (error) {
                console.error('Error loading products:', error);
                setHasError(true);
                createTestProducts();
            } finally {
                setIsSearching(false);
            }
        };

        const createTestProducts = () => {
            const testProducts = Array(10).fill().map((_, i) => ({
                id: `test-${i}`,
                product_id: i + 1,
                name: `Test Product ${i+1}`,
                product_name: `Test Product ${i+1}`,
                description: `Description for test product ${i+1}`,
                price: 99.99 + i,
                image: '/images/default-product.png',
                url: `/product/${i}`
            }));
            
            setAllProducts(testProducts);
        };

        fetchAllProducts();
    }, []);

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        if (query.length > 1) {
            setIsSearching(true);
            
            timeoutRef.current = setTimeout(() => {
                try {
                    console.log(`Searching locally for: "${query}"`);
                    
                    const queryLower = query.toLowerCase();
                    const filtered = allProducts.filter(product => {
                        const productName = product.name || product.product_name || '';
                        return productName.toLowerCase().includes(queryLower) || 
                               (product.description && product.description.toLowerCase().includes(queryLower));
                    });
                    
                    console.log(`Found ${filtered.length} matching products`);
                    
                    const results = filtered.slice(0, 5).map(product => ({
                        id: product.id || product.product_id,
                        name: product.name || product.product_name,
                        description: product.description || '',
                        price: product.price,
                        image: product.image || '/images/default-product.png',
                        url: `/product/${encodeURIComponent(product.name || product.product_name)}/`
                    }));
                    
                    setSearchResults(results);
                    setShowSearchResults(true);
                } catch (error) {
                    console.error('Search error:', error);
                    setSearchResults([{
                        id: 'error',
                        name: `Error: ${error.message}`,
                        description: 'Failed to search products',
                        price: 0,
                        image: '/images/default-product.png',
                        url: '/shop/'
                    }]);
                    setShowSearchResults(true);
                } finally {
                    setIsSearching(false);
                }
            }, 300);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    };

    const handleSearchFocus = () => {
        if (searchQuery.length > 0) {
            setShowSearchResults(true);
        }
    };
    
    return (
        <div className="search-box" ref={searchRef}>
            <div className="search-input-container" style={{
                                            marginRight: '45px'
                                        }}>
                <input 
                    type="text" 
                    placeholder="Looking for something..." 
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                />
                <i className="fas fa-search hidden" style={{
                                            position: 'absolute',
                                            Right: '100px'
                                        }}></i>
            </div>
            
            {/* {isSearching && (
                <div className="search-results">
                    <div className="search-loading">Searching...</div>
                </div>
            )} */}
            
            {showSearchResults && !isSearching && (
                <div className="search-results">
                    {searchResults.length > 0 ? (
                        <>
                            <div className="search-results-header">
                                <h4>Search Results</h4>
                                <span>{searchResults.length} items found</span>
                            </div>
                            <div className="search-results-items">
                                {searchResults.map(product => (
                                    <a href={product.url} key={product.id} className="search-result-item">
                                        <img 
                                            src={product.image} 
                                            alt={product.name}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "/images/default-product.png";
                                            }}
                                        />
                                        <div className="search-item-info">
                                            <p>{product.name}</p>
                                            <span>${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                            <a href={`/shop/?search=${encodeURIComponent(searchQuery)}`} className="view-all-results">
                                View all results for "{searchQuery}"
                            </a>
                        </>
                    ) : (
                        <div className="no-results">
                            <p>No products found for "{searchQuery}"</p>
                            <a href="/shop/">Browse our shop</a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Main Navbar component combining features from both files
export default function Navbar() {
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [clickToggled, setClickToggled] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);
    
    const handleDropdownClick = (e) => {
        e.preventDefault();
        setClickToggled(!clickToggled);
        setDropdownVisible(!dropdownVisible);
    };

    // Handle outside clicks for dropdown menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            const isClickOnTrigger = event.target.closest('.dropdown-trigger');
            
            if (
                clickToggled &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !isClickOnTrigger
            ) {
                setClickToggled(false);
                setDropdownVisible(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [clickToggled]);

    // Fetch cart items from API
    useEffect(() => {
        axios.get("http://localhost:8000/cart/", { withCredentials: true })
            .then((res) => {
                setCartItems(res.data.items || []);
            })
            .catch((err) => {
                console.error("Error fetching cart:", err);
                // If error, you could set default items or leave empty
            });
    }, []);

    return (
        <nav className="navbar">
            <div className="logo">
                <a href="/home/">
                    <img src="/images/GD1.png" alt="Logo" className="logo-image" />
                </a>
            </div>
            <div className="nav-links">
                <a href="/home/">Explore</a>
                <a href="/shop/">Shop</a>
                <div className="nav-dropdown" ref={dropdownRef}>
                    <a
                        href="/collections/"
                        className="dropdown-trigger"
                        onClick={handleDropdownClick}
                    >
                        New collections <i className={`fas fa-angle-down rotate-icon ${clickToggled ? 'open' : 'closed'}`} />
                    </a>
                    {dropdownVisible && (
                        <div className="dropdown-content" onMouseEnter={() => setDropdownVisible(true)}>
                            <div className="dropdown-layout">
                                <div className="dropdown-column">
                                    <h3>Collections</h3>
                                    <ul>
                                        <li><a href="/collections/hell-fire">Hell's Fire GD: 2025</a></li>
                                        <li><a href="/collections/sea-swept">Sea's Swept GD: 2025</a></li>
                                        <li><a href="/collections/star-falling">Star Falling GD: 2026</a></li>
                                        <li><a href="/collections/nature-return">Nature's Return GD: 2026</a></li>
                                    </ul>
                                </div>
                                <div className="dropdown-column">
                                    <h3>Discover</h3>
                                    <ul>
                                        <li><a href="/collections/featured">Featured Items</a></li>
                                        <li><a href="/collections/designers">Our Designers</a></li>
                                        <li><a href="/collections/upcoming">Upcoming Releases</a></li>
                                        <li><a href="/collections/limited">Limited Editions</a></li>
                                    </ul>
                                </div>
                                <div className="dropdown-promo">
                                    <img src="/images/20250504_0058_Fiery Luxury Watches_simple_compose_01jtbvmgdeerb9svn5vs7248rv.png" alt="Featured Collection" />
                                    <div className="promo-text">
                                        <span>Featured Collection</span>
                                        <h4>Hell's Fire GD: 2025</h4>
                                        <a href="/collections/hell-fire" className="promo-link">Explore Now</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <a href="/About/">Learn about GD</a>
            </div>
            
            {/* Use the enhanced SearchBox component */}
            <SearchBox searchRef={searchRef} />
            
            <div className="auth-container">
                <a href="/login/" className="sign-up">Sign In</a>
                <a href="/register/" className="sign-in">Sign Up</a>
            </div>
            <div className="icons">
                <div className="cart-icon">
                    <i className="fas fa-shopping-cart" />
                    <div className="cart-dropdown">
                        <div className="cart-items">
                            <p>YOUR ITEMS</p>
                            {cartItems.length === 0 ? (
                                <p>Cart is empty</p>
                            ) : (
                                cartItems.map((item) => (
                                    <div className="cart-item" key={item.id}>
                                        <img 
                                            src={item.image} 
                                            alt={item.name}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "/images/default-product.png";
                                            }}
                                        />
                                        <div className="item-info">
                                            <p>{item.name}</p>
                                            <span>${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <a href="/cart/" className="view-cart-btn">VIEW DETAILS</a>
                    </div>
                </div>
                <a href="/profile/">
                    <i className="fas fa-user-circle" />
                </a>
            </div>
        </nav>
    );
}

