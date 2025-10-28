import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatMessage from "./ChatMessage";
import { useAgentforce } from "@/hooks/useAgentforce";

interface AgentforceChatProps {
  initialMessage: string;
  onClose: () => void;
}

const AgentforceChat = ({ initialMessage, onClose }: AgentforceChatProps) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, sessionId, isInitializing, isStreaming, error } = useAgentforce();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send initial message when session is ready
  useEffect(() => {
    if (sessionId && !isInitializing && !isStreaming && messages.length === 0 && initialMessage) {
      console.log('[chat] Sending initial message:', initialMessage);
      sendMessage(initialMessage);
    }
  }, [sessionId, isInitializing, isStreaming]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const messageToSend = inputValue;
    setInputValue("");
    await sendMessage(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-screen-xl mx-auto h-[calc(100vh-200px)] flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-chat-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">A</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Agentforce</h3>
              <p className="text-xs text-muted-foreground">Powered by Salesforce</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-chat-background">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isUser={message.isUser}
            />
          ))}
          {isStreaming && (
            <ChatMessage
              message=""
              isUser={false}
              isTyping={true}
            />
          )}
          {error && (
            <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-chat-border">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isStreaming}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isStreaming}
              size="sm"
              className="bg-primary hover:bg-primary-dark"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentforceChat;