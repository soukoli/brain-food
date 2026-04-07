import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Cache the quote for 1 hour to avoid hitting rate limits
let cachedQuote: { quote: string; author: string; fetchedAt: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface ZenQuote {
  q: string; // quote text
  a: string; // author
  h: string; // html formatted
}

/**
 * GET /api/quote - Get an inspirational quote of the day
 */
export async function GET() {
  try {
    // Return cached quote if still valid
    if (cachedQuote && Date.now() - cachedQuote.fetchedAt < CACHE_DURATION) {
      return NextResponse.json({
        data: {
          quote: cachedQuote.quote,
          author: cachedQuote.author,
          cached: true,
        },
      });
    }

    // Fetch quote of the day from ZenQuotes
    const response = await fetch("https://zenquotes.io/api/today", {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error("Failed to fetch quote");
    }

    const data: ZenQuote[] = await response.json();

    if (!data || data.length === 0) {
      throw new Error("No quote returned");
    }

    const quote = data[0];

    // Update cache
    cachedQuote = {
      quote: quote.q,
      author: quote.a,
      fetchedAt: Date.now(),
    };

    return NextResponse.json({
      data: {
        quote: quote.q,
        author: quote.a,
        cached: false,
      },
    });
  } catch (error) {
    console.error("Quote fetch error:", error);

    // Return a fallback quote if API fails
    const fallbackQuotes = [
      {
        quote: "The secret of getting ahead is getting started.",
        author: "Mark Twain",
      },
      {
        quote: "Focus on being productive instead of busy.",
        author: "Tim Ferriss",
      },
      {
        quote: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
      },
      {
        quote: "Start where you are. Use what you have. Do what you can.",
        author: "Arthur Ashe",
      },
      {
        quote: "Your time is limited, don't waste it living someone else's life.",
        author: "Steve Jobs",
      },
      {
        quote: "The best time to plant a tree was 20 years ago. The second best time is now.",
        author: "Chinese Proverb",
      },
      {
        quote: "Done is better than perfect.",
        author: "Sheryl Sandberg",
      },
      {
        quote: "Action is the foundational key to all success.",
        author: "Pablo Picasso",
      },
    ];

    // Pick a random fallback quote based on the day
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const fallback = fallbackQuotes[dayOfYear % fallbackQuotes.length];

    return NextResponse.json({
      data: {
        quote: fallback.quote,
        author: fallback.author,
        cached: false,
        fallback: true,
      },
    });
  }
}
