import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatMessage from "./ChatMessage";
import { useAgentforce } from "@/hooks/useAgentforce";
import agentforceLogo from "@/assets/agentforce-logo.svg";
interface AgentforceChatProps {
  initialMessage: string;
  onClose: () => void;
}
const AgentforceChat = ({
  initialMessage,
  onClose
}: AgentforceChatProps) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    sendMessage,
    sessionId,
    isInitializing,
    isStreaming,
    error
  } = useAgentforce();

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
  return <div className="flex flex-col h-[450px] md:h-[600px] w-full">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-chat-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-chat-agent-avatar flex items-center justify-center">
              <img src={agentforceLogo} alt="Agentforce" className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">PRIMACY_agent</h3>
              <p className="text-xs text-muted-foreground">Powered by Agentforce</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-chat-background">
          {messages.map(message => <ChatMessage key={message.id} message={message.text} isUser={message.isUser} />)}
          {(() => {
          const lastAssistantMessage = messages.filter(m => !m.isUser).pop();
          const showTyping = isStreaming && (!lastAssistantMessage || lastAssistantMessage.text.length === 0);
          return showTyping && <ChatMessage message="" isUser={false} isTyping={true} />;
        })()}
          {error && <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-chat-border">
          <div className="flex gap-2">
            <Input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type your message..." className="flex-1" disabled={isStreaming} />
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isStreaming} size="sm" className="bg-primary hover:bg-primary-dark">
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default AgentforceChat;