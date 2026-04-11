const ChatItem = ({ chat, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left group
        ${active ? "glass-panel bg-primary/10" : "hover:bg-muted/50"}`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="font-display font-bold text-primary text-lg">
            {chat.user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        {chat.user.online && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-online rounded-full border-2 border-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-display font-semibold text-sm text-foreground truncate">
            {chat.user.name}
          </span>
          {chat.lastTime && (
            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{chat.lastTime}</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-muted-foreground truncate">
            {chat.lastMessage || "No messages yet"}
          </span>
          {chat.unread > 0 && (
            <span className="flex-shrink-0 ml-2 gradient-sunset text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
              {chat.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ChatItem;
