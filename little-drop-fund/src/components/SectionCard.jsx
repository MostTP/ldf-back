// src/components/SectionCard.jsx
import React from 'react';

/**
 * A reusable container component for consistent styling across sections.
 * It applies a standard white background, rounded corners, shadow, and padding.
 * @param {string} props.className - Additional Tailwind classes for customization.
 * @param {React.ReactNode} props.children - The content to be wrapped.
 * @param {string} props.borderEmphasis - Optional: 'left' or 'top' to add a primary color border.
 */
export default function SectionCard({ children, className = '', borderEmphasis }) {
    
    // Base styles applied to all cards
    let baseStyles = "bg-white rounded-xl shadow-lg transition-transform hover:shadow-xl duration-300";
    
    // Handle border emphasis
    if (borderEmphasis === 'left') {
        baseStyles += " border-l-4 border-l-[--emerald]";
    } else if (borderEmphasis === 'top') {
        baseStyles += " border-t-4 border-t-[--emerald]";
    } else {
        baseStyles += " border border-gray-100"; // Default subtle border
    }

    return (
        <div className={`${baseStyles} ${className}`}>
            {children}
        </div>
    );
}