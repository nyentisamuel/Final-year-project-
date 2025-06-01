"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";

// Mock data for fraud detection logs
const mockLogs = [
  {
    id: "log1",
    timestamp: new Date("2024-05-22T08:30:00"),
    fingerprintId: "fp_003",
    voterName: "Bob Johnson",
    confidence: 95,
    status: "verified",
    message: "Verification successful. Fingerprint matched.",
    riskFactors: [],
  },
  {
    id: "log2",
    timestamp: new Date("2024-05-22T09:15:00"),
    fingerprintId: "fp_unknown_1",
    voterName: "Unknown",
    confidence: 30,
    status: "rejected",
    message:
      "Verification failed. Fingerprint does not match any registered voter.",
    riskFactors: ["Unknown fingerprint", "Multiple failed attempts"],
  },
  {
    id: "log3",
    timestamp: new Date("2024-05-22T10:05:00"),
    fingerprintId: "fp_002",
    voterName: "Jane Smith",
    confidence: 75,
    status: "suspicious",
    message: "Verification suspicious. Unusual login pattern detected.",
    riskFactors: ["Unusual time of day", "Different device than registration"],
  },
  {
    id: "log4",
    timestamp: new Date("2024-05-22T11:20:00"),
    fingerprintId: "fp_004",
    voterName: "Alice Brown",
    confidence: 92,
    status: "verified",
    message: "Verification successful. Fingerprint matched.",
    riskFactors: [],
  },
  {
    id: "log5",
    timestamp: new Date("2024-05-22T12:45:00"),
    fingerprintId: "fp_001",
    voterName: "John Doe",
    confidence: 88,
    status: "verified",
    message: "Verification successful. Fingerprint matched.",
    riskFactors: [],
  },
];

export default function FraudDetectionPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }

    // In a real app, we would fetch logs from an API
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setLogs(mockLogs);
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError("Failed to fetch fraud detection logs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [status, router]);

  if (status === "loading" || isLoading) {
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
              You need to login as an admin to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/login" className="w-full">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b bg-white p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Fraud Detection Logs</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>AI Verification Logs</CardTitle>
            <CardDescription>
              Review all fingerprint verification attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Voter</TableHead>
                  <TableHead>Fingerprint ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Risk Factors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.timestamp.toLocaleString()}</TableCell>
                    <TableCell>{log.voterName}</TableCell>
                    <TableCell>{log.fingerprintId}</TableCell>
                    <TableCell>
                      {log.status === "verified" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      ) : log.status === "suspicious" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          <AlertCircle className="h-3 w-3" />
                          Suspicious
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          <ShieldAlert className="h-3 w-3" />
                          Rejected
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{log.confidence}%</TableCell>
                    <TableCell>
                      {log.riskFactors.length > 0 ? (
                        <ul className="list-disc pl-4 text-xs">
                          {log.riskFactors.map(
                            (factor: string, index: number) => (
                              <li key={index}>{factor}</li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          None
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
