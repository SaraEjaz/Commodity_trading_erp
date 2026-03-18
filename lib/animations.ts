import gsap from 'gsap';

export const animations = {
  // Card entrance animation
  cardEntrance: (element: HTMLElement | null, delay = 0) => {
    if (!element) return;
    gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay,
        ease: 'power3.out',
      }
    );
  },

  // Stagger cards animation
  staggerCards: (elements: HTMLElement[], staggerDelay = 0.1) => {
    gsap.fromTo(
      elements,
      {
        opacity: 0,
        y: 20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: staggerDelay,
        ease: 'power3.out',
      }
    );
  },

  // Number counter animation
  counterAnimation: (element: HTMLElement | null, endValue: number, duration = 1) => {
    if (!element) return;
    const obj = { value: 0 };
    gsap.to(obj, {
      value: endValue,
      duration,
      onUpdate: () => {
        element.textContent = Math.round(obj.value).toLocaleString();
      },
      ease: 'power2.out',
    });
  },

  // Page transition
  pageTransition: (element: HTMLElement | null) => {
    gsap.fromTo(
      element,
      {
        opacity: 0,
      },
      {
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
      }
    );
  },

  // Sidebar slide
  sidebarSlide: (element: HTMLElement | null, isOpen: boolean) => {
    if (!element) return;
    gsap.to(element, {
      x: isOpen ? 0 : -300,
      duration: 0.4,
      ease: 'power3.out',
    });
  },

  // Table row highlight
  rowHighlight: (element: HTMLElement | null) => {
    if (!element) return;
    gsap.fromTo(
      element,
      {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
      {
        backgroundColor: 'rgba(59, 130, 246, 0)',
        duration: 1,
        delay: 0.2,
      }
    );
  },

  // Modal entrance
  modalEntrance: (modalElement: HTMLElement | null, overlayElement: HTMLElement | null) => {
    if (modalElement) {
      gsap.fromTo(
        modalElement,
        {
          opacity: 0,
          scale: 0.9,
          y: -50,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.3,
          ease: 'back.out(1.7)',
        }
      );
    }

    if (overlayElement) {
      gsap.fromTo(
        overlayElement,
        {
          opacity: 0,
        },
        {
          opacity: 1,
          duration: 0.2,
        }
      );
    }
  },

  // Modal exit
  modalExit: (modalElement: HTMLElement | null, overlayElement: HTMLElement | null) => {
    if (modalElement) {
      gsap.to(modalElement, {
        opacity: 0,
        scale: 0.9,
        y: -50,
        duration: 0.2,
      });
    }

    if (overlayElement) {
      gsap.to(overlayElement, {
        opacity: 0,
        duration: 0.2,
      });
    }
  },

  // Pulse animation
  pulse: (element: HTMLElement | null) => {
    if (!element) return;
    gsap.to(element, {
      boxShadow: '0 0 0 15px rgba(59, 130, 246, 0)',
      duration: 1.5,
      repeat: -1,
      ease: 'power2.out',
    });
  },

  // Bounce animation
  bounce: (element: HTMLElement | null) => {
    if (!element) return;
    gsap.to(element, {
      y: -10,
      duration: 0.4,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
    });
  },

  // Fade in
  fadeIn: (element: HTMLElement | null, duration = 0.4) => {
    if (!element) return;
    gsap.fromTo(
      element,
      { opacity: 0 },
      { opacity: 1, duration, ease: 'power2.out' }
    );
  },

  // Fade out
  fadeOut: (element: HTMLElement | null, duration = 0.4) => {
    if (!element) return;
    gsap.to(element, { opacity: 0, duration, ease: 'power2.out' });
  },

  // Slide in from left
  slideInLeft: (element: HTMLElement | null, duration = 0.5) => {
    if (!element) return;
    gsap.fromTo(
      element,
      { x: -100, opacity: 0 },
      { x: 0, opacity: 1, duration, ease: 'power3.out' }
    );
  },

  // Slide in from right
  slideInRight: (element: HTMLElement | null, duration = 0.5) => {
    if (!element) return;
    gsap.fromTo(
      element,
      { x: 100, opacity: 0 },
      { x: 0, opacity: 1, duration, ease: 'power3.out' }
    );
  },
};
