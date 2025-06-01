import { ShieldCheck, ShieldAlert, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerificationBadgeProps {
  status: "verified" | "suspicious" | "unverified";
  confidence?: number;
  message?: string;
}

export function VerificationBadge({
  status,
  confidence = 0,
  message,
}: VerificationBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
            inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium
            ${
              status === "verified"
                ? "bg-green-100 text-green-800"
                : status === "suspicious"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }
          `}
          >
            {status === "verified" ? (
              <>
                <ShieldCheck className="h-3 w-3" />
                <span>Verified ({confidence}%)</span>
              </>
            ) : status === "suspicious" ? (
              <>
                <AlertCircle className="h-3 w-3" />
                <span>Suspicious ({confidence}%)</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-3 w-3" />
                <span>Unverified</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {message ||
              (status === "verified"
                ? "Identity verified by AI"
                : "Identity verification failed")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
