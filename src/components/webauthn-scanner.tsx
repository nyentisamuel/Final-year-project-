"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Fingerprint,
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";

interface WebAuthnScannerProps {
  voterId: string;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}

export function WebAuthnScanner({
  voterId,
  onSuccess,
  onError,
}: WebAuthnScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAuthenticate = async () => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      // Begin authentication
      const beginResponse = await fetch("/api/webauthn/authenticate/begin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voterId }),
      });

      if (!beginResponse.ok) {
        const errorData = await beginResponse.json();
        throw new Error(errorData.error || "Failed to begin authentication");
      }

      const options = await beginResponse.json();

      // Start WebAuthn authentication
      const authResponse = await startAuthentication(options);

      // Complete authentication
      const completeResponse = await fetch(
        "/api/webauthn/authenticate/complete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            voterId,
            response: authResponse,
          }),
        },
      );

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || "Authentication failed");
      }

      const result = await completeResponse.json();
      setScanResult(result);
      onSuccess(result);
    } catch (err: any) {
      const errorMessage = err.message || "Authentication failed";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusIcon = () => {
    if (isScanning)
      return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
    if (scanResult?.success)
      return <CheckCircle className="h-8 w-8 text-green-500" />;
    if (error) return <AlertTriangle className="h-8 w-8 text-red-500" />;
    return <Fingerprint className="h-8 w-8 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isScanning) return "Authenticating with biometrics...";
    if (scanResult?.success) return "Authentication successful!";
    if (error) return "Authentication failed";
    return "Ready to authenticate";
  };

  const getStatusColor = () => {
    if (isScanning) return "text-blue-600";
    if (scanResult?.success) return "text-green-600";
    if (error) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Biometric Authentication
        </CardTitle>
        <CardDescription>
          Use your fingerprint, Face ID, or other biometric authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scanner Status */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            {getStatusIcon()}
            {isScanning && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-pulse" />
            )}
          </div>
          <p className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </p>
        </div>

        {/* Authentication Button */}
        <Button
          onClick={handleAuthenticate}
          disabled={isScanning}
          className="w-full"
          size="lg"
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <Fingerprint className="mr-2 h-4 w-4" />
              Authenticate with Biometrics
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Display with AI Verification */}
        {scanResult?.success && scanResult.aiVerification && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Authentication verified successfully!</p>
                <div className="text-xs text-gray-600">
                  <p>AI Confidence: {scanResult.aiVerification.confidence}%</p>
                  <p>Risk Level: {scanResult.aiVerification.riskLevel}</p>
                  {scanResult.aiVerification.riskFactors?.length > 0 && (
                    <p>
                      Risk Factors:{" "}
                      {scanResult.aiVerification.riskFactors.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>• Ensure your device supports biometric authentication</p>
          <p>
            • Follow your device's prompts for fingerprint or face recognition
          </p>
          <p>• Your biometric data never leaves your device</p>
        </div>
      </CardContent>
    </Card>
  );
}
