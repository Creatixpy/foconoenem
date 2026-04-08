'use client';

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth/context";
import { AccountLinkButton } from "./components/ui";

type Highlight = {
  title: string;
  description: string;
  icon: ReactNode;
};

type Step = {
  number: string;
  title: string;
  description: string;
};

type Testimonial = {
  author: string;
  role: string;
  quote: string;
};

const heroStats = [
  { value: "8,5k+", label: "ESSAYS GRADED" },
  { value: "1,2k+", label: "QUESTS UPDATED" },
  { value: "88%", label: "LEVEL UP RATE" },
];

const highlights: Highlight[] = [
  {
    title: "AI-POWERED FEEDBACK",
    description: "Receive instant grading based on the 5 official criteria. No loading times.",
    icon: "🤖",
  },
  {
    title: "CUSTOM QUESTS",
    description: "Build rapid-fire simulation blocks for the subjects you need to grind.",
    icon: "⚔️",
  },
  {
    title: "PLAYER STATS",
    description: "Track XP, accuracy, and weak spots in a centralized dashboard.",
    icon: "📊",
  },
  {
    title: "PATCH NOTES",
    description: "Stay updated with curated news about deadlines and official rule changes.",
    icon: "📜",
  },
];

const steps: Step[] = [
  {
    number: "01",
    title: "CHOOSE YOUR MISSION",
    description: "Select between Essay Writing, Full Simulation, or Quick Fire questions.",
  },
  {
    number: "02",
    title: "GRIND & LEARN",
    description: "Use our clean editor and get immediate feedback on your performance.",
  },
  {
    number: "03",
    title: "LEVEL UP",
    description: "Analyze your stats, fix your mistakes, and boost your score.",
  },
];

const testimonials: Testimonial[] = [
  {
    author: "Gabriela S.",
    role: "MEDICINE STUDENT",
    quote: "I turned short feedbacks into real goals. Went from 720 to 960 XP!",
  },
  {
    author: "Diego M.",
    role: "GUILD MASTER (TEACHER)",
    quote: "I use the stats to decide what to raid (teach) next in class.",
  },
  {
    author: "Larissa M.",
    role: "ROOKIE PLAYER",
    quote: "The short alerts keep me updated without breaking my focus streak.",
  },
];

