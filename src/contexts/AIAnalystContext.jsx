import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AIAnalystContext = createContext();

export const useAIAnalyst = () => {
  const context = useContext(AIAnalystContext);
  if (!context) {
    throw new Error('useAIAnalyst must be used within an AIAnalystProvider');
  }
  return context;
};

export const AIAnalystProvider = ({ children }) => {
  const { userProfile } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [performanceContext, setPerformanceContext] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [sessionData, setSessionData] = useState({});

  // Initialize with welcome message
  useEffect(() => {
    // Only set welcome message if chat history is empty and we have user profile data
    if (chatHistory?.length === 0 && (userProfile || userProfile === null)) {
      // Extract first name from full_name
      let userName = 'Sales Team Member';
      if (userProfile?.full_name) {
        userName = userProfile.full_name.split(' ')[0];
      } else if (userProfile?.email) {
        userName = userProfile.email.split('@')[0];
      }
      setChatHistory([
        {
          id: Date.now(),
          type: 'assistant',
          content: `Hello ${userName}! I'm your AI Data Analyst at Daly City Mitsubishi. How can I assist you today?`,
          timestamp: new Date(),
          page: currentPage
        }
      ]);
    }
  }, [userProfile, chatHistory?.length]);

  // Generate suggested questions when context changes
  useEffect(() => {
    const generateQuestions = async () => {
      if (!performanceContext) return;

      try {
        // Send request to n8n webhook to generate suggested questions
        const response = await fetch('https://8n8-n8n.80r4dr.easypanel.host/webhook/d7ef1725-2c5a-4c7f-8791-fd57f86604a2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'generate_questions',
            context: performanceContext,
            user: userProfile,
            page: currentPage
          }),
        });

        if (response?.ok) {
          const text = await response?.text();
          // Check if response is JSON
          if (text?.startsWith('{') || text?.startsWith('[')) {
            const data = JSON.parse(text);
            setSuggestedQuestions(data?.questions || [
              "What are our top performance metrics this month?",
              "Show me areas that need improvement",
              "Generate weekly performance report",
              "What coaching recommendations do you have?"
            ]);
          } else {
            // If not JSON, set default questions
            setSuggestedQuestions([
              "What are our top performance metrics this month?",
              "Show me areas that need improvement",
              "Generate weekly performance report",
              "What coaching recommendations do you have?"
            ]);
          }
        }
      } catch (error) {
        console.error('Error generating suggested questions:', error);
        // Set default questions if there's an error
        setSuggestedQuestions([
          "What are our top performance metrics this month?",
          "Show me areas that need improvement",
          "Generate weekly performance report",
          "What coaching recommendations do you have?"
        ]);
      }
    };

    generateQuestions();
  }, [performanceContext, currentPage]);

  const sendMessage = async (message) => {
    if (!message?.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      page: currentPage
    };

    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send message to n8n webhook through proxy
      const response = await fetch('https://8n8-n8n.80r4dr.easypanel.host/webhook/d7ef1725-2c5a-4c7f-8791-fd57f86604a2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          context: performanceContext,
          user: userProfile,
          page: currentPage
        }),
      });

      if (response?.ok) {
        const text = await response?.text();
        // Check if response is JSON
        if (text?.startsWith('{') || text?.startsWith('[')) {
          const data = JSON.parse(text);
          const assistantMessage = {
            id: Date.now() + 1,
            type: 'assistant',
            content: data?.output || data?.response || 'I received your message. How else can I assist you?',
            timestamp: new Date(),
            page: currentPage
          };

          setChatHistory(prev => [...prev, assistantMessage]);
        } else {
          // If not JSON, provide a default response
          const assistantMessage = {
            id: Date.now() + 1,
            type: 'assistant',
            content: text || 'I received your message. How else can I assist you?',
            timestamp: new Date(),
            page: currentPage
          };

          setChatHistory(prev => [...prev, assistantMessage]);
        }
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          type: 'error',
          content: `I apologize, but I encountered an error: ${response?.statusText}. Please try again.`,
          timestamp: new Date(),
          page: currentPage
        };

        setChatHistory(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'I apologize, but I encountered an unexpected error. Please try again.',
        timestamp: new Date(),
        page: currentPage
      };

      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendStreamingMessage = async (message, onChunk) => {
    if (!message?.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      page: currentPage
    };

    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);

    const assistantMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      page: currentPage,
      streaming: true
    };

    setChatHistory(prev => [...prev, assistantMessage]);

    try {
      // Send message to n8n webhook through proxy
      const response = await fetch('https://8n8-n8n.80r4dr.easypanel.host/webhook/d7ef1725-2c5a-4c7f-8791-fd57f86604a2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          context: performanceContext,
          user: userProfile,
          page: currentPage
        }),
      });

      if (response?.ok) {
        const text = await response?.text();
        let fullContent = 'I received your message. How else can I assist you?';
        
        // Check if response is JSON
        if (text?.startsWith('{') || text?.startsWith('[')) {
          const data = JSON.parse(text);
          fullContent = data?.output || data?.response || 'I received your message. How else can I assist you?';
        } else {
          // If not JSON, use the text response
          fullContent = text || 'I received your message. How else can I assist you?';
        }
        
        // Simulate streaming by sending chunks
        let index = 0;
        const interval = setInterval(() => {
          if (index < fullContent?.length) {
            const chunk = fullContent?.substring(index, index + 10); // Send 10 characters at a time
            index += 10;
            setChatHistory(prev => 
              prev?.map(msg => 
                msg?.id === assistantMessage?.id 
                  ? { ...msg, content: fullContent?.substring(0, index) }
                  : msg
              )
            );
            if (onChunk) onChunk(chunk);
          } else {
            clearInterval(interval);
            setChatHistory(prev => 
              prev?.map(msg => 
                msg?.id === assistantMessage?.id 
                  ? { ...msg, streaming: false }
                  : msg
              )
            );
          }
        }, 50); // Send a chunk every 50ms
      } else {
        setChatHistory(prev => 
          prev?.map(msg => 
            msg?.id === assistantMessage?.id 
              ? { 
                  ...msg, 
                  content: `I apologize, but I encountered an error: ${response?.statusText}. Please try again.`,
                  type: 'error',
                  streaming: false
                }
              : msg
          )
        );
      }
    } catch (error) {
      setChatHistory(prev => 
        prev?.map(msg => 
          msg?.id === assistantMessage?.id 
            ? { 
                ...msg, 
                content: 'I apologize, but I encountered an unexpected error. Please try again.',
                type: 'error',
                streaming: false
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updatePageContext = (page, context) => {
    setCurrentPage(page);
    setPerformanceContext(context);
    
    // Store session data for this page
    setSessionData(prev => ({
      ...prev,
      [page]: {
        ...context,
        lastUpdated: new Date()
      }
    }));

    // Don't add context change message to chat to avoid clutter
    // The context is used by the n8n webhook but doesn't need to be displayed
  };

  const clearChat = () => {
    setChatHistory([
      {
        id: Date.now(),
        type: 'assistant',
        content: `Chat cleared. I'm ready to help you analyze your ${currentPage} data. What would you like to know?`,
        timestamp: new Date(),
        page: currentPage
      }
    ]);
  };

  const exportChatHistory = () => {
    const chatData = {
      exportDate: new Date()?.toISOString(),
      currentPage,
      messages: chatHistory,
      performanceContext,
      sessionData
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-chat-export-${currentPage?.toLowerCase()}-${new Date()?.toISOString()?.split('T')?.[0]}.json`;
    document.body?.appendChild(link);
    link?.click();
    document.body?.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const value = {
    isMinimized,
    setIsMinimized,
    currentPage,
    chatHistory,
    isLoading,
    performanceContext,
    suggestedQuestions,
    sessionData,
    sendMessage,
    sendStreamingMessage,
    updatePageContext,
    clearChat,
    exportChatHistory
  };

  return (
    <AIAnalystContext.Provider value={value}>
      {children}
    </AIAnalystContext.Provider>
  );
};
