document.addEventListener('DOMContentLoaded', function() {
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
            months.push({ label: monthNames[m] + ' ' + y, file: photosAvailable[key] ? 'photos/' + key + '.jpeg' : null });
        }
    }

    let currentIndex = 0;
    const monthEl = document.getElementById('galleryMonth');
    const containerEl = document.getElementById('galleryImageContainer');

    function showMonth(i) {
        currentIndex = i;
        const item = months[i];
        monthEl.textContent = item.label;
        if (item.file) {
            containerEl.innerHTML = '<img src="' + item.file + '" alt="' + item.label + ' meetup photo">';
        } else {
            containerEl.innerHTML = '<span class="no-photo">No photo for this month</span>';
        }
    }

    document.getElementById('galleryPrev').addEventListener('click', () => {
        showMonth((currentIndex - 1 + months.length) % months.length);
    });
    document.getElementById('galleryNext').addEventListener('click', () => {
        showMonth((currentIndex + 1) % months.length);
    });

    // Start at most recent photo
    for (let i = months.length - 1; i >= 0; i--) {
        if (months[i].file) { currentIndex = i; break; }
    }
    showMonth(currentIndex);
});