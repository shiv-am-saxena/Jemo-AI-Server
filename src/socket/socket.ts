import { Server } from 'socket.io';
import { ApiError } from '../utils/ApiError';
import logger from '../services/logger';
import { registerChatHandlers } from './chatSocket';

let io: Server;

export function initSocket(server: any): void {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
            credentials: true,
        },
    });
    logger.info('Socket.io initialized');
    io.on('connection', (socket) => {
        console.log('A user connected');
        registerChatHandlers(io, socket);
        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });
}

export function getSocket(): Server {
    if (!io) {
        throw new ApiError(401, 'Socket.io not initialized');
    }
    return io;
}