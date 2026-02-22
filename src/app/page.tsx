import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefcaseBusiness, UserRoundSearch, MessagesSquare } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
      {/* Hero Section */}
      <section className="text-center space-y-6 pb-16 pt-8 md:pb-24">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
          Upgrade Your Career Profile With AI
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
          Generate professional buzzwords, optimize your LinkedIn profile, and craft powerful negotiation messages in seconds.
        </p>
        <div className="pt-4 mt-8 flex justify-center gap-4">
          <Button size="lg" className="rounded-full px-8 shadow-md hover:shadow-lg transition-all" asChild>
            <Link href="#tools">Try Free Tools</Link>
          </Button>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="space-y-8 scroll-mt-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Tool Card 1 */}
          <Card className="hover:shadow-xl transition-shadow bg-card/80 backdrop-blur-sm border-white/20 dark:border-white/10 flex flex-col justify-between">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BriefcaseBusiness className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Professional Buzzword Generator</CardTitle>
              <CardDescription className="text-base pt-2">
                Transform simple work statements into executive-level achievement bullets.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/buzzword-generator">Open Tool →</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Tool Card 2 */}
          <Card className="hover:shadow-xl transition-shadow bg-card/80 backdrop-blur-sm border-white/20 dark:border-white/10 flex flex-col justify-between">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <UserRoundSearch className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>LinkedIn Profile Optimizer</CardTitle>
              <CardDescription className="text-base pt-2">
                Improve your headline, summary, and experience section with AI.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild disabled>
                <Link href="/linkedin-optimizer">Coming Soon</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Tool Card 3 */}
          <Card className="hover:shadow-xl transition-shadow bg-card/80 backdrop-blur-sm border-white/20 dark:border-white/10 flex flex-col justify-between">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessagesSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Negotiation Message Generator</CardTitle>
              <CardDescription className="text-base pt-2">
                Generate confident and strategic salary or promotion requests.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild disabled>
                <Link href="/negotiation-generator">Coming Soon</Link>
              </Button>
            </CardFooter>
          </Card>

        </div>
      </section>
    </main>
  );
}
