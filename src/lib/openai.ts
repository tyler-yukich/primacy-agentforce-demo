// Mock OpenAI integration for demo purposes
// In production, this would connect to a real OpenAI API endpoint

interface ChatRequest {
  message: string;
  step: string;
  userData: any;
}

export const generateAgentResponse = async (request: ChatRequest): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { message, step, userData } = request;

  // Mock responses based on conversation flow
  const responses: Record<string, string> = {
    greeting: `Hi there! That's awesome — I'd love to learn more about how Primacy can help you with that! I'm Agentforce, and I'm here to connect you with the right person on our team. To get started, what's your first name?`,
    
    firstName: `Nice to meet you, ${userData.firstName}! And what's your last name?`,
    
    lastName: `Perfect! Could you please share your email address so someone from our team can reach out to you?`,
    
    email: `Great! What company do you work for? (This helps us understand your needs better)`,
    
    company: `Excellent! What industry is ${userData.company || 'your company'} in? This will help us connect you with the right team member.`,
    
    industry: `Thanks, ${userData.firstName}! I've got all the information I need. One of our team members will be in touch shortly to discuss how Primacy can help ${userData.company || 'your business'} achieve its goals. Have a great day!`
  };

  // For the initial greeting, customize based on user's input
  if (step === 'greeting') {
    const userInput = message.toLowerCase();
    if (userInput.includes('conversion') || userInput.includes('cro')) {
      return `That's fantastic! Conversion rate optimization is one of Primacy's specialties. I'd love to learn more about your specific needs and connect you with our CRO experts. To get started, what's your first name?`;
    } else if (userInput.includes('marketing') || userInput.includes('digital')) {
      return `Excellent! Digital marketing is right in our wheelhouse. We'd love to help you drive better results. I'm Agentforce, and I'll get you connected with the right specialist. What's your first name?`;
    } else if (userInput.includes('website') || userInput.includes('performance')) {
      return `Perfect! Website performance optimization is something our team excels at. I'd love to learn more about your goals and get you connected with the right expert. What's your first name?`;
    }
  }

  return responses[step] || "Thanks for that information! Could you tell me a bit more?";
};

export const mockOpenAIAPI = {
  chat: {
    completions: {
      create: async (params: any) => {
        // Mock OpenAI response structure
        return {
          choices: [{
            message: {
              content: await generateAgentResponse({
                message: params.messages[params.messages.length - 1].content,
                step: params.step || 'greeting',
                userData: params.userData || {}
              })
            }
          }]
        };
      }
    }
  }
};