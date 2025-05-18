"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Types
export interface Voter {
  id: string;
  name: string;
  fingerprintId: string;
  hasVoted: boolean;
  email?: string;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  position: string;
  electionId: string;
  bio?: string;
  imageUrl?: string;
}

export interface Vote {
  id: string;
  voterId: string;
  candidateId: string;
  timestamp: Date;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

interface VotingContextType {
  // Data
  voters: Voter[];
  candidates: Candidate[];
  elections: Election[];
  currentElection: Election | null;
  currentVoter: Voter | null;

  // Loading states
  isLoading: boolean;
  isVotersLoading: boolean;
  isCandidatesLoading: boolean;
  isElectionsLoading: boolean;
  isVotingLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  authenticateVoter: (fingerprintId: string) => Promise<Voter | null>;
  registerVoter: (
    voter: Omit<Voter, "id" | "hasVoted">,
  ) => Promise<Voter | null>;
  castVote: (candidateId: string) => Promise<boolean>;
  addCandidate: (candidate: Omit<Candidate, "id">) => Promise<Candidate | null>;
  removeCandidate: (id: string) => Promise<boolean>;
  addElection: (election: Omit<Election, "id">) => Promise<Election | null>;
  setCurrentElection: (id: string) => Promise<boolean>;
  getVoteResults: (electionId: string) => Promise<Record<string, any>>;
  getCandidatesByElection: (electionId: string) => Candidate[];
  fetchVoters: () => Promise<void>;
  fetchCandidates: (electionId?: string) => Promise<void>;
  fetchElections: () => Promise<void>;
  setCurrentVoter: (voter: Voter | null) => void;
  resetError: () => void;
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

export const VotingProvider = ({ children }: { children: ReactNode }) => {
  // State for data
  const [voters, setVoters] = useState<Voter[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [currentElection, setCurrentElection] = useState<Election | null>(null);
  const [currentVoter, setCurrentVoter] = useState<Voter | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isVotersLoading, setIsVotersLoading] = useState(false);
  const [isCandidatesLoading, setIsCandidatesLoading] = useState(false);
  const [isElectionsLoading, setIsElectionsLoading] = useState(false);
  const [isVotingLoading, setIsVotingLoading] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const { data: session, status } = useSession();
  const router = useRouter();

  // Reset error
  const resetError = () => setError(null);

  // Fetch elections from API
  const fetchElections = async () => {
    try {
      setIsElectionsLoading(true);
      const response = await fetch("/api/elections");

      if (!response.ok) {
        throw new Error("Failed to fetch elections");
      }

      const data = await response.json();

      // Convert date strings to Date objects
      const formattedElections = data.map((election: any) => ({
        ...election,
        startDate: new Date(election.startDate),
        endDate: new Date(election.endDate),
      }));

      setElections(formattedElections);

      // Set current election if there's an active one
      const activeElection = formattedElections.find(
        (e: Election) => e.isActive,
      );
      if (activeElection) {
        setCurrentElection(activeElection);
      }

      return formattedElections;
    } catch (err) {
      console.error("Error fetching elections:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch elections",
      );
      return [];
    } finally {
      setIsElectionsLoading(false);
    }
  };

  // Fetch candidates from API
  const fetchCandidates = async (electionId?: string) => {
    try {
      setIsCandidatesLoading(true);
      const url = electionId
        ? `/api/candidates?electionId=${electionId}`
        : "/api/candidates";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch candidates");
      }

      const data = await response.json();
      setCandidates(data);
      return data;
    } catch (err) {
      console.error("Error fetching candidates:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch candidates",
      );
      return [];
    } finally {
      setIsCandidatesLoading(false);
    }
  };

  // Fetch voters from API (admin only)
  const fetchVoters = async () => {
    if (!session || session.user.role !== "admin") {
      return;
    }

    try {
      setIsVotersLoading(true);
      const response = await fetch("/api/admin/voters");

      if (!response.ok) {
        throw new Error("Failed to fetch voters");
      }

      const data = await response.json();
      setVoters(data);
    } catch (err) {
      console.error("Error fetching voters:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch voters");
    } finally {
      setIsVotersLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await fetchElections();
      await fetchCandidates();
      if (session?.user.role === "admin") {
        await fetchVoters();
      }
      setIsLoading(false);
    };

    if (status === "authenticated") {
      initializeData();
    } else if (status === "unauthenticated") {
      // Just fetch public data like elections
      const fetchPublicData = async () => {
        setIsLoading(true);
        await fetchElections();
        setIsLoading(false);
      };
      fetchPublicData();
    }
  }, [status, session]);

