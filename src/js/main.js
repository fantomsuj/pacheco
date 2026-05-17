// Lenis smooth scroll
import '../styles/style.css';
import Lenis from 'lenis';

// Check for reduced motion preference early
const prefersReducedMotionEarly = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth < 768;
const deviceMemory = 'deviceMemory' in navigator ? navigator.deviceMemory : Infinity;
const hasLimitedHardware = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
    || deviceMemory <= 4;
const shouldUseLiteMotion = prefersReducedMotionEarly || isMobile || hasLimitedHardware;

const lenis = new Lenis({
    duration: shouldUseLiteMotion ? 0.5 : 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth exponential ease
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: !shouldUseLiteMotion,
    wheelMultiplier: 1,
    touchMultiplier: 2,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Hero parallax elements
const heroSection = document.querySelector('.hero');
const heroContent = document.querySelector('.hero-content');
const heroSunsetAtmosphere = document.querySelector('.sunset-atmosphere');
const heroCanvas = document.querySelector('.hero-canvas');

// Utility: Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

const analyticsDebug = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

let analyticsLoaded = false;
let nonCriticalFontsLoaded = false;

function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;
    import('./analytics.js').catch((error) => {
        analyticsLoaded = false;
        if (analyticsDebug) {
            console.warn(error);
        }
    });
}

function loadNonCriticalFonts() {
    if (nonCriticalFontsLoaded) return;
    nonCriticalFontsLoaded = true;
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Manrope:wght@300;500&family=JetBrains+Mono:wght@400;500&display=swap';
    document.head.appendChild(fontLink);
}

function scheduleDeferredResources() {
    const loadDeferredResources = () => {
        loadAnalytics();
        loadNonCriticalFonts();
    };

    const triggerOnce = () => {
        loadDeferredResources();
        window.removeEventListener('pointerdown', triggerOnce);
        window.removeEventListener('keydown', triggerOnce);
        window.removeEventListener('touchstart', triggerOnce);
        window.removeEventListener('scroll', triggerOnce);
    };

    window.addEventListener('pointerdown', triggerOnce, { passive: true, once: true });
    window.addEventListener('keydown', triggerOnce, { once: true });
    window.addEventListener('touchstart', triggerOnce, { passive: true, once: true });
    window.addEventListener('scroll', triggerOnce, { passive: true, once: true });

    const idleLoad = () => loadDeferredResources();
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(idleLoad, { timeout: 3000 });
    } else {
        setTimeout(idleLoad, 2500);
    }
}

scheduleDeferredResources();

// Analytics Helper - Track events (wrapper for GA4)
function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
    }
    if (analyticsDebug) {
        console.log('Analytics Event:', eventName, params);
    }
}

// Utility: Detect reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Navigation scroll effect (throttled)
const nav = document.querySelector('nav');
const handleScroll = throttle(() => {
    if (!nav) return;
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
}, 16); // ~60fps

if (nav) {
    window.addEventListener('scroll', handleScroll, { passive: true });
}

// Mobile menu toggle
const mobileMenu = document.querySelector('.mobile-menu');
const navLinks = document.querySelector('.nav-links');
let isMenuOpen = false;

function toggleMobileMenu() {
    if (!mobileMenu || !navLinks) return;
    isMenuOpen = !isMenuOpen;
    mobileMenu.classList.toggle('active', isMenuOpen);
    navLinks.classList.toggle('mobile-open', isMenuOpen);
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    // Update ARIA attribute for accessibility
    mobileMenu.setAttribute('aria-expanded', isMenuOpen.toString());
}

if (mobileMenu && navLinks) {
    mobileMenu.addEventListener('click', toggleMobileMenu);

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (isMenuOpen) toggleMobileMenu();
        });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMenuOpen) toggleMobileMenu();
    });
}

// Update aria-expanded attribute
function updateMobileMenuAria() {
    mobileMenu.setAttribute('aria-expanded', isMenuOpen.toString());
}

