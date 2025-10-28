import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface UseAgentforceReturn {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useAgentforce(): UseAgentforceReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const sessionInitialized = useRef(false);

  const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agentforce-proxy`;

  // Initialize session on mount
  useEffect(() => {
    if (sessionInitialized.current) return;
    sessionInitialized.current = true;

    const initSession = async () => {
      try {
        console.log('Initializing Agentforce session...');
        const response = await fetch(`${edgeFunctionUrl}?action=init`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to initialize session');
        }

        const data = await response.json();
        console.log('Session initialized:', data.sessionId);
        setSessionId(data.sessionId);
        setIsInitializing(false);
      } catch (err) {
        console.error('Session initialization error:', err);
        setError('Failed to connect to the agent. Please refresh the page.');
        setIsInitializing(false);
      }
    };

    initSession();
  }, [edgeFunctionUrl]);

  const sendMessage = async (text: string) => {
    if (!sessionId) {
      setError('Session not initialized. Please refresh the page.');
      return;
    }

    if (!text.trim()) return;

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text,
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending message to Agentforce:', text);
      
      const response = await fetch(`${edgeFunctionUrl}?action=message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

      let assistantText = '';
      let assistantMessageId = `assistant-${Date.now()}`;
      let buffer = '';

      // Add initial assistant message
      setMessages(prev => [
        ...prev,
        { id: assistantMessageId, text: '', isUser: false }
      ]);

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream complete');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Skip empty lines and comments
          if (!trimmedLine || trimmedLine.startsWith(':')) continue;
          
          // Parse SSE data
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6);
            
            // Check for done signal
            if (data === '[DONE]') {
              console.log('Received [DONE] signal');
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              
              // Extract text content from various possible formats
              let content = '';
              if (parsed.choices?.[0]?.delta?.content) {
                content = parsed.choices[0].delta.content;
              } else if (parsed.content) {
                content = parsed.content;
              } else if (parsed.text) {
                content = parsed.text;
              } else if (typeof parsed === 'string') {
                content = parsed;
              }

              if (content) {
                assistantText += content;
                
                // Update the assistant message
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, text: assistantText }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data, e);
            }
          }
        }
      }

      // If no text was received, show a fallback message
      if (!assistantText) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, text: 'I received your message. How can I help you further?' }
              : msg
          )
        );
      }

    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      
      // Remove the user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    sendMessage,
    isLoading: isLoading || isInitializing,
    error,
  };
}
