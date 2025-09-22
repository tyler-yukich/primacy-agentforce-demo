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
  return <div className="flex-1 flex items-center justify-center py-16 px-6">
      <div className="text-center max-w-2xl mx-auto mt-[100px]">
        <div className="mb-10">
          
          
          <p className="text-muted-foreground max-w-lg mx-auto text-4xl">How can we help?</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full mx-auto px-8">
          <div className="flex gap-3">
            <Input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Type your question or tell us what you need help with..." className="flex-1 h-16 text-xl" />
            <Button type="submit" size="lg" disabled={!inputValue.trim()} className="bg-primary hover:bg-primary-dark h-16 px-8 text-2xl">↑</Button>
          </div>
        </form>

      </div>
    </div>;
};
export default PreEngagement;