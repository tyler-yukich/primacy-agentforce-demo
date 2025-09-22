// Mock OpenAI integration for demo purposes
// In production, this would connect to a real OpenAI API endpoint

interface ChatRequest {
  message: string;
  step: string;
  userData: any;
}

// Comprehensive Primacy knowledge base for realistic responses
const PRIMACY_KNOWLEDGE = {
  company: {
    history: "Founded in 2009, Primacy has been a leading 360° digital marketing agency based in Connecticut for over 15 years, helping businesses of all sizes achieve extraordinary growth through data-driven strategies and creative solutions.",
    team: "Our team of 45+ certified specialists includes Google Ads experts, SEO strategists, conversion optimization analysts, creative directors, and data scientists who work together to deliver exceptional results.",
    awards: ["Connecticut Small Business Excellence Award 2023", "Google Premier Partner Status", "HubSpot Diamond Partner", "Top Digital Agency New England 2022-2024"],
    values: "We believe in transparency, data-driven decision making, and treating every client's success as our own. Our collaborative approach ensures you're always in the loop."
  },
  
  industryExperience: {
    education: [
      "Helped Stamford Public Schools increase parent engagement by 65% through comprehensive digital communication strategy",
      "Worked with Connecticut Department of Education on statewide awareness campaign reaching 2M+ residents",
      "Assisted New Haven Community College boost enrollment by 40% through targeted digital campaigns"
    ],
    healthcare: [
      "Reduced customer acquisition cost by 45% for Hartford HealthCare while doubling monthly leads",
      "Helped Yale New Haven Hospital improve patient portal adoption by 85% through user experience optimization",
      "Increased online appointment bookings by 120% for Connecticut Children's Medical Center"
    ],
    nonprofit: [
      "Boosted United Way of Connecticut donations by 78% through integrated digital fundraising campaigns",
      "Helped Habitat for Humanity Connecticut increase volunteer signups by 200% via social media strategy",
      "Improved Connecticut Food Bank's donor retention rate by 55% through email marketing automation"
    ],
    government: [
      "Streamlined citizen services portal for City of Hartford, improving user satisfaction scores by 90%",
      "Developed digital transparency initiative for Connecticut State Treasury, increasing public engagement by 150%",
      "Created emergency communication system for Fairfield County that reaches 95% of residents within 2 hours"
    ],
    business: [
      "SaaS company conversion rate increased from 2.1% to 4.8% through checkout optimization and personalized CTAs",
      "Connecticut e-commerce client saw 67% increase in organic traffic after comprehensive SEO strategy",
      "B2B manufacturer's lead generation boosted by 340% through strategic PPC and landing page optimization",
      "Financial services firm reduced cost per lead by 60% while improving lead quality scores by 45%"
    ]
  },

  services: {
    seo: "Our SEO specialists focus on technical SEO, content strategy, and local search optimization with proven results across industries",
    ppc: "We manage Google Ads, Microsoft Ads, and social media advertising with a focus on ROI and conversion tracking",
    "conversion optimization": "Our CRO team uses advanced A/B testing, heatmap analysis, and user journey optimization to maximize conversion rates",
    "web development": "Full-stack development team specializing in performance optimization, accessibility, and conversion-focused design",
    "content marketing": "Strategic content creation that drives engagement, builds authority, and generates qualified leads",
    "social media": "Comprehensive social media management and advertising across all major platforms with measurable ROI",
    "email marketing": "Sophisticated automation sequences and segmentation strategies that nurture leads and retain customers",
    "analytics": "Advanced tracking, reporting, and data analysis to optimize performance across all marketing channels",
    branding: "Complete brand strategy and identity development that resonates with your target audience",
    consulting: "Strategic digital marketing consulting and audits to identify opportunities and optimize existing efforts"
  },

  capabilities: {
    "team size": "45+ certified digital marketing specialists",
    "client retention": "96% client retention rate with average partnership lasting 3.5+ years",
    "results timeline": "Most clients see initial improvements within 30-60 days, with significant growth by month 6",
    "reporting": "Weekly performance reports with monthly strategy calls and quarterly business reviews",
    "certifications": "Google Premier Partner, HubSpot Diamond Partner, Microsoft Advertising Select Partner, Facebook Marketing Partner"
  }
};

