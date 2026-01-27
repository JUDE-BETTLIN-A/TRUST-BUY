"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { analyzeProductPrice, PriceAnalysis } from '@/lib/price-analysis';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';

// Price History Chart
function PriceHistoryChart({ data, label }: { data: { date: string; price: number }[]; label: string }) {
  // Format data for Recharts
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    price: d.price,
    fullDate: d.date
  }));

  const minPrice = Math.min(...data.map(d => d.price)) * 0.95;
  const maxPrice = Math.max(...data.map(d => d.price)) * 1.05;

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            minTickGap={30}
          />
          <YAxis
            hide
            domain={[minPrice, maxPrice]}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px' }}
            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Price']}
            labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#4f46e5"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Future Predictions Chart
function FuturePredictionsChart({
  currentPrice,
  predictions
}: {
  currentPrice: number;
  predictions: { date: string; predictedPrice: number; confidence: number; event?: string }[]
}) {
  // Combine current price as start point
  const chartData = [
    { date: 'Today', price: currentPrice, type: 'current', fullDate: new Date().toISOString().split('T')[0] },
    ...predictions.map(p => ({
      date: new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      price: p.predictedPrice,
      type: 'prediction',
      fullDate: p.date,
      event: p.event
    }))
  ];

  const minPrice = Math.min(...chartData.map(d => d.price)) * 0.9;
  const maxPrice = Math.max(...chartData.map(d => d.price)) * 1.1;

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
          />
          <YAxis
            hide
            domain={[minPrice, maxPrice]}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px' }}
            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Price']}
          />
          <ReferenceLine x="Today" stroke="#4f46e5" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#8b5cf6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPrice)"
            dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#8b5cf6' }}
            activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'prediction' | 'history'>('prediction');

  const productName = searchParams.get('name') || 'Unknown Product';
  const productPrice = searchParams.get('price') || '0';
  const productImage = searchParams.get('image') || '';
  const productUrl = searchParams.get('url') || '';
  const productSource = searchParams.get('source') || 'Unknown';

  useEffect(() => {
    async function fetchAnalysis() {
      // Debug logging
      console.log('[Analysis Page] Received price:', productPrice);
      console.log('[Analysis Page] Price type:', typeof productPrice);

      try {
        setLoading(true);
        const result = await analyzeProductPrice(
          productName,
          productPrice,
          productUrl,
          productSource
        );
        setAnalysis(result);
      } catch (err) {
        console.error('Analysis error:', err);
        setError('Failed to analyze price. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (productName && productPrice) {
      fetchAnalysis();
    }
  }, [productName, productPrice, productUrl, productSource]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Price Data</h2>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-red-400 mb-4">error</span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
          <p className="text-gray-500 mb-4">{error || 'Unable to analyze this product'}</p>
          <button onClick={() => router.back()} className="text-primary font-semibold hover:underline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { prediction, alerts, priceHistory, futurePredictions, pastAnalysis, summary } = analysis;

  const recommendationColors: Record<string, string> = {
    'BUY NOW': 'bg-green-500',
    'WAIT': 'bg-amber-500',
    'SET ALERT': 'bg-blue-500'
  };

  const trendIcons: Record<string, string> = {
    'rising': 'trending_up',
    'falling': 'trending_down',
    'stable': 'trending_flat'
  };

  const trendColors: Record<string, string> = {
    'rising': 'text-red-500',
    'falling': 'text-green-500',
    'stable': 'text-gray-500'
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Results
          </button>

          <div className="flex gap-6 items-start">
            {productImage && (
              <div className="w-20 h-20 bg-white rounded-xl border border-gray-200 p-2 shrink-0">
                <Image
                  src={productImage}
                  alt={productName}
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 line-clamp-2">{productName}</h1>
              <p className="text-sm text-gray-500">Source: {productSource}</p>
              <p className="text-2xl font-bold text-primary mt-1">₹{analysis.currentPrice.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Recommendation Card */}
        <div className={`${recommendationColors[prediction.recommendation] || 'bg-gray-500'} rounded-2xl p-6 text-white mb-6`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">
                  {prediction.recommendation === 'BUY NOW' ? 'thumb_up' : prediction.recommendation === 'WAIT' ? 'schedule' : 'notifications'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{prediction.recommendation}</h2>
                <p className="text-white/80">{prediction.reasoning}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/70">AI Confidence</p>
              <p className="text-3xl font-bold">{prediction.confidence}%</p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* TABS Navigation */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('prediction')}
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'prediction' ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="material-symbols-outlined">auto_awesome</span>
                  AI Prediction
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'history' ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="material-symbols-outlined">history</span>
                  Price History
                </button>
              </div>

              <div className="p-6">
                {/* PREDICTION TAB */}
                {activeTab === 'prediction' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-600">show_chart</span>
                        Future Trend Forecast
                        {analysis.predictionSource === 'Python/Prophet' && (
                          <span className="ml-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <span className="material-symbols-outlined text-[12px]">psychology</span>
                            Prophet ML Model
                          </span>
                        )}
                      </h3>
                    </div>

                    <FuturePredictionsChart
                      currentPrice={analysis.currentPrice}
                      predictions={futurePredictions.length > 0 ? futurePredictions : [
                        { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], predictedPrice: Math.round(analysis.currentPrice * 0.97), confidence: 75 },
                        { date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], predictedPrice: Math.round(analysis.currentPrice * 0.95), confidence: 70 },
                        { date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], predictedPrice: Math.round(analysis.currentPrice * 0.92), confidence: 65, event: 'Expected Sale' },
                        { date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], predictedPrice: Math.round(analysis.currentPrice * 0.94), confidence: 55 },
                        { date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], predictedPrice: Math.round(analysis.currentPrice * 0.90), confidence: 50 }
                      ]}
                    />
                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>Lower than now</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-amber-500 rounded"></div>
                        <span>Higher than now</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-purple-600 rounded"></div>
                        <span>Sale event</span>
                      </div>
                    </div>

                    {/* AI Price Summary */}
                    <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-white text-xl">psychology</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-1">AI Price Summary</h4>
                          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
                        </div>
                      </div>
                    </div>

                    {/* Predicted Price Range */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Next 90 Days Range</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-xl">
                          <p className="text-xs text-green-600 mb-1 font-bold">LOWEST</p>
                          <p className="text-xl font-bold text-green-700">₹{prediction.predictedLowestPrice.toLocaleString()}</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500 mb-1 font-bold">CURRENT</p>
                          <p className="text-xl font-bold text-gray-900">₹{analysis.currentPrice.toLocaleString()}</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-xl">
                          <p className="text-xs text-red-600 mb-1 font-bold">HIGHEST</p>
                          <p className="text-xl font-bold text-red-700">₹{prediction.predictedHighestPrice.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">history</span>
                      Past 60 Days Price History
                    </h3>
                    <PriceHistoryChart data={priceHistory} label="" />

                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 border border-gray-100 rounded-lg">
                        <p className="text-xs text-gray-500">Average</p>
                        <p className="font-bold text-gray-700">₹{analysis.averagePrice.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-3 border border-gray-100 rounded-lg">
                        <p className="text-xs text-gray-500">Highest</p>
                        <p className="font-bold text-red-500">₹{analysis.highestPrice.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-3 border border-gray-100 rounded-lg">
                        <p className="text-xs text-gray-500">Lowest</p>
                        <p className="font-bold text-green-600">₹{analysis.lowestPrice.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-3 border border-gray-100 rounded-lg">
                        <p className="text-xs text-gray-500">Volatilty</p>
                        <p className="font-bold text-amber-600 capitalize">{pastAnalysis.volatility}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Price Stats */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Historical Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-500">Current Price</span>
                  <span className="font-bold text-gray-900">₹{analysis.currentPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-500">60-Day Lowest</span>
                  <span className="font-bold text-green-600">₹{analysis.lowestPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-500">60-Day Highest</span>
                  <span className="font-bold text-red-500">₹{analysis.highestPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">60-Day Average</span>
                  <span className="font-bold text-gray-700">₹{analysis.averagePrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Past Analysis */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Past Price Analysis</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Trend</span>
                  <span className={`font-bold flex items-center gap-1 ${trendColors[pastAnalysis.trend]}`}>
                    <span className="material-symbols-outlined text-sm">{trendIcons[pastAnalysis.trend]}</span>
                    {pastAnalysis.trend.charAt(0).toUpperCase() + pastAnalysis.trend.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Volatility</span>
                  <span className={`font-bold ${pastAnalysis.volatility === 'low' ? 'text-green-600' :
                    pastAnalysis.volatility === 'medium' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                    {pastAnalysis.volatility.charAt(0).toUpperCase() + pastAnalysis.volatility.slice(1)}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Seasonal Pattern</p>
                  <p className="text-sm text-gray-700">{pastAnalysis.seasonalPattern}</p>
                </div>
                {pastAnalysis.priceDropEvents.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-2">Notable Price Drop Events</p>
                    <div className="flex flex-wrap gap-2">
                      {pastAnalysis.priceDropEvents.map((event, i) => (
                        <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Smart Alerts</h3>
              <div className="space-y-3">
                {alerts.isAtLow && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <span className="material-symbols-outlined text-green-600">trending_down</span>
                    <span className="text-sm font-medium text-green-800">Price at historic low!</span>
                  </div>
                )}
                {alerts.isAtHigh && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                    <span className="material-symbols-outlined text-red-600">trending_up</span>
                    <span className="text-sm font-medium text-red-800">Price at historic high</span>
                  </div>
                )}
                {alerts.priceDropSoon && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <span className="material-symbols-outlined text-blue-600">schedule</span>
                    <span className="text-sm font-medium text-blue-800">Price drop expected soon</span>
                  </div>
                )}
                {alerts.upcomingSale && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                    <span className="material-symbols-outlined text-purple-600">celebration</span>
                    <span className="text-sm font-medium text-purple-800">{alerts.upcomingSale} coming!</span>
                  </div>
                )}
                {!alerts.isAtLow && !alerts.isAtHigh && !alerts.priceDropSoon && !alerts.upcomingSale && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="material-symbols-outlined text-gray-500">info</span>
                    <span className="text-sm text-gray-600">No special alerts at this time</span>
                  </div>
                )}
              </div>
            </div>

            {/* Best Time to Buy */}
            <div className="bg-gradient-to-br from-primary/10 to-blue-100 border border-primary/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Best Time to Buy</h3>
              <p className="text-2xl font-bold text-primary capitalize">{prediction.bestTimeToBuy}</p>
              {prediction.expectedDrop && (
                <p className="text-sm text-gray-600 mt-2">
                  Expected drop: <span className="font-bold text-green-600">{prediction.dropPercentage}%</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mt-8 justify-center">
          {productUrl && (
            <a
              href={productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined">open_in_new</span>
              Go to Store
            </a>
          )}

          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Search
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PriceAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AnalysisContent />
    </Suspense>
  );
}
