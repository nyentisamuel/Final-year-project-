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
  UserPlus,
} from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";

interface WebAuthnRegistrationProps {
  voterId: string;
  voterName: string;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}

export function WebAuthnRegistration({
  voterId,
  voterName,
  onSuccess,
  onError,
}: WebAuthnRegistrationProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setIsRegistering(true);
    setError(null);
    setRegistrationResult(null);

    try {
      // Begin registration
      const beginResponse = await fetch("/api/webauthn/register/begin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voterId }),
      });

      if (!beginResponse.ok) {
        const errorData = await beginResponse.json();
        throw new Error(errorData.error || "Failed to begin registration");
      }

      const options = await beginResponse.json();

      // Start WebAuthn registration
      const regResponse = await startRegistration(options);

      // Complete registration
      const completeResponse = await fetch("/api/webauthn/register/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voterId,
          response: regResponse,
        }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const result = await completeResponse.json();
      setRegistrationResult(result);
      onSuccess(result);
    } catch (err: any) {
      const errorMessage = err.message || "Registration failed";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const getStatusIcon = () => {
    if (isRegistering)
      return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
    if (registrationResult?.success)
      return <CheckCircle className="h-8 w-8 text-green-500" />;
    if (error) return <AlertTriangle className="h-8 w-8 text-red-500" />;
    return <UserPlus className="h-8 w-8 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isRegistering) return "Registering biometric authentication...";
    if (registrationResult?.success) return "Registration successful!";
    if (error) return "Registration failed";
    return "Ready to register biometric authentication";
  };

  const getStatusColor = () => {
    if (isRegistering) return "text-blue-600";
    if (registrationResult?.success) return "text-green-600";
    if (error) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Register Biometric Authentication
        </CardTitle>
        <CardDescription>
          Set up fingerprint, Face ID, or other biometric authentication for{" "}
          {voterName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Registration Status */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            {getStatusIcon()}
            {isRegistering && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-pulse" />
            )}
          </div>
          <p className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </p>
        </div>

        {/* Registration Button */}
        <Button
          onClick={handleRegister}
          disabled={isRegistering || registrationResult?.success}
          className="w-full"
          size="lg"
        >
          {isRegistering ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : registrationResult?.success ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Registration Complete
            </>
          ) : (
            <>
              <Fingerprint className="mr-2 h-4 w-4" />
              Register Biometric Authentication
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
        {registrationResult?.success && registrationResult.aiVerification && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Biometric authentication registered successfully!</p>
                <div className="text-xs text-gray-600">
                  <p>
                    AI Confidence:{" "}
                    {registrationResult.aiVerification.confidence}%
                  </p>
                  <p>
                    Risk Level: {registrationResult.aiVerification.riskLevel}
                  </p>
                  {registrationResult.aiVerification.riskFactors?.length >
                    0 && (
                    <p>
                      Risk Factors:{" "}
                      {registrationResult.aiVerification.riskFactors.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>• Your device must support biometric authentication</p>
          <p>• Follow your device's prompts to register your biometric</p>
          <p>• Your biometric data is stored securely on your device</p>
          <p>• This registration is required for secure voting</p>
        </div>
      </CardContent>
    </Card>
  );
}
