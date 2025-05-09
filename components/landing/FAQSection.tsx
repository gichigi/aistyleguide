export function FAQSection() {
  const faqs = [
    {
      q: "What if I don't have a brand yet?",
      a: "No problem! Our tool can help you define your brand voice from scratch. Just answer a few questions about your target audience and goals.",
    },
    {
      q: "Can I edit the output?",
      a: "Yes! After we generate your style guide, you can review and edit any section before downloading the final version. You can also regenerate specific sections if needed.",
    },
    {
      q: "Is this better than hiring a writer?",
      a: "Our AI tool provides a comprehensive starting point in minutes instead of weeks. While professional writers offer customized expertise, our tool delivers 90% of what most brands need at a fraction of the cost.",
    },
    {
      q: "How is this different from other tools?",
      a: "Unlike generic templates or complex brand management platforms, we focus exclusively on creating practical, actionable style guides with specific rules and examples tailored to your brand.",
    },
    {
      q: "How long does it take to generate a style guide?",
      a: "Most style guides are generated in under 2 minutes. You can then review and make any adjustments before downloading the final version.",
    },
    {
      q: "Can I share my style guide with my team?",
      a: "You can download your style guide in multiple formats (PDF, Markdown, DOCX, HTML) and share it with your entire team. You'll also receive a permanent access link via email.",
    },
    {
      q: "Do you offer refunds if I'm not satisfied?",
      a: "Yes, we offer a 14-day money-back guarantee. If you're not completely satisfied with your style guide, contact our support team for a full refund.",
    },
    {
      q: "Can I update my style guide later?",
      a: "Yes! Your purchase includes unlimited revisions. You can come back anytime to update your brand details and regenerate your style guide as your brand evolves.",
    },
  ];
  return (
    <section id="faq" className="w-full py-12 md:py-20 lg:py-24 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Got questions?
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              We've got answers
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl divide-y py-8">
          {faqs.map((item, i) => (
            <div key={i} className="py-6">
              <h3 className="text-lg font-semibold">{item.q}</h3>
              <p className="mt-2 text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
