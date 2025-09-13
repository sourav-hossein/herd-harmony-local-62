import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  Key, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';
import { aiService, AISettings as AISettingsType } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';

export default function AISettings() {
  const [settings, setSettings] = useState<AISettingsType>({
    enabled: false
  });
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [lastValidated, setLastValidated] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('aiSettings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings(parsedSettings);
        if (parsedSettings.geminiApiKey) {
          setApiKey(parsedSettings.geminiApiKey);
          aiService.setApiKey(parsedSettings.geminiApiKey);
        }
        if (parsedSettings.lastValidated) {
          setLastValidated(parsedSettings.lastValidated);
          setIsValid(true);
        }
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
  };

  const saveSettings = (newSettings: AISettingsType) => {
    try {
      localStorage.setItem('aiSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      aiService.setApiKey(newSettings.geminiApiKey || '');
      
      toast({
        title: "Settings saved",
        description: "AI settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      toast({
        title: "Error",
        description: "Failed to save AI settings.",
        variant: "destructive",
      });
    }
  };

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key first.",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setIsValid(null);

    try {
      const valid = await aiService.validateApiKey(apiKey);
      setIsValid(valid);
      
      if (valid) {
        const now = new Date().toISOString();
        setLastValidated(now);
        
        const newSettings = {
          ...settings,
          geminiApiKey: apiKey,
          enabled: true,
          lastValidated: now
        };
        saveSettings(newSettings);
        
        toast({
          title: "Success",
          description: "API key validated successfully!",
        });
      } else {
        toast({
          title: "Invalid API Key",
          description: "The provided API key is not valid or cannot access Gemini API.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsValid(false);
      toast({
        title: "Validation Failed",
        description: "Failed to validate API key. Check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const removeApiKey = () => {
    setApiKey('');
    setIsValid(null);
    setLastValidated(null);
    
    const newSettings = {
      ...settings,
      geminiApiKey: undefined,
      enabled: false,
      lastValidated: undefined
    };
    saveSettings(newSettings);
    
    toast({
      title: "API Key Removed",
      description: "AI features have been disabled.",
    });
  };

  const toggleAI = (enabled: boolean) => {
    if (enabled && !apiKey) {
      toast({
        title: "API Key Required",
        description: "Please add and validate a Gemini API key first.",
        variant: "destructive",
      });
      return;
    }

    const newSettings = {
      ...settings,
      enabled
    };
    saveSettings(newSettings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          AI Assistant Settings
        </h2>
        <p className="text-muted-foreground">
          Configure Gemini AI integration for smart farm insights and assistance
        </p>
      </div>

      {/* AI Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">AI Assistant</Label>
              <p className="text-sm text-muted-foreground">
                Enable AI-powered insights and recommendations
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={toggleAI}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">API Key Status</Label>
              <div className="flex items-center gap-2">
                {isValid === true ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-success" />
                    <Badge variant="outline" className="text-success border-success">
                      Valid
                    </Badge>
                  </>
                ) : isValid === false ? (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <Badge variant="outline" className="text-destructive border-destructive">
                      Invalid
                    </Badge>
                  </>
                ) : apiKey ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <Badge variant="outline" className="text-warning border-warning">
                      Not Validated
                    </Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">
                      Not Configured
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Last Validated</Label>
              <p className="text-sm text-muted-foreground">
                {lastValidated 
                  ? new Date(lastValidated).toLocaleDateString()
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Gemini API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your API key is stored locally and never uploaded. Get your free Gemini API key from 
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline ml-1"
              >
                Google AI Studio
              </a>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <Button
                onClick={validateApiKey}
                disabled={isValidating || !apiKey.trim()}
                variant="outline"
              >
                {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Validate
              </Button>
              
              {apiKey && (
                <Button
                  onClick={removeApiKey}
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Features Overview */}
      {settings.enabled && isValid && (
        <Card>
          <CardHeader>
            <CardTitle>Available AI Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">🧬 Genetics & Breeding</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Genetic diversity analysis</li>
                  <li>• Breeding recommendations</li>
                  <li>• Inbreeding risk detection</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">💰 Financial Insights</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Profitability analysis</li>
                  <li>• Cost optimization</li>
                  <li>• Revenue predictions</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">🌾 Grazing Management</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pasture health assessment</li>
                  <li>• Rotation optimization</li>
                  <li>• Stocking rate analysis</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">🏥 Health Management</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Health pattern analysis</li>
                  <li>• Preventive care suggestions</li>
                  <li>• Risk identification</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Farm Advisor Preview */}
      {settings.enabled && isValid && (
        <Card>
          <CardHeader>
            <CardTitle>Farm Advisor Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The Farm Advisor chat will be available in the main dashboard. 
                Ask questions about your goats, finances, breeding plans, and more!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}