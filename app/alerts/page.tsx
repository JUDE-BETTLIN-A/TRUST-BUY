import { auth } from "@/lib/auth";
import { getAlerts } from "./actions";
import { AlertItem } from "./AlertItem";
import { CheckNowButton } from "./CheckNowButton";
import { redirect } from "next/navigation";

export default async function AlertsPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const alerts = await getAlerts();

  const upcomingAlerts = alerts.filter((alert: any) => alert.productLink === '#');
  const regularAlerts = alerts.filter((alert: any) => alert.productLink !== '#');

  return (
    <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-4xl">notifications_active</span>
              Price Alerts
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Monitoring {alerts.length} products for price drops.
            </p>
          </div>
          <CheckNowButton count={alerts.length} />
        </header>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-surface-dark rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
            <span className="material-symbols-outlined text-6xl text-gray-200 dark:text-gray-700 mb-4">
              notifications_off
            </span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No active alerts</h3>
            <p className="text-gray-500 max-w-sm mt-2">
              Search for products and click the "Set Price Alert" button to start tracking prices.
            </p>
            <a href="/home" className="mt-6 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Find Products
            </a>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Upcoming Offers Section */}
            {upcomingAlerts.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">event_upcoming</span>
                  Upcoming & Exclusive Deals
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {upcomingAlerts.map((alert: any) => (
                    <AlertItem key={alert.id} alert={alert} hidePriceDetails={true} />
                  ))}
                </div>
              </section>
            )}

            {/* Regular Product Alerts Section */}
            {regularAlerts.length > 0 && (
              <section>
                {upcomingAlerts.length > 0 && (
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500">inventory_2</span>
                    Product Watchlist
                  </h2>
                )}
                <div className="grid grid-cols-1 gap-4">
                  {regularAlerts.map((alert: any) => (
                    <AlertItem key={alert.id} alert={alert} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
