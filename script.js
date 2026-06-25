/* Roller Coaster Media — shared interactions */

// Mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
}

// Reveal-on-scroll
const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Form: noop / open-sheet handlers
document.querySelectorAll('form[data-noop]').forEach(f => {
    f.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = f.querySelector('button[type="submit"], .btn');
        if (btn) {
            const original = btn.textContent;
            btn.textContent = 'Sent! We\'ll reply in 2 hours.';
            btn.disabled = true;
            setTimeout(() => { btn.textContent = original; btn.disabled = false; f.reset(); }, 3000);
        }
    });
});

// Forms that should open a Google Sheet (or any URL) on submit
document.querySelectorAll('form[data-sheet]').forEach(f => {
    f.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = f.dataset.sheet;
        if (url) window.open(url, '_blank', 'noopener');
        const btn = f.querySelector('button[type="submit"]');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = 'Opening enquiry sheet…';
            btn.disabled = true;
            setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 2500);
        }
    });
});

// Year in footer
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

// Brand slider — shows N at a time, arrow nav, swipe support, progress bar
(function initBrandSlider() {
    const track = document.querySelector('[data-track]');
    if (!track) return;

    const slots = Array.from(track.children);
    const total = slots.length;
    const progressBar = document.querySelector('[data-progress-bar]');
    const buttons = document.querySelectorAll('.slider-btn');

    let index = 0;

    function visibleCount() {
        const w = window.innerWidth;
        if (w <= 540) return 1;
        if (w <= 880) return 2;
        return 3;
    }

    function maxIndex() {
        return Math.max(0, total - visibleCount());
    }

    function update() {
        const n = visibleCount();
        const slotWidth = slots[0].getBoundingClientRect().width;
        const styles = getComputedStyle(slots[0]);
        const marginRight = parseFloat(styles.marginRight) || 0;
        const offset = (slotWidth + marginRight) * index;
        track.style.transform = `translateX(-${offset}px)`;

        // Update arrow disabled states
        buttons.forEach(btn => {
            const dir = parseInt(btn.dataset.dir, 10);
            if (dir < 0) btn.disabled = index <= 0;
            else btn.disabled = index >= maxIndex();
        });

        // Update progress bar
        if (progressBar) {
            const pct = total <= n ? 100 : ((index + n) / total) * 100;
            progressBar.style.width = Math.min(100, pct) + '%';
        }
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const dir = parseInt(btn.dataset.dir, 10);
            index = Math.max(0, Math.min(maxIndex(), index + dir));
            update();
        });
    });

    // Touch swipe
    let touchStart = 0;
    track.addEventListener('touchstart', e => touchStart = e.touches[0].clientX, { passive: true });
    track.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStart;
        if (Math.abs(dx) > 40) {
            index = Math.max(0, Math.min(maxIndex(), index + (dx < 0 ? 1 : -1)));
            update();
        }
    });

    window.addEventListener('resize', () => {
        index = Math.min(index, maxIndex());
        update();
    });

    update();
})();

// Video testimonials — swap thumb for live player on click
// Supports both local video files (data-type="file") and embed URLs (YouTube/Vimeo)
document.querySelectorAll('.video-thumb[data-video]').forEach(thumb => {
    const play = () => {
        const url = thumb.dataset.video;
        const type = thumb.dataset.type;
        // Clear placeholder content
        thumb.querySelectorAll('.play-btn, .video-quote, .video-tag').forEach(el => el.remove());

        let media;
        if (type === 'file' || /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url)) {
            media = document.createElement('video');
            media.src = url;
            media.controls = true;
            media.autoplay = true;
            media.playsInline = true;
            media.style.objectFit = 'cover';
        } else {
            media = document.createElement('iframe');
            media.src = url;
            media.title = 'Client testimonial';
            media.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            media.allowFullscreen = true;
        }
        thumb.appendChild(media);
    };
    thumb.addEventListener('click', play);
    thumb.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
    });
});
