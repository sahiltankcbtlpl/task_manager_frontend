import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import PropTypes from 'prop-types';
import useAuth from '../hooks/useAuth';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const [socket, setSocket] = useState(null);

    const userId = user?._id || user?.id || null;

    useEffect(() => {
        if (!user) {
            // User logged out → disconnect socket
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
            return;
        }

        if (socketRef.current) return; // Prevent duplicate connections

        let baseUrl = 'http://localhost:5000';
        
        // Dynamically determine the WebSocket base URL based on where the frontend is being accessed from
        if (window.location.hostname.includes('devtunnels.ms')) {
            // Replace the frontend port (e.g. 5173) with the backend port (5000) for the API URL
            baseUrl = `${window.location.protocol}//${window.location.host.replace(/(?:-\d+)?\.inc1\.devtunnels\.ms/, '-5000.inc1.devtunnels.ms')}`;
        } else if (import.meta.env.VITE_API_URL && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            baseUrl = new URL(import.meta.env.VITE_API_URL).origin;
        }

        const newSocket = io(baseUrl, {
            withCredentials: true,
            transports: ['websocket'],
            autoConnect: true,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });

        return () => {
            newSocket.disconnect();
            newSocket.off();
            socketRef.current = null;
            setSocket(null);
        };
    }, [userId]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

SocketProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocketContext must be used within SocketProvider');
    }
    return context;
};

export default SocketContext;
