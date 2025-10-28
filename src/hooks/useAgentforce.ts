import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface UseAgentforceReturn {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  sessionId: string | null;
  isInitializing: boolean;
  isStreaming: boolean;
  error: string | null;
}

export function useAgentforce(): UseAgentforceReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
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
          const errorText = await response.text();
          console.error('[hook] Init failed with status:', response.status, 'body:', errorText);
          throw new Error('Failed to initialize session');
        }

        const data = await response.json();
        console.log('[hook] Session init response:', data);

        if (!data.sessionId) {
          throw new Error('No session ID received from server');
        }

        console.log('[hook] Session ID received:', data.sessionId);
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
    setIsStreaming(true);
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
              console.log('Received [DONE] signal - finalizing stream');
              setIsStreaming(false);
              break; // Stop reading immediately
            }

            try {
              const parsed = JSON.parse(data);
              
              // Edge function transforms Salesforce events to simple format
              const content = parsed.content;
          
          if (content) {
            
            setMessages(prev =>
                  prev.map(msg => {
                    if (msg.id !== assistantMessageId) return msg;
                    
                    const currentText = msg.text || '';
                    const newContent = String(content);
                    
                    // If incoming content starts with current text, it's an aggregate - replace
                    if (newContent.startsWith(currentText) && newContent.length > currentText.length) {
                      console.log('[dedup] Detected aggregate, replacing');
                      assistantText = newContent;
                      return { ...msg, text: newContent };
                    }
                    
                    // Otherwise, append as delta
                    assistantText = currentText + newContent;
                    return { ...msg, text: assistantText };
                  })
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
        console.warn('[hook] Stream completed but no content received');
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, text: "Hmm, I didn't quite catch that — could you try rephrasing your question?" }
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
      setIsStreaming(false);
    }
  };

  return {
    messages,
    sendMessage,
    sessionId,
    isInitializing,
    isStreaming,
    error,
  };
}
