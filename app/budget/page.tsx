import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Target, Bell, CheckCircle2 } from 'lucide-react';

export default function BudgetGuardianPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Budget Guardian</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Set your target price and we'll monitor the market for you. No spam, just results.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Status</span>
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-100 dark:border-green-800">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-bold">Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Product & Target</CardTitle>
              <CardDescription>
                Select a product and define your maximum acceptable price.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input 
                  type="text" 
                  placeholder="e.g., Sony WH-1000XM5" 
                  defaultValue="Sony WH-1000XM5 Wireless Headphones"
                  className="bg-white dark:bg-slate-950"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Target Price ($)</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    defaultValue="350.00"
                    className="bg-white dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Best Price</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                    $348.00
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="font-medium">Smart Alerts</div>
                    <div className="text-xs text-slate-500">Notify only when target is met</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button className="w-full md:w-auto">Save Monitoring</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Active Monitors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Monitor Item 1 */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-xs font-bold text-slate-500">
                    S
                  </div>
                  <div>
                    <div className="font-medium text-sm">Sony WH-1000XM5</div>
                    <div className="text-xs text-slate-500">Target: $350.00 • Current: $348.00</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Ready</span>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                    Remove
                  </Button>
                </div>
              </div>
              {/* Monitor Item 2 */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-xs font-bold text-slate-500">
                    M
                  </div>
                  <div>
                    <div className="font-medium text-sm">MacBook Pro 14" M3</div>
                    <div className="text-xs text-slate-500">Target: $1500.00 • Current: $1599.00</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">Waiting</span>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Insights */}
        <div className="space-y-6">
          <Card className="bg-slate-900 text-white border-none">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Target className="text-slate-300" /> Smart Goal
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 text-sm leading-relaxed">
              You are currently <strong>under budget</strong> for your tracked items. 
              This is an excellent time to purchase if the price is right.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <p>1. Set your target price.</p>
              <p>2. We check prices every hour.</p>
              <p>3. You get one notification when target is met.</p>
              <p>4. No spam, ever.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
