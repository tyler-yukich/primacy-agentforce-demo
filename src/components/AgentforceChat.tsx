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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasStreamingRef = useRef(false);
  
  const {
    messages,
    sendMessage,
    sessionId,
    isInitializing,
    isStreaming,
    error
  } = useAgentforce();

  const NEAR_BOTTOM_PX = 80;
  const isNearBottom = (c: HTMLDivElement) =>
    c.scrollHeight - (c.scrollTop + c.clientHeight) < NEAR_BOTTOM_PX;

  const scrollToBottom = (opts?: { smooth?: boolean }) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Only auto-scroll if content exceeds container height (scrollbar is active)
    const hasScrollbar = container.scrollHeight > container.clientHeight;
    if (!hasScrollbar) return;

    // Respect user if not near the bottom
    if (!isNearBottom(container)) return;

    const smooth = !!opts?.smooth;
    const prev = container.style.scrollBehavior;
    container.style.scrollBehavior = smooth ? 'smooth' : 'auto';
    container.scrollTo({ top: container.scrollHeight });
    
    // Reset behavior shortly after a smooth scroll completes
    if (smooth) {
      window.setTimeout(() => {
        if (!messagesContainerRef.current) return;
        container.style.scrollBehavior = prev || 'auto';
      }, 450);
    }
  };

  // Send initial message immediately on mount (optimistic UI)
  const initialMessageSent = useRef(false);
  useEffect(() => {
    if (initialMessage && !initialMessageSent.current) {
      initialMessageSent.current = true;
      console.log('[chat] Sending initial message:', initialMessage);
      sendMessage(initialMessage);
    }
  }, []); // Empty deps - only run once on mount

  // Auto-scroll when messages change or typing indicator appears
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // If we are currently streaming, batch updates and use instant scroll
    if (isStreaming) {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToBottom({ smooth: false });
      }, 100);
    } else {
      // If we just finished streaming, do one smooth scroll
      if (wasStreamingRef.current) {
        scrollToBottom({ smooth: true });
      } else {
        // For non-stream changes (e.g., user sends message), also smooth
        scrollToBottom({ smooth: true });
      }
    }

    wasStreamingRef.current = isStreaming;
  }, [messages, isStreaming]);

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
        <div 
          ref={messagesContainerRef} 
          className="flex-1 min-h-0 overflow-y-auto p-4 bg-chat-background"
          style={{ overscrollBehavior: 'contain', scrollbarGutter: 'stable' }}
        >
          {messages.map(message => <ChatMessage key={message.id} message={message.text} isUser={message.isUser} />)}
          {(() => {
          const lastMessage = messages[messages.length - 1];
          const showTyping = isStreaming && lastMessage?.isUser === true;
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