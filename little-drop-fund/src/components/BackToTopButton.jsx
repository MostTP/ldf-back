// src/components/BackToTopButton.jsx 
// Renamed to match the import in App.jsx (formerly BackToTop)
import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTopButton(){
 const [visible, setVisible] = useState(false);

 useEffect(()=> {
 const onScroll = () => {
        // Show the button after scrolling down 400px (matches your original threshold)
        setVisible(window.scrollY > 400); 
    };
 window.addEventListener("scroll", onScroll);
 return () => window.removeEventListener("scroll", onScroll);
 }, []);

 // Use your original logic to conditionally render the component
 if(!visible) return null;
 
 return (
 <button 
 onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} 
 aria-label="Back to top" // Added accessibility label
 className="
            fixed right-6 bottom-8 
            bg-[--emerald] text-white 
            p-3 rounded-full 
            shadow-xl hover:scale-105 
            transition duration-300 z-50
        "
 >
 <ArrowUp size={20}/> {/* Slightly increased size for better visibility */}
 </button>
 );
}