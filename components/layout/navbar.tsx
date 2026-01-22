import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="bg-slate-900 text-white p-1.5 rounded-md">
              <ShieldCheck size={18} />
            </div>
            <span className="hidden font-bold sm:inline-block text-lg tracking-tight">
              TrustBuy
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/home"
              className="transition-colors hover:text-slate-900 text-slate-500"
            >
              Dashboard
            </Link>
            <Link
              href="/search"
              className="transition-colors hover:text-slate-900 text-slate-500"
            >
              Search
            </Link>
            <Link
              href="/analysis"
              className="transition-colors hover:text-slate-900 text-slate-500"
            >
              Analysis
            </Link>
            <Link
              href="/budget"
              className="transition-colors hover:text-slate-900 text-slate-500"
            >
              Budget
            </Link>
            <Link
              href="/alerts"
              className="transition-colors hover:text-slate-900 text-slate-500"
            >
              Alerts
            </Link>
            <Link
              href="/settings"
              className="transition-colors hover:text-slate-900 text-slate-500"
            >
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex-1 md:flex md:justify-end">
          <div className="flex items-center space-x-2">
            {session ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold">
                    {session.user?.name?.charAt(0) || "U"}
                  </div>
                  <span className="hidden lg:inline">
                    {session.user?.name?.split(" ")[0]}
                  </span>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await signOut();
                  }}
                >
                  <Button variant="outline" size="sm">
                    Sign Out
                  </Button>
                </form>
              </div>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("credentials", { callbackUrl: "/home" });
                }}
              >
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
                  Sign In
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
