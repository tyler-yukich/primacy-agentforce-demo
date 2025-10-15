import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { generateAgentResponse } from "@/lib/openai";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface UserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  industry?: string;
}

interface AgentforceChatProps {
  initialMessage: string;
  onClose: () => void;
}

const AgentforceChat = ({ initialMessage, onClose }: AgentforceChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: initialMessage, isUser: true }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userData, setUserData] = useState<UserData>({});
  const [currentStep, setCurrentStep] = useState<'greeting' | 'discovery' | 'exploration' | 'needs_assessment' | 'firstName' | 'lastName' | 'email' | 'company' | 'industry' | 'complete'>('greeting');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial greeting
    handleAgentResponse();
  }, []);

  const handleAgentResponse = async () => {
    setIsTyping(true);
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const responseText = await generateAgentResponse({
        message: initialMessage,
        step: currentStep,
        userData: userData
      });

      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: responseText,
        isUser: false
      }]);
      
      // Advance to next step with enhanced conversational flow
      const stepSequence: Record<string, string> = {
        greeting: 'discovery',
        discovery: 'exploration', 
        exploration: 'needs_assessment',
        needs_assessment: 'firstName',
        firstName: 'lastName',
        lastName: 'email',
        email: 'company',
        company: 'industry',
        industry: 'complete'
      };
      
      setCurrentStep(stepSequence[currentStep] as any);
    } catch (error) {
      setIsTyping(false);
      toast.error("Sorry, I'm having trouble responding right now. Please try again.");
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    
    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: userMessage,
      isUser: true
    }]);

    // Update user data based on current step
    const newUserData = { ...userData };
    if (currentStep === 'firstName') {
      newUserData.firstName = userMessage;
    } else if (currentStep === 'lastName') {
      newUserData.lastName = userMessage;
    } else if (currentStep === 'email') {
      newUserData.email = userMessage;
    } else if (currentStep === 'company') {
      newUserData.company = userMessage;
    } else if (currentStep === 'industry') {
      newUserData.industry = userMessage;
    }
    // For conversational steps, we don't store specific data but keep the conversation context
    setUserData(newUserData);

    setInputValue("");

    // Generate agent response
    setIsTyping(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const responseText = await generateAgentResponse({
        message: userMessage,
        step: currentStep,
        userData: newUserData
      });

      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: responseText,
        isUser: false
      }]);
      
      // Advance to next step with enhanced conversational flow
      const stepSequence: Record<string, string> = {
        discovery: 'exploration',
        exploration: 'needs_assessment', 
        needs_assessment: 'firstName',
        firstName: 'lastName',
        lastName: 'email',
        email: 'company',
        company: 'industry',
        industry: 'complete'
      };
      
      const nextStep = stepSequence[currentStep];
      if (nextStep) {
        setCurrentStep(nextStep as any);
      }

      if (currentStep === 'industry') {
        toast.success("Lead captured successfully! Our team will be in touch soon.");
      }
    } catch (error) {
      setIsTyping(false);
      toast.error("Sorry, I'm having trouble responding right now. Please try again.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
              <p className="text-xs text-muted-foreground">Primacy Assistant</p>
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
          {isTyping && (
            <ChatMessage
              message=""
              isUser={false}
              isTyping={true}
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {currentStep !== 'complete' && (
          <div className="p-4 border-t border-chat-border">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                size="sm"
                className="bg-primary hover:bg-primary-dark"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentforceChat;