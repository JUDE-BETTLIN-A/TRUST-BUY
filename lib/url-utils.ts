/**
 * Utility functions for handling and cleaning URLs
 */

export function cleanProductUrl(url: string | null | undefined): string {
    if (!url) return '';

    // 1. Aggressive Amazon Cleaning
    // Matches: /dp/ASIN, /gp/product/ASIN, /Title/dp/ASIN
    // ASIN is 10 chars, alphanumeric, usually starts with B
    const amazonAsinMatch = url.match(/\/dp\/([A-Z0-9]{10})/) || url.match(/\/gp\/product\/([A-Z0-9]{10})/);
    if (amazonAsinMatch && (url.includes('amazon') || url.includes('amzn'))) {
        // We found an ASIN. Reconstruct a purely clean URL.
        // Default to .in if we can't detect TLD, but try to preserve host.
        let host = 'www.amazon.in';
        try {
            const urlObj = new URL(url);
            host = urlObj.hostname;
        } catch (e) {
            // Relative URL or invalid, ignore
        }
        return `https://${host}/dp/${amazonAsinMatch[1]}`;
    }

    // 2. Flipkart Cleaning
    if (url.includes('flipkart')) {
        const pidMatch = url.match(/pid=([A-Z0-9]{10,})/);
        if (pidMatch) {
            let host = 'www.flipkart.com';
            try {
                const urlObj = new URL(url);
                host = urlObj.hostname;
                // Preserve the path until /p/ if possible, or just default
                if (urlObj.pathname.includes('/p/')) {
                    return `https://${host}${urlObj.pathname.split('?')[0]}?pid=${pidMatch[1]}`;
                }
            } catch (e) { }
            return `https://${host}/product/p/itme?pid=${pidMatch[1]}`; // Fallback generic
        }
    }

    // 3. General Parameter Stripping fallback
    try {
        const urlObj = new URL(url, 'https://example.com'); // Base allows parsing relative URLs if needed
        const paramsToRemove = [
            'ref', 'ref_', 'qid', 'sr', 'keywords', 'dib', 'dib_tag',
            'crid', 'sprefix', 'psc', 'smid', 'linkCode', 'tag', 'ascsubtag',
            'pf_rd_r', 'pf_rd_p', 'pd_rd_r', 'pd_rd_w', 'pd_rd_wg', 'clnoe'
        ];

        paramsToRemove.forEach(p => urlObj.searchParams.delete(p));

        // If it was absolute, return full. If it was relative (we added base), return generic string?
        // Actually, if input didn't start with http, new URL(url) fails without base.
        // If we added base, we should strip it if the original didn't have it.
        // But for product links, we usually want absolute.

        if (url.startsWith('http')) {
            return urlObj.toString();
        }
        // If it was relative, just return the pathname + search
        return urlObj.pathname + urlObj.search;

    } catch (e) {
        return url;
    }
}

export function cleanProductTitle(title: string): string {
    if (!title) return '';
    let clean = title;

    // Remove content in parentheses, brackets
    clean = clean.replace(/\([^)]*\)/g, '');
    clean = clean.replace(/\[[^\]]*\]/g, '');

    // Remove content after pipes | or hyphens - (often used for specs)
    // Be careful with hyphens as they might be part of name "Wi-Fi"
    if (clean.includes('|')) clean = clean.split('|')[0];

    // Remove "GB Storage", "RAM" etc if they clutter
    // clean = clean.replace(/\d+GB\s+RAM/gi, ''); 
    // ^ Optional, might be overkill

    // Trim and remove extra spaces
    clean = clean.replace(/\s+/g, ' ').trim();

    // Remove trailing commas/hyphens
    clean = clean.replace(/^[,\-\s]+|[,\-\s]+$/g, '');

    return clean;
}
