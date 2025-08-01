import React, { createContext, useContext, useState, useEffect } from 'react';
import openaiService from '../utils/openaiService';

const AIAnalystContext = createContext();

export const useAIAnalyst = () => {
  const context = useContext(AIAnalystContext);
  if (!context) {
    throw new Error('useAIAnalyst must be used within an AIAnalystProvider');
  }
  return context;
};

export const AIAnalystProvider = ({ children }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [performanceContext, setPerformanceContext] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [sessionData, setSessionData] = useState({});

  // Initialize with welcome message
  useEffect(() => {
    if (chatHistory?.length === 0) {
      setChatHistory([
        {
          id: Date.now(),
          type: 'assistant',
          content: `Hello! I'm your AI Data Analyst. I'm here to help you analyze team performance, identify trends, and provide actionable insights across all your manager pages. How can I assist you today?`,
          timestamp: new Date(),
          page: currentPage
        }
      ]);
    }
  }, []);

  // Generate suggested questions when context changes
  useEffect(() => {
    const generateQuestions = async () => {
      if (!performanceContext) return;

      try {
        const response = await openaiService?.generateSuggestedQuestions(performanceContext);
        if (response?.success) {
          setSuggestedQuestions(response?.data);
        }
      } catch (error) {
        console.error('Error generating suggested questions:', error);
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
      const response = await openaiService?.getChatCompletion(message, performanceContext);
      
      if (response?.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: response?.data?.content,
          timestamp: new Date(),
          page: currentPage,
          usage: response?.data?.usage
        };

        setChatHistory(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          type: 'error',
          content: `I apologize, but I encountered an error: ${response?.error}. Please try again.`,
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
      let fullContent = '';

      const response = await openaiService?.getStreamingChatCompletion(
        message, 
        performanceContext, 
        (chunk) => {
          fullContent += chunk;
          setChatHistory(prev => 
            prev?.map(msg => 
              msg?.id === assistantMessage?.id 
                ? { ...msg, content: fullContent }
                : msg
            )
          );
          if (onChunk) onChunk(chunk);
        }
      );

      if (response?.success) {
        setChatHistory(prev => 
          prev?.map(msg => 
            msg?.id === assistantMessage?.id 
              ? { ...msg, streaming: false }
              : msg
          )
        );
      } else {
        setChatHistory(prev => 
          prev?.map(msg => 
            msg?.id === assistantMessage?.id 
              ? { 
                  ...msg, 
                  content: `I apologize, but I encountered an error: ${response?.error}. Please try again.`,
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

    // Add context change message to chat
    const contextMessage = {
      id: Date.now(),
      type: 'system',
      content: `Context updated: Now analyzing ${page} data`,
      timestamp: new Date(),
      page: page
    };

    setChatHistory(prev => [...prev, contextMessage]);
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