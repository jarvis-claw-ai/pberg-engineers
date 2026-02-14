// Smooth scroll animation observer
document.addEventListener('DOMContentLoaded', function() {
    // Simple AOS implementation
    const animatedElements = document.querySelectorAll('[data-aos]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // Navbar background opacity on scroll
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        if (scrolled > 100) {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
            navbar.style.backdropFilter = 'blur(20px)';
        } else {
            navbar.style.background = 'rgba(15, 23, 42, 0.9)';
            navbar.style.backdropFilter = 'blur(20px)';
        }
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add staggered animation delays for gallery items
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
    });

    // Add staggered animation delays for talk cards
    const talkCards = document.querySelectorAll('.talk-card');
    talkCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });

    // Add staggered animation delays for community cards
    const communityCards = document.querySelectorAll('.community-card');
    communityCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });

    // Parallax effect for hero background
    const hero = document.querySelector('.hero');
    const heroDecoration = document.querySelector('.hero-decoration');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.3;
        
        if (heroDecoration) {
            heroDecoration.style.transform = `translateY(${rate}px)`;
        }
    });

    // Add hover effects to external links
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    externalLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add pulse effect to CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button');
    ctaButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.animation = 'pulse 0.6s ease-in-out';
        });
        
        button.addEventListener('animationend', function() {
            this.style.animation = '';
        });
    });

    // Gallery image lazy loading enhancement
    const galleryImages = document.querySelectorAll('.gallery-item img');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.style.opacity = '0';
                img.addEventListener('load', function() {
                    img.style.transition = 'opacity 0.5s ease';
                    img.style.opacity = '1';
                });
                imageObserver.unobserve(img);
            }
        });
    });

    galleryImages.forEach(img => {
        imageObserver.observe(img);
    });

    // Add typing animation to hero title
    const heroTitle = document.querySelector('.hero-title .gradient-text');
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                heroTitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        };
        
        setTimeout(typeWriter, 500);
    }

    // Add interactive hover effects to talk cards
    talkCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            // Add subtle rotation
            this.style.transform = 'translateY(-5px) rotateX(5deg)';
            this.style.transformStyle = 'preserve-3d';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) rotateX(0deg)';
        });
    });

    // Add floating animation to hero circles
    const circles = document.querySelectorAll('.circle');
    circles.forEach((circle, index) => {
        circle.style.animationDelay = `${index * 2}s`;
        circle.style.animationDuration = `${6 + index * 2}s`;
    });

    // Performance optimization: reduce animations on smaller screens
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleMediaQuery = (e) => {
        const elements = document.querySelectorAll('.circle, .floating-circles');
        elements.forEach(el => {
            if (e.matches) {
                el.style.animation = 'none';
            } else {
                el.style.animation = '';
            }
        });
    };
    
    handleMediaQuery(mediaQuery);
    mediaQuery.addListener(handleMediaQuery);
});

// Add custom CSS animation keyframes via JavaScript
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
    }
`;
document.head.appendChild(style);