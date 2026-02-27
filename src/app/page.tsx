"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefcaseBusiness, UserRoundSearch, MessagesSquare } from "lucide-react";

const CYCLE_PHRASES = [
  "To Get More\nWork Done",
  "To Promote\nFaster",
  "To Switch\nJobs",
];

export default function Home() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % CYCLE_PHRASES.length);
        setVisible(true);
      }, 400); // wait for fade-out then swap + fade in
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
      {/* Hero Section */}
      <section className="text-center space-y-6 pb-16 pt-8 md:pb-24">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Free AI Tools for Employees
          <span
            style={{
              color: "#055149",
              transition: "opacity 0.4s ease",
              opacity: visible ? 1 : 0,
              display: "block",
            }}
          >
            {CYCLE_PHRASES[phraseIndex]}
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
          Generate professional buzzwords, optimize your Linkedin profile, and craft
          powerful negotiation messages in seconds.
        </p>
        <div className="pt-4 mt-8 flex justify-center gap-4">
          <Button
            size="lg"
            className="rounded-full px-8 shadow-md hover:shadow-lg transition-all text-white hover:opacity-90"
            style={{ backgroundColor: "#055149" }}
            asChild
          >
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
              <div className="h-12 w-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "#05514915" }}>
                <BriefcaseBusiness className="h-6 w-6" style={{ color: "#055149" }} />
              </div>
              <CardTitle>Corporate Buzzword Generator</CardTitle>
              <CardDescription className="text-base pt-2">
                Transform simple work statements into Corporate-Level Achievement Bullets.
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
              <div className="h-12 w-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "#05514915" }}>
                <UserRoundSearch className="h-6 w-6" style={{ color: "#055149" }} />
              </div>
              <CardTitle>Linkedin profile Optimizer</CardTitle>
              <CardDescription className="text-base pt-2">
                Improve your Linkedin profile with AI and Get More Messages from Recruiters
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/linkedin-optimizer">Open Tool →</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Tool Card 3 */}
          <Card className="hover:shadow-xl transition-shadow bg-card/80 backdrop-blur-sm border-white/20 dark:border-white/10 flex flex-col justify-between">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "#05514915" }}>
                <MessagesSquare className="h-6 w-6" style={{ color: "#055149" }} />
              </div>
              <CardTitle>Workplace Communication Assistant</CardTitle>
              <CardDescription className="text-base pt-2">
                Tired of Excuses from your team? Write with Authority &amp; Get things done
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/negotiation-generator">Open Tool →</Link>
              </Button>
            </CardFooter>
          </Card>

        </div>
      </section>
    </main>
  );
}