export const generateAgentResponse = async (request: ChatRequest): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { message, step, userData } = request;
  const userInput = message.toLowerCase();

  // Enhanced conversational responses with Primacy knowledge
  const responses: Record<string, string> = {
    greeting: generateGreetingResponse(userInput),
    
    discovery: generateDiscoveryResponse(userInput, userData),
    
    exploration: generateExplorationResponse(userInput, userData),
    
    needs_assessment: generateNeedsAssessmentResponse(userInput, userData),
    
    firstName: `Thanks for sharing more about your situation, ${userData.firstName || 'there'}! This sounds like something our team can definitely help with. To make sure I connect you with the right specialist, what's your last name?`,
    
    lastName: `Perfect, ${userData.firstName}! Could you share your email address so our team can send you some relevant case studies and set up a consultation?`,
    
    email: `Great! What company do you work for? This helps us understand your business context better.`,
    
    company: `Excellent! What industry is ${userData.company || 'your company'} in? This will help us connect you with a specialist who has experience in your sector.`,
    
    industry: `Perfect, ${userData.firstName}! Based on everything you've shared, I think our team can provide some valuable insights for ${userData.company || 'your business'}. One of our specialists will reach out within 24 hours with some initial recommendations and to schedule a strategic consultation. Thanks for your time!`
  };

  return responses[step] || generateGenericResponse(userInput);
};

function generateGreetingResponse(userInput: string): string {
  // Handle specific questions about agency capabilities
  const response = generateContextualResponse(userInput);
  if (response) return response;
  
  // Handle general marketing topics
  if (userInput.includes('conversion') || userInput.includes('cro')) {
    return `Conversion rate optimization is one of our strongest areas! ${PRIMACY_KNOWLEDGE.industryExperience.business[0]} What's your current conversion rate, and where do you think the biggest opportunities might be?`;
  } 
  
  if (userInput.includes('traffic') || userInput.includes('seo')) {
    return `SEO and traffic growth - excellent! ${PRIMACY_KNOWLEDGE.industryExperience.business[1]} What's your biggest challenge right now - getting found in search, or converting the traffic you already have?`;
  }
  
  if (userInput.includes('leads') || userInput.includes('lead generation')) {
    return `Lead generation is something we're really passionate about! ${PRIMACY_KNOWLEDGE.industryExperience.business[2]} What's your current lead volume like, and what's your biggest bottleneck?`;
  }
  
  if (userInput.includes('marketing') || userInput.includes('digital')) {
    return `Digital marketing is our bread and butter! ${PRIMACY_KNOWLEDGE.company.history} What specific area of your marketing feels like it needs the most attention right now?`;
  }
  
  if (userInput.includes('website') || userInput.includes('performance')) {
    return `Website performance is crucial for conversions! Our development team specializes in making sites lightning-fast and conversion-focused. What issues are you seeing - slow load times, poor mobile experience, or low conversion rates?`;
  }
  
  // Natural fallback that still provides value
  return `Thanks for reaching out! As a full-service digital marketing agency, we help businesses like yours grow through strategic SEO, PPC, conversion optimization, and more. ${PRIMACY_KNOWLEDGE.company.history.split('.')[0]}. What's the biggest challenge you're facing with your digital presence right now?`;
}

