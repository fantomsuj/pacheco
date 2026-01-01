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

// Utility: Detect mobile devices
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth < 768;

// Utility: Detect reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Navigation scroll effect (throttled)
const nav = document.querySelector('nav');
const handleScroll = throttle(() => {
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
}, 16); // ~60fps

window.addEventListener('scroll', handleScroll, { passive: true });

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
const ctx = canvas.getContext('2d');
let particles = [];
let mouseX = 0;
let mouseY = 0;
let animationId;
let colorTime = 0;

// Performance state management
let isPageVisible = !document.hidden;
let isCanvasVisible = true;
let isAnimating = false;
let mouseTrackingEnabled = true;

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
        // Mouse interaction
        let dx = mouseX - this.x;
        let dy = mouseY - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = 150;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = forceDirectionX * force * this.density * 0.5;
        let directionY = forceDirectionY * force * this.density * 0.5;

        if (distance < maxDistance) {
            this.x -= directionX;
            this.y -= directionY;
        } else {
            // Gentle floating motion
            this.x += this.vx;
            this.y += this.vy;
            
            // Boundary check
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
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

function animate() {
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
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
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

canvasObserver.observe(document.querySelector('.hero'));

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
    const hour = new Date().getHours();
    const sunsetAtmosphere = document.querySelector('.sunset-atmosphere');
    
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
    const delay = 15000 + Math.random() * 30000;
    setTimeout(() => {
        triggerSunbeam();
        scheduleSunbeam();
    }, delay);
}

// Start sunbeam effect after initial page load
setTimeout(scheduleSunbeam, 5000);

// Handle resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resizeCanvas();
        init();
    }, 250);
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handling
document.querySelector('.cta-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const button = e.target.querySelector('button');
    const originalText = button.textContent;
    button.textContent = 'Submitting...';
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = 'Request Received ✓';
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
            e.target.reset();
        }, 2000);
    }, 1500);
});

// Newsletter form
document.querySelector('.footer-newsletter').addEventListener('submit', (e) => {
    e.preventDefault();
    const button = e.target.querySelector('button');
    button.textContent = 'Subscribed ✓';
    setTimeout(() => {
        button.textContent = 'Subscribe';
        e.target.querySelector('input').value = '';
    }, 2000);
});

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
