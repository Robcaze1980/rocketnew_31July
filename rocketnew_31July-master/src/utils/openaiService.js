import OpenAI from 'openai';

class OpenAIQuotaExceededError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OpenAIQuotaExceededError';
  }
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage in React
});

const openaiService = {
  // Analyze warranty screenshot using official OpenAI client with structured output
  analyzeWarrantyScreenshot: async (file) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your_vite_openai_api_key' || apiKey === 'your-openai-api-key-here') {
        throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file');
      }

      // Convert file to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this warranty contract image and extract specific financial information for commission calculations.

                CRITICAL EXTRACTION TARGETS:
                1. PRIMARY COST FIELD: Look for "File ID" field in the "Current Service Contract" section - this value should be used as the cost
                2. SELLING PRICE: Look for "Selling Price"in the "Primary Service Contract Pricing" section 3. FALLBACK COST: If"File ID" is not found, look for "Default Price" or "Total" as alternative cost fields
                
                FIELD IDENTIFICATION GUIDE:
                - File ID appears as a decimal number (e.g., 994.00) and represents the actual cost for commission calculation
                - Selling Price is typically in the pricing section at the bottom and shows the final customer price
                - Total in the pricing section may also serve as a cost reference if File ID is unavailable
                
                CALCULATION RULES:
                - Cost should be the File ID value when available
                - Profit = Selling Price - Cost
                - If specific fields cannot be found, return 0 for those fields`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`
                }
              }
            ]
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'warranty_analysis_response',
            schema: {
              type: 'object',
              properties: {
                selling_price: { type: 'number' },
                cost: { type: 'number' },
                profit: { type: 'number' },
                extraction_source: {
                  type: 'object',
                  properties: {
                    cost_field: { type: 'string' },
                    selling_price_field: { type: 'string' }
                  },
                  required: ['cost_field', 'selling_price_field'],
                  additionalProperties: false
                }
              },
              required: ['selling_price', 'cost', 'profit', 'extraction_source'],
              additionalProperties: false
            }
          }
        },
        max_tokens: 400
      });

      const content = response.choices[0]?.message?.content?.trim();
      
      if (!content) {
        throw new Error('No response from OpenAI service');
      }

      // Parse JSON response
      const result = JSON.parse(content);
      
      return {
        success: true,
        data: {
          selling_price: parseFloat(result.selling_price) || 0,
          cost: parseFloat(result.cost) || 0,
          profit: parseFloat(result.profit) || 0,
          extraction_source: result.extraction_source || {}
        }
      };

    } catch (error) {
      if (error.status === 429) {
        throw new OpenAIQuotaExceededError('OpenAI API quota exceeded. Please check your usage limits.');
      }
      
      return {
        success: false,
        error: error.message || 'Failed to analyze warranty screenshot'
      };
    }
  },

  // Analyze service screenshot using official OpenAI client with structured output
  analyzeServiceScreenshot: async (file) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your_vite_openai_api_key' || apiKey === 'your-openai-api-key-here') {
        throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file');
      }

      // Convert file to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this service contract image and extract the following information:
                
                1. Look for a row labeled "Price | Cost" or similar pricing information
                2. Extract the first value as the service price
                3. Extract the second value as the service cost
                4. Calculate profit as: Price - Cost
                
                If you cannot find specific values, return 0 for those fields.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`
                }
              }
            ]
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'service_analysis_response',
            schema: {
              type: 'object',
              properties: {
                price: { type: 'number' },
                cost: { type: 'number' },
                profit: { type: 'number' }
              },
              required: ['price', 'cost', 'profit'],
              additionalProperties: false
            }
          }
        },
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content?.trim();
      
      if (!content) {
        throw new Error('No response from OpenAI service');
      }

      // Parse JSON response
      const result = JSON.parse(content);
      
      return {
        success: true,
        data: {
          price: parseFloat(result.price) || 0,
          cost: parseFloat(result.cost) || 0,
          profit: parseFloat(result.profit) || 0
        }
      };

    } catch (error) {
      if (error.status === 429) {
        throw new OpenAIQuotaExceededError('OpenAI API quota exceeded. Please check your usage limits.');
      }
      
      return {
        success: false,
        error: error.message || 'Failed to analyze service screenshot'
      };
    }
  },

  // Analyze maintenance screenshot using OpenAI
  analyzeMaintenanceScreenshot: async (file) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your_vite_openai_api_key' || apiKey === 'your-openai-api-key-here') {
        throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file');
      }

      // Convert file to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this maintenance contract image and extract pricing information:
                
                1. Look for maintenance service price
                2. Look for cost information
                3. Calculate profit as: Price - Cost
                4. Provide confidence level in the extraction
                
                Focus on finding clear price and cost values in the document.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`
                }
              }
            ]
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'maintenance_analysis_response',
            schema: {
              type: 'object',
              properties: {
                price: { type: 'number' },
                cost: { type: 'number' },
                profit: { type: 'number' },
                confidence: { type: 'number' }
              },
              required: ['price', 'cost', 'profit', 'confidence'],
              additionalProperties: false
            }
          }
        },
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content?.trim();
      
      if (!content) {
        throw new Error('No response from OpenAI service');
      }

      // Parse JSON response
      const result = JSON.parse(content);
      
      return {
        success: true,
        data: {
          price: parseFloat(result.price) || 0,
          cost: parseFloat(result.cost) || 0,
          profit: parseFloat(result.profit) || 0,
          confidence: parseFloat(result.confidence) || 0
        }
      };

    } catch (error) {
      if (error.status === 429) {
        throw new OpenAIQuotaExceededError('OpenAI API quota exceeded. Please check your usage limits.');
      }
      
      return {
        success: false,
        error: error.message || 'Failed to analyze maintenance screenshot'
      };
    }
  },

  // AI Chat Service for Performance Analytics
  getChatCompletion: async (message, performanceContext = null) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your_vite_openai_api_key' || apiKey === 'your-openai-api-key-here') {
        throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file');
      }

      // Build system prompt with performance context
      let systemPrompt = `You are an AI assistant specializing in sales performance analytics for automotive dealerships. You help managers analyze team performance, identify trends, and provide actionable insights.

      Key capabilities:
      - Analyze sales performance data and trends
      - Provide insights on team member performance
      - Suggest strategies for improvement
      - Answer questions about commission structures, goals, and KPIs
      - Offer predictive insights based on historical data

      Always provide specific, actionable recommendations based on the data provided.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];

      // Add performance context if provided
      if (performanceContext) {
        const contextMessage = {
          role: 'system',
          content: `Current Performance Data Context:
          
          Team Performance:
          - Team Size: ${performanceContext.teamData?.length || 0} members
          - Top Performer: ${performanceContext.topPerformer?.full_name || 'N/A'} (${performanceContext.topPerformer?.total_sales || 0} sales, $${performanceContext.topPerformer?.total_revenue?.toLocaleString() || '0'} revenue)
          - Team Average Sales: ${performanceContext.teamAverage?.sales || 0}
          - Team Average Revenue: $${performanceContext.teamAverage?.revenue?.toLocaleString() || '0'}
          - Team Average Commission: $${performanceContext.teamAverage?.commission?.toLocaleString() || '0'}
          
          Recent Trends:
          ${performanceContext.trends?.map(trend => 
            `- ${trend.month}: ${trend.sales} sales, $${trend.revenue?.toLocaleString()} revenue, ${trend.conversion}% conversion`
          ).join('\n') || 'No trend data available'}
          
          Goals & Targets:
          ${performanceContext.goals?.map(goal => 
            `- ${goal.team_member?.full_name}: ${goal.sales_target} sales target, $${goal.revenue_target?.toLocaleString()} revenue target`
          ).join('\n') || 'No goals set'}

          Use this data to provide specific, contextual insights and recommendations.`
        };
        messages.splice(1, 0, contextMessage);
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 800,
      });

      return {
        success: true,
        data: {
          content: response.choices[0].message.content,
          usage: response.usage
        }
      };

    } catch (error) {
      if (error.status === 429) {
        throw new OpenAIQuotaExceededError('OpenAI API quota exceeded. Please check your usage limits.');
      }
      
      return {
        success: false,
        error: error.message || 'Failed to get AI response'
      };
    }
  },

  // Streaming chat completion for real-time responses
  getStreamingChatCompletion: async (message, performanceContext = null, onChunk) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your_vite_openai_api_key' || apiKey === 'your-openai-api-key-here') {
        throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file');
      }

      let systemPrompt = `You are an AI assistant specializing in sales performance analytics for automotive dealerships. You help managers analyze team performance, identify trends, and provide actionable insights.

      Key capabilities:
      - Analyze sales performance data and trends
      - Provide insights on team member performance
      - Suggest strategies for improvement
      - Answer questions about commission structures, goals, and KPIs
      - Offer predictive insights based on historical data

      Always provide specific, actionable recommendations based on the data provided.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];

      // Add performance context if provided
      if (performanceContext) {
        const contextMessage = {
          role: 'system',
          content: `Current Performance Data Context:
          
          Team Performance:
          - Team Size: ${performanceContext.teamData?.length || 0} members
          - Top Performer: ${performanceContext.topPerformer?.full_name || 'N/A'} (${performanceContext.topPerformer?.total_sales || 0} sales, $${performanceContext.topPerformer?.total_revenue?.toLocaleString() || '0'} revenue)
          - Team Average Sales: ${performanceContext.teamAverage?.sales || 0}
          - Team Average Revenue: $${performanceContext.teamAverage?.revenue?.toLocaleString() || '0'}
          - Team Average Commission: $${performanceContext.teamAverage?.commission?.toLocaleString() || '0'}
          
          Recent Trends:
          ${performanceContext.trends?.map(trend => 
            `- ${trend.month}: ${trend.sales} sales, $${trend.revenue?.toLocaleString()} revenue, ${trend.conversion}% conversion`
          ).join('\n') || 'No trend data available'}
          
          Goals & Targets:
          ${performanceContext.goals?.map(goal => 
            `- ${goal.team_member?.full_name}: ${goal.sales_target} sales target, $${goal.revenue_target?.toLocaleString()} revenue target`
          ).join('\n') || 'No goals set'}

          Use this data to provide specific, contextual insights and recommendations.`
        };
        messages.splice(1, 0, contextMessage);
      }

      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 800,
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          onChunk(content);
        }
      }

      return {
        success: true,
        data: {
          content: fullContent
        }
      };

    } catch (error) {
      if (error.status === 429) {
        throw new OpenAIQuotaExceededError('OpenAI API quota exceeded. Please check your usage limits.');
      }
      
      return {
        success: false,
        error: error.message || 'Failed to get streaming AI response'
      };
    }
  },

  // Generate suggested questions based on performance context
  generateSuggestedQuestions: async (performanceContext) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your_vite_openai_api_key' || apiKey === 'your-openai-api-key-here') {
        throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file');
      }

      const contextPrompt = `Based on the following sales performance data, generate 4 specific, relevant questions that a sales manager might want to ask about their team's performance:

      Team Performance Summary:
      - Team Size: ${performanceContext.teamData?.length || 0} members
      - Top Performer: ${performanceContext.topPerformer?.full_name || 'N/A'} with ${performanceContext.topPerformer?.total_sales || 0} sales
      - Team Average Sales: ${performanceContext.teamAverage?.sales || 0}
      - Team Average Revenue: $${performanceContext.teamAverage?.revenue?.toLocaleString() || '0'}

      Generate questions that would help the manager gain actionable insights. Focus on trends, comparisons, improvement opportunities, and strategic planning.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'user', content: contextPrompt }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'suggested_questions',
            schema: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 4,
                  maxItems: 4
                }
              },
              required: ['questions'],
              additionalProperties: false
            }
          }
        },
        max_tokens: 400
      });

      const result = JSON.parse(response.choices[0].message.content);

      return {
        success: true,
        data: result.questions || []
      };

    } catch (error) {
      if (error.status === 429) {
        throw new OpenAIQuotaExceededError('OpenAI API quota exceeded. Please check your usage limits.');
      }
      
      return {
        success: false,
        error: error.message || 'Failed to generate suggested questions',
        data: [
          "What are the key factors driving our top performer's success?",
          "How can we improve our team's average conversion rate?",
          "What strategies should we implement to reach our quarterly goals?",
          "Which team members need additional support or training?"
        ]
      };
    }
  }
};

export { OpenAIQuotaExceededError };
export default openaiService;