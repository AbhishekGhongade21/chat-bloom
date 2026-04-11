# Chat Bloom 93 Backend API

A production-ready backend for the Chat Bloom 93 messaging application built with Node.js, Express.js, and Socket.IO.

## Features

### Authentication
- User registration and login
- JWT token-based authentication
- Secure password hashing with bcrypt
- Password change functionality
- Token refresh mechanism

### User Management
- Profile management
- Status updates (online/offline/away/busy)
- User search and discovery
- Profile picture uploads
- Privacy settings

### Chat System
- 1-to-1 chat creation
- Group chat management
- Add/remove participants
- Group admin functionality
- Chat settings and permissions

### Messaging
- Real-time messaging with Socket.IO
- Message editing and deletion
- Reply to messages
- Emoji reactions
- Message forwarding
- File sharing support
- Read receipts
- Typing indicators
- Message search
- Unread message counts

### Real-time Features
- Live messaging
- Typing indicators
- Online/offline status
- Message delivery and read receipts
- Live reactions

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **multer** - File uploads
- **validator** - Input validation
- **dotenv** - Environment variables

## Project Structure

```
backend/
  config/
    database.js          # Database connection
  controllers/
    authController.js     # Authentication logic
    userController.js     # User management
    chatController.js     # Chat operations
    messageController.js  # Message operations
  middleware/
    auth.js              # Authentication middleware
    errorHandler.js      # Error handling
  models/
    User.js              # User schema
    Chat.js              # Chat schema
    Message.js           # Message schema
  routes/
    auth.js              # Auth routes
    users.js             # User routes
    chats.js             # Chat routes
    messages.js          # Message routes
  utils/
    socketEvents.js      # Socket.IO events
    validation.js        # Validation utilities
  uploads/              # File upload directory
    profile-pictures/
    files/
  server.js             # Main server file
  package.json
  .env
  .env.example
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/update` - Update profile
- `PUT /api/users/status` - Update status
- `GET /api/users/all` - Get all users
- `GET /api/users/online` - Get online users
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users/upload-profile-picture` - Upload profile picture
- `DELETE /api/users/delete-account` - Delete account

### Chats
- `POST /api/chats/create` - Create chat
- `GET /api/chats` - Get user chats
- `GET /api/chats/:id` - Get chat by ID
- `POST /api/chats/:id/add-participant` - Add participant
- `DELETE /api/chats/:id/remove-participant/:participantId` - Remove participant
- `PUT /api/chats/:id` - Update chat
- `POST /api/chats/:id/leave` - Leave chat

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/:chatId` - Get messages
- `PUT /api/messages/edit/:id` - Edit message
- `DELETE /api/messages/delete/:id` - Delete message
- `POST /api/messages/react` - Add/remove reaction
- `POST /api/messages/forward` - Forward message
- `GET /api/messages/search/:chatId` - Search messages
- `GET /api/messages/unread-count` - Get unread count

## Socket.IO Events

### Client to Server
- `authenticate` - Authenticate socket connection
- `join_chat` - Join chat room
- `leave_chat` - Leave chat room
- `typing` - Send typing indicator
- `send_message` - Send real-time message
- `edit_message` - Edit message
- `delete_message` - Delete message
- `react_to_message` - Add/remove reaction
- `mark_messages_read` - Mark messages as read
- `change_status` - Change user status

### Server to Client
- `authenticated` - Authentication successful
- `new_message` - New message received
- `message_edited` - Message edited
- `message_deleted` - Message deleted
- `message_reacted` - Message reaction updated
- `messages_read` - Messages read by user
- `user_typing` - User typing indicator
- `user_status_changed` - User status changed
- `error` - Error occurred

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start MongoDB server

5. Start the application:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/chat-bloom-93 |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `MAX_FILE_SIZE` | Maximum file size in bytes | 5242880 |
| `UPLOAD_PATH` | File upload directory | ./uploads |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |

## Sample API Responses

### Registration Success
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePicture": null,
    "status": "online",
    "lastSeen": "2023-09-01T12:00:00.000Z"
  }
}
```

### Send Message Success
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "senderId": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "John Doe",
      "profilePicture": null
    },
    "chatId": "64f1a2b3c4d5e6f7g8h9i0j3",
    "content": "Hello, world!",
    "messageType": "text",
    "reactions": [],
    "isEdited": false,
    "status": "sent",
    "readBy": [],
    "isDeleted": false,
    "createdAt": "2023-09-01T12:00:00.000Z",
    "updatedAt": "2023-09-01T12:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- File upload validation
- SQL injection prevention (via Mongoose)
- XSS protection

## Performance Features

- Database indexing for optimal queries
- Pagination for large datasets
- Efficient real-time communication with Socket.IO
- File upload optimization
- Connection pooling

## Development

### Running Tests
```bash
npm test
```

### Code Style
The codebase follows ESLint configuration. Run:
```bash
npm run lint
```

### Database Seeding
You can create sample data using the provided seed scripts (if available).

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Configure proper CORS settings
4. Set up file storage (AWS S3, etc.)
5. Configure reverse proxy (nginx)
6. Set up SSL/TLS
7. Configure monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the GitHub repository.
