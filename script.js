document.addEventListener('DOMContentLoaded', function() {
    // Hero background cycling
    const heroPhotos = [
        'photos/September2024.jpeg', 'photos/October2024.jpeg', 'photos/November2024.jpeg',
        'photos/January2025.jpeg', 'photos/February2025.jpeg', 'photos/March2025.jpeg',
        'photos/April2025.jpeg', 'photos/September2025.jpeg', 'photos/October2025.jpeg',
        'photos/November2025.jpeg', 'photos/December2025.jpeg'
    ];
    const heroBg = document.getElementById('heroBg');
    // Pick a random starting photo
    let heroIndex = Math.floor(Math.random() * heroPhotos.length);
    heroBg.style.backgroundImage = 'url(' + heroPhotos[heroIndex] + ')';
    heroBg.classList.add('fade-in');

    setInterval(function() {
        heroBg.classList.remove('fade-in');
        heroBg.classList.add('fade-out');
        setTimeout(function() {
            heroIndex = (heroIndex + 1) % heroPhotos.length;
            heroBg.style.backgroundImage = 'url(' + heroPhotos[heroIndex] + ')';
            heroBg.classList.remove('fade-out');
            heroBg.classList.add('fade-in');
        }, 1500);
    }, 8000);

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 100) {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
        } else {
            navbar.style.background = 'rgba(15, 23, 42, 0.9)';
        }
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
            }
        });
    });

    // Photo Gallery
    const months = [];
    const startYear = 2024, startMonth = 8; // Sep 2024 = index 8
    const endYear = 2025, endMonth = 11; // Dec 2025 = index 11
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const photosAvailable = {
        'September2024': true, 'October2024': true, 'November2024': true,
        'January2025': true, 'February2025': true, 'March2025': true, 'April2025': true,
        'September2025': true, 'October2025': true, 'November2025': true, 'December2025': true
    };

    for (let y = startYear; y <= endYear; y++) {
        const mStart = (y === startYear) ? startMonth : 0;
        const mEnd = (y === endYear) ? endMonth : 11;
        for (let m = mStart; m <= mEnd; m++) {
            const key = monthNames[m] + y;
            if (photosAvailable[key]) {
                months.push({ label: monthNames[m] + ' ' + y, file: 'photos/' + key + '.jpeg' });
            }
        }
    }

    let currentIndex = 0;
    const monthEl = document.getElementById('galleryMonth');
    const containerEl = document.getElementById('galleryImageContainer');

    function showMonth(i) {
        currentIndex = i;
        const item = months[i];
        monthEl.textContent = item.label;
        containerEl.innerHTML = '<img src="' + item.file + '" alt="' + item.label + ' meetup photo">';
    }

    document.getElementById('galleryPrev').addEventListener('click', () => {
        showMonth((currentIndex - 1 + months.length) % months.length);
    });
    document.getElementById('galleryNext').addEventListener('click', () => {
        showMonth((currentIndex + 1) % months.length);
    });

    // Start at most recent photo
    currentIndex = months.length - 1;
    showMonth(currentIndex);
});