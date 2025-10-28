import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PreEngagement from "@/components/PreEngagement";
import AgentforceChat from "@/components/AgentforceChat";

const Index = () => {
  const [chatMessage, setChatMessage] = useState<string | null>(null);

  const handleStartChat = (message: string) => {
    setChatMessage(message);
  };

  const handleCloseChat = () => {
    setChatMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 min-h-0 flex">
        {chatMessage ? (
          <AgentforceChat 
            initialMessage={chatMessage}
            onClose={handleCloseChat}
          />
        ) : (
          <PreEngagement onStartChat={handleStartChat} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
