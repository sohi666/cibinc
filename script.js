/* ==========================================================================
   CIBINC

   Everything here is optional. The previous version queried `.hero h1`, which
   exists only on the home page, and threw on the other six -- taking every
   handler registered after it down with it, including the contact form. So
   each feature below checks for its own markup and returns quietly when the
   page does not have it.
   ========================================================================== */

(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var css = getComputedStyle(document.documentElement);
    var token = function (name, fallback) {
        return (css.getPropertyValue(name) || '').trim() || fallback;
    };

    /* ----------------------------------------------------------------------
       Mobile navigation
       ---------------------------------------------------------------------- */

    (function nav() {
        var hamburger = document.querySelector('.hamburger');
        var links = document.querySelector('.nav-links');
        if (!hamburger || !links) return;

        hamburger.setAttribute('role', 'button');
        hamburger.setAttribute('tabindex', '0');
        hamburger.setAttribute('aria-label', 'Menu');
        hamburger.setAttribute('aria-expanded', 'false');

        var toggle = function () {
            var open = links.classList.toggle('is-open');
            hamburger.classList.toggle('active', open);
            hamburger.setAttribute('aria-expanded', String(open));
        };

        hamburger.addEventListener('click', toggle);
        hamburger.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });

        // Close after following a link, or the menu stays over the destination.
        links.addEventListener('click', function (e) {
            if (e.target.tagName === 'A') {
                links.classList.remove('is-open');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }());

    /* ----------------------------------------------------------------------
       Navbar hairline once the page has moved
       ---------------------------------------------------------------------- */

    (function navbarState() {
        var navbar = document.querySelector('.navbar');
        if (!navbar) return;

        var apply = function () { navbar.classList.toggle('is-scrolled', window.scrollY > 24); };
        apply();
        window.addEventListener('scroll', apply, { passive: true });
    }());

    /* ----------------------------------------------------------------------
       Section eyebrows

       Numbered from the headings themselves rather than written into every
       page, so the sequence cannot drift out of step with the markup.
       ---------------------------------------------------------------------- */

    (function eyebrows() {
        var sections = document.querySelectorAll(
            '.about-section, .services-section, .product-section, .services-detail, ' +
            '.tech-platforms, .product-callout, .map-section'
        );
        var n = 0;

        Array.prototype.forEach.call(sections, function (section) {
            var heading = section.querySelector('h2');
            if (!heading || heading.previousElementSibling) return;

            n += 1;
            var label = document.createElement('div');
            label.className = 'section-eyebrow';
            label.textContent = String(n).padStart(2, '0') + ' / ' + heading.textContent.trim();
            label.setAttribute('aria-hidden', 'true');
            heading.parentNode.insertBefore(label, heading);
        });
    }());

    /* ----------------------------------------------------------------------
       Scroll reveal

       The hidden state is added here, never in the HTML, so a browser that
       never runs this file still shows a complete page.
       ---------------------------------------------------------------------- */

    (function reveal() {
        if (reduceMotion || !('IntersectionObserver' in window)) return;

        var targets = document.querySelectorAll(
            '.service-card, .service-item, .tech-item, .platform-item, ' +
            '.product-feature, .product-plan, .product-shot, .contact-item'
        );
        if (!targets.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -40px 0px' });

        Array.prototype.forEach.call(targets, function (el, i) {
            el.classList.add('reveal');
            el.style.transitionDelay = Math.min(i % 6, 5) * 45 + 'ms';
            observer.observe(el);
        });
    }());

    /* ----------------------------------------------------------------------
       Contact form
       ---------------------------------------------------------------------- */

    (function contactForm() {
        var form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var button = form.querySelector('.submit-btn');
            if (!button) return;

            var original = button.textContent;
            button.textContent = 'Message sent';
            button.disabled = true;
            form.reset();

            setTimeout(function () {
                button.textContent = original;
                button.disabled = false;
            }, 3000);
        });
    }());

    /* ----------------------------------------------------------------------
       The hero topology

       Producers publish to a broker, the broker fans out to consumers. It is
       what this company is hired to build, drawn rather than described, and
       the throughput figure beneath it counts packets this canvas has really
       delivered -- so the number on the page is true.
       ---------------------------------------------------------------------- */

    (function topology() {
        var canvas = document.getElementById('flow-canvas');
        if (!canvas || !canvas.getContext) return;

        var ctx = canvas.getContext('2d');
        var deliveredEl = document.querySelector('[data-readout="delivered"]');
        var lagEl = document.querySelector('[data-readout="lag"]');

        var colours = {
            line: token('--line', '#232A38'),
            lineBright: token('--line-bright', '#333D51'),
            surface: token('--surface-2', '#161B26'),
            text: token('--muted', '#8792A6'),
            dim: token('--dim', '#5C6679'),
            accent: token('--accent', '#E0A542'),
            ok: token('--ok', '#4FD1A5')
        };

        var producers = ['orders', 'payments', 'inventory'];
        var consumers = ['ledger', 'search', 'analytics'];
        var nodes = { producers: [], broker: null, consumers: [] };
        var packets = [];
        var delivered = 0;
        var tick = 0;
        var width = 0;
        var height = 0;

        function layout() {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            var rect = canvas.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // The topology lives on the right; the headline owns the left.
            var left = width * 0.52;
            var right = width - 76;
            var mid = width > 760 ? (left + right) / 2 : width * 0.5;
            var cy = height * 0.5;
            var spread = Math.min(height * 0.26, 118);

            nodes.producers = producers.map(function (name, i) {
                return { x: left, y: cy + (i - 1) * spread, label: name };
            });
            nodes.broker = { x: mid, y: cy, label: 'broker' };
            nodes.consumers = consumers.map(function (name, i) {
                return { x: right, y: cy + (i - 1) * spread, label: name };
            });
        }

        function roundRect(x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }

        function drawNode(node, isBroker) {
            var w = isBroker ? 74 : 58;
            var h = isBroker ? 54 : 30;
            var x = node.x - w / 2;
            var y = node.y - h / 2;

            ctx.fillStyle = colours.surface;
            ctx.strokeStyle = isBroker ? colours.lineBright : colours.line;
            ctx.lineWidth = 1;
            roundRect(x, y, w, h, 4);
            ctx.fill();
            ctx.stroke();

            // The broker gets partition ticks: the detail that says which kind
            // of box this is without a word of explanation.
            if (isBroker) {
                ctx.strokeStyle = colours.accent;
                ctx.globalAlpha = 0.5;
                for (var i = 1; i <= 3; i++) {
                    var px = x + (w / 4) * i;
                    ctx.beginPath();
                    ctx.moveTo(px, y + 9);
                    ctx.lineTo(px, y + h - 9);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            }

            ctx.fillStyle = isBroker ? colours.text : colours.dim;
            ctx.font = '500 9px "IBM Plex Mono", ui-monospace, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label.toUpperCase(), node.x, node.y + (isBroker ? h / 2 + 13 : 0));
        }

        function drawEdge(a, b) {
            ctx.strokeStyle = colours.line;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }

        function drawFrame() {
            ctx.clearRect(0, 0, width, height);

            nodes.producers.forEach(function (p) { drawEdge(p, nodes.broker); });
            nodes.consumers.forEach(function (c) { drawEdge(nodes.broker, c); });

            packets.forEach(function (p) {
                var from = p.leg === 0 ? p.producer : nodes.broker;
                var to = p.leg === 0 ? nodes.broker : p.consumer;
                var x = from.x + (to.x - from.x) * p.t;
                var y = from.y + (to.y - from.y) * p.t;

                ctx.fillStyle = p.leg === 0 ? colours.accent : colours.ok;
                ctx.globalAlpha = 0.9;
                roundRect(x - 2.5, y - 2.5, 5, 5, 1);
                ctx.fill();
                ctx.globalAlpha = 1;
            });

            nodes.producers.forEach(function (p) { drawNode(p, false); });
            nodes.consumers.forEach(function (c) { drawNode(c, false); });
            drawNode(nodes.broker, true);
        }

        function spawn() {
            packets.push({
                producer: nodes.producers[Math.floor(Math.random() * nodes.producers.length)],
                consumer: nodes.consumers[Math.floor(Math.random() * nodes.consumers.length)],
                leg: 0,
                t: 0,
                speed: 0.006 + Math.random() * 0.006
            });
        }

        function step() {
            for (var i = packets.length - 1; i >= 0; i--) {
                var p = packets[i];
                p.t += p.speed;
                if (p.t < 1) continue;

                if (p.leg === 0) {
                    p.leg = 1;
                    p.t = 0;
                } else {
                    packets.splice(i, 1);
                    delivered += 1;
                }
            }

            if (packets.length < 14 && Math.random() < 0.09) spawn();

            // The readout only needs to be legible, not per-frame. Writing to
            // the DOM sixty times a second to animate a number nobody can read
            // that fast is work for no one's benefit.
            if (++tick % 6 === 0) {
                if (deliveredEl) deliveredEl.textContent = delivered.toLocaleString();
                if (lagEl) lagEl.textContent = String(packets.length);
            }

            drawFrame();
            requestAnimationFrame(step);
        }

        layout();

        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () { layout(); drawFrame(); }, 150);
        });

        if (reduceMotion) {
            // Still show the topology, just without anything moving.
            drawFrame();
            if (deliveredEl) deliveredEl.textContent = '—';
            if (lagEl) lagEl.textContent = '0';
            return;
        }

        for (var i = 0; i < 5; i++) spawn();
        requestAnimationFrame(step);
    }());
}());
