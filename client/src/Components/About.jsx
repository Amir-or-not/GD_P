import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from 'react';
import scroll from '../js/scroll';
import cart from '../js/cart';
import Navbar from "./Navbar";
const About = () => {
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
            
            <section className="minimal-hero">
                    <div className="minimal-container">
                        <h1>GD PLACE | The quotes</h1>
                        <div className="minimal-quote-block">
                            <p className="minimal-quote">
                                The place where the fire meets the sea, and the stars fall into the ocean, and where you can find the most luxurious accessories. Special marketplace where you can interact with retailers and us directly.
                            </p>
                            <p className="minimal-author">- Ashirbek Amir, The CEO of GD, Backend Developer</p>
                        </div>
                    </div>
                </section>

                <section className="minimal-section">
                    <div className="minimal-container">
                        <div className="minimal-quote-block secondary">
                            <p className="minimal-quote">
                                Intercourse with us, and you will find the most fitted accessories for you.
                            </p>
                            <p className="minimal-author">- Tleukhan Ilyas, The COO of GD, Data Engineer</p>
                        </div>
                    </div>
                </section>

                <section className="minimal-section">
                    <div className="minimal-container">
                        <div className="minimal-content-block">
                            <h2>OUR PROCESS</h2>
                            <p>
                                GD Place emerges from the depths, where master craftsmen forge each piece with precision. 
                                Our jewelry is born from meticulous attention to detail and minimalist design philosophy.
                            </p>
                        </div>

                        <div className="minimal-features">
                            <div className="minimal-feature">
                                <h3>01. CRAFTSMANSHIP</h3>
                                <p>
                                    Each piece is handcrafted by our artisans with decades of experience.
                                </p>
                            </div>

                            <div className="minimal-feature">
                                <h3>02. MATERIALS</h3>
                                <p>
                                    We use only premium materials sourced through ethical channels.
                                </p>
                            </div>

                            <div className="minimal-feature">
                                <h3>03. DESIGN</h3>
                                <p>
                                    Minimalist aesthetics that stand the test of time.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="minimal-section team-section">
                    <div className="minimal-container">
                        <h2>THE TEAM</h2>
                        <div className="minimal-team">
                            <div className="minimal-team-member">
                                <div className="minimal-team-image">
                                    <img src="/images/ashim.jpg" alt="Ashirbek Amir" />
                                </div>
                                <h3>Ashirbek Amir</h3>
                                <p>Backend developer</p>
                                <p className="minimal-member-quote">"lets dance"</p>
                            </div>
                            <div className="minimal-team-member">
                                <div className="minimal-team-image">
                                    <img src="/images/muky.jpg" alt="Mukynov Mansur" />
                                </div>
                                <h3>Mukynov Mansur</h3>
                                <p>Frontend developer</p>
                                <p className="minimal-member-quote">"aaaaaa furina aaaa kokomi"</p>
                            </div>
                            <div className="minimal-team-member">
                                <div className="minimal-team-image">
                                    <img src="/images/shket.png" alt="Tleukhan Ilyas" />
                                </div>
                                <h3>Tleukhan Ilyas</h3>
                                <p>Database</p>
                                <p className="minimal-member-quote">"oh noooooo la policiya"</p>
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

export default About;