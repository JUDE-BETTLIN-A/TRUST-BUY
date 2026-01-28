import axios, { AxiosRequestConfig } from 'axios';

/**
 * Proxy Service Configuration
 * Uses ScraperAPI for bypassing anti-bot protection
 * Free tier: 5000 requests/month
 * Sign up at: https://www.scraperapi.com/
 */

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || '';

export interface ProxyOptions {
    url: string;
    timeout?: number;
    useProxy?: boolean;
    renderJs?: boolean; // For JS-rendered sites like Myntra
}

/**
 * Fetch URL with optional proxy support
 * Falls back to direct request if proxy fails or is not configured
 */
export async function fetchWithProxy(options: ProxyOptions): Promise<string> {
    const { url, timeout = 10000, useProxy = true, renderJs = false } = options;

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
    };

    // Try with ScraperAPI if key is available
    if (useProxy && SCRAPER_API_KEY) {
        try {
            const proxyUrl = new URL('https://api.scraperapi.com/');
            proxyUrl.searchParams.set('api_key', SCRAPER_API_KEY);
            proxyUrl.searchParams.set('url', url);
            
            if (renderJs) {
                proxyUrl.searchParams.set('render', 'true');
            }
            
            // Add country code for India-specific sites
            proxyUrl.searchParams.set('country_code', 'in');

            console.log(`[Proxy] Fetching via ScraperAPI: ${url}`);
            
            const response = await axios.get(proxyUrl.toString(), {
                timeout: timeout + 10000, // Extra time for proxy
                headers: {
                    'Accept': 'text/html'
                }
            });

            return response.data;
        } catch (proxyError) {
            console.warn(`[Proxy] ScraperAPI failed for ${url}, trying direct...`);
        }
    }

    // Direct request as fallback
    try {
        console.log(`[Direct] Fetching: ${url}`);
        const response = await axios.get(url, {
            headers,
            timeout,
        });
        return response.data;
    } catch (directError) {
        throw new Error(`Failed to fetch ${url}: ${directError instanceof Error ? directError.message : 'Unknown error'}`);
    }
}

/**
 * Check if proxy is configured
 */
export function isProxyConfigured(): boolean {
    return !!SCRAPER_API_KEY;
}
