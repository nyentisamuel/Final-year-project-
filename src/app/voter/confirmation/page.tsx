"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVoting } from "@/lib/voting-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

export default function ConfirmationPage() {
  const { currentVoter, setCurrentVoter } = useVoting();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Redirect if no voter is authenticated
    if (status === "unauthenticated") {
      router.push("/voter/login");
    }

    // Clear current voter after 30 seconds for security
    const timeout = setTimeout(() => {
      setCurrentVoter(null);
      signOut({ redirect: false });
    }, 30000);

    return () => clearTimeout(timeout);
  }, [status, router, setCurrentVoter]);

  const handleDone = () => {
    setCurrentVoter(null);
    signOut({ redirect: false });
    router.push("/");
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Session Expired</CardTitle>
          </CardHeader>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button className="w-full">Return to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Vote Successfully Cast</CardTitle>
        </CardHeader>

        <CardContent className="text-center">
          <p className="mb-4">
            Thank you for participating in the democratic process,{" "}
            {session.user.name}.
          </p>
          <p className="text-sm text-muted-foreground">
            Your vote has been securely recorded. This page will automatically
            expire in 30 seconds.
          </p>
        </CardContent>

        <CardFooter>
          <Button onClick={handleDone} className="w-full">
            Done
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
