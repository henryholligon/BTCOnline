import { Link } from "wouter";
import { ArrowLeft, HelpCircle } from "lucide-react";
import Navbar from "@/components/navbar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqSections = [
  {
    title: "About the directory",
    questions: [
      {
        question: "What is BTC Online?",
        answer: "BTC Online is an open directory of online merchants that accept Bitcoin. Browse the directory to find places to spend Bitcoin, then use the filters to narrow results by payment method, category, availability, country, or provider.",
      },
      {
        question: "How do you decide which merchants are listed?",
        answer: "We focus on merchants that accept Bitcoin directly or through an established Bitcoin payment provider. We do not list merchants that require gated solutions such as BitPay or Coinbase Pay. Listings are reviewed and kept in sync with the directory's merchant data.",
      },
      {
        question: "Is BTC Online affiliated with the merchants listed?",
        answer: "No. BTC Online is an independent directory and is not affiliated with, sponsored by, or responsible for the merchants listed. Please review a merchant's own terms, pricing, and policies before purchasing.",
      },
    ],
  },
  {
    title: "Finding and using merchants",
    questions: [
      {
        question: "How do I find a specific merchant?",
        answer: "Use the Search control in the top navigation to search by merchant name, description, category, or other listing details. You can combine search with the payment, availability, country, and provider filters.",
      },
      {
        question: "What do the payment badges mean?",
        answer: "The badges show which Bitcoin-related payment methods a merchant supports, such as on-chain Bitcoin, Lightning, Cashu, or Liquid. A merchant may support more than one method.",
      },
      {
        question: "How can I see more details about a merchant?",
        answer: "Select a merchant card to expand it. The expanded view includes the merchant description, categories, availability, payment details, ratings, comments, public likes, and a link to visit the merchant's website.",
      },
    ],
  },
  {
    title: "Accounts and community",
    questions: [
      {
        question: "Do I need an account to browse the directory?",
        answer: "No. You can browse and search the directory without signing in. Signing in enables features such as favourites, likes, lists, reviews, comments, and community activity.",
      },
      {
        question: "Why sign in with Nostr?",
        answer: "Nostr lets you use a portable identity across compatible applications. BTC Online uses it for community features such as public likes, profiles, reviews, comments, merchant submissions, and social signals from people you follow.",
      },
      {
        question: "How do I submit a merchant?",
        answer: "Use the Add Merchant button in the top navigation. Include as much accurate information as possible, especially the merchant website and supported payment methods. Submissions are reviewed before being added to the public directory.",
      },
      {
        question: "How do I report incorrect information?",
        answer: "If a listing is outdated or inaccurate, please use the available contact or feedback channel to share the merchant name, the incorrect detail, and the correct source if possible. Clear, specific reports are easiest to verify.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar onSearch={() => {}} filtersSlot={null} onClearFilters={() => {}} />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-10 flex items-start gap-3">
            <Link
              href="/"
              className="mt-1 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Back to directory"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
                <HelpCircle className="h-4 w-4" />
                Help centre
              </div>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Frequently asked questions
              </h1>
              <p className="mt-4 max-w-2xl text-muted-foreground">
                Everything you need to know about finding Bitcoin merchants, using the directory, and joining the community.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {faqSections.map(section => (
              <section key={section.title} className="rounded-xl border border-border/70 bg-card px-5 shadow-none sm:px-7">
                <h2 className="pt-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {section.title}
                </h2>
                <Accordion type="single" collapsible>
                  {section.questions.map((item, index) => (
                    <AccordionItem key={item.question} value={`${section.title}-${index}`}>
                      <AccordionTrigger className="text-base hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="max-w-2xl leading-6 text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="font-medium">Still have a question?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start by exploring the directory or submit feedback with the details you have.
            </p>
            <Link href="/" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
              Browse the directory
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}