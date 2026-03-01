import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, Trash2 } from 'lucide-react';

const TMSChatAssistant = ({ fetchWithAuth, BACKEND_URL, user, activeDepartment }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const departmentMap = {
    'dispatch': { label: 'Dispatch Operations', icon: '🚚' },
    'accounting': { label: 'Accounting', icon: '💰' },
    'sales': { label: 'Sales/Business Development', icon: '📈' },
    'hr': { label: 'HR', icon: '👥' },
    'maintenance': { label: 'Fleet Maintenance', icon: '🔧' },
    'safety': { label: 'Fleet Safety', icon: '🛡️' }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeDepartment) {
      loadChatHistory();
    }
  }, [activeDepartment]);

  const loadChatHistory = async () => {
    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/api/tms-chat/history?context=${activeDepartment}&limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.history && data.history.length > 0) {
          const formattedMessages = data.history.reverse().flatMap(entry => [
            { role: 'user', content: entry.user_message, timestamp: entry.timestamp },
            { role: 'assistant', content: entry.assistant_response, timestamp: entry.timestamp }
          ]);
          setMessages(formattedMessages);
        } else {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    
    // Add user message to UI
    const newUserMsg = { role: 'user', content: userMessage, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/tms-chat/message`, {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          context: activeDepartment
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Check if access was denied
        if (data.success === false && data.error) {
          toast.error(data.error, { duration: 5000 });
          setMessages(prev => [...prev.slice(0, -1), {
            role: 'assistant',
            content: `🚫 ${data.error}`,
            timestamp: new Date().toISOString()
          }]);
        } else {
          const assistantMsg = {
            role: 'assistant',
            content: data.response,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, assistantMsg]);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to get response');
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (error) {
      toast.error('Error sending message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm(`Clear all chat history for ${departmentMap[activeDepartment]?.label}?`)) {
      return;
    }

    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/api/tms-chat/history?context=${activeDepartment}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        setMessages([]);
        toast.success('Chat history cleared');
      } else {
        toast.error('Failed to clear history');
      }
    } catch (error) {
      toast.error('Error clearing history');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get role badge for display
  const getRoleBadge = () => {
    const isPlatformAdmin = user?.role === 'platform_admin';
    if (isPlatformAdmin) {
      return <Badge className="bg-purple-600 text-white text-xs">Full Access</Badge>;
    }
    return <Badge className="bg-blue-600 text-white text-xs capitalize">
      {user?.role?.replace('_', ' ')}
    </Badge>;
  };

  return (
    <div className="w-full h-full bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <span>🤖</span>
            AI Assistant
          </h2>
          {getRoleBadge()}
        </div>
        <p className="text-xs text-muted-foreground">
          GPT-5 Nano • Context-aware
        </p>
      </div>

      {/* Active Department Banner */}
      <div className="px-4 py-3 bg-muted border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{departmentMap[activeDepartment]?.icon}</span>
          <div className="flex-1">
            <div className="font-semibold text-xs text-foreground">
              {departmentMap[activeDepartment]?.label}
            </div>
            <div className="text-xs text-muted-foreground">
              Active context
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            title="Clear chat history"
            className="h-8 w-8 p-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">
              {departmentMap[activeDepartment]?.icon}
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              Start a conversation
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Ask me anything about {departmentMap[activeDepartment]?.label.toLowerCase()}. 
              I'm here to help with your TMS operations!
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-foreground shadow-sm'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
              {msg.timestamp && (
                <div className={`text-xs mt-1 ${
                  msg.role === 'user' ? 'text-muted-foreground' : 'text-muted-foreground'
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-muted-foreground">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2 items-end">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask about ${departmentMap[activeDepartment]?.label}...`}
            disabled={isLoading}
            className="flex-1 border-border rounded-lg focus:border-gray-400 resize-none h-[220px]"
            rows={8}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 px-4 py-6 rounded-lg"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default TMSChatAssistant;
