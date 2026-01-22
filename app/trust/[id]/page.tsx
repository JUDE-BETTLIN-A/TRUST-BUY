import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Star, AlertTriangle, ThumbsUp, ThumbsDown, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: {
    id: string;
  };
}

export default function TrustReviewPage({ params }: Props) {
  // Mock data for demonstration
  const sellerName = "Amazon";
  const trustScore = 95;
  const pros = [
    "Fast shipping (2 days)",
    "Easy return policy",
    "Verified authentic products",
    "24/7 customer support"
  ];
  const cons = [
    "Slightly higher prices",
    "Restocking fees on some items"
  ];
  const warnings: string[] = [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Trust & Reviews</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Seller analysis for <span className="font-semibold text-slate-900 dark:text-slate-200">{sellerName}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Trust Score</span>
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full">
            <Shield className="w-4 h-4" />
            <span className="text-xl font-bold">{trustScore}</span>
            <span className="text-xs opacity-70">/ 100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Score Breakdown</CardTitle>
              <CardDescription>Based on 2,430 verified transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Shipping Speed</span>
                  <span className="font-bold text-slate-900 dark:text-white">98%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-900 h-full" style={{ width: '98%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Return Rate</span>
                  <span className="font-bold text-slate-900 dark:text-white">2%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-600 h-full" style={{ width: '2%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Customer Satisfaction</span>
                  <span className="font-bold text-slate-900 dark:text-white">94%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-900 h-full" style={{ width: '94%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ThumbsUp className="text-green-600 w-5 h-5" /> Pros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {pros.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ThumbsDown className="text-red-600 w-5 h-5" /> Cons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {cons.map((con, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Warnings
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-orange-700 dark:text-orange-300 space-y-2">
                {warnings.map((warning, i) => (
                  <p key={i}>• {warning}</p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Action & Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <p>
                This seller has a <strong>high trust score</strong> and is considered safe for
                purchases. They have a reliable return policy and fast shipping.
              </p>
              <p>
                We recommend proceeding with the purchase if the price meets your budget.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                Proceed to Buy
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Verified Badges</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                Official Partner
              </Badge>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                Fast Shipper
              </Badge>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                Easy Returns
              </Badge>
            </CardContent>
          </Card>

          <div className="text-center text-xs text-slate-400">
            <p>Analysis generated on {new Date().toLocaleDateString()}</p>
            <p>Data source: TrustBuy Verified Transactions</p>
          </div>
        </div>
      </div>
    </div>
  );
}