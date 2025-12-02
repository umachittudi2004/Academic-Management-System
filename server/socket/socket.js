import { Server } from 'socket.io';

export const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            credentials: true,
            methods: ["GET", "POST"]
        }
    });

    // Store online users
    const onlineUsers = new Map();
    
    // Store typing users per group
    const typingUsers = new Map();

    io.on('connection', (socket) => {
        console.log('🔌 User connected:', socket.id);

        // ========== USER JOINS ==========
        socket.on('join', (userId) => {
            if (userId) {
                socket.join(userId.toString());
                onlineUsers.set(userId.toString(), socket.id);
                console.log(`👤 User ${userId} joined their room`);

                // Broadcast online status
                io.emit('user_online', { userId });
            }
        });

        // ========== JOIN GROUP ROOM ==========
        socket.on('join_group', (groupId) => {
            if (groupId) {
                socket.join(`group_${groupId}`);
                console.log(`👥 User joined group room: ${groupId}`);
            }
        });

        // ========== LEAVE GROUP ROOM ==========
        socket.on('leave_group', (groupId) => {
            if (groupId) {
                socket.leave(`group_${groupId}`);
                console.log(`👥 User left group room: ${groupId}`);
            }
        });

        // ========== TYPING INDICATOR (Direct Message) ==========
        socket.on('typing', (data) => {
            const { recipientId, senderId, isTyping } = data;
            io.to(recipientId.toString()).emit('user_typing', {
                senderId,
                isTyping
            });
        });

        // ========== TYPING INDICATOR (Group) ==========
        socket.on('typing_in_group', (data) => {
            const { groupId, userId, userName, isTyping } = data;
            
            if (isTyping) {
                // Add to typing users
                if (!typingUsers.has(groupId)) {
                    typingUsers.set(groupId, new Set());
                }
                typingUsers.get(groupId).add({ userId, userName });
            } else {
                // Remove from typing users
                if (typingUsers.has(groupId)) {
                    const groupTyping = typingUsers.get(groupId);
                    groupTyping.forEach(user => {
                        if (user.userId === userId) {
                            groupTyping.delete(user);
                        }
                    });
                }
            }

            // Broadcast to group (except sender)
            socket.to(`group_${groupId}`).emit('user_typing_in_group', {
                groupId,
                userId,
                userName,
                isTyping,
                typingUsers: typingUsers.has(groupId) 
                    ? Array.from(typingUsers.get(groupId)) 
                    : []
            });
        });

        // ========== DISCONNECT ==========
        socket.on('disconnect', () => {
            console.log('🔌 User disconnected:', socket.id);
            
            // Remove from online users
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    io.emit('user_offline', { userId });
                    console.log(`👤 User ${userId} went offline`);
                    
                    // Remove from all typing indicators
                    typingUsers.forEach((groupTyping, groupId) => {
                        groupTyping.forEach(user => {
                            if (user.userId === userId) {
                                groupTyping.delete(user);
                                io.to(`group_${groupId}`).emit('user_typing_in_group', {
                                    groupId,
                                    userId,
                                    isTyping: false
                                });
                            }
                        });
                    });
                    
                    break;
                }
            }
        });

        // ========== MESSAGE DELIVERY CONFIRMATION ==========
        socket.on('message_delivered', (data) => {
            const { messageId, senderId } = data;
            io.to(senderId.toString()).emit('delivery_confirmation', {
                messageId,
                status: 'delivered'
            });
        });

        // ========== GROUP MESSAGE READ ==========
        socket.on('group_message_read', (data) => {
            const { groupId, messageId, userId } = data;
            socket.to(`group_${groupId}`).emit('message_read_in_group', {
                groupId,
                messageId,
                userId
            });
        });
    });

    // Cleanup typing indicators periodically
    setInterval(() => {
        typingUsers.forEach((groupTyping, groupId) => {
            if (groupTyping.size === 0) {
                typingUsers.delete(groupId);
            }
        });
    }, 60000); // Every minute
    return io;
};