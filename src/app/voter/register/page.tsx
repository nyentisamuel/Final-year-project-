"use client";

import type React from "react";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ChevronLeft, Fingerprint } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function VoterRegistrationPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [fingerprintId, setFingerprintId] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { registerVoter, error, resetError } = useVoting();
  const router = useRouter();

  async function handleScanFingerprint() {
    if (!name) {
      setLocalError("Please enter your name first");
      return;
    }

    const data = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array([0, 1, 2, 3, 4, 5]),
        rp: { name: "fingerprint voting" },
        user: {
          id: new Uint8Array(16),
          name: email,
          displayName: name,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -8 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required"
        },
        timeout: 60000,
        attestation: "none"
      },
    });

    setLocalError(null);
    resetError();
    setScanning(true);

    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setScanning(false);
        setScanComplete(true);

        function arrayBufferToBase64(buffer){
          const bytes = new Uint8Array(buffer)
          const binary = bytes.reduce((data, byte) => data + String.fromCharCode(byte), '')
          return btoa(binary)
        }

        

        // Generate a random fingerprint ID 
        setFingerprintId(arrayBufferToBase64(data.rawId));

        

      }
    }, 100);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      setLocalError("Please enter your name");
      return;
    }

    if (!fingerprintId) {
      setLocalError("Please scan your fingerprint");
      return;
    }

    resetError();
    setLocalError(null);

    const voter = await registerVoter({ name, fingerprintId, email });

    if (voter) {
      setSuccess("Registration successful! You can now login to vote.");
      localStorage.setItem('id', fingerprintId)

      // Redirect after a delay
      setTimeout(() => {
        router.push("/voter/login");
      }, 2000);
    }
  };

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
          <h1 className="mb-2 text-3xl font-bold">Voter Registration</h1>
          <p className="text-muted-foreground">
            Register to participate in the election
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Register as a Voter</CardTitle>
            <CardDescription>
              Enter your details and scan your fingerprint
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {localError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{localError}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">Success</AlertTitle>
                  <AlertDescription className="text-green-600">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>

              <div className="space-y-2">
                <Label>Fingerprint</Label>
                <div className="flex flex-col items-center space-y-4">
                  <div
                    className={`relative flex h-32 w-32 items-center justify-center rounded-full border-2 ${
                      scanning
                        ? "border-blue-500"
                        : scanComplete
                          ? "border-green-500"
                          : "border-gray-300"
                    } bg-slate-100 transition-all duration-300`}
                  >
                    <Fingerprint
                      size={64}
                      className={`transition-all duration-300 ${
                        scanning
                          ? "text-blue-500 animate-pulse"
                          : scanComplete
                            ? "text-green-500"
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

                  {fingerprintId ? (
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-600">
                        Fingerprint registered
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {fingerprintId}
                      </p>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleScanFingerprint}
                      disabled={scanning || !name}
                      variant="outline"
                    >
                      {scanning ? "Scanning..." : "Scan Fingerprint"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={!name || !fingerprintId || !!success}
              >
                Register
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
