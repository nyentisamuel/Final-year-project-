import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Secure Fingerprint Voting System
          </h1>
          <p className="mb-8 text-xl text-slate-600">
            A modern, secure voting platform using fingerprint authentication
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Voter Access</CardTitle>
                <CardDescription>
                  Cast your vote securely using fingerprint authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex h-32 items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="128"
                    height="128"
                    viewBox="0 0 14 14"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      // stroke-linecap="round"
                      // stroke-linejoin="round"
                    >
                      <path d="M5.5 13.5V8.25A1.25 1.25 0 0 1 6.75 7h0A1.25 1.25 0 0 1 8 8.25V11h2a2 2 0 0 1 2 2v.5" />
                      <path d="M3.39 8.61a4.75 4.75 0 1 1 6.72 0" />
                    </g>
                  </svg>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Link href="/voter/login" className="w-full">
                  <Button className="w-full">Vote Now</Button>
                </Link>
                <Link href="/voter/register" className="w-full">
                  <Button variant="outline" className="w-full">
                    Register as Voter
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Admin Portal</CardTitle>
                <CardDescription>
                  Manage elections and view real-time results
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex h-32 items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100"
                    height="100"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-600"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/admin/login" className="w-full">
                  <Button variant="outline" className="w-full">
                    Admin Login
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