export default function HomePageClient() {
  useAuth();
  return (
    <main className="flex-grow bg-background">
      {/* HERO SECTION */}
      <section
        id="home-hero"
        className="relative overflow-hidden px-4 py-20 lg:py-32 border-b-4 border-foreground"
        aria-labelledby="home-hero-heading"
      >
        <div className="container relative z-10 mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 border-2 border-foreground bg-card-bg px-3 py-1 text-xs font-pixel text-foreground shadow-[4px_4px_0px_var(--foreground)]">
              <span className="h-2 w-2 bg-success animate-pulse" />
              SERVER STATUS: ONLINE (7H - 23H30)
            </div>
            <div className="space-y-6">
              <h1
                id="home-hero-heading"
                className="font-pixel text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight"
              >
                TURN STUDYING INTO <span className="text-primary">HIGHSCORES</span>.
              </h1>
              <p className="max-w-xl text-lg font-mono text-foreground/80">
                Fast grading, custom simulations, and critical alerts. Study only what matters to beat the Boss (ENEM).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/redacao" className="btn btn-primary text-sm px-6 py-4 shadow-[4px_4px_0px_var(--foreground)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_var(--foreground)]">
                START WRITING
              </Link>
              <Link href="/questoes" className="btn btn-outline gap-2 text-sm px-6 py-4 bg-card-bg shadow-[4px_4px_0px_var(--foreground)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_var(--foreground)]">
                EXPLORE QUESTS
              </Link>
            </div>

            <dl className="grid grid-cols-3 gap-4 pt-8 border-t-2 border-foreground/20">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <dd className="text-xl sm:text-2xl font-pixel text-primary">{stat.value}</dd>
                  <dt className="text-[10px] sm:text-xs font-pixel text-foreground/60 mt-1">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          {/* RETRO UI MOCKUP */}
          <div className="hidden lg:block relative">
             <div className="bg-card-bg border-4 border-foreground p-2 shadow-[8px_8px_0px_var(--foreground)]">
                <div className="bg-muted-bg border-2 border-foreground p-4 mb-4">
                   <div className="flex justify-between items-center mb-4">
                      <span className="font-pixel text-xs text-foreground">PLAYER STATS</span>
                      <span className="h-3 w-3 bg-success rounded-full border border-foreground"></span>
                   </div>
                   {/* Fake Stat Bars */}
                   <div className="space-y-4 font-mono text-xs">
                      <div>
                         <div className="flex justify-between mb-1">
                            <span>COMPETENCE 1</span>
                            <span>200/200</span>
                         </div>
                         <div className="h-4 border-2 border-foreground bg-white relative">
                            <div className="absolute top-0 left-0 h-full bg-success w-full"></div>
                         </div>
                      </div>
                      <div>
                         <div className="flex justify-between mb-1">
                            <span>COMPETENCE 2</span>
                            <span>180/200</span>
                         </div>
                         <div className="h-4 border-2 border-foreground bg-white relative">
                            <div className="absolute top-0 left-0 h-full bg-primary w-[90%]"></div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-muted-bg border-2 border-foreground p-4">
                    <div className="flex justify-between items-center mb-2">
                       <span className="font-pixel text-xs">CURRENT QUEST</span>
                       <span className="font-mono text-xs text-primary animate-pulse">ACTIVE</span>
                    </div>
                    <p className="font-mono text-sm mb-2">Math & Logic Simulation</p>
                    <div className="h-4 border-2 border-foreground bg-white relative">
                        <div className="absolute top-0 left-0 h-full bg-accent w-[80%]"></div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 px-4 bg-muted-bg border-b-4 border-foreground">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-pixel text-2xl sm:text-3xl text-foreground">INVENTORY & SKILLS</h2>
            <p className="font-mono text-foreground/70 max-w-2xl mx-auto">
              Equip yourself with the best tools to conquer the exam.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {highlights.map((highlight) => (
              <div key={highlight.title} className="bg-card-bg border-2 border-foreground p-6 shadow-[4px_4px_0px_var(--foreground)] hover:-translate-y-1 transition-transform">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{highlight.icon}</div>
                  <div>
                    <h3 className="font-pixel text-sm text-primary mb-2">{highlight.title}</h3>
                    <p className="font-mono text-sm text-foreground/80">{highlight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METHODOLOGY SECTION */}
      <section id="methodology" className="py-20 px-4 bg-background border-b-4 border-foreground">
        <div className="container mx-auto max-w-6xl">
           <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                 <h2 className="font-pixel text-2xl sm:text-3xl text-foreground mb-6">WALKTHROUGH GUIDE</h2>
                 <p className="font-mono text-lg text-foreground/70 mb-8">
                    Follow our 3-step strategy to beat the game. Consistency is key to reaching the final boss prepared.
                 </p>
                 <Link href="/sobre" className="btn btn-outline text-xs">
                    READ FULL GUIDE
                 </Link>
              </div>

              <div className="space-y-6">
                 {steps.map((step) => (
                    <div key={step.number} className="bg-card-bg border-2 border-foreground p-6 relative shadow-[4px_4px_0px_var(--foreground)]">
                       <span className="absolute -top-3 -left-3 bg-primary text-white border-2 border-foreground font-pixel text-xs px-2 py-1">
                          {step.number}
                       </span>
                       <h3 className="font-pixel text-sm text-foreground mb-2 mt-2">{step.title}</h3>
                       <p className="font-mono text-sm text-foreground/70">{step.description}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="hall-of-fame" className="py-20 px-4 bg-muted-bg border-b-4 border-foreground">
        <div className="container mx-auto max-w-6xl">
           <h2 className="font-pixel text-2xl sm:text-3xl text-foreground text-center mb-16">HALL OF FAME</h2>
           <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                 <div key={t.author} className="bg-card-bg border-2 border-foreground p-6 shadow-[4px_4px_0px_var(--foreground)] flex flex-col justify-between">
                    <p className="font-mono italic text-sm text-foreground/70 mb-6">&quot;{t.quote}&quot;</p>
                    <div className="border-t-2 border-foreground/10 pt-4">
                       <p className="font-pixel text-xs text-primary">{t.author}</p>
                       <p className="font-pixel text-[10px] text-foreground/50">{t.role}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-4 bg-background">
         <div className="container mx-auto max-w-4xl text-center">
            <div className="border-4 border-foreground p-8 sm:p-12 bg-card-bg shadow-[8px_8px_0px_var(--foreground)] relative">
               {/* Decorative Pixels */}
               <div className="absolute top-4 left-4 w-4 h-4 bg-primary"></div>
               <div className="absolute top-4 right-4 w-4 h-4 bg-primary"></div>
               <div className="absolute bottom-4 left-4 w-4 h-4 bg-primary"></div>
               <div className="absolute bottom-4 right-4 w-4 h-4 bg-primary"></div>

               <h2 className="font-pixel text-2xl sm:text-4xl text-foreground mb-6">READY TO START?</h2>
               <p className="font-mono text-foreground/70 mb-8 max-w-xl mx-auto">
                  Insert your coin (it&apos;s free to start) and begin your journey to the 1000 score.
               </p>
               <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <AccountLinkButton
                     className="btn btn-primary px-8 py-4 text-sm"
                     loggedInLabel="CONTINUE GAME"
                  />
                  <Link href="/noticias" className="btn btn-outline px-8 py-4 text-sm">
                     READ NEWS
                  </Link>
               </div>
            </div>
         </div>
      </section>
    </main>
  );
}
