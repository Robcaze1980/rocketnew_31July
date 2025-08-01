import React, { useState, useEffect, useRef } from 'react';
        import { useAuth } from '../../../contexts/AuthContext';
        import openaiService from '../../../utils/openaiService';
        
        import { MessageCircle, Send, Bot, User, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react';

        const AIPerformanceChat = ({ performanceData, isVisible, onToggle }) => {
          const { user } = useAuth();
          const [messages, setMessages] = useState([]);
          const [inputMessage, setInputMessage] = useState('');
          const [isLoading, setIsLoading] = useState(false);
          const [isStreaming, setIsStreaming] = useState(false);
          const [suggestedQuestions, setSuggestedQuestions] = useState([]);
          const [isMinimized, setIsMinimized] = useState(false);
          const [error, setError] = useState(null);
          const messagesEndRef = useRef(null);
          const chatContainerRef = useRef(null);

          // Auto-scroll to bottom when new messages arrive
          const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          };

          useEffect(() => {
            scrollToBottom();
          }, [messages]);

          // Load suggested questions when component mounts or performance data changes
          useEffect(() => {
            if (isVisible && performanceData) {
              loadSuggestedQuestions();
            }
          }, [isVisible, performanceData]);

          // Initialize chat with welcome message
          useEffect(() => {
            if (isVisible && messages.length === 0) {
              setMessages([{
                id: 1,
                type: 'ai',
                content: `Hello! I'm your AI Performance Analytics Assistant. I can help you analyze your team's performance data, identify trends, and provide actionable insights.

        I have access to your current team performance metrics and can answer questions about:
        • Team member performance comparisons
        • Sales trends and forecasting
        • Goal achievement analysis
        • Commission optimization strategies
        • Performance improvement recommendations

        What would you like to explore today?`,
                timestamp: new Date()
              }]);
            }
          }, [isVisible]);

          const loadSuggestedQuestions = async () => {
            try {
              const result = await openaiService.generateSuggestedQuestions(performanceData);
              if (result.success) {
                setSuggestedQuestions(result.data);
              }
            } catch (error) {
              console.error('Failed to load suggested questions:', error);
              // Use fallback questions
              setSuggestedQuestions([
                "What are the key factors driving our top performer's success?",
                "How can we improve our team's average conversion rate?",
                "What strategies should we implement to reach our quarterly goals?",
                "Which team members need additional support or training?"
              ]);
            }
          };

          const handleSendMessage = async (message = null) => {
            const messageToSend = message || inputMessage.trim();
            if (!messageToSend || isLoading) return;

            const newUserMessage = {
              id: Date.now(),
              type: 'user',
              content: messageToSend,
              timestamp: new Date()
            };

            setMessages(prev => [...prev, newUserMessage]);
            setInputMessage('');
            setIsLoading(true);
            setIsStreaming(true);
            setError(null);

            // Create placeholder for AI response
            const aiMessageId = Date.now() + 1;
            const aiMessage = {
              id: aiMessageId,
              type: 'ai',
              content: '',
              timestamp: new Date(),
              isStreaming: true
            };

            setMessages(prev => [...prev, aiMessage]);

            try {
              // Use streaming chat completion for real-time response
              await openaiService.getStreamingChatCompletion(
                messageToSend,
                performanceData,
                (chunk) => {
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, content: msg.content + chunk }
                      : msg
                  ));
                }
              );

              // Mark streaming as complete
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, isStreaming: false }
                  : msg
              ));

            } catch (error) {
              console.error('AI Chat Error:', error);
              setError(error.message);
              
              // Replace streaming message with error
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { 
                      ...msg, 
                      content: 'I apologize, but I encountered an error processing your request. Please try again or check your OpenAI configuration.',
                      isStreaming: false,
                      isError: true
                    }
                  : msg
              ));
            } finally {
              setIsLoading(false);
              setIsStreaming(false);
            }
          };

          const handleSuggestedQuestion = (question) => {
            handleSendMessage(question);
          };

          const handleKeyPress = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          };

          if (!isVisible) {
            return (
              <button
                onClick={onToggle}
                className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 z-50"
                title="Open AI Performance Assistant"
              >
                <MessageCircle size={24} />
              </button>
            );
          }

          return (
            <div 
              className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
                isMinimized ? 'w-80 h-16' : 'w-96 h-[32rem]'
              }`}
            >
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 rounded-t-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">AI Performance Assistant</h3>
                    <p className="text-xs text-gray-500">
                      {isStreaming ? 'Analyzing...' : 'Ready to help'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1 hover:bg-gray-200 rounded"
                    title={isMinimized ? 'Maximize' : 'Minimize'}
                  >
                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                  </button>
                  <button
                    onClick={onToggle}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Messages Container */}
                  <div 
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 h-80"
                  >
                    {messages.map((message) => (
                      <div 
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start space-x-2 max-w-[85%] ${
                          message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            message.type === 'user' ?'bg-blue-600' 
                              : message.isError 
                                ? 'bg-red-600' :'bg-gray-600'
                          }`}>
                            {message.type === 'user' ? (
                              <User size={12} className="text-white" />
                            ) : (
                              <Bot size={12} className="text-white" />
                            )}
                          </div>
                          <div className={`px-3 py-2 rounded-lg ${
                            message.type === 'user' ?'bg-blue-600 text-white'
                              : message.isError
                                ? 'bg-red-50 text-red-800 border border-red-200' :'bg-gray-100 text-gray-800'
                          }`}>
                            <div className="text-sm whitespace-pre-wrap">
                              {message.content}
                              {message.isStreaming && (
                                <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1"></span>
                              )}
                            </div>
                            <div className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Suggested Questions */}
                  {messages.length <= 1 && suggestedQuestions.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
                      <div className="space-y-1">
                        {suggestedQuestions.slice(0, 2).map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestedQuestion(question)}
                            className="w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded border border-blue-200 transition-colors"
                            disabled={isLoading}
                          >
                            <Sparkles size={10} className="inline mr-1" />
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="p-4 border-t border-gray-200">
                    {error && (
                      <div className="mb-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about team performance..."
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      />
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={isLoading || !inputMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-md transition-colors"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        };

        export default AIPerformanceChat;