import { Switch, Route, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import Footer from "@/components/Footer";
import ChatButton from "@/components/ChatButton";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import TextToImageGenerator from "@/pages/TextToImageGenerator";
import ImageToImage from "@/pages/ImageToImage";
import ImageToSketch from "@/pages/ImageToSketch";
import BGRemover from "@/pages/BGRemover";
import Upscale from "@/pages/Upscale";
import Favorites from "@/pages/Favorites";
import MyArtStyle from "@/pages/MyArtStyle";
import ArtStyles from "@/pages/ArtStyles";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";
import Guides from "@/pages/Guides";
import Settings from "@/pages/Settings";
import Admin from "@/pages/Admin";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/guides" component={Guides} />
      <Route path="/settings" component={Settings} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={Admin} />
      <Route path="/text-to-image" component={TextToImageGenerator} />
      <Route path="/image-to-image" component={ImageToImage} />
      <Route path="/image-to-sketch" component={ImageToSketch} />
      <Route path="/bg-remover" component={BGRemover} />
      <Route path="/upscale" component={Upscale} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/my-art-style" component={MyArtStyle} />
      <Route path="/art-styles" component={ArtStyles} />
      <Route path="/messages" component={Messages} />
      <Route component={NotFound} />
    </Switch>
  );
}

function TopBar() {
  const { user, loading } = useAuth();

  return (
    <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <div className="hidden md:flex items-center space-x-6">
          <a href="#tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-tools">
            Tools
          </a>
          <Link href="/guides" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-guides">
            Guides
          </Link>
          <a href="#gallery" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-gallery">
            Gallery
          </a>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {!loading && (
          user ? (
            <UserAvatar user={user} className="h-8 w-8" />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" data-testid="button-login">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="bg-[#8a3dff] hover:bg-[#7c36e6] text-white" data-testid="button-signup">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )
        )}
      </div>
    </header>
  );
}

function App() {
  const { user } = useAuth();
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/login">
            <Auth />
            <Toaster />
          </Route>
          <Route path="/signup">
            <Auth />
            <Toaster />
          </Route>
          <Route>
            <SidebarProvider style={sidebarStyle as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar user={user} />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <TopBar />
                  <main className="flex-1 overflow-auto flex flex-col">
                    <div className="flex-1">
                      <Router />
                    </div>
                    <Footer />
                  </main>
                </div>
              </div>
              <ChatButton />
              <Toaster />
            </SidebarProvider>
          </Route>
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
