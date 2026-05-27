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

// Form noop submit
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

// Year in footer
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
