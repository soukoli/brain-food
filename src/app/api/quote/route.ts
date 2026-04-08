import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ZenQuote {
  q: string; // quote text
  a: string; // author
  h: string; // html formatted
}

// Fallback quotes for when API fails or rate limited
const FALLBACK_QUOTES = [
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { quote: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { quote: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { quote: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { quote: "The mind is everything. What you think you become.", author: "Buddha" },
  { quote: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { quote: "The best revenge is massive success.", author: "Frank Sinatra" },
  { quote: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
];

// Track last used fallback index to avoid repeats
let lastFallbackIndex = -1;

function getRandomFallback(): { quote: string; author: string } {
  let index;
  do {
    index = Math.floor(Math.random() * FALLBACK_QUOTES.length);
  } while (index === lastFallbackIndex && FALLBACK_QUOTES.length > 1);
  
  lastFallbackIndex = index;
  return FALLBACK_QUOTES[index];
}

/**
 * GET /api/quote - Get a random inspirational quote
 * Each call returns a different quote
 */
export async function GET() {
  try {
    // Fetch a random quote from ZenQuotes
    // Using /api/random instead of /api/today to get different quotes
    const response = await fetch("https://zenquotes.io/api/random", {
      cache: "no-store", // Don't cache - we want fresh quotes
    });

    if (!response.ok) {
      throw new Error("Failed to fetch quote");
    }

    const data: ZenQuote[] = await response.json();

    if (!data || data.length === 0 || data[0].q === "Too many requests") {
      // Rate limited - use fallback
      throw new Error("Rate limited or no quote returned");
    }

    const quote = data[0];

    return NextResponse.json({
      data: {
        quote: quote.q,
        author: quote.a,
      },
    });
  } catch (error) {
    console.error("Quote fetch error:", error);

    // Return a random fallback quote
    const fallback = getRandomFallback();

    return NextResponse.json({
      data: {
        quote: fallback.quote,
        author: fallback.author,
        fallback: true,
      },
    });
  }
}
