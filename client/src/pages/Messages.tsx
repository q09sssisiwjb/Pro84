import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Trash2, CheckCircle, Bell } from "lucide-react";

interface Message {
  id: string;
  type: 'welcome' | 'info' | 'notification';
  title: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);

  useEffect(() => {
    // Load messages from localStorage
    const savedMessages = localStorage.getItem('userMessages');
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(parsedMessages);
      setPreviousMessageCount(parsedMessages.length);
    }

    // Check if user just signed up/logged in and add welcome message
    const hasWelcomeMessage = savedMessages ? 
      JSON.parse(savedMessages).some((msg: any) => msg.type === 'welcome') : false;

    if (user && !hasWelcomeMessage) {
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        type: 'welcome',
        title: `Welcome to Visionary AI, ${user.displayName || 'Creator'}!`,
        content: `We're excited to have you on board! Your AI-powered creative journey starts here. Explore our tools to generate stunning images, enhance your artwork, and bring your imagination to life. Ready to create something amazing?`,
        timestamp: new Date(),
        isRead: false
      };

      const updatedMessages = [welcomeMessage, ...messages];
      setMessages(updatedMessages);
      localStorage.setItem('userMessages', JSON.stringify(updatedMessages));
    }
  }, [user]);

  // Listen for storage changes (new messages from other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userMessages' && e.newValue) {
        const newMessages = JSON.parse(e.newValue).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        // Check if there are new messages
        if (newMessages.length > messages.length) {
          const latestMessage = newMessages[0];
          
          // Show notification toast for new message
          toast({
            title: "New Message Received",
            description: latestMessage.title,
            duration: 5000,
          });
        }
        
        setMessages(newMessages);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [messages.length, toast]);

  // Show notification when messages count increases
  useEffect(() => {
    if (messages.length > previousMessageCount && previousMessageCount > 0) {
      const newMessage = messages[0];
      
      // Show notification toast
      toast({
        title: "📬 New Message",
        description: newMessage.title,
        duration: 5000,
      });
    }
    setPreviousMessageCount(messages.length);
  }, [messages.length]);

  const markAsRead = (messageId: string) => {
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, isRead: true } : msg
    );
    setMessages(updatedMessages);
    localStorage.setItem('userMessages', JSON.stringify(updatedMessages));
  };

  const deleteMessage = (messageId: string) => {
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    setMessages(updatedMessages);
    localStorage.setItem('userMessages', JSON.stringify(updatedMessages));
  };

  const markAllAsRead = () => {
    const updatedMessages = messages.map(msg => ({ ...msg, isRead: true }));
    setMessages(updatedMessages);
    localStorage.setItem('userMessages', JSON.stringify(updatedMessages));
  };


  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return <MessageCircle className="w-5 h-5 text-primary" />;
      case 'notification':
        return <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <MessageCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getMessageBadgeColor = (type: string) => {
    switch (type) {
      case 'welcome':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'notification':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Messages</h1>
                <p className="text-muted-foreground">
                  Stay updated with your latest notifications and updates
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {unreadCount} unread
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={markAllAsRead}
                  data-testid="button-mark-all-read"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark all as read
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {messages.length === 0 && user && (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No messages yet</h3>
                <p className="text-muted-foreground">
                  When you receive notifications or updates, they'll appear here.
                </p>
              </CardContent>
            </Card>
          )}
          
          {messages.length > 0 && messages.map((message) => (
            <Card 
              key={message.id} 
              className={`bg-card/50 backdrop-blur border-border/50 transition-all duration-200 ${
                !message.isRead ? 'border-primary/30 bg-primary/5' : ''
              }`}
              data-testid={`message-${message.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getMessageIcon(message.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg truncate">{message.title}</CardTitle>
                        {!message.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getMessageBadgeColor(message.type)}`}
                        >
                          {message.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {message.timestamp.toLocaleDateString()} at {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!message.isRead && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => markAsRead(message.id)}
                        data-testid={`button-mark-read-${message.id}`}
                        className="flex-shrink-0"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteMessage(message.id)}
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      data-testid={`button-delete-${message.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-foreground leading-relaxed">{message.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Welcome Message for Non-authenticated Users */}
        {!user && (
          <Card className="bg-gradient-to-r from-primary/10 via-background to-primary/10 border-primary/20 mt-8">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-12 h-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to Visionary AI Messages</h3>
              <p className="text-muted-foreground mb-4">
                Sign up or log in to receive personalized welcome messages, notifications, and updates about your creative journey.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('open-auth', { detail: { mode: 'login' } }))}>
                  Log In
                </Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => window.dispatchEvent(new CustomEvent('open-auth', { detail: { mode: 'signup' } }))}>
                  Sign Up
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Messages;