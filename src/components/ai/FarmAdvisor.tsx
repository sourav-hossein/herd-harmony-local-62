import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  Send, 
  User, 
  Loader2, 
  Sparkles, 
  MessageCircle,
  Info,
  AlertTriangle
} from 'lucide-react';
import { aiService, ChatMessage } from '@/services/aiService';
import { useGoatContext } from '@/context/GoatContext';
import { useFarm } from '@/context/FarmContext';
import { useToast } from '@/hooks/use-toast';

interface FarmAdvisorProps {
  className?: string;
}

export default function FarmAdvisor({ className }: FarmAdvisorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { goats, weightRecords, healthRecords, breedingRecords } = useGoatContext();
  const { activeFarmId, farms } = useFarm();
  const { toast } = useToast();

  useEffect(() => {
    checkAISettings();
    addWelcomeMessage();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAISettings = () => {
    try {
      const stored = localStorage.getItem('aiSettings');
      if (stored) {
        const settings = JSON.parse(stored);
        setIsEnabled(settings.enabled && settings.geminiApiKey);
        if (settings.geminiApiKey) {
          aiService.setApiKey(settings.geminiApiKey);
        }
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your Farm Advisor AI assistant. I can help you with:

• **Breeding recommendations** based on genetics and performance
• **Financial analysis** and cost optimization
• **Health insights** and preventive care suggestions  
• **Grazing management** and pasture optimization
• **General farm management** questions

What would you like to know about your farm today?`,
      timestamp: new Date().toISOString(),
      context: 'welcome'
    };
    setMessages([welcomeMessage]);
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const buildFarmContext = () => {
    return {
      farm: {
        name: activeFarmId ? farms.find(f => f.id === activeFarmId)?.name || 'Current Farm' : 'Current Farm',
        totalGoats: goats.length,
        activeGoats: goats.filter(g => g.status !== "deceased").length,
        totalPastures: 0, // Will be updated when pasture data is available
      },
      goats: {
        total: goats.length,
        breeds: [...new Set(goats.map(g => g.breed).filter(Boolean))],
        averageAge: calculateAverageAge(),
        recentBirths: getRecentBirths(),
      },
      health: {
        recentRecords: healthRecords.slice(-10),
        commonIssues: getCommonHealthIssues(),
      },
      breeding: {
        recentRecords: breedingRecords.slice(-10),
        activeBreeders: getActiveBreeders(),
      },
      weight: {
        recentRecords: weightRecords.slice(-10),
        averageWeight: calculateAverageWeight(),
      }
    };
  };

  const calculateAverageAge = () => {
    const ages = goats
      .filter(g => g.birthDate && g.status !== "deceased")
      .map(g => {
        const birth = new Date(g.birthDate!);
        const now = new Date();
        return (now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      });
    
    return ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;
  };

  const getRecentBirths = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return goats.filter(g => 
      g.birthDate && new Date(g.birthDate) > thirtyDaysAgo
    ).length;
  };

  const getCommonHealthIssues = () => {
    const issues: Record<string, number> = {};
    healthRecords.forEach(record => {
      const issue = record.type || 'General';
      issues[issue] = (issues[issue] || 0) + 1;
    });
    
    return Object.entries(issues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));
  };

  const getActiveBreeders = () => {
    return goats.filter(g => 
      g.status !== "deceased" && 
      (g.gender === 'male' || (g.gender === 'female' && g.breedingStatus !== 'not_breeding'))
    ).length;
  };

  const calculateAverageWeight = () => {
    if (weightRecords.length === 0) return 0;
    
    const totalWeight = weightRecords.reduce((sum, record) => sum + record.weight, 0);
    return totalWeight / weightRecords.length;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !isEnabled) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const farmContext = buildFarmContext();
      const response = await aiService.chat(userMessage.content, farmContext);

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        context: 'farm_analysis'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat request failed:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please check your internet connection and try again.',
        timestamp: new Date().toISOString(),
        context: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Chat Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "Which goats are most profitable?",
    "Analyze my breeding program",
    "What health trends should I watch?",
    "Optimize my grazing rotation",
    "Review my farm finances"
  ];

  const handleSuggestionClick = (question: string) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  if (!isEnabled) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-muted-foreground" />
            Farm Advisor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              AI features are not enabled. Configure your Gemini API key in Settings → AI to unlock the Farm Advisor chat.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Farm Advisor
          <Badge variant="outline" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col h-[600px]">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-1 ${
                      message.role === 'user' 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t bg-muted/30">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Suggested questions:
              </div>
              <div className="flex flex-wrap gap-1">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => handleSuggestionClick(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your farm..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}