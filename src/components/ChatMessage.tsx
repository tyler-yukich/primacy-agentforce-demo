import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import agentforceLogo from "@/assets/agentforce-logo.svg";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  isTyping?: boolean;
}

const ChatMessage = ({ message, isUser, isTyping }: ChatMessageProps) => {
  return (
    <div className={cn(
      "flex gap-3 mb-4 animate-fade-in",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-chat-agent-avatar flex items-center justify-center flex-shrink-0">
          <img src={agentforceLogo} alt="Agentforce" className="w-5 h-5" />
        </div>
      )}
      
      <div className={cn(
        "max-w-[70%] rounded-2xl px-4 py-3 shadow-sm",
        isUser 
          ? "bg-chat-user text-primary-foreground ml-auto" 
          : "bg-chat-agent text-foreground"
      )}>
        {isTyping ? (
          <div className="flex items-center gap-1 py-2">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce-dot"></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce-dot" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce-dot" style={{ animationDelay: "0.4s" }}></div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-line">{message}</p>
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-chat-agent-avatar flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;