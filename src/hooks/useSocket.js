import { useSocketContext } from '../context/SocketContext';

const useSocket = () => {
    return useSocketContext();
};

export default useSocket;
