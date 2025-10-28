import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle } from "lucide-react";
interface PreEngagementProps {
  onStartChat: (message: string) => void;
}
const PreEngagement = ({
  onStartChat
}: PreEngagementProps) => {
  const [inputValue, setInputValue] = useState("");
  
  const SUGGESTIONS = [
    "What industries do you specialize in?",
    "Tell me about your recent case studies",
    "How does your pricing work?",
    "Can you integrate with my Salesforce data?"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onStartChat(inputValue.trim());
    }
  };
  return <div className="flex-1 flex items-center justify-center px-6">
      <div className="text-center w-full max-w-screen-xl mx-auto">
        <div>
          
          
          <p className="text-muted-foreground max-w-lg mx-auto text-4xl">How can we help?</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full mx-auto px-8 mt-12">
          <div className="flex w-full gap-3">
            <Input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Type your question or tell us what you need help with..." className="flex-1 min-w-0 h-16 text-xl" />
            <Button type="submit" size="lg" disabled={!inputValue.trim()} className="bg-chat-agent-avatar hover:bg-black h-16 px-8 text-2xl text-white">↑</Button>
          </div>
        </form>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onStartChat(suggestion)}
              className="inline-flex items-center justify-center rounded-full border border-input bg-background px-4 py-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label={`Ask: ${suggestion}`}
            >
              {suggestion}
            </button>
          ))}
        </div>

      </div>
    </div>;
};
export default PreEngagement;