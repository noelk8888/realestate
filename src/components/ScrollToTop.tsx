import { useState, useEffect } from 'react';
import kiuLogo from '../assets/kiu_logo.png';

export const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    // Toggle visibility based on scroll position
    const toggleVisibility = () => {
        if (window.scrollY > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    // Scroll to top smoothly
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    return (
        <>
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-[9999] flex flex-col items-center justify-center p-0 bg-transparent border-none outline-none group transition-transform duration-300 hover:scale-110 active:scale-95"
                    aria-label="Scroll to top"
                >
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#D4AF37] relative bg-black flex items-center justify-center shadow-2xl">
                        {/* Gradient overlay for premium feel */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent pointer-events-none"></div>

                        <img
                            src={kiuLogo}
                            alt="Back to Top"
                            className="w-full h-full object-contain p-1"
                        />
                    </div>
                    <span className="mt-1 text-[10px] font-bold text-gray-700 bg-white/80 px-1.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm border border-gray-200">
                        Back to Top
                    </span>
                </button>
            )}
        </>
    );
};
