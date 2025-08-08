import React, { useState, useRef, useEffect } from 'react';
import { useAIAnalyst } from '../contexts/AIAnalystContext';
import { Bot, Minimize2, Send, Mic, MicOff, Download, Trash2, Clock, Brain, TrendingUp, AlertCircle, MessageSquare, Lightbulb } from 'lucide-react';

const AIDataAnalyst = () => {
  const {
    isMinimized,
    setIsMinimized,
    currentPage,
    chatHistory,
    isLoading,
    suggestedQuestions,
    sendMessage,
    sendStreamingMessage,
    clearChat,
    exportChatHistory
  } = useAIAnalyst();

  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef?.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage?.trim() || isLoading) return;

    const message = inputMessage?.trim();
    setInputMessage('');

    if (useStreaming) {
      await sendStreamingMessage(message);
    } else {
      await sendMessage(message);
    }
  };

  const handleKeyPress = (e) => {
    if (e?.key === 'Enter' && !e?.shiftKey) {
      e?.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef?.current) return;

    if (isListening) {
      recognitionRef?.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef?.current?.start();
      setIsListening(true);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
    inputRef?.current?.focus();
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp)?.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPageIcon = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <TrendingUp size={16} className="text-blue-500" />;
      case 'Team Reports':
        return <MessageSquare size={16} className="text-green-500" />;
      case 'Performance Analytics':
        return <Brain size={16} className="text-purple-500" />;
      case 'Goal Tracking':
        return <AlertCircle size={16} className="text-orange-500" />;
      default:
        return <Bot size={16} className="text-gray-500" />;
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed right-4 top-20 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 animate-pulse"
        >
          <Bot size={24} />
        </button>
        {chatHistory?.length > 1 && (
          <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
            {chatHistory?.filter(msg => msg?.type === 'user')?.length}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bot size={24} />
          <div>
            <h3 className="font-semibold">AI Data Analyst</h3>
            <div className="flex items-center space-x-2 text-blue-100 text-sm">
              {getPageIcon()}
              <span>Analyzing: {currentPage}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-blue-100 hover:text-white transition-colors"
        >
          <Minimize2 size={20} />
        </button>
      </div>
      {/* Context Indicator */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-blue-700">
            <Brain size={14} />
            <span>Context: {currentPage} Analysis</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-blue-600 text-xs">Live</span>
          </div>
        </div>
      </div>
      {/* Chat Interface */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory?.map((message) => (
          <div
            key={message?.id}
            className={`flex ${message?.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message?.type === 'user' ?'bg-blue-600 text-white'
                  : message?.type === 'error' ?'bg-red-50 text-red-700 border border-red-200'
                  : message?.type === 'system' ?'bg-gray-50 text-gray-600 text-sm italic border border-gray-200' :'bg-gray-50 text-gray-800 border border-gray-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{message?.content}</div>
              <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                <span>{formatTimestamp(message?.timestamp)}</span>
                {message?.page && message?.page !== currentPage && (
                  <span className="bg-black bg-opacity-20 px-2 py-1 rounded">
                    {message?.page}
                  </span>
                )}
              </div>
              {message?.streaming && (
                <div className="flex items-center space-x-1 mt-2">
                  <div className="h-1 w-1 bg-current rounded-full animate-bounce"></div>
                  <div className="h-1 w-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-1 w-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-[85%]">
              <div className="flex items-center space-x-2">
                <Bot size={16} className="text-blue-600" />
                <span className="text-gray-600">Analyzing your data...</span>
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>
      {/* Quick Actions */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Quick Actions</h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportChatHistory}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="Export Chat"
            >
              <Download size={16} />
            </button>
            <button
              onClick={clearChat}
              className="text-gray-500 hover:text-red-600 transition-colors"
              title="Clear Chat"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => handleSuggestedQuestion("What are our top performance metrics this month?")}
            className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded border border-green-200 transition-colors"
          >
            Summary Performance
          </button>
          <button
            onClick={() => handleSuggestedQuestion("Generate weekly performance report")}
            className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded border border-purple-200 transition-colors"
          >
            Weekly Report
          </button>
        </div>
      </div>
      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e?.target?.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your team's performance..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="2"
              disabled={isLoading}
            />
            {recognitionRef?.current && (
              <button
                onClick={handleVoiceInput}
                className={`absolute right-2 top-2 p-1 rounded transition-colors ${
                  isListening
                    ? 'text-red-600 bg-red-50' :'text-gray-400 hover:text-gray-600'
                }`}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage?.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-3 rounded-lg transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e?.target?.checked)}
                className="rounded"
              />
              <span>Stream responses</span>
            </label>
          </div>
          <div className="flex items-center space-x-1">
            <Clock size={12} />
            <span>Response time: ~2-5s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDataAnalyst;
