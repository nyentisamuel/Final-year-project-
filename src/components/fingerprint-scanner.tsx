"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Fingerprint, ShieldCheck, ShieldAlert } from "lucide-react";
import { useVoting } from "@/lib/voting-context";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signIn } from "next-auth/react";
import { Progress } from "@/components/ui/progress";

export function FingerprintScanner() {
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fingerprintId, setFingerprintId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const { authenticateVoter, currentVoter, error, resetError, setError } =
    useVoting();
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (scanning) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setScanning(false);
            setScanComplete(true);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    }

    return () => {
      clearInterval(interval);
    };
  }, [scanning]);

  useEffect(() => {
    if (scanComplete) {
      // Simulate fingerprint matching
      setTimeout(async () => {
        const fingerprintIds = [
          "fp_001",
          "fp_002",
          "fp_003",
          "fp_004",
          "fp_005",
        ];
        const randomIndex = Math.floor(Math.random() * fingerprintIds.length);
        const randomFingerprintId = fingerprintIds[randomIndex];
        setFingerprintId(randomFingerprintId);

        // Start AI verification
        setVerifying(true);

        try {
          // Call the verification API
          const response = await fetch("/api/voters/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fingerprintId: randomFingerprintId }),
          });

          const data = await response.json();

          if (!response.ok) {
            setError(data.message || "Verification failed");
            setVerificationResult({
              isVerified: false,
              confidence: data.confidence || 0,
              message: data.message || "Verification failed",
            });
            setVerifying(false);
            return;
          }

          setVerificationResult(data.verification);

          // Store verification result in session storage
          sessionStorage.setItem(
            "voterVerification",
            JSON.stringify(data.verification),
          );

          // If verification passed, proceed with authentication
          if (data.verification.isVerified) {
            const voter = await authenticateVoter(randomFingerprintId);

            if (voter) {
              if (voter.hasVoted) {
                setError("You have already voted in this election");
              } else {
                // Use NextAuth to sign in
                const result = await signIn("credentials", {
                  fingerprintId: randomFingerprintId,
                  role: "voter",
                  redirect: false,
                });

                if (result?.error) {
                  setError(result.error);
                } else {
                  router.push("/voter/ballot");
                }
              }
            }
          } else {
            setError(
              data.verification.message || "Fingerprint verification failed",
            );
          }
        } catch (err) {
          console.error("Verification error:", err);
          setError("An error occurred during verification");
          setVerificationResult({
            isVerified: false,
            confidence: 0,
            message: "Verification system error",
          });
        }

        setVerifying(false);
        setScanComplete(false);
      }, 1000);
    }
  }, [scanComplete, authenticateVoter, router, setError]);

  const handleScan = () => {
    resetError();
    setFingerprintId(null);
    setVerificationResult(null);
    setScanning(true);
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-6">
          <div
            className={`relative flex h-48 w-48 items-center justify-center rounded-full border-2 ${
              scanning
                ? "border-blue-500"
                : verifying
                  ? "border-yellow-500"
                  : verificationResult?.isVerified
                    ? "border-green-500"
                    : error
                      ? "border-red-500"
                      : "border-gray-300"
            } bg-slate-100 transition-all duration-300`}
          >
            <Fingerprint
              size={100}
              className={`transition-all duration-300 ${
                scanning
                  ? "text-blue-500 animate-pulse"
                  : verifying
                    ? "text-yellow-500 animate-pulse"
                    : verificationResult?.isVerified
                      ? "text-green-500"
                      : error
                        ? "text-red-500"
                        : "text-slate-400"
              }`}
            />

            {scanning && (
              <svg className="absolute -top-1 -left-1 h-[calc(100%+8px)] w-[calc(100%+8px)]">
                <circle
                  cx="50%"
                  cy="50%"
                  r="49%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray="307"
                  strokeDashoffset={307 - (307 * progress) / 100}
                  className="text-blue-500 transform -rotate-90 origin-center"
                />
              </svg>
            )}
          </div>

          {verifying && (
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  AI Verification in progress...
                </span>
                <span className="text-sm font-medium">Analyzing patterns</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
          )}

          {verificationResult && !error && (
            <Alert
              variant={
                verificationResult.isVerified ? "default" : "destructive"
              }
            >
              {verificationResult.isVerified ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <ShieldAlert className="h-4 w-4" />
              )}
              <AlertTitle>
                {verificationResult.isVerified
                  ? "Verification Successful"
                  : "Verification Failed"}
              </AlertTitle>
              <AlertDescription className="flex flex-col gap-1">
                <span>{verificationResult.message}</span>
                <span className="text-xs">
                  Confidence: {verificationResult.confidence}%
                </span>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {fingerprintId && !error && !verificationResult && (
            <Alert>
              <AlertTitle>Fingerprint Detected</AlertTitle>
              <AlertDescription>ID: {fingerprintId}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleScan}
            disabled={scanning || verifying}
            className="w-full"
          >
            {scanning
              ? "Scanning..."
              : verifying
                ? "Verifying..."
                : "Scan Fingerprint"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Place your finger on the scanner to authenticate
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
