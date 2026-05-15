import { Variants } from 'motion/react';

// Shared animation variants for consistency

export const fadeInUp: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

export const fadeIn: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
};

export const scaleIn: Variants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 }
};

export const slideInFromRight: Variants = {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
};

export const slideInFromLeft: Variants = {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 }
};

export const springTransition = {
    type: 'spring',
    stiffness: 400,
    damping: 30
};

export const smoothTransition = {
    duration: 0.3,
    ease: [0.22, 1, 0.36, 1]
};

// Water drop animation
export const dropIn: Variants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.5,
            type: 'spring',
            damping: 25,
            stiffness: 500
        }
    }
};

// Stagger children animation
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

// Easing curves
export const easing = {
    easeInOut: [0.22, 1, 0.36, 1],
    easeOut: [0, 0, 0.2, 1],
    easeIn: [0.4, 0, 1, 1],
    sharp: [0.4, 0, 0.6, 1]
};