function generateDiscoveryResponse(userInput: string, userData: any): string {
  if (userInput.includes('competitor') || userInput.includes('competition')) {
    return `Competition can definitely be tough! We've helped many clients outperform their competitors through strategic positioning and optimization. What do you think your competitors are doing that you're not? And what advantages do you think you have that we could leverage better?`;
  }
  
  if (userInput.includes('budget') || userInput.includes('cost')) {
    return `Budget is always an important consideration. The good news is that digital marketing can be scaled to fit different budgets, and we focus on ROI from day one. What kind of results would make a marketing investment feel worthwhile to you?`;
  }
  
  if (userInput.includes('tried') || userInput.includes('attempt')) {
    return `It sounds like you've done some experimenting already - that's smart! What have you tried before, and what kind of results did you see? Understanding what hasn't worked helps us avoid those pitfalls and focus on what will move the needle.`;
  }
  
  return `That's really helpful context! ${generateCaseStudyExample(userInput)} What would success look like for you - are you more focused on increasing traffic, improving conversions, or generating more qualified leads?`;
}

function generateExplorationResponse(userInput: string, userData: any): string {
  if (userInput.includes('timeline') || userInput.includes('when') || userInput.includes('time')) {
    return `Timeline expectations are important to set upfront. Some improvements can happen quickly (like PPC optimization), while others build over time (like SEO). What's driving your timeline - is there a particular deadline or goal you're working toward?`;
  }
  
  if (userInput.includes('team') || userInput.includes('internal')) {
    return `It's great that you're thinking about team dynamics! We work best as an extension of our clients' teams. Do you have internal marketing resources, or would we be handling most of the digital marketing strategy and execution?`;
  }
  
  return `Based on what you're telling me, this sounds like exactly the type of challenge our team loves to tackle. ${generateRelevantExpertise(userInput)} Would you like me to connect you with one of our specialists who can dive deeper into your specific situation?`;
}

function generateNeedsAssessmentResponse(userInput: string, userData: any): string {
  if (userInput.includes('yes') || userInput.includes('interested') || userInput.includes('connect')) {
    return `Fantastic! I'd love to get you connected with the right person on our team. They'll be able to provide some specific recommendations based on everything we've discussed. What's your first name?`;
  }
  
  if (userInput.includes('information') || userInput.includes('learn')) {
    return `Of course! I'd be happy to share more information. ${generateServiceInfo(userInput)} Would you like me to have someone send you some relevant case studies and insights, or do you have other specific questions?`;
  }
  
  return `I understand you might want to think it over. ${generateCaseStudyExample(userInput)} Would it be helpful if I had someone from our team send you some relevant case studies and insights with no pressure to move forward?`;
}