  // Authenticate voter with fingerprint
  const authenticateVoter = async (
    fingerprintId: string,
  ): Promise<Voter | null> => {
    try {
      const response = await fetch("/api/voters/authenticate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fingerprintId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Authentication failed");
      }

      const voter = await response.json();
      setCurrentVoter(voter);
      return voter;
    } catch (err) {
      console.error("Error authenticating voter:", err);
      setError(err instanceof Error ? err.message : "Authentication failed");
      return null;
    }
  };

  // Register new voter
  const registerVoter = async (
    voter: Omit<Voter, "id" | "hasVoted">,
  ): Promise<Voter | null> => {
    try {
      const response = await fetch("/api/voters/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(voter),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const newVoter = await response.json();
      return newVoter;
    } catch (err) {
      console.error("Error registering voter:", err);
      setError(err instanceof Error ? err.message : "Registration failed");
      return null;
    }
  };

  // Cast a vote
  const castVote = async (candidateId: string): Promise<boolean> => {
    if (!currentElection || !session) {
      setError("No active election or user not authenticated");
      return false;
    }

    try {
      setIsVotingLoading(true);

      const response = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId,
          electionId: currentElection.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cast vote");
      }

      // Update current voter status
      if (currentVoter) {
        setCurrentVoter({
          ...currentVoter,
          hasVoted: true,
        });
      }

      return true;
    } catch (err) {
      console.error("Error casting vote:", err);
      setError(err instanceof Error ? err.message : "Failed to cast vote");
      return false;
    } finally {
      setIsVotingLoading(false);
    }
  };

  // Add new candidate (admin only)
  const addCandidate = async (
    candidate: Omit<Candidate, "id">,
  ): Promise<Candidate | null> => {
    if (!session || session.user.role !== "admin") {
      setError("Unauthorized");
      return null;
    }

    try {
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(candidate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add candidate");
      }

      const newCandidate = await response.json();
      setCandidates([...candidates, newCandidate]);
      return newCandidate;
    } catch (err) {
      console.error("Error adding candidate:", err);
      setError(err instanceof Error ? err.message : "Failed to add candidate");
      return null;
    }
  };

  // Remove candidate (admin only)
  const removeCandidate = async (id: string): Promise<boolean> => {
    if (!session || session.user.role !== "admin") {
      setError("Unauthorized");
      return false;
    }

    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove candidate");
      }

      setCandidates(candidates.filter((c) => c.id !== id));
      return true;
    } catch (err) {
      console.error("Error removing candidate:", err);
      setError(
        err instanceof Error ? err.message : "Failed to remove candidate",
      );
      return false;
    }
  };

  // Add new election (admin only)
  const addElection = async (
    election: Omit<Election, "id">,
  ): Promise<Election | null> => {
    if (!session || session.user.role !== "admin") {
      setError("Unauthorized");
      return null;
    }

    try {
      const response = await fetch("/api/elections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(election),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add election");
      }

      const newElection = await response.json();

      // Convert date strings to Date objects
      const formattedElection = {
        ...newElection,
        startDate: new Date(newElection.startDate),
        endDate: new Date(newElection.endDate),
      };

      setElections([...elections, formattedElection]);

      // If this is the active election, set it as current
      if (formattedElection.isActive) {
        setCurrentElection(formattedElection);
      }

      return formattedElection;
    } catch (err) {
      console.error("Error adding election:", err);
      setError(err instanceof Error ? err.message : "Failed to add election");
      return null;
    }
  };

  // Set active election (admin only)
  const setActiveElection = async (id: string): Promise<boolean> => {
    if (!session || session.user.role !== "admin") {
      setError("Unauthorized");
      return false;
    }

    try {
      const response = await fetch("/api/elections/set-active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ electionId: id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to set active election");
      }

      // Update elections in state
      const updatedElections = elections.map((e) =>
        e.id === id ? { ...e, isActive: true } : { ...e, isActive: false },
      );
      setElections(updatedElections);

      // Update current election
      const newCurrentElection =
        updatedElections.find((e) => e.id === id) || null;
      setCurrentElection(newCurrentElection);

      return true;
    } catch (err) {
      console.error("Error setting active election:", err);
      setError(
        err instanceof Error ? err.message : "Failed to set active election",
      );
      return false;
    }
  };

  // Get vote results for an election
  const getVoteResults = async (
    electionId: string,
  ): Promise<Record<string, any>> => {
    try {
      const response = await fetch(`/api/votes?electionId=${electionId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch vote results");
      }

      const results = await response.json();
      return results;
    } catch (err) {
      console.error("Error fetching vote results:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch vote results",
      );
      return { totalVotes: 0, candidates: [] };
    }
  };

  // Filter candidates by election
  const getCandidatesByElection = (electionId: string): Candidate[] => {
    return candidates.filter((c) => c.electionId === electionId);
  };

  const value = {
    // Data
    voters,
    candidates,
    elections,
    currentElection,
    currentVoter,

    // Loading states
    isLoading,
    isVotersLoading,
    isCandidatesLoading,
    isElectionsLoading,
    isVotingLoading,

    // Error state
    error,

    // Actions
    authenticateVoter,
    registerVoter,
    castVote,
    addCandidate,
    removeCandidate,
    addElection,
    setCurrentElection: setActiveElection,
    getVoteResults,
    getCandidatesByElection,
    fetchVoters,
    fetchCandidates,
    fetchElections,
    setCurrentVoter,
    resetError,
  };

  return (
    <VotingContext.Provider value={value}>{children}</VotingContext.Provider>
  );
};

export const useVoting = () => {
  const context = useContext(VotingContext);
  if (context === undefined) {
    throw new Error("useVoting must be used within a VotingProvider");
  }
  return context;
};
