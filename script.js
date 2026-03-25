document.addEventListener("DOMContentLoaded", function () {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    // Initial Hero Animation
    const heroTl = gsap.timeline();
    heroTl.from(".hero-left > *", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out"
    });

    const sections = gsap.utils.toArray(".comparisonSection");

    // Set initial states
    sections.forEach((section, i) => {
        gsap.set(section, { autoAlpha: i === 0 ? 1 : 0, zIndex: i });
    });

    // 2. Wipe Timeline - linked to ScrollTrigger for manual "friendly" scroll control
    const wipeTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".scroll-container",
            pin: true,
            start: "top top",
            end: "+=" + (sections.length * 250) + "%",
            scrub: 1, // Faster response for "neat" feel
            pinSpacing: true,
            id: "wipe-trigger",
            snap: {
                snapTo: 1 / (sections.length - 1),
                duration: { min: 0.2, max: 0.6 },
                delay: 0.1,
                ease: "power1.inOut"
            }
        }
    });

    sections.forEach((section, i) => {
        if (i === 0) return;

        const isRightToLeft = i % 2 !== 0;
        const img = section.querySelector(".afterImage img");
        const text = section.querySelector(".text-overlay-container");

        const containerStart = isRightToLeft ? 100 : -100;
        const imageStart = isRightToLeft ? -100 : 100;

        wipeTl.set(section, { autoAlpha: 1 })
            .fromTo(section, { xPercent: containerStart }, { xPercent: 0, duration: 3 })
            .fromTo(img, { xPercent: imageStart }, { xPercent: 0, duration: 3 }, "<")
            .fromTo(text, { xPercent: imageStart }, { xPercent: 0, duration: 3 }, "<")
            .to({}, { duration: 1.5 });
    });

    // 3. Continuous Auto-Scroll Logic with Interaction Handling
    let autoScrollTween;
    let resumeTimeout;
    let initialScrollTween;
    let isYoyoBack = false;

    function startAutoScroll() {
        const st = ScrollTrigger.getById("wipe-trigger");
        if (!st) return;

        const startPos = 0; // Starts from intro page
        const endPos = ScrollTrigger.maxScroll(window); // Ends at footer
        const currentPos = window.scrollY;

        // If very close to end, switch direction
        if (Math.abs(currentPos - endPos) < 15) isYoyoBack = true;
        if (Math.abs(currentPos - startPos) < 15) isYoyoBack = false;

        const target = isYoyoBack ? startPos : endPos;
        const distanceLeft = Math.abs(currentPos - target);
        const totalDistance = Math.abs(endPos - startPos);
        const baseDuration = (sections.length + 2) * 7; // Adjusted for full page length

        const duration = (distanceLeft / totalDistance) * baseDuration;

        if (autoScrollTween) autoScrollTween.kill();

        autoScrollTween = gsap.to(window, {
            scrollTo: target,
            duration: Math.max(duration, 0.5),
            ease: "none",
            onComplete: () => {
                isYoyoBack = !isYoyoBack;
                // Hold for 2 seconds at the ends (especially footer)
                gsap.delayedCall(2, startAutoScroll);
            }
        });

        // Ensure global listeners are active
        if (!window.hasAutoScrollListeners) {
            window.addEventListener("wheel", handleUserInteraction);
            window.addEventListener("touchstart", handleUserInteraction);
            document.addEventListener("mouseleave", () => resumeAutoScroll(1000));
            window.hasAutoScrollListeners = true;
        }
    }

    // Change Resume Check logic: Resume only if mouse is NOT in the window
    let isMouseInWindow = false;

    function handleUserInteraction() {
        if (autoScrollTween) {
            autoScrollTween.pause();
            clearTimeout(resumeTimeout);
        }
        // Kill any pending auto-scroll start from a "hold" delay
        gsap.killTweensOf(startAutoScroll);

        if (initialScrollTween) {
            initialScrollTween.kill();
        }
    }

    function resumeAutoScroll(delay) {
        clearTimeout(resumeTimeout);
        resumeTimeout = setTimeout(() => {
            // Only resume if mouse is actually outside the browser window
            if (!isMouseInWindow) {
                startAutoScroll();
            }
        }, delay);
    }

    // New Global Window Listeners for Hover-Stop
    document.addEventListener("mouseenter", () => {
        isMouseInWindow = true;
        handleUserInteraction();
    });

    document.addEventListener("mouseleave", () => {
        isMouseInWindow = false;
        resumeAutoScroll(1000);
    });

    document.addEventListener("mousemove", () => {
        // Any movement within the screen also ensures it's stopped/pushed back
        isMouseInWindow = true;
        handleUserInteraction();
    });

    // Handle touch separately to allow auto-scroll on touch devices once interaction stops
    document.addEventListener("touchstart", () => {
        handleUserInteraction();
        // Touch doesn't mean mouse is in window
        setTimeout(() => resumeAutoScroll(2500), 100);
    });

    // Initial scroll from landing (Ultra Smooth Transition)
    initialScrollTween = gsap.to(window, {
        scrollTo: { y: ".scroll-container", autoKill: true },
        duration: 4, // More deliberate and smooth
        delay: 3,    // Allow user to read the hero section first
        ease: "power2.inOut",
        onComplete: () => {
            ScrollTrigger.refresh(); // Ensure footer position is recalculated
            if (!isMouseInWindow) {
                startAutoScroll();
            }
        }
    });

});
