import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

// Updated Custom Design/Personalization Section
const CustomDesignSection = () => {
    const modelContainerRef = useRef(null);
    
    useEffect(() => {
        if (!modelContainerRef.current) return;
        
        let renderer;
        let controls;
        let animationFrameId;
        let loadedModel;
        
        const container = modelContainerRef.current;
        
        // Clear any previous content
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        // Add styling to ensure the container is visible
        container.style.width = '100%';
        container.style.height = '400px';
        container.style.position = 'relative';
        container.style.backgroundColor = '#f8f8f8';
        container.style.borderRadius = '8px';
        
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8f8f8);
        
        // Improve camera settings for better viewing angle
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 0, 15); // Position camera more appropriately
        
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);
        
        // Enhanced lighting for better model visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Brighter ambient light
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Brighter directional light
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0xffffff, 1.2); // Brighter point light
        pointLight.position.set(0, 0, 10); // Position closer to camera
        scene.add(pointLight);
        
        // Add another light from different angle for better highlights
        const secondPointLight = new THREE.PointLight(0xffd700, 0.8); // Golden highlight
        secondPointLight.position.set(-5, 5, 5);
        scene.add(secondPointLight);
        
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.autoRotate = true; // Enable auto rotation for better showcase
        controls.autoRotateSpeed = 2.0;
        
        // Create and style a loading indicator
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-indicator';
        loadingElement.style.position = 'absolute';
        loadingElement.style.top = '50%';
        loadingElement.style.left = '50%';
        loadingElement.style.transform = 'translate(-50%, -50%)';
        loadingElement.style.textAlign = 'center';
        loadingElement.style.color = '#333';
        loadingElement.style.zIndex = '10';
        loadingElement.innerHTML = `
            <div class="spinner" style="
                width: 40px;
                height: 40px;
                margin: 0 auto 10px;
                border: 4px solid rgba(0,0,0,0.1);
                border-radius: 50%;
                border-top-color: #3498db;
                animation: spin 1s ease-in-out infinite;
            "></div>
            <p>Loading 3D Model...</p>
        `;
        container.appendChild(loadingElement);
        
        // Add loading animation style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        // Improved loading logic with fallbacks
        const mtlLoader = new MTLLoader();
        mtlLoader.setPath('/models/');
        mtlLoader.load(
            'Nenya_Galadriels_Ring.mtl',
            (materialsCreator) => {
                materialsCreator.preload();
                
                const objLoader = new OBJLoader();
                objLoader.setMaterials(materialsCreator);
                objLoader.setPath('/models/');
                
                objLoader.load(
                    'Nenya_Galadriels_Ring.obj',
                    (objModel) => {
                        loadedModel = objModel;
                        
                        // Scale up the model significantly to make it more visible
                        loadedModel.scale.set(8, 8, 8);
                        
                        const box = new THREE.Box3().setFromObject(loadedModel);
                        const center = box.getCenter(new THREE.Vector3());
                        loadedModel.position.sub(center);
                        
                        // Apply enhanced materials
                        loadedModel.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                
                                // Create a premium jewelry material
                                const silverMaterial = new THREE.MeshStandardMaterial({
                                    color: 0xf0f0f0,
                                    metalness: 0.9,
                                    roughness: 0.1,
                                    envMapIntensity: 1.0
                                });
                                
                                // Apply the enhanced material
                                child.material = silverMaterial;
                            }
                        });
                        
                        scene.add(loadedModel);
                        
                        // Remove loading indicator
                        if (container.contains(loadingElement)) {
                            container.removeChild(loadingElement);
                        }
                        
                        // Animation function with improved rotation
                        const animate = () => {
                            animationFrameId = requestAnimationFrame(animate);
                            
                            controls.update(); // This will handle the auto-rotation
                            renderer.render(scene, camera);
                        };
                        
                        // Start animation
                        animate();
                    },
                    (xhr) => {
                        const percent = (xhr.loaded / xhr.total) * 100;
                        if (loadingElement) {
                            loadingElement.innerHTML = `
                                <div class="spinner" style="
                                    width: 40px;
                                    height: 40px;
                                    margin: 0 auto 10px;
                                    border: 4px solid rgba(0,0,0,0.1);
                                    border-radius: 50%;
                                    border-top-color: #3498db;
                                    animation: spin 1s ease-in-out infinite;
                                "></div>
                                <p>Loading: ${Math.round(percent)}%</p>
                            `;
                        }
                        console.log('OBJ model ' + percent + '% loaded');
                    },
                    (error) => {
                        console.error('Error loading OBJ model:', error);
                        loadFallbackModel(container, loadingElement, scene, camera, renderer, controls);
                    }
                );
            },
            (xhr) => {
                console.log('MTL file ' + (xhr.loaded / xhr.total) * 100 + '% loaded');
            },
            (error) => {
                console.warn('Error loading MTL file, attempting fallback:', error);
                loadFallbackModel(container, loadingElement, scene, camera, renderer, controls);
            }
        );
        
        // Handle window resize
        const handleResize = () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            
            if (controls) {
                controls.dispose();
            }
            
            if (renderer) {
                if (container && renderer.domElement && container.contains(renderer.domElement)) {
                    container.removeChild(renderer.domElement);
                }
                renderer.dispose();
            }
            
            if (container && loadingElement && container.contains(loadingElement)) {
                container.removeChild(loadingElement);
            }
            
            document.head.removeChild(style);
            
            // Clean up scene and geometry
            if (loadedModel) {
                scene.remove(loadedModel);
                loadedModel.traverse((child) => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(material => material.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    }
                });
            }
        };
    }, []);
    
    return (
        <section className="custom-design-section">
            <div className="custom-design-container">
                <div className="custom-design-image" ref={modelContainerRef}>
                    {/* Three.js container will be mounted here via ref */}
                </div>
                <div className="custom-design-content">
                    <h2 className="custom-design-title">CREATE YOUR UNIQUE PIECE</h2>
                    <p className="custom-design-description">
                        Work with our master craftsmen to design a one-of-a-kind accessory that perfectly matches your style and personality.
                    </p>
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
    );
};

