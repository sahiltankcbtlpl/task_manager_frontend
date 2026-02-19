import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import useAuth from '../hooks/useAuth';
import PropTypes from 'prop-types';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        let newSocket;
        if (user) {
            // Initialize socket only when user is logged in
            newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
                withCredentials: true,
                autoConnect: false,
            });

            newSocket.connect();

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
                setSocket(null);
            };
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

SocketProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useSocketContext = () => useContext(SocketContext);

// eslint-disable-next-line react-refresh/only-export-components
export default SocketContext;
