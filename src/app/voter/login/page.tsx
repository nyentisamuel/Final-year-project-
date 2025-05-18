import { FingerprintScanner } from "@/components/fingerprint-scanner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function VoterLoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b bg-white p-4">
        <div className="container mx-auto flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronLeft size={16} />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Voter Authentication</h1>
          <p className="text-muted-foreground">
            Please scan your fingerprint to proceed to voting
          </p>
        </div>

        <FingerprintScanner />
      </main>
    </div>
  );
}
