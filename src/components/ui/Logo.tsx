import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = "h-8", showText = true }: LogoProps) {
  return (
    <div className={`flex items-center group/logo ${showText ? "gap-3" : ""}`}>
      <div className="relative">
        <img 
          src="/logo-clean.png?v=2" 
          alt="3D-Snap" 
          className={`${className} w-auto transition-transform duration-500 group-hover/logo:scale-110 object-contain`}
        />
        <div className="absolute inset-0 bg-[#00aaff]/20 blur-2xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl md:text-2xl font-black tracking-tighter text-white leading-none">
            3D-SNAP
          </span>
          <span className="text-[8px] font-black text-[#00aaff] tracking-[0.2em] uppercase opacity-80">
            Visual Commerce .com
          </span>
        </div>
      )}
    </div>
  );
}
