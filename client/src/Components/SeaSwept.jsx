import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from 'react';
import scroll from '../js/scroll';
import cart from '../js/cart';
import Navbar from "./Navbar";
const SeaSwept = () => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [clickToggled, setClickToggled] = useState(false);
    const dropdownRef = useRef(null);

    const toggleVideo = () => {
        const video = document.getElementById('bannerVideo');
        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    const handleDropdownClick = (e) => {
        e.preventDefault();
        if (clickToggled) {
            setClickToggled(false);
            setDropdownVisible(false);
        } else {
            setClickToggled(true);
            setDropdownVisible(true);
        }
    };

    const handleMouseEnter = () => {
        if (!clickToggled) {
            setDropdownVisible(true);
        }
    };

    const handleMouseLeave = () => {
        if (!clickToggled) {
            setDropdownVisible(false);
        }
    };

    useEffect(() => {
        function handleClickOutside(event) {
            const isClickOnTrigger = event.target.closest('.dropdown-trigger');
            
            if (clickToggled && dropdownRef.current && !dropdownRef.current.contains(event.target) && !isClickOnTrigger) {
                setClickToggled(false);
                setDropdownVisible(false);
            }
        }


        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [clickToggled]);

    useEffect(() => {
        const cleanupCart = cart?.();
        const cleanupScroll = scroll?.();
        return () => {
            if (typeof cleanupCart === 'function') cleanupCart();
            if (typeof cleanupScroll === 'function') cleanupScroll();
        };
    }, []);

    return (
        <>
            {/* META & HEAD STYLES */}
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>GPlace</title>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap" rel="stylesheet" />
            <link rel="stylesheet" href="/static/all.min.css" />
            <link rel="stylesheet" href="/static/styles.css" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            {/* NAVBAR */}
            <Navbar />
            
            {/* Rest of the component remains the same */}
            <section className="collection-banner-v6 sea-theme">
    <div className="banner-content-v6">
        <h1 className="collection-title-v6">Sea's Swept GD: 2025</h1>
        <p className="collection-description-v6">
            Plunge into the whispers of the ocean  a collection crafted by tides, sculpted by salt, and kissed by moonlight.
        </p>
    </div>
    <div className="video-banner-wrapper-v6">
        <video
            className="video-banner-v6"
            id="bannerVideo"
            autoPlay
            muted
            loop
            playsInline
        >
            <source src="/images/Запись 2025-05-04 022032 (online-video-cutter.com).mp4" type="video/mp4" />
            Your browser does not support the video tag.
        </video>
        <button className="video-toggle-btn-v6" onClick={toggleVideo}>
            <i id="videoIcon" className={isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play"} />
        </button>
    </div>
</section>
<section className="collection-grid-v6">
    <h1 className="grid-title-v6">Ocean-Touched Elegance</h1>
    <p className="grid-description-v6">
        Dive into an array of pieces echoing coral reefs, pearl shores, and deep blue dreams.
    </p>
    <div className="grid-v6">
        <div className="item-v6 wave-glow">
            <img src="/images/20250504_0230_Pearl Ring on Water_simple_compose_01jtc0x08xf7wrbvk1qr56es5y.png" alt="Ocean Ring" />
            <p className="item-label-v6">Pearl Tide Ring</p>
        </div>
        <div className="item-v6 wave-glow">
            <img src="/images/20250504_0232_Moonlit Coral Necklace_simple_compose_01jtc0zk6me2fbpw83bv4mja67.png" alt="Necklace" />
            <p className="item-label-v6">Moonlit Coral</p>
        </div>
        {/* <div className="item-v6 wave-glow">
            <img src="/images/20250504_0234_Abyss Whisper Earrings_simple_compose_01jtc13909fpdagfy3q05abj35.png" alt="Earring" />
            <p className="item-label-v6">Abyss Whisper</p>
        </div> */}
        <div className="item-v6 wave-glow">
            <img src="/images/20250504_0236_Silver Shoreline Bracelet_simple_compose_01jtc17hczef7rwswr9k6hfr6s.png" alt="Bracelet" />
            <p className="item-label-v6">Silver Shoreline</p>
        </div>
    </div>
</section>

            <section className="designer-showcase">
                <div className="designer-quote-container">
                    <p className="designer-collection-description">"Collection under impeachment of GD place, made by it's craftsmanship in the deep ocean. In the very end of darkess bloom in it's depth, clinching for it's renewance for once more."</p>
                    <span className="designer-quote-author">- Amirok Amir, The CEO of GD.</span>
                </div>
                
                <div className="designer-content">
                    <div className="designer-image">
                        <video
                            className="designer-video"
                            autoPlay
                            muted
                            loop
                            playsInline
                        >
                            <source src="/images/IMG_5013.MP4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                        
                    </div>
                    <div className="designer-quote">
                        <h2 className ="quote-title-seas">Building the elegant pieces of acessories altogether in ocean</h2>
                        <p className="quote-text">"We will lit everybody to ashes, with these beats. But this accessories will lit everything to the celestial courses."</p>
                        <span className="quote-author">- Johnny Silverhand</span>
                    </div>
                </div>
                                
                <div className="collection-items">
                    <h3 className="collection-subtitle">Investigate more collections</h3>
                    <div className="luxury-items-grid">
                        <div className="luxury-item">
                            <img src="/images/20250504_0048_Flaming Pendant Elegance_simple_compose_01jtbv1gj6e5ev9p75x8gvecmz.png" alt="Celestial Brooch" />
                            <div className="item-details">
                                <h4>Hell's Fire GD: 2025 Collection </h4>
                                <p>Sacrificial power of fire burns through the elegancy of accessories, contempt them in blazing vow</p>
                                <a href="/collections/hell-fire" className="view-details-btn">Learn more</a>
                            </div>
                        </div>
                        <div className="luxury-item">
                            <img src="/images/20250504_0042_Golden Star Brooch_simple_compose_01jtbtn4rpfgha1d0y23j9rk1a.png" alt="Celestial Brooch" />
                            <div className="item-details">
                                <h4>Star falling GD: ??? Collection </h4>
                                <p>Collection proclaimed by it's space and time, galaxy and bond, universe pledge</p>
                                <a href="#" className="view-details-btn">Coming soon</a>
                            </div>
                        </div>
                        <div className="luxury-item">
                            <img src="/images/20250504_0036_Leaf Diamond Brooch_simple_compose_01jtbtcc6ffd38r0qzz1qdvamr.png" alt="Celestial Brooch" />
                            <div className="item-details">
                                <h4>Nature's return GD: ??? Jewelry </h4>
                                <p>Environment wind laments from the nature's spirit, astonishing every leaf</p>
                                <a href="#" className="view-details-btn">Coming soon</a>
                            </div>
                        </div>
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

export default SeaSwept;