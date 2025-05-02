import Image from "next/image"

export default function CompanyLogosSection() {
  // Company logos data
  const companyLogos = [
    { name: "TechVision" },
    { name: "Elevate Agency" },
    { name: "NexGen Solutions" },
    { name: "Quantum Dynamics" },
    { name: "Horizon Media" },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-8 py-6">
      {companyLogos.map((company, i) => (
        <div
          key={i}
          className="relative h-12 w-32 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0"
        >
          <Image
            src={`/abstract-corporate-logo.png?height=48&width=128&query=company logo ${company.name}`}
            alt={`${company.name} logo`}
            width={128}
            height={48}
            className="object-contain"
          />
        </div>
      ))}
    </div>
  )
}
