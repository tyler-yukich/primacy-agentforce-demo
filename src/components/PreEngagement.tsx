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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onStartChat(inputValue.trim());
    }
  };
  return <div className="flex-1 flex items-center justify-center px-6">
      <div className="bg-background rounded-lg shadow-lg p-12 w-full max-w-5xl">
        <div className="text-center">
          <div className="mb-8">
            
            
            <p className="text-xl text-muted-foreground mx-auto">Agentforce is our digital assistant built to help Primacy connect faster with prospective clients.</p>
          </div>

          <form onSubmit={handleSubmit} className="mx-auto">
            <div className="flex gap-2 justify-center">
              <Input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Type your question or tell us what you need help with..." className="flex-1 h-12 text-base" />
              <Button type="submit" size="lg" disabled={!inputValue.trim()} className="bg-primary hover:bg-primary-dark h-12 px-6">
                Start Chat
              </Button>
            </div>
          </form>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 mx-auto">
            {["I need help with conversion rate optimization", "Tell me about your digital marketing services", "I want to improve my website's performance"].map((suggestion, index) => <Button key={index} variant="outline" onClick={() => onStartChat(suggestion)} className="text-left justify-start h-auto p-4 whitespace-normal text-sm">
                {suggestion}
              </Button>)}
          </div>
        </div>
      </div>
    </div>;
};
export default PreEngagement;