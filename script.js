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

    // 1. Auto-scroll from landing page to wipe section
    gsap.to(window, {
        scrollTo: ".scroll-container",
        duration: 2.5,
        delay: 1.5,
        ease: "power2.inOut",
        onComplete: () => {
            // Start the slow continuous auto-scroll behavior
            startAutoScroll();
        }
    });

    const sections = gsap.utils.toArray(".comparisonSection");
    const container = document.querySelector(".scroll-container");

    // Set initial states
    sections.forEach((section, i) => {
        gsap.set(section, { autoAlpha: i === 0 ? 1 : 0, zIndex: i });
    });

    // 2. Wipe Timeline - linked to ScrollTrigger for manual "friendly" scroll control
    // scrub: 1 allows the user to scroll back and forth to see sections again
    const wipeTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".scroll-container",
            pin: true,
            start: "top top",
            end: "+=" + (sections.length * 250) + "%", // Longer scroll area for slower feel
            scrub: 1.5, // Smooth scrubbing
            pinSpacing: true,
            id: "wipe-trigger"
        }
    });

    sections.forEach((section, i) => {
        if (i === 0) return;

        const isRightToLeft = i % 2 !== 0;
        const img = section.querySelector(".afterImage img");
        const text = section.querySelector(".text-overlay-container");

        const containerStart = isRightToLeft ? 100 : -100;
        const imageStart = isRightToLeft ? -100 : 100;

        // Transitions - slightly increased duration for "premium" feel
        wipeTl.set(section, { autoAlpha: 1 })
            .fromTo(section, { xPercent: containerStart }, { xPercent: 0, duration: 3 })
            .fromTo(img, { xPercent: imageStart }, { xPercent: 0, duration: 3 }, "<")
            .fromTo(text, { xPercent: imageStart, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 3 }, "<")
            .to({}, { duration: 1.5 }); // Hold section view
    });

    // 3. Continuous Auto-Scroll Logic with Interaction Handling
    let autoScrollTween;
    let resumeTimeout;

    function startAutoScroll() {
        const st = ScrollTrigger.getById("wipe-trigger");
        if (!st) return;

        const startPos = st.start;
        const endPos = st.end;

        // Animate the scroll position automatically (faster speed)
        autoScrollTween = gsap.fromTo(window, 
            { scrollTo: startPos },
            {
                scrollTo: endPos,
                duration: sections.length * 4.5, // Even faster auto-scroll
                ease: "none",
                repeat: -1,
                yoyo: true,
                paused: false,
                overwrite: "auto"
            }
        );

        // Interaction listeners
        window.addEventListener("wheel", handleUserInteraction);
        window.addEventListener("touchstart", handleUserInteraction);
        
        // Mouse leave screen/window behavior
        document.addEventListener("mouseleave", () => {
             // If mouse leaves the browser window, ensure it starts after a delay
             resumeAutoScroll(1000);
        });
    }

    function handleUserInteraction() {
        if (autoScrollTween) {
            autoScrollTween.pause();
            resumeAutoScroll(1000); // Resume after 1 second of no manual interaction
        }
    }

    function resumeAutoScroll(delay) {
        clearTimeout(resumeTimeout);
        resumeTimeout = setTimeout(() => {
            if (autoScrollTween && !isMouseOverContainer()) {
                autoScrollTween.play();
            }
        }, delay);
    }

    function isMouseOverContainer() {
        // Simple flag check or just rely on mouseenter/mouseleave
        return container.matches(':hover');
    }

    // Hover logic for the scroll-container
    container.addEventListener("mouseenter", () => {
        if (autoScrollTween) {
            autoScrollTween.pause();
            clearTimeout(resumeTimeout);
        }
    });

    container.addEventListener("mouseleave", () => {
        resumeAutoScroll(1000); // Resume 1 second after leaving the container
    });
});
