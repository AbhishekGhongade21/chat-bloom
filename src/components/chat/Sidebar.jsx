import { Search, MessageCircle, Sun, Moon, Plus } from "lucide-react";
import ChatItem from "./ChatItem";

const Sidebar = ({ chats, activeId, onSelect, search, onSearch, lightMode, onToggleTheme, open, onClose, onAddContact }) => {
  const filtered = chats.filter((c) =>
    c.user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed md:relative z-40 md:z-auto h-full w-80 flex-shrink-0 flex flex-col border-r border-border gradient-sidebar transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <div className="gradient-ocean w-9 h-9 rounded-lg flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display font-bold text-lg text-foreground">Chatly</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onAddContact} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Add Contact">
              <Plus className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={onToggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors">
              {lightMode ? <Moon className="w-4 h-4 text-foreground" /> : <Sun className="w-4 h-4 text-foreground" />}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto chat-scrollbar px-2 pb-2 space-y-0.5">
          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              {chats.length === 0 ? (
                <div className="space-y-2">
                  <p>No contacts yet</p>
                  <p className="text-xs">Click the + button to add one</p>
                </div>
              ) : (
                "No results found"
              )}
            </div>
          )}
          {filtered.map((chat) => (
            <ChatItem
              key={chat.user.id}
              chat={chat}
              active={chat.user.id === activeId}
              onClick={() => {
                onSelect(chat.user.id);
                onClose();
              }}
            />
          ))}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
