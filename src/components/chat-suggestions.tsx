"use client";

import { Button } from "@/components/ui/button";
import { useChat } from "@/lib/chat-context";
import { usePathname } from "next/navigation";

export function ChatSuggestions() {
  const { sendMessage, toggleChat } = useChat();
  const pathname = usePathname();

  const getSuggestions = () => {
    if (pathname.includes("/voter/login")) {
      return [
        "How do I authenticate with biometrics?",
        "What if my fingerprint isn't recognized?",
        "Is my biometric data secure?",
      ];
    } else if (pathname.includes("/voter/register")) {
      return [
        "How do I register to vote?",
        "What information do I need to provide?",
        "How does biometric registration work?",
      ];
    } else if (pathname.includes("/voter/ballot")) {
      return [
        "How do I cast my vote?",
        "Can I change my vote after submitting?",
        "How do I know my vote was counted?",
      ];
    } else if (pathname.includes("/admin")) {
      return [
        "How do I view election results?",
        "How does fraud detection work?",
        "How do I manage candidates?",
      ];
    }
    return [
      "How does the voting system work?",
      "Is my vote secure and private?",
      "What are the system requirements?",
    ];
  };

  const handleSuggestionClick = async (suggestion: string) => {
    toggleChat();
    setTimeout(() => {
      sendMessage(suggestion);
    }, 100);
  };

  const suggestions = getSuggestions();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Quick Help:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => handleSuggestionClick(suggestion)}
            className="text-xs"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
