"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVoting } from "@/lib/voting-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { VerificationBadge } from "@/components/verification-badge";

export default function BallotPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null,
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<{
    status: "verified" | "suspicious" | "unverified";
    confidence: number;
    message: string;
  }>({
    status: "unverified",
    confidence: 0,
    message: "Identity not yet verified",
  });

  const {
    currentVoter,
    currentElection,
    candidates,
    castVote,
    error,
    resetError,
    isVotingLoading,
    fetchCandidates,
  } = useVoting();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Fetch candidates for the current election when it changes
  useEffect(() => {
    if (currentElection) {
      fetchCandidates(currentElection.id);
    }
  }, []);

  useEffect(() => {
    // Redirect if no voter is authenticated
    if (status === "unauthenticated") {
      router.push("/voter/login");
    }

    // Check verification status from session storage
    const storedVerification = sessionStorage.getItem("voterVerification");
    if (storedVerification) {
      try {
        const verification = JSON.parse(storedVerification);
        setVerificationStatus({
          status: verification.isVerified
            ? verification.confidence > 80
              ? "verified"
              : "suspicious"
            : "unverified",
          confidence: verification.confidence,
          message: verification.message,
        });
      } catch (e) {
        console.error("Error parsing verification status:", e);
      }
    }
  }, [status, router]);

  // Get candidates for the current election
  const electionCandidates = currentElection
    ? candidates.filter((c) => c.electionId === currentElection.id)
    : [];

  const handleSubmit = async () => {
    if (!selectedCandidate) {
      setLocalError("Please select a candidate to vote for");
      return;
    }

    if (!session) {
      setLocalError("Authentication error. Please login again.");
      return;
    }

    // Additional verification check
    if (verificationStatus.status === "unverified") {
      setLocalError(
        "Your identity could not be verified. Please try authenticating again.",
      );
      return;
    }

    resetError();
    setLocalError(null);

    const success = await castVote(selectedCandidate);

    if (success) {
      router.push("/voter/confirmation");
    }
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
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to authenticate before accessing the ballot
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/voter/login" className="w-full">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b bg-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Official Ballot</h1>
            <p className="text-sm text-muted-foreground">
              {currentElection ? currentElection.title : "Loading election..."}
            </p>
          </div>
          <VerificationBadge
            status={verificationStatus.status}
            confidence={verificationStatus.confidence}
            message={verificationStatus.message}
          />
        </div>
      </header>

      <main className="container mx-auto flex flex-1 flex-col items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Select Your Candidate</CardTitle>
            <CardDescription>
              Please select one candidate for{" "}
              {currentElection ? currentElection.description : "this election"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {localError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{localError}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {verificationStatus.status === "suspicious" && (
              <Alert variant="warning" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Verification Warning</AlertTitle>
                <AlertDescription>
                  Your identity verification has some suspicious patterns. You
                  can still vote, but this will be flagged for review.
                </AlertDescription>
              </Alert>
            )}

            <RadioGroup
              value={selectedCandidate || ""}
              onValueChange={setSelectedCandidate}
              className="space-y-4"
            >
              {electionCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-start space-x-2 rounded-md border p-4"
                >
                  <RadioGroupItem value={candidate.id} id={candidate.id} />
                  <div className="flex-1">
                    <Label
                      htmlFor={candidate.id}
                      className="text-base font-medium"
                    >
                      {candidate.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {candidate.party}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Position: {candidate.position}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/">Cancel</Link>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !selectedCandidate ||
                isVotingLoading ||
                verificationStatus.status === "unverified"
              }
            >
              {isVotingLoading ? "Submitting..." : "Cast Vote"}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
