import { CheckCircle } from "lucide-react";

export function WhoItsForSection() {
  return (
    <section className="w-full py-12 md:py-20 lg:py-24 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Perfect for teams who need clarity in communication
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Perfect for teams and individuals who need clear writing guidelines
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 sm:grid-cols-2 gap-6 py-8 md:grid-cols-4 lg:gap-12">
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
            <CheckCircle className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-bold">Copywriters</h3>
            <p className="text-center text-sm text-muted-foreground">
              Create consistent content across projects
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
            <CheckCircle className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-bold">Marketing leads</h3>
            <p className="text-center text-sm text-muted-foreground">
              Align team messaging with brand values
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
            <CheckCircle className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-bold">Founders</h3>
            <p className="text-center text-sm text-muted-foreground">
              Establish your brand voice from day one
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
            <CheckCircle className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-bold">Agencies</h3>
            <p className="text-center text-sm text-muted-foreground">
              Deliver professional guidelines to clients
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