// ====================
// PARALLAX EFFECTS
// ====================
const parallaxElements = document.querySelectorAll('[data-parallax]');
let ticking = false;
let isHeroVisible = true;
let parallaxListenerActive = false;

function updateParallax() {
    if (shouldUseLiteMotion || !isHeroVisible) return;

    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const updates = [];

    parallaxElements.forEach(element => {
        const rect = element.getBoundingClientRect();

        // Only apply parallax when element is in or near viewport
        if (rect.top < viewportHeight && rect.bottom > 0) {
            const elementTop = rect.top + scrollY;
            const elementCenter = elementTop + rect.height / 2;
            const viewportCenter = scrollY + viewportHeight / 2;
            const speed = parseFloat(element.dataset.speed) || 0.2;
            const distance = (viewportCenter - elementCenter) * speed;

            updates.push({
                element,
                transform: `translateY(${distance}px)`,
            });
        }
    });

    if (heroSection) {
        const heroHeight = heroSection.offsetHeight;
        const scrollProgress = Math.min(scrollY / heroHeight, 1);

        // Only apply hero wrapper movement while the hero is near the viewport.
        if (scrollY < heroHeight * 1.5) {
            if (heroContent) {
                updates.push({
                    element: heroContent,
                    transform: `translateY(${scrollY * 0.3}px)`,
                    opacity: `${1 - scrollProgress * 0.8}`,
                });
            }

            if (heroSunsetAtmosphere) {
                updates.push({
                    element: heroSunsetAtmosphere,
                    transform: `translateY(${scrollY * 0.15}px) scale(${1 + scrollProgress * 0.1})`,
                });
            }

            if (heroCanvas) {
                updates.push({
                    element: heroCanvas,
                    transform: `translateY(${scrollY * 0.2}px)`,
                });
            }
        }
    }

    updates.forEach(({ element, transform, opacity }) => {
        if (element.style.transform !== transform) {
            element.style.transform = transform;
        }
        if (opacity !== undefined && element.style.opacity !== opacity) {
            element.style.opacity = opacity;
        }
    });

    ticking = false;
}

function onParallaxScroll() {
    if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
    }
}

function enableParallaxListener() {
    if (parallaxListenerActive || shouldUseLiteMotion) return;
    window.addEventListener('scroll', onParallaxScroll, { passive: true });
    parallaxListenerActive = true;
}

function disableParallaxListener() {
    if (!parallaxListenerActive) return;
    window.removeEventListener('scroll', onParallaxScroll);
    parallaxListenerActive = false;
}

// Only enable parallax for devices using the full motion profile.
if (!shouldUseLiteMotion) {
    enableParallaxListener();
    // Initial call
    updateParallax();
}

// Intersection Observer for reveal animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 100);
        }
    });
}, observerOptions);

function observeRevealElements(root = document) {
    root.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

observeRevealElements();

// Quiet atmospheric canvas for the hero background.
const canvas = document.getElementById('heroCanvas');
const ctx = canvas?.getContext?.('2d');
let atmosphereParticles = [];
let animationId;
let frameTime = 0;

// Performance state management
let isPageVisible = !document.hidden;
let isCanvasVisible = true;
let isAnimating = false;
const shouldUseLightEffects = shouldUseLiteMotion;

if (shouldUseLightEffects && heroCanvas) {
    heroCanvas.style.display = 'none';
}

function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

class AtmosphereParticle {
    constructor() {
        this.reset(true);
    }

    reset(randomizeX = false) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.x = randomizeX ? Math.random() * width : width + Math.random() * 80;
        this.y = height * (0.12 + Math.random() * 0.62);
        this.length = 24 + Math.random() * 96;
        this.width = 0.45 + Math.random() * 0.85;
        this.alpha = 0.026 + Math.random() * 0.052;
        this.speed = 0.035 + Math.random() * 0.085;
        this.drift = (Math.random() - 0.5) * 0.018;
        this.phase = Math.random() * Math.PI * 2;
        this.warmth = Math.random();
    }

    update() {
        this.x -= this.speed;
        this.y += Math.sin(frameTime * 0.014 + this.phase) * 0.012 + this.drift;

        if (this.x + this.length < -80) {
            this.reset();
        }
    }

    draw() {
        const pulse = 0.72 + Math.sin(frameTime * 0.012 + this.phase) * 0.18;
        const color = this.warmth > 0.48 ? '212, 165, 116' : '245, 240, 235';
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.length, this.y);
        gradient.addColorStop(0, `rgba(${color}, 0)`);
        gradient.addColorStop(0.45, `rgba(${color}, ${this.alpha * pulse})`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.width;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.length, this.y + Math.sin(this.phase) * 3);
        ctx.stroke();
    }
}

