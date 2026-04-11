import { Menu, Phone, Video, MoreVertical } from "lucide-react";

const ChatHeader = ({ user, onMenuClick }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border glass-panel">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-1 text-foreground">
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="font-display font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          {user.online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-online rounded-full border-2 border-background" />
          )}
        </div>
        <div>
          <h2 className="font-display font-semibold text-sm text-foreground">{user.name}</h2>
          <p className="text-xs text-muted-foreground">
            {user.online ? "Online" : "Offline"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {[Phone, Video, MoreVertical].map((Icon, i) => (
          <button key={i} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatHeader;
