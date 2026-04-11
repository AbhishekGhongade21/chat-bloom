import { useRef, useEffect } from "react";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

const ChatWindow = ({ chat, onSend, onMenuClick }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length]);

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <ChatHeader user={chat.user} onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto chat-scrollbar p-4 space-y-3 gradient-bg">
        {chat.messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-bold text-2xl text-primary">
                  {chat.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="font-display font-semibold text-foreground">{chat.user.name}</p>
              <p className="text-sm">Start a conversation by typing a message below</p>
            </div>
          </div>
        )}
        {chat.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={onSend} />
    </div>
  );
};

export default ChatWindow;
