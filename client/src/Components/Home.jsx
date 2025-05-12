import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from 'react';
import scroll from '../js/scroll';
import cart from '../js/cart';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import Navbar from "./Navbar";

const Home = () => {
    const modelContainerRef = useRef(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slideDirection, setSlideDirection] = useState('right');

    const bannerSlides = [
        {
            image: "/images/1744795905005.jpg",
            title: "Discover Elegant Timepieces",
            buttonText: "Shop Now",
            buttonLink: "/shop"
        },
        {
            image: "/images/photo_2025-05-04_17-48-58.jpg",
            title: "Luxury Fire Styled Accessories Collection",
            buttonText: "View More",
            buttonLink: "/collections/hell-fire"
        },
        {
            image: "/images/photo_2025-05-04_18-01-14.jpg",
            title: "Learn more about us, our story and our products",
            buttonText: "Learn More",
            buttonLink: "/About"
        }
    ];

    const nextSlide = () => {
        setSlideDirection('right');
        setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    };

    const prevSlide = () => {
        setSlideDirection('left');
        setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const cleanupCart = typeof cart === 'function' ? cart() : undefined;
        const cleanupScroll = typeof scroll === 'function' ? scroll() : undefined;
        return () => {
            if (typeof cleanupCart === 'function') cleanupCart();
            if (typeof cleanupScroll === 'function') cleanupScroll();
        };
    }, []);

    useEffect(() => {
        if (!modelContainerRef.current) return;

        let renderer, controls, animationFrameId, loadedModel;
        const container = modelContainerRef.current;

        const scene = new THREE.Scene();

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('/images/photo-1604147706283-d7119b5b822c.jpg', (texture) => {
            scene.background = texture;
        }, undefined, (error) => {
            console.error("Failed to load background texture:", error);
        });

        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 10000);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 7);
        scene.add(light);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(0, 0, 5);
        scene.add(pointLight);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        const width = container.clientWidth || 600;
        const height = container.clientHeight || 500;
        renderer.setSize(width, height);


        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-indicator';
        loadingElement.innerHTML = `
            <div class="spinner"></div>
            <p>Loading 3D Model...</p>
        `;
        container.appendChild(loadingElement);

        const mtlLoader = new MTLLoader();
        mtlLoader.load('/models/Nenya_Galadriels_Ring.mtl', (materialsCreator) => {
            materialsCreator.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(materialsCreator);
            objLoader.load('/models/Nenya_Galadriels_Ring.obj', (objModel) => {
                setupModel(objModel);
            }, undefined, (error) => {
                console.error('Error loading OBJ model:', error);
                loadingElement.innerHTML = `<p>Error loading 3D model</p>`;
            });
        }, undefined, (error) => {
            console.warn('Error loading MTL, loading OBJ without materials:', error);
            const objLoader = new OBJLoader();
            objLoader.load('/models/Nenya_Galadriels_Ring.obj', (objModel) => {
                setupModel(objModel);
            }, undefined, (error) => {
                console.error('Error loading fallback OBJ model:', error);
                loadingElement.innerHTML = `<p>Error loading 3D model</p>`;
            });
        });

        function setupModel(objModel) {
            loadedModel = objModel;
            loadedModel.scale.set(1, 1, 1);

            const box = new THREE.Box3().setFromObject(loadedModel);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            console.log("Размер модели:", size);
            console.log("Центр модели:", center);

            // Центрирование
            loadedModel.position.sub(center);

            // Автоматическое масштабирование под сцену
            const maxDim = Math.max(size.x, size.y, size.z);
            const scaleFactor = 10 / maxDim; // можно подправить коэффициент
            loadedModel.scale.setScalar(scaleFactor);

            // Камера
            const fov = camera.fov * (Math.PI / 180);
            const cameraZ = Math.abs(maxDim * scaleFactor / 2 / Math.tan(fov / 2)) * 1.5;
            camera.position.set(0, 0, cameraZ);
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();

            loadedModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (!child.material) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xdddddd,
                            metalness: 0.8,
                            roughness: 0.2,
                        });
                    }
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => {
                        if (mat.metalness !== undefined) mat.metalness = 0.8;
                        if (mat.roughness !== undefined) mat.roughness = 0.2;
                        if (mat.map) mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                    });
                }
            });

            scene.add(loadedModel);
            if (container.contains(loadingElement)) container.removeChild(loadingElement);

            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);
                if (loadedModel) loadedModel.rotation.y += 0.005;
                controls.update();
                renderer.render(scene, camera);
            };
            animate();
        }

        const handleResize = () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (controls) controls.dispose();
            if (renderer && container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
            renderer?.dispose();
            if (container.contains(loadingElement)) container.removeChild(loadingElement);
            if (loadedModel) {
                loadedModel.traverse((child) => {
                    if (child.isMesh) {
                        child.geometry?.dispose();
                        const disposeMaterial = (mat) => {
                            mat.map?.dispose();
                            mat.lightMap?.dispose();
                            mat.aoMap?.dispose();
                            mat.normalMap?.dispose();
                            mat.bumpMap?.dispose();
                            mat.specularMap?.dispose();
                            mat.envMap?.dispose();
                            mat.alphaMap?.dispose();
                            mat.roughnessMap?.dispose();
                            mat.metalnessMap?.dispose();
                            mat.emissiveMap?.dispose();
                            mat.dispose();
                        };
                        if (Array.isArray(child.material)) {
                            child.material.forEach(disposeMaterial);
                        } else {
                            disposeMaterial(child.material);
                        }
                    }
                });
                scene.remove(loadedModel);
            }
        };
    }, []);

  
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
            
            {/* Hero Banner Slider Section with Horizontal Slide Effect */}
            <section className="hero-banner-container" style={{ overflow: 'hidden', position: 'relative' }}>
                <div 
                    className="hero-banner-slider" 
                    style={{
                        display: 'flex',
                        width: `${bannerSlides.length * 100}%`,
                        transform: `translateX(-${(100 / bannerSlides.length) * currentSlide}%)`,
                        transition: 'transform 0.5s ease',
                    }}
                >
                    {bannerSlides.map((slide, index) => (
                        <div
                            key={index}
                            className="hero-slide"
                            style={{
                                width: `${100 / bannerSlides.length}%`,
                                backgroundImage: `url('${slide.image}')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                height: '80vh',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start', 
                                paddingLeft: '5vw',         
                            }}
                            >
                            <div className="hero-content">
                                <h1>{slide.title}</h1>
                                <button onClick={() => window.location.href = slide.buttonLink}>
                                    {slide.buttonText}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Slider Navigation */}
                <button 
                    className="slider-nav slider-prev" 
                    onClick={prevSlide}
                    aria-label="Previous slide"
                    style={{
                        position: 'absolute',
                        left: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255, 255, 255, 0.5)',
                        border: 'none',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 2
                    }}
                >
                    <i className="fas fa-chevron-left"></i>
                </button>
                
                <button 
                    className="slider-nav slider-next" 
                    onClick={nextSlide}
                    aria-label="Next slide"
                    style={{
                        position: 'absolute',
                        right: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255, 255, 255, 0.5)',
                        border: 'none',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 2
                    }}
                >
                    <i className="fas fa-chevron-right"></i>
                </button>
                
                {/* Slide Indicators */}
                <div 
                    className="slider-indicators"
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '10px',
                        zIndex: 2
                    }}
                >
                    {bannerSlides.map((_, index) => (
                        <button
                            key={index}
                            className={`slider-indicator ${currentSlide === index ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                            style={{
                                width: '12px',
                                height: '12px',
                                background: currentSlide === index ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        />
                    ))}
                </div>
            </section>
            
            {/* секция с категориями */}
            <h2 className="explore-heading">EXPLORE</h2>
            <section className="category-section">
                <div className="category-card">
                    <img src="/images/bracelet.png" alt="Watches" />
                </div>
                <div className="category-card">
                    <img src="/images/charms.png" alt="Bracelets" />
                </div>
                <div className="category-card">
                    <img src="/images/rings.png" alt="Rings" />
                </div>
                <div className="category-card">
                    <img src="/images/necklaces.png" alt="Necklaces" />
                </div>
            </section>
            {/* секция о чем материалы */}
            <section className="new-product-section">
                <div className="producthome-image">
                    <img src="/images/v1.jpg" alt="Silver and gold bracelets" />
                </div>
                <div className="producthome-info">
                    <h2>ONLY QUALITY MATERIAL</h2>
                    <p>
                        All products on this website were made with pure qualified quality.
                        Dismembering a lot of work for this materials, just to be looking
                        towards the clients base.
                    </p>
                    <a href="#" className="shop-button">
                        LOOK FOR MORE
                    </a>
                </div>
            </section>
            <section className="jewelry-section">
                <div className="jewelry-item">
                    <div className="image-container">
                        <img src="/images/20250504_0234_Abyss Whisper Earrings_simple_compose_01jtc1390aez6tmf56w76192f4.png" alt=" Icons Jewelry" />
                    </div>
                    <h3 className="jewelry-title">The Sea's Icons</h3>
                    <a href="/collections/sea-swept" className="shop-now">
                        VIEW MORE
                    </a>
                </div>
                <div className="jewelry-item">
                    <div className="image-container">
                        <img
                            src="/images/ATX2510X_4f9a118e-2afe-424b-9f5e.png"
                            alt="Gold Jewelry"
                        />
                    </div>
                    <h3 className="jewelry-title">Gold Jewelry</h3>
                    <a href="/shop/" className="shop-now">
                        SHOP NOW
                    </a>
                </div>
                <div className="jewelry-item">
                    <div className="image-container">
                        <img src="/images/photo_2025-04-23_21-08-09.jpg" alt="Diamond Jewelry" />
                    </div>
                    <h3 className="jewelry-title">Who Are We?</h3>
                    <a href="/About/" className="shop-now">
                        LEARN ABOUT US
                    </a>
                </div>
            </section>
            
            <section className="testimonials-section">
                <h2 className="section-title">WHAT OUR CUSTOMERS SAY?</h2>
                <div className="testimonials-container">
                    <div className="testimonial-card">
                        <div className="testimonial-rating">
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                        </div>
                        <p className="testimonial-text">"The silver watch I purchased exceeded all my expectations. The quality is outstanding and the customer service was impeccable!"</p>
                        <div className="testimonial-author">
                            <p className="testimonial-name">- Michael T.</p>
                        </div>
                    </div>
                    <div className="testimonial-card">
                        <div className="testimonial-rating">
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star-half-alt"></i>
                        </div>
                        <p className="testimonial-text">"I've been collecting watches for years, and GD Accessories consistently offers some of the most elegant pieces I've seen. Highly recommend new GD Fire Collection!"</p>
                        <div className="testimonial-author">
                            <p className="testimonial-name">- Sarah L.</p>
                        </div>
                    </div>
                    <div className="testimonial-card">
                        <div className="testimonial-rating">
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                        </div>
                        <p className="testimonial-text">"The diamond bracelet I bought for my wife was simply stunning. The craftsmanship is incredible and she absolutely loves it!"</p>
                        <div className="testimonial-author">
                            <p className="testimonial-name">- Egor B.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits/Features Section */}
            <section className="benefits-section">
                <h2 className="section-title">OUR PRODUCTS PROFIT</h2>
                <div className="benefits-container">
                    <div className="benefit-card">
                        <div className="benefit-icon">
                            <i className="fas fa-shipping-fast"></i>
                        </div>
                        <h3 className="benefit-title">Free Shipping</h3>
                        <p className="benefit-description">Free worldwide shipping on all orders over $150</p>
                    </div>
                    <div className="benefit-card">
                        <div className="benefit-icon">
                            <i className="fas fa-undo-alt"></i>
                        </div>
                        <h3 className="benefit-title">30-Day Returns</h3>
                        <p className="benefit-description">Not satisfied? Return your items within 30 days</p>
                    </div>
                    <div className="benefit-card">
                        <div className="benefit-icon">
                            <i className="fas fa-shield-alt"></i>
                        </div>
                        <h3 className="benefit-title">Product Warranty</h3>
                        <p className="benefit-description">All our products come with a 2-year warranty</p>
                    </div>
                    <div className="benefit-card">
                        <div className="benefit-icon">
                            <i className="fas fa-headset"></i>
                        </div>
                        <h3 className="benefit-title">24/7 Support</h3>
                        <p className="benefit-description">Our customer support team is always here to help</p>
                    </div>
                </div>
            </section>

            {/* Custom Design/Personalization Section */}
            <section className="custom-design-section">
                <div className="custom-design-container">
                <div id="model-container" className="custom-design-image" ref={modelContainerRef}>
                        {/* Three.js container will be mounted here via ref */}
                    </div>
                    <div className="custom-design-content">
                        <h2 className="custom-design-title">CREATE YOUR UNIQUE PIECE</h2>
                        <p className="custom-design-description">Work with our master craftsmen to design a one-of-a-kind accessory that perfectly matches your style and personality.</p>
                        <ul className="custom-design-features">
                            <li><i className="fas fa-check"></i> Personal consultation with our designers</li>
                            <li><i className="fas fa-check"></i> Choose from premium materials</li>
                            <li><i className="fas fa-check"></i> Custom engraving available</li>
                            <li><i className="fas fa-check"></i> Perfect for special occasions</li>
                        </ul>
                        <a href="/custom-design" className="custom-design-button">START DESIGNING</a>
                    </div>
                </div>
            </section>

            {/* Newsletter Signup Section */}
            <section className="newsletter-section">
                <div className="newsletter-container">
                    <div className="newsletter-content">
                        <h2 className="newsletter-title">JOIN OUR NEWSLETTER</h2>
                        <p className="newsletter-description">Subscribe to receive updates, exclusive offers, and 10% off your first order</p>
                        <form className="newsletter-form">
                            <input type="email" placeholder="Your email address" className="newsletter-input" required />
                            <button type="submit" className="newsletter-button">SUBSCRIBE</button>
                        </form>
                    </div>
                    <div className="newsletter-image">
                        <img src="/images/elproblema.jpg" alt="Luxury Accessories" />
                    </div>
                </div>
            </section>
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

export default Home;