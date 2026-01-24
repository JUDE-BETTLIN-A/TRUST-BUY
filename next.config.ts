import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'loremflickr.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ebayimg.com',
      },
      {
        protocol: 'https',
        hostname: 'thumbs1.ebaystatic.com',
      },
      {
        protocol: 'https',
        hostname: 'thumbs2.ebaystatic.com',
      },
      {
        protocol: 'https',
        hostname: 'thumbs3.ebaystatic.com',
      },
      {
        protocol: 'https',
        hostname: 'thumbs4.ebaystatic.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'bing.com',
      },
      {
        protocol: 'https',
        hostname: 'th.bing.com',
      },
      {
        protocol: 'https',
        hostname: 'tse2.mm.bing.net',
      },
      {
        protocol: 'https',
        hostname: 'tse1.mm.bing.net',
      },
      {
        protocol: 'https',
        hostname: 'tse3.mm.bing.net',
      },
      {
        protocol: 'https',
        hostname: 'tse4.mm.bing.net',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'images-eu.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'rukminim1.flixcart.com',
      },
      {
        protocol: 'https',
        hostname: 'rukminim2.flixcart.com',
      },
      // Croma image domains
      {
        protocol: 'https',
        hostname: 'media.croma.com',
      },
      {
        protocol: 'https',
        hostname: 'd2d22nphq0yz8t.cloudfront.net', // Croma CDN
      },
      // Reliance Digital image domains
      {
        protocol: 'https',
        hostname: 'www.reliancedigital.in',
      },
      {
        protocol: 'https',
        hostname: 'media.reliancedigital.in',
      },
      {
        protocol: 'https',
        hostname: 'd1z88p83zuviay.cloudfront.net', // Reliance CDN
      },
      // Vijay Sales image domains
      {
        protocol: 'https',
        hostname: 'www.vijaysales.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.vijaysales.com',
      },
      // Tata CLiQ image domains
      {
        protocol: 'https',
        hostname: 'www.tatacliq.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.tatacliq.com',
      },
      {
        protocol: 'https',
        hostname: 'd3t32hsnjxo7q6.cloudfront.net', // Tata CLiQ CDN
      },
      // Paytm Mall image domains
      {
        protocol: 'https',
        hostname: 'assetscdn1.paytm.com',
      },
      {
        protocol: 'https',
        hostname: 'paytmmall.com',
      },
      {
        protocol: 'https',
        hostname: 'images.paytmcdn.com',
      },
      // Google Shopping images
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn1.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn2.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn3.gstatic.com',
      },
      // Amazon.com (International)
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
      },
      // eBay images
      {
        protocol: 'https',
        hostname: 'i.ebayimg.com',
      },
      {
        protocol: 'https',
        hostname: 'ir.ebaystatic.com',
      },
      // AliExpress images
      {
        protocol: 'https',
        hostname: 'ae01.alicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'ae04.alicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'img.alicdn.com',
      },
      // Newegg images
      {
        protocol: 'https',
        hostname: 'c1.neweggimages.com',
      },
      {
        protocol: 'https',
        hostname: 'images10.newegg.com',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