function generateContextualResponse(userInput: string): string | null {
  const input = userInput.toLowerCase();
  
  // Industry-specific questions
  if (input.includes('education') || input.includes('school') || input.includes('public') || input.includes('university') || input.includes('college')) {
    const example = PRIMACY_KNOWLEDGE.industryExperience.education[Math.floor(Math.random() * PRIMACY_KNOWLEDGE.industryExperience.education.length)];
    return `Absolutely! We have extensive experience in the education sector. ${example} What specific challenges is your institution facing with digital outreach or communication?`;
  }
  
  if (input.includes('healthcare') || input.includes('medical') || input.includes('hospital') || input.includes('clinic')) {
    const example = PRIMACY_KNOWLEDGE.industryExperience.healthcare[Math.floor(Math.random() * PRIMACY_KNOWLEDGE.industryExperience.healthcare.length)];
    return `Yes, we work with several healthcare organizations! ${example} What are your main priorities - patient engagement, appointment bookings, or something else?`;
  }
  
  if (input.includes('nonprofit') || input.includes('non-profit') || input.includes('charity') || input.includes('foundation')) {
    const example = PRIMACY_KNOWLEDGE.industryExperience.nonprofit[Math.floor(Math.random() * PRIMACY_KNOWLEDGE.industryExperience.nonprofit.length)];
    return `We love working with nonprofits! ${example} Are you looking to increase donations, volunteer signups, or general awareness?`;
  }
  
  if (input.includes('government') || input.includes('municipal') || input.includes('city') || input.includes('state') || input.includes('federal')) {
    const example = PRIMACY_KNOWLEDGE.industryExperience.government[Math.floor(Math.random() * PRIMACY_KNOWLEDGE.industryExperience.government.length)];
    return `Yes, we have great experience with government clients! ${example} What's your main goal - improving citizen services, increasing engagement, or transparency?`;
  }
  
  // Company-specific questions
  if (input.includes('team') || input.includes('who') || input.includes('staff') || input.includes('employees')) {
    return `Great question! ${PRIMACY_KNOWLEDGE.company.team} We're also ${PRIMACY_KNOWLEDGE.capabilities.certifications}. What size team are you looking to work with?`;
  }
  
  if (input.includes('experience') || input.includes('how long') || input.includes('established') || input.includes('founded')) {
    return `${PRIMACY_KNOWLEDGE.company.history} We've maintained a ${PRIMACY_KNOWLEDGE.capabilities["client retention"]} which speaks to the relationships we build. What type of experience are you looking for?`;
  }
  
  if (input.includes('results') || input.includes('success') || input.includes('track record') || input.includes('case stud')) {
    const businessExample = PRIMACY_KNOWLEDGE.industryExperience.business[Math.floor(Math.random() * PRIMACY_KNOWLEDGE.industryExperience.business.length)];
    return `We love talking results! Here's a recent example: ${businessExample} ${PRIMACY_KNOWLEDGE.capabilities["results timeline"]} What kind of results are you hoping to achieve?`;
  }
  
  if (input.includes('award') || input.includes('recognition') || input.includes('certified') || input.includes('partner')) {
    return `We're proud of our recognition in the industry! ${PRIMACY_KNOWLEDGE.company.awards.join(', ')}, and we're ${PRIMACY_KNOWLEDGE.capabilities.certifications}. What's most important to you when choosing an agency partner?`;
  }
  
  if (input.includes('process') || input.includes('approach') || input.includes('methodology') || input.includes('how do you')) {
    return `Our approach is built on ${PRIMACY_KNOWLEDGE.company.values} ${PRIMACY_KNOWLEDGE.capabilities.reporting} What aspect of our process would you like to know more about?`;
  }
  
  // Service-specific responses
  if (input.includes('price') || input.includes('cost') || input.includes('budget') || input.includes('investment')) {
    return `Investment varies based on scope and goals, but we work with businesses of all sizes. ${PRIMACY_KNOWLEDGE.capabilities["results timeline"]} What kind of budget range were you considering for your digital marketing?`;
  }
  
  return null; // No specific match found
}

function generateCaseStudyExample(userInput: string): string {
  if (userInput.includes('ecommerce') || userInput.includes('e-commerce') || userInput.includes('online store')) {
    return PRIMACY_KNOWLEDGE.industryExperience.business[1];
  }
  if (userInput.includes('b2b') || userInput.includes('manufacturing') || userInput.includes('business')) {
    return PRIMACY_KNOWLEDGE.industryExperience.business[2];
  }
  if (userInput.includes('startup') || userInput.includes('healthcare') || userInput.includes('acquisition')) {
    return PRIMACY_KNOWLEDGE.industryExperience.business[0];
  }
  return PRIMACY_KNOWLEDGE.industryExperience.business[3];
}

function generateRelevantExpertise(userInput: string): string {
  for (const [key, value] of Object.entries(PRIMACY_KNOWLEDGE.services)) {
    if (userInput.includes(key)) {
      return value;
    }
  }
  return PRIMACY_KNOWLEDGE.company.history;
}

function generateServiceInfo(userInput: string): string {
  for (const [key, value] of Object.entries(PRIMACY_KNOWLEDGE.services)) {
    if (userInput.includes(key)) {
      return value;
    }
  }
  return "Our comprehensive approach includes strategy development, implementation, and ongoing optimization across all digital channels to deliver measurable results.";
}

function generateGenericResponse(userInput: string): string {
  // Even generic responses should provide some value
  const response = generateContextualResponse(userInput);
  if (response) return response;
  
  return `That's great information! ${PRIMACY_KNOWLEDGE.company.history.split('.')[0]}. Tell me more about what's driving this need and what success would look like for you.`;
}

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