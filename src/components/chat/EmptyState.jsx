import { MessageCircle, UserPlus } from "lucide-react";

const EmptyState = ({ onAddContact }) => {
  return (
    <div className="flex-1 flex items-center justify-center gradient-bg">
      <div className="text-center space-y-4 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl gradient-aurora flex items-center justify-center mx-auto shadow-lg">
          <MessageCircle className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground">Welcome to Chatly</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Add a contact to start chatting
        </p>
        <button
          onClick={onAddContact}
          className="gradient-accent text-primary-foreground px-5 py-2.5 rounded-lg font-medium text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
        >
          <UserPlus className="w-4 h-4" />
          Add Your First Contact
        </button>
      </div>
    </div>
  );
};

export default EmptyState;