// Helper function to load a fallback model when the main model fails
const loadFallbackModel = (container, loadingElement, scene, camera, renderer, controls) => {
    // Update loading message
    if (loadingElement) {
        loadingElement.innerHTML = `
            <div class="spinner" style="
                width: 40px;
                height: 40px;
                margin: 0 auto 10px;
                border: 4px solid rgba(0,0,0,0.1);
                border-radius: 50%;
                border-top-color: #3498db;
                animation: spin 1s ease-in-out infinite;
            "></div>
            <p>Creating fallback model...</p>
        `;
    }
    
    // Create a simple ring geometry as fallback
    const ringGeometry = new THREE.TorusGeometry(3, 0.5, 16, 100);
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700, // Gold color
        metalness: 0.9,
        roughness: 0.1,
        envMapIntensity: 1.0
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    scene.add(ring);
    
    // Add some decorative elements to make it look more like jewelry
    const gemGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const gemMaterial = new THREE.MeshStandardMaterial({
        color: 0x9ac5db, // Light blue for gem
        metalness: 0.2,
        roughness: 0.1,
        transparent: true,
        opacity: 0.9,
        envMapIntensity: 1.0
    });
    
    const gem = new THREE.Mesh(gemGeometry, gemMaterial);
    gem.position.y = 0.5;
    ring.add(gem);
    
    // Small decorative elements around the main gem
    for (let i = 0; i < 8; i++) {
        const smallGemGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const smallGemMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, // White for small gems
            metalness: 0.5,
            roughness: 0.1
        });
        
        const smallGem = new THREE.Mesh(smallGemGeometry, smallGemMaterial);
        const angle = (i / 8) * Math.PI * 2;
        smallGem.position.set(
            Math.cos(angle) * 1.5,
            Math.sin(angle) * 1.5,
            0.5
        );
        smallGem.scale.set(0.5, 0.5, 0.5);
        ring.add(smallGem);
    }
    
    // Position the ring nicely in view
    ring.rotation.x = Math.PI / 4;
    
    // Remove loading indicator
    if (container.contains(loadingElement)) {
        container.removeChild(loadingElement);
    }
    
    // Animation function
    const animate = () => {
        requestAnimationFrame(animate);
        
        ring.rotation.y += 0.01;  // Simple rotation
        controls.update();
        renderer.render(scene, camera);
    };
    
    // Start animation
    animate();
};