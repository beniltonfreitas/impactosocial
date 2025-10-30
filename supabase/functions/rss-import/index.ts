import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeedItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  imageUrl?: string;
  category?: string;
  author?: string;
  content?: string;
}

function extractTextContent(element: any): string {
  return element?.textContent?.trim() || '';
}

function extractImageFromContent(content: string): string | undefined {
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i);
  return imgMatch ? imgMatch[1] : undefined;
}

function parseRSSFeed(xmlDoc: any): FeedItem[] {
  const items: FeedItem[] = [];
  
  // Try RSS 2.0 format
  const rssItems = xmlDoc.querySelectorAll('item');
  
  if (rssItems.length > 0) {
    rssItems.forEach((item: any) => {
      const title = extractTextContent(item.querySelector('title'));
      const description = extractTextContent(item.querySelector('description'));
      const link = extractTextContent(item.querySelector('link'));
      const pubDate = extractTextContent(item.querySelector('pubDate'));
      const category = extractTextContent(item.querySelector('category'));
      const author = extractTextContent(item.querySelector('author')) || 
                    extractTextContent(item.querySelector('dc\\:creator'));
      
      // Try to find image from enclosure or media:content
      let imageUrl = item.querySelector('enclosure')?.getAttribute('url');
      if (!imageUrl) {
        imageUrl = item.querySelector('media\\:content')?.getAttribute('url') ||
                  item.querySelector('media\\:thumbnail')?.getAttribute('url');
      }
      
      // If no image found, try to extract from description/content
      if (!imageUrl && description) {
        imageUrl = extractImageFromContent(description);
      }
      
      // Get full content if available
      const contentEncoded = extractTextContent(item.querySelector('content\\:encoded'));
      const content = contentEncoded || description;
      
      if (title && link) {
        items.push({
          title,
          description,
          link,
          pubDate,
          imageUrl,
          category,
          author,
          content,
        });
      }
    });
  } else {
    // Try Atom format
    const entries = xmlDoc.querySelectorAll('entry');
    
    entries.forEach((entry: any) => {
      const title = extractTextContent(entry.querySelector('title'));
      const summary = extractTextContent(entry.querySelector('summary'));
      const content = extractTextContent(entry.querySelector('content')) || summary;
      const linkEl = entry.querySelector('link');
      const link = linkEl?.getAttribute('href') || '';
      const published = extractTextContent(entry.querySelector('published')) ||
                       extractTextContent(entry.querySelector('updated'));
      const category = extractTextContent(entry.querySelector('category'));
      const author = extractTextContent(entry.querySelector('author name'));
      
      // Try to find image
      let imageUrl = entry.querySelector('media\\:content')?.getAttribute('url') ||
                    entry.querySelector('media\\:thumbnail')?.getAttribute('url');
      
      if (!imageUrl && content) {
        imageUrl = extractImageFromContent(content);
      }
      
      if (title && link) {
        items.push({
          title,
          description: summary,
          link,
          pubDate: published,
          imageUrl,
          category,
          author,
          content,
        });
      }
    });
  }
  
  return items;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedUrl } = await req.json();
    
    if (!feedUrl) {
      return new Response(
        JSON.stringify({ error: 'feedUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching RSS feed from:', feedUrl);

    // Fetch the RSS feed
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader Bot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // Parse XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    if (!xmlDoc) {
      throw new Error('Failed to parse XML');
    }

    // Parse feed items
    const items = parseRSSFeed(xmlDoc);
    
    console.log(`Successfully parsed ${items.length} items from feed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        items,
        feedUrl,
        count: items.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('RSS import error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
