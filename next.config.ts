import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'loremflickr.com' },
      { protocol: 'https', hostname: 'i.ebayimg.com' },
      { protocol: 'https', hostname: '*.ebaystatic.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'bing.com' },
      { protocol: 'https', hostname: '*.bing.com' },
      { protocol: 'https', hostname: '*.bing.net' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '*.media-amazon.com' },
      { protocol: 'https', hostname: '*.ssl-images-amazon.com' },
      { protocol: 'https', hostname: '*.flixcart.com' },
      { protocol: 'https', hostname: 'media.croma.com' },
      { protocol: 'https', hostname: '*.cloudfront.net' },
      { protocol: 'https', hostname: '*.reliancedigital.in' },
      { protocol: 'https', hostname: '*.vijaysales.com' },
      { protocol: 'https', hostname: '*.tatacliq.com' },
      { protocol: 'https', hostname: '*.paytm.com' },
      { protocol: 'https', hostname: '*.paytmcdn.com' },
      { protocol: 'https', hostname: 'paytmmall.com' },
      { protocol: 'https', hostname: '*.gstatic.com' },
      { protocol: 'https', hostname: '*.alicdn.com' },
      { protocol: 'https', hostname: '*.neweggimages.com' },
      { protocol: 'https', hostname: '*.newegg.com' },
      { protocol: 'https', hostname: 'assets.myntassets.com' },
      { protocol: 'https', hostname: 'assets.ajio.com' },
      { protocol: 'https', hostname: '*.sdlcdn.com' },
      { protocol: 'https', hostname: 'cdn.shopclues.com' },
      { protocol: 'http', hostname: 'cdn.shopclues.com' },
    ],
  },
};

export default nextConfig;
