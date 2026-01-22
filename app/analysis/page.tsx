import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function AnalysisPage() {
  // Mock data for the chart
  const priceHistory = [
    { date: 'Nov 1', price: 399 },
    { date: 'Nov 15', price: 389 },
    { date: 'Dec 1', price: 379 },
    { date: 'Dec 15', price: 355 },
    { date: 'Jan 1', price: 349 },
    { date: 'Jan 14', price: 348 },
  ];
  const currentPrice = 348;
  const lowestPrice = 348;
  const recommendation = 'Buy Now'; // or 'Wait'
  const reason = 'Price is at its lowest point in 90 days. Market trend suggests a rebound is likely.';
  const stability = 'Stable';

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Price Analysis</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Sony WH-1000XM5 Wireless Headphones
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700">
            <Activity className="w-3 h-3 mr-1" /> Live Data
          </Badge>
          <Badge variant="secondary" className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700">
            <Calendar className="w-3 h-3 mr-1" /> 90 Days
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart & Recommendation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommendation Card */}
          <Card className={recommendation === 'Buy Now' ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800' : 'border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800'}>
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                {recommendation === 'Buy Now' ? (
                  <TrendingDown className="text-green-600 w-6 h-6" />
                ) : (
                  <TrendingUp className="text-orange-600 w-6 h-6" />
                )}
                {recommendation}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
                {reason}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Price Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Price History (90 Days)</CardTitle>
              <CardDescription>Track price movements and identify trends</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Clean Chart Visualization */}
              <div className="h-64 flex items-end justify-between gap-1 bg-slate-50 dark:bg-slate-900 rounded p-4 border border-slate-200 dark:border-slate-800">
                {priceHistory.map((point, i) => {
                  // Calculate height relative to the range (340 to 400)
                  const height = ((point.price - 340) / 60) * 100;
                  const isLowest = point.price === lowestPrice;
                  return (
                    <div 
                      key={i} 
                      className={`w-full rounded-t relative group transition-all ${isLowest ? 'bg-slate-900' : 'bg-slate-300 dark:bg-slate-700'} hover:opacity-80`}
                      style={{ height: `${height}%` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 shadow-sm">
                        ${point.price}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* X-Axis Labels */}
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                {priceHistory.map((point, i) => (
                  <span key={i}>{point.date}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stability & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Price Stability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  <span className="font-bold text-slate-900 dark:text-white">{stability}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Price has been consistent with minor fluctuations. Low volatility.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Cost Transparency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Product Price</span>
                  <span>$348.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Shipping</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-800 pt-1 mt-1">
                  <span>Total</span>
                  <span>$348.00</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar: Actions & Context */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                Set Budget Alert
              </Button>
              <Button variant="outline" className="w-full">
                Compare Sellers
              </Button>
              <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-900">
                View Product Details
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Why This Recommendation?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <p>• Current price is the <strong>lowest in 90 days</strong>.</p>
              <p>• Historical data shows a <strong>rebound pattern</strong> after 2 weeks.</p>
              <p>• Seller trust score is <strong>95/100</strong>.</p>
              <p>• No major complaints in recent reviews.</p>
            </CardContent>
          </Card>

          <div className="text-center text-xs text-slate-400">
            <p>Analysis generated on {new Date().toLocaleDateString()}</p>
            <p>Confidence: High</p>
          </div>
        </div>
      </div>
    </div>
  );
}