class DustMote {
    constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.size = Math.random() * 2 + 1;
        this.alpha = 0.018 + Math.random() * 0.032;
        this.speed = 0.01 + Math.random() * 0.028;
        this.phase = Math.random() * Math.PI * 2;
    }

    update() {
        this.x -= this.speed;
        this.y += Math.sin(frameTime * 0.01 + this.phase) * 0.015;

        if (this.x < -10) {
            this.x = window.innerWidth + Math.random() * 40;
            this.y = Math.random() * window.innerHeight;
        }
    }

    draw() {
        const pulse = 0.75 + Math.sin(frameTime * 0.008 + this.phase) * 0.18;
        ctx.fillStyle = `rgba(245, 240, 235, ${this.alpha * pulse})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function init() {
    if (!canvas || !ctx) return;
    if (shouldUseLightEffects) {
        atmosphereParticles = [];
        return;
    }

    atmosphereParticles = [];
    const width = window.innerWidth;
    const height = window.innerHeight;
    const fieldCount = prefersReducedMotion ? 8 : Math.min(Math.round((width * height) / 52000), 34);
    const dustCount = prefersReducedMotion ? 10 : Math.min(Math.round((width * height) / 90000), 22);

    for (let i = 0; i < fieldCount; i++) {
        atmosphereParticles.push(new AtmosphereParticle());
    }

    for (let i = 0; i < dustCount; i++) {
        atmosphereParticles.push(new DustMote());
    }
}

function renderStaticFrame() {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    atmosphereParticles.forEach(particle => {
        particle.draw();
    });
}

function animate() {
    if (!canvas || !ctx) {
        isAnimating = false;
        return;
    }

    if (prefersReducedMotion || shouldUseLightEffects) {
        renderStaticFrame();
        isAnimating = false;
        return;
    }

    // Only animate if page is visible and canvas is in viewport
    if (!isPageVisible || !isCanvasVisible) {
        isAnimating = false;
        return;
    }
    
    isAnimating = true;
    frameTime += 1;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    atmosphereParticles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    animationId = requestAnimationFrame(animate);
}

// Start animation only when conditions are met
function startAnimation() {
    if (!canvas || !ctx) return;
    if (prefersReducedMotion || shouldUseLightEffects) {
        renderStaticFrame();
        return;
    }
    if (!isAnimating && isPageVisible && isCanvasVisible) {
        animate();
    }
}

// Stop animation and cancel frame
function stopAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    isAnimating = false;
}

// Page Visibility API - pause animations when tab is hidden
document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    
    if (isPageVisible && isCanvasVisible) {
        if (isHeroVisible) enableParallaxListener();
        startAnimation();
        startSunsetIntensityUpdates();
    } else {
        disableParallaxListener();
        stopAnimation();
        stopSunsetIntensityUpdates();
    }
});

// Intersection Observer - pause canvas when scrolled out of view
const canvasObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        isCanvasVisible = entry.isIntersecting;
        isHeroVisible = entry.isIntersecting;

        if (!isHeroVisible) {
            ticking = false;
            disableParallaxListener();
        } else if (isPageVisible) {
            enableParallaxListener();
        }
        
        if (isCanvasVisible && isPageVisible) {
            startAnimation();
            startSunsetIntensityUpdates();
        } else {
            stopAnimation();
            stopSunsetIntensityUpdates();
        }
    });
}, { threshold: 0.1 });

if (heroSection && canvas && ctx) {
    canvasObserver.observe(heroSection);
} else {
    isCanvasVisible = false;
    isHeroVisible = false;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopAnimation();
    stopSunsetIntensityUpdates();
    canvasObserver.disconnect();
});

// Initialize
resizeCanvas();
init();
startAnimation();

// Time-aware sunset intensity
function updateSunsetIntensity() {
    if (!isPageVisible || !isHeroVisible) return;
    const sunsetAtmosphere = document.querySelector('.sunset-atmosphere');
    if (!sunsetAtmosphere) return;

    const hour = new Date().getHours();
    
    // Peak intensity during golden hour (5pm - 8pm)
    let intensity = 1;
    if (hour >= 17 && hour <= 20) {
        // Golden hour - maximum intensity
        intensity = 1.3;
    } else if (hour >= 6 && hour <= 9) {
        // Dawn - warm but softer
        intensity = 1.1;
    } else if (hour >= 21 || hour <= 5) {
        // Night - subtle
        intensity = 0.7;
    }
    
    sunsetAtmosphere.style.opacity = intensity;
    sunsetAtmosphere.style.filter = `saturate(${0.8 + intensity * 0.4})`;
}

let sunsetIntervalId = null;

function startSunsetIntensityUpdates() {
    if (sunsetIntervalId || !isPageVisible || !isHeroVisible) return;
    updateSunsetIntensity();
    sunsetIntervalId = setInterval(updateSunsetIntensity, 300000);
}

function stopSunsetIntensityUpdates() {
    if (!sunsetIntervalId) return;
    clearInterval(sunsetIntervalId);
    sunsetIntervalId = null;
}

// Start visual timers
startSunsetIntensityUpdates();

// Handle resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resizeCanvas();
        init();
        if (prefersReducedMotion) {
            renderStaticFrame();
        }
    }, 250);
});

function getAnchorScrollOffset() {
    const nav = document.querySelector('nav');
    return nav ? -(nav.offsetHeight + 16) : 0;
}

// Smooth scroll for navigation links (using Lenis)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href) return;

        e.preventDefault();

        if (href === '#') {
            lenis.scrollTo(0, {
                offset: 0,
                duration: prefersReducedMotion ? 0 : 1,
            });
            return;
        }

        const target = document.querySelector(href);
        if (!target) return;

        lenis.scrollTo(target, {
            offset: getAnchorScrollOffset(),
            duration: prefersReducedMotion ? 0 : 1.5,
        });
    });
});

// ====================
// FORM VALIDATION
// ====================

// Validation rules
const validators = {
    name: {
        validate: (value) => value.trim().length >= 2,
        message: 'Please enter your full name (at least 2 characters)'
    },
    email: {
        validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Please enter a valid email address'
    },
    organization: {
        validate: (value) => value.trim().length >= 2,
        message: 'Please enter your organization name'
    }
};

// Show error for a field
function showError(input, errorElement, message) {
    input.classList.add('invalid');
    input.classList.remove('valid');
    errorElement.textContent = message;
    errorElement.classList.add('visible');
    input.setAttribute('aria-invalid', 'true');
}

// Clear error for a field
function clearError(input, errorElement) {
    input.classList.remove('invalid');
    input.classList.add('valid');
    errorElement.textContent = '';
    errorElement.classList.remove('visible');
    input.setAttribute('aria-invalid', 'false');
}

// Validate a single field
function validateField(input, validatorKey) {
    const errorElement = document.getElementById(`${validatorKey === 'organization' ? 'org' : validatorKey}-error`);
    const validator = validators[validatorKey];

    if (!validator || !errorElement) return true;

    const value = input.value;

    if (!value.trim()) {
        showError(input, errorElement, `This field is required`);
        return false;
    }

    if (!validator.validate(value)) {
        showError(input, errorElement, validator.message);
        return false;
    }

    clearError(input, errorElement);
    return true;
}

// Contact form validation and submission
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const orgInput = document.getElementById('contact-org');
    const successMessage = document.getElementById('form-success');
    const errorMessage = document.getElementById('form-error');

    // Real-time validation on blur
    nameInput?.addEventListener('blur', () => validateField(nameInput, 'name'));
    emailInput?.addEventListener('blur', () => validateField(emailInput, 'email'));
    orgInput?.addEventListener('blur', () => validateField(orgInput, 'organization'));

    // Clear error on input
    [nameInput, emailInput, orgInput].forEach(input => {
        input?.addEventListener('input', () => {
            const errorId = input.getAttribute('aria-describedby');
            const errorElement = document.getElementById(errorId);
            if (input.classList.contains('invalid') && errorElement) {
                input.classList.remove('invalid');
                errorElement.classList.remove('visible');
            }
        });
    });

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate all fields (with null checks to prevent runtime errors)
        const isNameValid = nameInput ? validateField(nameInput, 'name') : false;
        const isEmailValid = emailInput ? validateField(emailInput, 'email') : false;
        const isOrgValid = orgInput ? validateField(orgInput, 'organization') : false;

        if (!isNameValid || !isEmailValid || !isOrgValid) {
            // Focus the first invalid field
            const firstInvalid = contactForm.querySelector('.invalid');
            firstInvalid?.focus();

            // Track validation failure
            trackEvent('form_validation_error', {
                form_name: 'contact_form',
                fields_invalid: [
                    !isNameValid && 'name',
                    !isEmailValid && 'email',
                    !isOrgValid && 'organization'
                ].filter(Boolean)
            });
            return;
        }

        const button = e.target.querySelector('button[type="submit"]');
        const originalText = button?.textContent || 'Request Assessment';
        if (button) {
            button.textContent = 'Submitting...';
            button.disabled = true;
        }
        if (successMessage) successMessage.hidden = true;
        if (errorMessage) errorMessage.hidden = true;

        // Track form submission
        trackEvent('form_submit', {
            form_name: 'contact_form',
            form_destination: 'assessment_request'
        });

        try {
            const formData = new FormData(contactForm);
            const res = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: { Accept: 'application/json' }
            });

            if (res.ok) {
                // Show success message
                contactForm.style.display = 'none';
                if (successMessage) successMessage.hidden = false;

                // Track successful submission
                trackEvent('form_submit_success', {
                    form_name: 'contact_form'
                });

                // Reset form after delay
                setTimeout(() => {
                    if (button) {
                        button.textContent = originalText;
                        button.disabled = false;
                    }
                    contactForm.reset();
                    contactForm.style.display = 'grid';
                    if (successMessage) successMessage.hidden = true;

                    // Clear validation states
                    [nameInput, emailInput, orgInput].forEach(input => {
                        input?.classList.remove('valid', 'invalid');
                    });
                }, 5000);
                return;
            }

            if (errorMessage) errorMessage.hidden = false;
            trackEvent('form_submit_error', {
                form_name: 'contact_form',
                status: res.status
            });
        } catch (error) {
            if (errorMessage) errorMessage.hidden = false;
            trackEvent('form_submit_error', {
                form_name: 'contact_form',
                error: error?.message || 'network_error'
            });
        }

        if (button) {
            button.textContent = originalText;
            button.disabled = false;
        }
    });
}

// Newsletter form with validation
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('newsletter-email');
        const button = e.target.querySelector('button');
        const email = emailInput.value.trim();

        // Validate email
        if (!validators.email.validate(email)) {
            emailInput.classList.add('invalid');
            emailInput.focus();
            trackEvent('newsletter_validation_error');
            return;
        }

        emailInput.classList.remove('invalid');
        button.textContent = 'Subscribing...';
        button.disabled = true;

        // Track newsletter signup
        trackEvent('newsletter_signup', {
            form_location: 'footer'
        });

        // Simulate API call
        setTimeout(() => {
            button.textContent = 'Subscribed ✓';
            trackEvent('newsletter_signup_success');

            setTimeout(() => {
                button.textContent = 'Subscribe';
                button.disabled = false;
                emailInput.value = '';
            }, 2000);
        }, 1000);
    });
}

// Dynamic footer year
const footerText = document.querySelector('.footer-bottom p');
if (footerText) {
    const currentYear = new Date().getFullYear();
    footerText.textContent = footerText.textContent.replace('2024', currentYear);
}

// Magnetic button effect for primary CTA
const magneticButtons = document.querySelectorAll('.btn-primary');
magneticButtons.forEach(button => {
    button.addEventListener('mousemove', (e) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translate(0, 0)';
    });

    // Track CTA clicks
    button.addEventListener('click', () => {
        trackEvent('cta_click', {
            button_text: button.textContent.trim(),
            button_location: button.closest('section')?.id || 'unknown'
        });
    });
});

// Track secondary button clicks
document.querySelectorAll('.btn-secondary').forEach(button => {
    button.addEventListener('click', () => {
        trackEvent('cta_click', {
            button_text: button.textContent.trim(),
            button_type: 'secondary',
            button_location: button.closest('section')?.id || 'unknown'
        });
    });
});

// Track navigation clicks
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        trackEvent('navigation_click', {
            link_text: link.textContent.trim(),
            link_href: link.getAttribute('href')
        });
    });
});

// Track phone number clicks
document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', () => {
        trackEvent('phone_click', {
            phone_location: link.closest('section')?.id || 'footer'
        });
    });
});

// Staggered animation for service cards
const serviceCards = document.querySelectorAll('.service-card');
const serviceObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 150);
        }
    });
}, { threshold: 0.2 });

serviceCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    serviceObserver.observe(card);
});

// Counter animation for metrics
const metricValues = document.querySelectorAll('.metric-value');
const metricObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const element = entry.target;
            const text = element.textContent;
            const hasPlus = text.includes('+');
            const hasPercent = text.includes('%');
            const hasDollar = text.includes('$');
            const hasB = text.includes('B');
            
            let endValue = parseFloat(text.replace(/[^0-9.]/g, ''));
            let startValue = 0;
            let duration = 2000;
            let startTime = null;

            function animate(currentTime) {
                if (!startTime) startTime = currentTime;
                const progress = Math.min((currentTime - startTime) / duration, 1);
                const easeProgress = 1 - Math.pow(1 - progress, 4);
                const currentValue = startValue + (endValue - startValue) * easeProgress;
                
                let displayValue = currentValue.toFixed(currentValue < 10 ? 1 : 0);
                if (hasDollar) displayValue = '$' + displayValue;
                if (hasB) displayValue += 'B';
                if (hasPlus) displayValue += '+';
                if (hasPercent) displayValue += '%';
                
                element.textContent = displayValue;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            }
            
            requestAnimationFrame(animate);
            metricObserver.unobserve(element);
        }
    });
}, { threshold: 0.5 });

metricValues.forEach(value => metricObserver.observe(value));

// ====================
// ANALYTICS TRACKING
// ====================

// Track scroll depth
const scrollMilestones = [25, 50, 75, 100];
const reachedMilestones = new Set();

const trackScrollDepth = throttle(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);

    scrollMilestones.forEach(milestone => {
        if (scrollPercent >= milestone && !reachedMilestones.has(milestone)) {
            reachedMilestones.add(milestone);
            trackEvent('scroll_depth', {
                percent: milestone
            });
        }
    });
}, 500);

window.addEventListener('scroll', trackScrollDepth, { passive: true });

// Track section visibility
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            if (sectionId) {
                trackEvent('section_view', {
                    section_id: sectionId,
                    section_name: entry.target.getAttribute('aria-label') ||
                                 entry.target.querySelector('h2')?.textContent || sectionId
                });
            }
            // Only track once per section
            sectionObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

// Observe all major sections
document.querySelectorAll('section[id]').forEach(section => {
    sectionObserver.observe(section);
});

// Track time on page
let pageLoadTime = Date.now();
window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);
    const maxReached = reachedMilestones.size ? Math.max(...reachedMilestones) : 0;
    trackEvent('page_exit', {
        time_on_page_seconds: timeOnPage,
        scroll_depth_reached: maxReached
    });
});
