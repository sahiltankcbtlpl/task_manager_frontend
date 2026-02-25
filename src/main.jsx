import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import theme from './theme/chakra.theme';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProjectProvider } from './context/ProjectContext';
import './index.css'; // Keep global styles if any

ReactDOM.createRoot(document.getElementById('root')).render(
  <ChakraProvider theme={theme}>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ProjectProvider>
            <App />
          </ProjectProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </ChakraProvider>,
);
