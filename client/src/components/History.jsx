import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageCircle,
  Trash2,
  LogOut,
  User,
  Settings,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

function History({
  open,
  setOpen,
  onNewChat,
  onDeleteChat,
  onSelectChat,
  currentChatId,
  chatHistory,
  isAuthenticated,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNewChat = () => {
    onNewChat();
    if (isMobile) {
      setOpen(false);
    }
  };

  const handleChatSelect = (chatId) => {
    onSelectChat(chatId);
    navigate(`/chat/${chatId}`);
    if (isMobile) {
      setOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2 rounded-xl shadow-sm"
          variant="default"
          disabled={!isAuthenticated}
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {chatHistory.length > 0 ? (
          chatHistory.map((chat) => (
            <div
              key={chat._id}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer",
                currentChatId === chat._id
                  ? "bg-secondary text-secondary-foreground font-medium shadow-sm"
                  : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleChatSelect(chat._id)}
            >
              <MessageCircle
                className={cn(
                  "h-4 w-4 shrink-0",
                  currentChatId === chat._id
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
              <span className="truncate flex-1">
                {chat.title || "New Chat"}
              </span>

              {currentChatId === chat._id && (
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat._id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-xs">No conversations yet</p>
          </div>
        )}
      </div>

      {isAuthenticated && (
        <div className="p-4 border-t bg-muted/20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-2 h-12 rounded-xl hover:bg-secondary"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                    {getInitials(user?.name)}
                  </div>
                )}
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="text-sm font-medium truncate w-full">
                    {user?.name || "User"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate w-full">
                    {user?.email}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.div
          initial={false}
          animate={{
            width: open ? 280 : 0,
            opacity: open ? 1 : 0,
          }}
          className={cn(
            "h-full bg-card text-card-foreground border-r overflow-hidden flex flex-col",
            !open && "border-none"
          )}
        >
          <SidebarContent />
        </motion.div>
      )}

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isMobile && open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-card border-r z-50 shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-semibold">History</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default History;
