import { PenTool, FileText, FileCode, Brain } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-12 md:py-20 lg:py-24 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Your brand voice, documented
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Everything you need to maintain consistent communication
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-8 lg:grid-cols-2 lg:gap-12">
          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <PenTool className="h-8 w-8 text-primary" />
              <div className="space-y-1">
                <h3 className="text-xl font-bold">A clear tone of voice</h3>
                <p className="text-muted-foreground">
                  Define your brand's personality with specific traits and
                  examples
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <FileText className="h-8 w-8 text-primary" />
              <div className="space-y-1">
                <h3 className="text-xl font-bold">99+ modern content rules</h3>
                <p className="text-muted-foreground">
                  Professional guidelines used by Apple, Spotify, BBC and other
                  leading brands
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <FileCode className="h-8 w-8 text-primary" />
              <div className="space-y-1">
                <h3 className="text-xl font-bold">
                  Instant PDF + Notion-style output
                </h3>
                <p className="text-muted-foreground">
                  Multiple formats ready to share with your team or clients
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Brain className="h-8 w-8 text-primary" />
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Optional AI assistant</h3>
                <p className="text-muted-foreground">
                  Get help applying your style guide to future content
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border bg-background p-2">
            <Tabs defaultValue="formal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="formal">Formal Tone</TabsTrigger>
                <TabsTrigger value="friendly">Friendly Tone</TabsTrigger>
                <TabsTrigger value="funny">Funny Tone</TabsTrigger>
              </TabsList>
              <TabsContent value="formal" className="p-4 space-y-4">
                <h4 className="font-semibold">Example: Formal Brand Voice</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    "Our comprehensive solution provides organizations with the
                    tools necessary to optimize their content strategy."
                  </p>
                  <p className="text-muted-foreground">
                    "We prioritize precision and clarity in all communications
                    to ensure maximum effectiveness."
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="friendly" className="p-4 space-y-4">
                <h4 className="font-semibold">Example: Friendly Brand Voice</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    "Hey there! Our tool helps you nail your content strategy
                    without the headache."
                  </p>
                  <p className="text-muted-foreground">
                    "We're all about keeping things simple and clear, so you can
                    get back to what you do best."
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="funny" className="p-4 space-y-4">
                <h4 className="font-semibold">Example: Funny Brand Voice</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    "Let's face it, your content strategy is about as organized
                    as a toddler's toy box. We can fix that."
                  </p>
                  <p className="text-muted-foreground">
                    "Our style guide is like GPS for your writing—except it
                    won't lead you into a lake like that one time."
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  );
}
