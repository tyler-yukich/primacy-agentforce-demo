import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

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
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-primary-foreground" />
        </div>
      )}
      
      <div className={cn(
        "max-w-[70%] rounded-2xl px-4 py-3 shadow-sm",
        isUser 
          ? "bg-chat-user text-primary-foreground ml-auto" 
          : "bg-chat-agent text-foreground"
      )}>
        {isTyping ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Agentforce is responding</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-100"></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-200"></div>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{message}</p>
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;