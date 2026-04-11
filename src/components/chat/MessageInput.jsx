import { useState } from "react";
import { Send, Smile } from "lucide-react";

const MessageInput = ({ onSend }) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="p-4 border-t border-border">
      <div className="flex items-center gap-2 glass-panel rounded-xl px-4 py-2">
        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Smile className="w-5 h-5" />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none py-1.5"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="gradient-candy p-2 rounded-lg transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:opacity-40"
        >
          <Send className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
