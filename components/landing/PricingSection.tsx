import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export function PricingSection() {
  const router = useRouter();
  return (
    <section id="pricing" className="w-full py-12 md:py-20 lg:py-24 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Pay once, use forever
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              No subscriptions or hidden fees
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 py-8 md:grid-cols-3">
          {/* Core Style Guide */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col items-center space-y-4 text-center">
                <h3 className="text-2xl font-bold">Core Style Guide</h3>
                <div className="space-y-1">
                  <p className="text-5xl font-bold">$99</p>
                  <p className="text-sm text-muted-foreground">
                    One-time payment
                  </p>
                </div>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Brand voice definition</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>25 essential writing rules</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Tone guidelines</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Do's and don'ts</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>PDF & Markdown formats</span>
                  </li>
                </ul>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => router.push("/brand-details")}
                >
                  Get Core Guide
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Complete Style Guide */}
          <Card className="relative overflow-hidden border-primary">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background"></div>
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">
              Popular
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col items-center space-y-4 text-center">
                <h3 className="text-2xl font-bold">Complete Style Guide</h3>
                <div className="space-y-1">
                  <p className="text-5xl font-bold">$149</p>
                  <p className="text-sm text-muted-foreground">
                    One-time payment
                  </p>
                </div>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Everything in Core Guide</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>99+ modern writing rules</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Used by Apple, Spotify, BBC</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Formatting standards</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Example corrections</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Unlimited revisions</span>
                  </li>
                </ul>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => router.push("/brand-details")}
                >
                  Get Complete Guide
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Custom Enterprise */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-background dark:from-purple-900/20"></div>
            <div className="absolute top-0 right-0 bg-purple-600 text-primary-foreground px-3 py-1 text-xs font-medium">
              Enterprise
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col items-center space-y-4 text-center">
                <h3 className="text-2xl font-bold">Custom Enterprise</h3>
                <div className="space-y-1">
                  <p className="text-5xl font-bold">Contact</p>
                  <p className="text-sm text-muted-foreground">
                    Custom pricing
                  </p>
                </div>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Everything in Complete Guide</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Custom onboarding</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Team training sessions</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button size="lg" className="w-full" variant="outline" asChild>
                  <Link href="mailto:enterprise@styleguideai.com">
                    Contact Sales
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
