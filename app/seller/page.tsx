import React from 'react';
import { getSellers } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Shield } from 'lucide-react';
import Link from 'next/link';

export default async function SellerPage() {
  const sellers = await getSellers();

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Seller Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Browse verified sellers and compare reliability.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700">
            <Shield className="w-3 h-3 mr-1" /> Verified Only
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sellers.map((seller) => (
          <Card key={seller.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold">{seller.name}</CardTitle>
              <Badge variant={seller.verified ? "default" : "secondary"} className="text-xs">
                {seller.verified ? "Verified" : "Standard"}
              </Badge>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 pt-2">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                  {seller.logo}
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-200">{seller.location}</div>
                  <div className="text-xs">{seller.rating} <Star className="w-3 h-3 inline text-slate-900 dark:text-white fill-slate-900 dark:fill-white" /> ({seller.reviews})</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-center">
                  <div className="font-bold text-slate-900 dark:text-white">{seller.shippingTime}</div>
                  <div className="text-slate-500">Shipping</div>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-center">
                  <div className="font-bold text-slate-900 dark:text-white">{seller.returnRate}%</div>
                  <div className="text-slate-500">Return</div>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                <span className="font-bold text-slate-700 dark:text-slate-300">Trust Score:</span> {seller.trustScore}/100
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-slate-900 h-full" style={{ width: `${seller.trustScore}%` }}></div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button asChild className="w-full" variant="outline">
                <Link href={`/trust/${seller.id}`}>View Profile</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
