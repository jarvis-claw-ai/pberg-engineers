document.addEventListener('DOMContentLoaded', function() {
    // Utility: convert a month label like "September 2024" to a file path like "photos/September2024.jpeg"
    function monthLabelToPath(label) {
        return 'photos/' + label.replace(' ', '') + '.jpeg';
    }

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

    // Load photos data and initialize hero background + gallery
    fetch('data/photos.json')
        .then(res => res.json())
        .then(function(photoLabels) {
            const months = photoLabels.map(label => ({
                label: label,
                file: monthLabelToPath(label)
            }));

            // Hero background cycling
            const heroPhotos = months.map(m => m.file);
            const heroBg = document.getElementById('heroBg');
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

            // Photo Gallery
            let currentIndex = months.length - 1;
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

            showMonth(currentIndex);
        });

    // Load talks data and populate the table
    fetch('data/talks.json')
        .then(res => res.json())
        .then(function(talks) {
            const tbody = document.getElementById('talksBody');
            talks.forEach(function(talk) {
                const tr = document.createElement('tr');
                const tdMonth = document.createElement('td');
                const tdSpeaker = document.createElement('td');
                const tdTopic = document.createElement('td');
                tdMonth.textContent = talk.month;
                tdSpeaker.textContent = talk.speaker;
                tdTopic.textContent = talk.topic;
                tr.appendChild(tdMonth);
                tr.appendChild(tdSpeaker);
                tr.appendChild(tdTopic);
                tbody.appendChild(tr);
            });
        });
});
