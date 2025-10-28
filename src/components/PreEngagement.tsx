import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
interface PreEngagementProps {
  onStartChat: (message: string) => void;
}
const PreEngagement = ({
  onStartChat
}: PreEngagementProps) => {
  const [inputValue, setInputValue] = useState("");
  const isMobile = useIsMobile();
  
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
      <div className="text-center w-full max-w-screen-xl mx-auto mt-[75px] mb-[100px] md:mt-[150px] md:mb-[200px]">
        <div>
          
          
          <p className="text-primary max-w-lg mx-auto text-4xl md:text-5xl font-space-grotesk font-light">How can we help?</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full mx-auto px-8 mt-12">
          <div className="relative w-full">
            <Input 
              value={inputValue} 
              onChange={e => setInputValue(e.target.value)} 
              placeholder={isMobile ? "Ask me a question!" : "Ask me a question to learn more about Primacy and our client work!"} 
              className="flex-1 w-full h-12 md:h-16 text-xl pr-16"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-chat-agent-avatar text-white flex items-center justify-center text-2xl disabled:opacity-50 hover:bg-primary transition-colors"
              aria-label="Submit message"
            >
              ↑
            </button>
          </div>
        </form>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onStartChat(suggestion)}
              className="inline-flex items-center justify-center rounded-full border border-input bg-[#2c2e33] text-white px-4 py-3 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
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