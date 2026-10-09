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

// Formspree AJAX submission — keeps the user on the page, shows inline status
document.querySelectorAll('form[data-formspree]').forEach(f => {
    const status = f.querySelector('[data-form-status]');
    const btn = f.querySelector('button[type="submit"]');
    const originalBtnHTML = btn ? btn.innerHTML : '';

    const setStatus = (msg, kind) => {
        if (!status) return;
        status.textContent = msg;
        status.style.display = 'block';
        status.style.color = kind === 'ok' ? '#2ecc71'
                           : kind === 'err' ? '#ff6b6b'
                           : 'var(--rcm-text-muted)';
    };

    f.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (btn) { btn.disabled = true; btn.innerHTML = 'Sending…'; }
        setStatus('Sending your enquiry…', 'info');

        try {
            const res = await fetch(f.action, {
                method: 'POST',
                body: new FormData(f),
                headers: { 'Accept': 'application/json' }
            });

            if (res.ok) {
                // Meta Pixel: count a successful enquiry as a Lead
                if (typeof fbq === 'function') fbq('track', 'Lead', { content_name: 'Contact form' });
                f.reset();
                setStatus('✓ Thanks — we got it. The team will reply within 2 hours.', 'ok');
                if (btn) btn.innerHTML = 'Sent ✓';
                setTimeout(() => { if (btn) { btn.innerHTML = originalBtnHTML; btn.disabled = false; } }, 4000);
            } else {
                const data = await res.json().catch(() => ({}));
                const msg = (data.errors && data.errors.map(e => e.message).join(', ')) || 'Something went wrong. Please email grow@rollercoastermedia.com instead.';
                setStatus('✗ ' + msg, 'err');
                if (btn) { btn.innerHTML = originalBtnHTML; btn.disabled = false; }
            }
        } catch (err) {
            setStatus('✗ Network error. Please email grow@rollercoastermedia.com instead.', 'err');
            if (btn) { btn.innerHTML = originalBtnHTML; btn.disabled = false; }
        }
    });
});

// Meta Pixel: count Calendly and WhatsApp clicks as Contact events
document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || typeof fbq !== 'function') return;
    if (a.href.includes('calendly.com')) fbq('track', 'Contact', { content_name: 'Calendly' });
    else if (a.href.includes('wa.me')) fbq('track', 'Contact', { content_name: 'WhatsApp' });
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
        // Clear placeholder content (play button, overlay text, and the thumbnail image)
        thumb.querySelectorAll('.play-btn, .video-quote, .video-tag, .video-thumb-img').forEach(el => el.remove());

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
