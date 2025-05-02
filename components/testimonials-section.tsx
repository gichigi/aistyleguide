import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export default function TestimonialsSection() {
  // Testimonials data
  const testimonials = [
    {
      name: "Michael Chen",
      title: "Content Director",
      company: "TechVision",
      quote:
        "Style Guide AI transformed our content strategy. The brand voice guidelines are spot-on and helped align our entire marketing team.",
    },
    {
      name: "Sophia Rodriguez",
      title: "Brand Manager",
      company: "Elevate Agency",
      quote:
        "The level of detail in our style guide is impressive. It's become our go-to reference for all content creation and has saved us countless hours of editing.",
    },
    {
      name: "James Wilson",
      title: "Startup Founder",
      company: "NexGen Solutions",
      quote:
        "As a startup, we needed to establish our voice quickly. Style Guide AI delivered a comprehensive guide that perfectly captures our brand personality.",
    },
  ]

  // Company logos data
  const companyLogos = [
    { name: "TechVision" },
    { name: "Elevate Agency" },
    { name: "NexGen Solutions" },
    { name: "Quantum Dynamics" },
    { name: "Horizon Media" },
  ]

  return (
    <section className="w-full py-12 md:py-20 lg:py-24 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Trusted by 1,200+ content creators
            </h2>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 py-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {testimonials.map((testimonial, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
                    <Image
                      src={`/confident-professional.png?height=40&width=40&query=professional headshot ${i + 1}`}
                      alt={`${testimonial.name} avatar`}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.title}, {testimonial.company}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-muted-foreground">"{testimonial.quote}"</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
      </div>
    </section>
  )
}
