import { useState, useEffect } from "react";
import Sidebar from "@/components/chat/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import EmptyState from "@/components/chat/EmptyState";
import AddContactDialog from "@/components/chat/AddContactDialog";

const Index = () => {
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [lightMode, setLightMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const activeChat = chats.find((c) => c.user.id === activeId);

  useEffect(() => {
    document.documentElement.classList.toggle("light", lightMode);
  }, [lightMode]);

  const handleAddContact = (name) => {
    const newChat = {
      user: {
        id: Date.now().toString(),
        name,
        online: Math.random() > 0.5,
      },
      lastMessage: "",
      lastTime: "",
      unread: 0,
      messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveId(newChat.user.id);
  };

  const handleSend = (text) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setChats((prev) =>
      prev.map((c) =>
        c.user.id === activeId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { id: Date.now().toString(), text, time, fromMe: true },
              ],
              lastMessage: text,
              lastTime: "now",
            }
          : c
      )
    );
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar
        chats={chats}
        activeId={activeId}
        onSelect={setActiveId}
        search={search}
        onSearch={setSearch}
        lightMode={lightMode}
        onToggleTheme={() => setLightMode(!lightMode)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddContact={() => setShowAddDialog(true)}
      />

      {activeChat ? (
        <ChatWindow
          chat={activeChat}
          onSend={handleSend}
          onMenuClick={() => setSidebarOpen(true)}
        />
      ) : (
        <EmptyState onAddContact={() => setShowAddDialog(true)} />
      )}

      <AddContactDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddContact}
      />
    </div>
  );
};

export default Index;
