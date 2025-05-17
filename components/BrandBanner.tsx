import React from "react"

export default function BrandBanner() {
  return (
    <section className="w-full py-10 px-4 bg-gray-50 border-t border-b border-gray-200 shadow-sm flex flex-col items-center">
      <h3 className="text-xs font-medium text-gray-500 mb-8 tracking-widest uppercase text-center">
        Style Guide Rules From
      </h3>
      <div className="w-full max-w-6xl mx-auto flex justify-center items-center">
        {/* Desktop banner */}
        <img
          src="/logos/logobanner1.png"
          alt="Brand Banner Desktop"
          className="hidden md:block w-full h-auto max-h-[100px] object-contain"
        />
        {/* Mobile banner */}
        <img
          src="/logos/logobanner2.png"
          alt="Brand Banner Mobile"
          className="block md:hidden w-full h-auto max-h-[80px] object-contain"
        />
      </div>
    </section>
  )
} 