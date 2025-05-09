export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="w-full py-12 md:py-20 lg:py-24 bg-background"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              From input to impact in 3 steps
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Generate a comprehensive style guide with just a few clicks
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-8 lg:grid-cols-3 lg:gap-12">
          <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-xl font-bold">Answer a few questions</h3>
            <p className="text-center text-muted-foreground">
              Tell us about your brand or let our AI extract details from your
              website
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-xl font-bold">Get personalized rules</h3>
            <p className="text-center text-muted-foreground">
              Receive a tailored tone of voice + 99+ writing rules for your
              brand
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-xl font-bold">Export and share</h3>
            <p className="text-center text-muted-foreground">
              Download as PDF, Markdown, or integrate with your workflow
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
