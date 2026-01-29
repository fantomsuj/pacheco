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

// Analytics Helper - Track events (wrapper for GA4)
function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
    }
    if (analyticsDebug) {
        console.log('Analytics Event:', eventName, params);
    }
}

// Utility: Detect mobile devices
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth < 768;

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

function updateParallax() {
    if (prefersReducedMotion) return;

    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;

    parallaxElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + scrollY;
        const elementCenter = elementTop + rect.height / 2;
        const viewportCenter = scrollY + viewportHeight / 2;

        // Only apply parallax when element is in or near viewport
        if (rect.top < viewportHeight && rect.bottom > 0) {
            const speed = parseFloat(element.dataset.speed) || 0.2;
            const distance = (viewportCenter - elementCenter) * speed;

            // Apply transform
            element.style.transform = `translateY(${distance}px)`;
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

// Only enable parallax on non-mobile and with no reduced motion preference
if (!isMobile && !prefersReducedMotion) {
    window.addEventListener('scroll', onParallaxScroll, { passive: true });
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

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Interactive particle network on hero canvas with sunset color cycling
const canvas = document.getElementById('heroCanvas');
const ctx = canvas?.getContext?.('2d');
let particles = [];
let mouseX = null;
let mouseY = null;
let animationId;
let colorTime = 0;

// Performance state management
let isPageVisible = !document.hidden;
let isCanvasVisible = true;
let isAnimating = false;
let mouseTrackingEnabled = !prefersReducedMotion;

// Sunset color palette for cycling
const sunsetColors = [
    { r: 255, g: 140, b: 66 },   // Warm orange
    { r: 201, g: 108, b: 77 },   // Terracotta (base accent)
    { r: 212, g: 165, b: 116 },  // Gold
    { r: 255, g: 120, b: 80 },   // Coral
    { r: 180, g: 100, b: 120 },  // Dusty rose
    { r: 156, g: 82, b: 100 },   // Mauve
    { r: 201, g: 108, b: 77 },   // Back to terracotta
];

function interpolateColor(color1, color2, factor) {
    return {
        r: Math.round(color1.r + (color2.r - color1.r) * factor),
        g: Math.round(color1.g + (color2.g - color1.g) * factor),
        b: Math.round(color1.b + (color2.b - color1.b) * factor)
    };
}

function getCurrentSunsetColor(offset = 0) {
    const adjustedTime = (colorTime + offset) % 1;
    const totalSegments = sunsetColors.length - 1;
    const segment = adjustedTime * totalSegments;
    const index = Math.floor(segment);
    const factor = segment - index;
    
    const color1 = sunsetColors[index];
    const color2 = sunsetColors[Math.min(index + 1, sunsetColors.length - 1)];
    
    return interpolateColor(color1, color2, factor);
}

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = Math.random() * 30 + 1;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.colorOffset = Math.random() * 0.3; // Each particle has slight color variation
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update() {
        const maxDistance = 150;

        if (mouseTrackingEnabled && mouseX !== null && mouseY !== null) {
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0 && distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                const directionX = (dx / distance) * force * this.density * 0.5;
                const directionY = (dy / distance) * force * this.density * 0.5;
                this.x -= directionX;
                this.y -= directionY;
                return;
            }
        }

        // Gentle floating motion
        this.x += this.vx;
        this.y += this.vy;

        // Boundary check
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
        const color = getCurrentSunsetColor(this.colorOffset);
        const pulse = 0.5 + 0.3 * Math.sin(colorTime * Math.PI * 4 + this.pulsePhase);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.5 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * (0.8 + pulse * 0.4), 0, Math.PI * 2);
        ctx.fill();
        
        // Add subtle glow for larger particles
        if (this.size > 1.5) {
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.1 + pulse * 0.1})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function init() {
    if (!canvas || !ctx) return;
    particles = [];
    // Optimize particle count based on device and preferences
    let maxParticles = 100;
    let densityFactor = 15000;
    
    if (prefersReducedMotion) {
        maxParticles = 20; // Minimal particles for reduced motion
        densityFactor = 30000;
    } else if (isMobile) {
        maxParticles = 40; // Reduced for mobile performance
        densityFactor = 20000;
    }
    
    const numberOfParticles = Math.min(
        (canvas.width * canvas.height) / densityFactor, 
        maxParticles
    );
    
    for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
    }
}

