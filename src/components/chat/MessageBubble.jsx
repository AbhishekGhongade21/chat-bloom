const MessageBubble = ({ message }) => {
  return (
    <div className={`flex ${message.fromMe ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl transition-shadow duration-200 hover:shadow-lg
          ${message.fromMe
            ? "gradient-primary text-primary-foreground rounded-br-md"
            : "bg-bubble-received text-foreground rounded-bl-md"
          }`}
      >
        <p className="text-sm leading-relaxed">{message.text}</p>
        <p className={`text-[10px] mt-1 ${message.fromMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {message.time}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
