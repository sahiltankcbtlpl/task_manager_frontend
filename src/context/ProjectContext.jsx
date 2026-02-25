import React, { createContext, useContext, useState } from 'react';

const ProjectContext = createContext();

export const useProject = () => {
    return useContext(ProjectContext);
};

export const ProjectProvider = ({ children }) => {
    const [activeProjectId, setActiveProjectId] = useState(null);

    return (
        <ProjectContext.Provider value={{ activeProjectId, setActiveProjectId }}>
            {children}
        </ProjectContext.Provider>
    );
};