function connectParticles() {
    if (!ctx) return;
    // Adjust connection distance based on device
    const maxDistance = isMobile ? 100 : 120;
    const maxDistanceSquared = maxDistance * maxDistance; // Avoid sqrt when possible
    
    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            const dx = particles[a].x - particles[b].x;
            const dy = particles[a].y - particles[b].y;
            
            // Early exit: check squared distance first (avoid expensive sqrt)
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared > maxDistanceSquared) continue;
            
            const distance = Math.sqrt(distanceSquared);
            const opacity = 1 - (distance / maxDistance);
            
            // Blend between the two particles' colors
            const colorA = getCurrentSunsetColor(particles[a].colorOffset);
            const colorB = getCurrentSunsetColor(particles[b].colorOffset);
            const avgColor = interpolateColor(colorA, colorB, 0.5);
            
            ctx.strokeStyle = `rgba(${avgColor.r}, ${avgColor.g}, ${avgColor.b}, ${opacity * 0.25})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
        }
    }
}

function renderStaticFrame() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => {
        particle.draw();
    });
    connectParticles();
}

function animate() {
    if (!canvas || !ctx) {
        isAnimating = false;
        return;
    }

    if (prefersReducedMotion) {
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update color time (complete cycle every 20 seconds)
    colorTime = (colorTime + 0.0008) % 1;
    
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    
    connectParticles();
    animationId = requestAnimationFrame(animate);
}

// Start animation only when conditions are met
function startAnimation() {
    if (!canvas || !ctx) return;
    if (prefersReducedMotion) {
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

// Mouse tracking (conditional based on animation state)
const handleMouseMove = (e) => {
    if (mouseTrackingEnabled && isAnimating) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
};

const handleTouchMove = (e) => {
    if (mouseTrackingEnabled && isAnimating) {
        const touch = e.touches && e.touches[0];
        if (!touch) return;
        mouseX = touch.clientX;
        mouseY = touch.clientY;
    }
};

document.addEventListener('mousemove', handleMouseMove, { passive: true });
document.addEventListener('touchmove', handleTouchMove, { passive: true });

// Page Visibility API - pause animations when tab is hidden
document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    
    if (isPageVisible && isCanvasVisible) {
        startAnimation();
    } else {
        stopAnimation();
    }
});

// Intersection Observer - pause canvas when scrolled out of view
const canvasObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        isCanvasVisible = entry.isIntersecting;
        
        if (isCanvasVisible && isPageVisible) {
            startAnimation();
        } else {
            stopAnimation();
        }
    });
}, { threshold: 0.1 });

const heroSection = document.querySelector('.hero');
if (heroSection && canvas && ctx) {
    canvasObserver.observe(heroSection);
} else {
    isCanvasVisible = false;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopAnimation();
    canvasObserver.disconnect();
});

// Initialize
resizeCanvas();
init();
startAnimation();

// Time-aware sunset intensity
function updateSunsetIntensity() {
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

// Update on load and every 5 minutes
updateSunsetIntensity();
setInterval(updateSunsetIntensity, 300000);

// Occasional sunbeam flash effect
function triggerSunbeam() {
    const sunbeam = document.querySelector('.sunbeam-flash');
    if (!sunbeam || prefersReducedMotion) return;
    sunbeam.classList.remove('active');
    
    // Force reflow
    void sunbeam.offsetWidth;
    
    sunbeam.classList.add('active');
    
    // Remove class after animation completes
    setTimeout(() => {
        sunbeam.classList.remove('active');
    }, 3000);
}

// Trigger sunbeam randomly between 15-45 seconds
function scheduleSunbeam() {
    if (prefersReducedMotion || !document.querySelector('.sunbeam-flash')) return;
    const delay = 15000 + Math.random() * 30000;
    setTimeout(() => {
        triggerSunbeam();
        scheduleSunbeam();
    }, delay);
}

// Start sunbeam effect after initial page load
if (!prefersReducedMotion) {
    setTimeout(scheduleSunbeam, 5000);
}

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

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href) return;

        if (href === '#') {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
            return;
        }

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'start'
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

    contactForm.addEventListener('submit', (e) => {
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
        const originalText = button.textContent;
        button.textContent = 'Submitting...';
        button.disabled = true;

        // Collect form data
        const formData = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            organization: orgInput.value.trim()
        };

        // Track form submission
        trackEvent('form_submit', {
            form_name: 'contact_form',
            form_destination: 'assessment_request'
        });

        // Simulate API call (replace with actual backend integration)
        setTimeout(() => {
            // Show success message
            contactForm.style.display = 'none';
            successMessage.hidden = false;

            // Track successful submission
            trackEvent('form_submit_success', {
                form_name: 'contact_form'
            });

            // Reset form after delay
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
                contactForm.reset();
                contactForm.style.display = 'grid';
                successMessage.hidden = true;

                // Clear validation states
                [nameInput, emailInput, orgInput].forEach(input => {
                    input?.classList.remove('valid', 'invalid');
                });
            }, 5000);
        }, 1500);
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
