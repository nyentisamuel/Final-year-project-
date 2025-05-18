"use client";

import { CardFooter } from "@/components/ui/card";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVoting } from "@/lib/voting-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AlertCircle, LogOut, Plus, UserCheck, UserX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    party: "",
    position: "President",
    electionId: "",
  });

  const [newElection, setNewElection] = useState({
    title: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    isActive: true,
  });

  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [voteResults, setVoteResults] = useState<any>({
    totalVotes: 0,
    candidates: [],
  });
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  const router = useRouter();
  const { data: session, status } = useSession();

  const {
    candidates,
    voters,
    elections,
    currentElection,
    error,
    resetError,
    addCandidate,
    removeCandidate,
    addElection,
    setCurrentElection,
    getVoteResults,
    fetchVoters,
    fetchCandidates,
    fetchElections,
    isLoading,
    isVotersLoading,
    isCandidatesLoading,
    isElectionsLoading,
  } = useVoting();

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  // Fetch vote results when current election changes
  useEffect(() => {
    const fetchResults = async () => {
      if (currentElection) {
        setIsLoadingResults(true);
        const results = await getVoteResults(currentElection.id);
        setVoteResults(results);
        setIsLoadingResults(false);
      }
    };

    fetchResults();
  }, [currentElection, getVoteResults]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/admin/login");
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    resetError();
    setSuccess(null);

    if (!newCandidate.name || !newCandidate.party || !newCandidate.electionId) {
      setLocalError("Please fill in all fields");
      return;
    }

    const candidate = await addCandidate(newCandidate);

    if (candidate) {
      setSuccess(`Candidate ${candidate.name} added successfully`);
      setNewCandidate({
        name: "",
        party: "",
        position: "President",
        electionId: "",
      });
    }
  };

  const handleRemoveCandidate = async (id: string, name: string) => {
    resetError();
    const success = await removeCandidate(id);

    if (success) {
      setSuccess(`Candidate ${name} removed successfully`);
    }
  };

  const handleAddElection = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    resetError();
    setSuccess(null);

    if (!newElection.title || !newElection.description) {
      setLocalError("Please fill in all fields");
      return;
    }

    if (newElection.startDate >= newElection.endDate) {
      setLocalError("End date must be after start date");
      return;
    }

    const election = await addElection(newElection);

    if (election) {
      setSuccess(`Election "${election.title}" added successfully`);
      setNewElection({
        title: "",
        description: "",
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        isActive: true,
      });
    }
  };

  const handleSetActiveElection = async (id: string) => {
    resetError();
    const success = await setCurrentElection(id);

    if (success) {
      setSuccess("Active election updated successfully");
    }
  };

  // Calculate total votes
  const totalVotes = voteResults.totalVotes || 0;

  // Calculate percentage of voters who have voted
  const votersWhoVoted = voters.filter((voter) => voter.hasVoted).length;
  const voterPercentage =
    voters.length > 0 ? (votersWhoVoted / voters.length) * 100 : 0;

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];

  // Prepare data for chart
  const chartData = voteResults.candidates || [];

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
              You need to login as an admin to access this page
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/admin/login" className="w-full">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b bg-white p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <Button variant="ghost" size="sm" className="mr-10" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-4">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Candidates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{candidates.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Votes Cast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVotes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Voter Participation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {voterPercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {votersWhoVoted} out of {voters.length} registered voters
              </p>
            </CardContent>
          </Card>
        </div>

        {success && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

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

        <Tabs defaultValue="results">
          <TabsList className="mb-4">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="elections">Elections</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="voters">Voters</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Election Results</CardTitle>
                <CardDescription>
                  Real-time voting results for the current election
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingResults ? (
                  <div className="flex h-40 items-center justify-center">
                    <p className="text-muted-foreground">Loading results...</p>
                  </div>
                ) : chartData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="votes" name="Votes">
                          {chartData.map((entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={colors[index % colors.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    <p className="text-muted-foreground">
                      No votes have been cast yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="elections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Election</CardTitle>
                <CardDescription>Create a new election event</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddElection} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Election Title</Label>
                      <Input
                        id="title"
                        value={newElection.title}
                        onChange={(e) =>
                          setNewElection({
                            ...newElection,
                            title: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newElection.description}
                        onChange={(e) =>
                          setNewElection({
                            ...newElection,
                            description: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newElection.startDate ? (
                              format(newElection.startDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newElection.startDate}
                            onSelect={(date) =>
                              date &&
                              setNewElection({
                                ...newElection,
                                startDate: date,
                              })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newElection.endDate ? (
                              format(newElection.endDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newElection.endDate}
                            onSelect={(date) =>
                              date &&
                              setNewElection({ ...newElection, endDate: date })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Button type="submit">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Election
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manage Elections</CardTitle>
                <CardDescription>View and manage all elections</CardDescription>
              </CardHeader>
              <CardContent>
                {isElectionsLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <p className="text-muted-foreground">
                      Loading elections...
                    </p>
                  </div>
                ) : elections.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {elections.map((election) => (
                        <TableRow key={election.id}>
                          <TableCell className="font-medium">
                            {election.title}
                          </TableCell>
                          <TableCell>{election.description}</TableCell>
                          <TableCell>
                            {format(
                              new Date(election.startDate),
                              "MMM d, yyyy",
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(election.endDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {election.isActive ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                Inactive
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!election.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleSetActiveElection(election.id)
                                }
                              >
                                Set Active
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    <p className="text-muted-foreground">
                      No elections added yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Candidate</CardTitle>
                <CardDescription>
                  Add a new candidate to an election
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCandidate} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Candidate Name</Label>
                      <Input
                        id="name"
                        value={newCandidate.name}
                        onChange={(e) =>
                          setNewCandidate({
                            ...newCandidate,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="party">Political Party</Label>
                      <Input
                        id="party"
                        value={newCandidate.party}
                        onChange={(e) =>
                          setNewCandidate({
                            ...newCandidate,
                            party: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={newCandidate.position}
                        onChange={(e) =>
                          setNewCandidate({
                            ...newCandidate,
                            position: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="election">Election</Label>
                      <select
                        id="election"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newCandidate.electionId}
                        onChange={(e) =>
                          setNewCandidate({
                            ...newCandidate,
                            electionId: e.target.value,
                          })
                        }
                      >
                        {elections.map((election) => (
                          <option key={election.id} value={election.id}>
                            {election.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button type="submit">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Candidate
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Voters</CardTitle>
                <CardDescription>Manage registered voters</CardDescription>
              </CardHeader>
              <CardContent>
                {isVotersLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <p className="text-muted-foreground">Loading voters...</p>
                  </div>
                ) : voters.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voters.map((voter) => (
                        <TableRow key={voter.id}>
                          <TableCell className="font-medium">
                            {voter.name}
                          </TableCell>
                          <TableCell>{voter.email}</TableCell>
                          <TableCell>
                            {voter.hasVoted ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Voted
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                Pending
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                console.log("Approve Voter", voter.id)
                              }
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                console.log("Reject Voter", voter.id)
                              }
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    <p className="text-muted-foreground">
                      No voters registered yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
