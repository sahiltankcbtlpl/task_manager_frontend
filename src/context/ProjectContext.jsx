import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProjects } from '../api/project.api';
import { useAuth } from './AuthContext';

const ProjectContext = createContext();

export const useProject = () => {
    return useContext(ProjectContext);
};

export const ProjectProvider = ({ children }) => {
    const { user, activeCompany } = useAuth();
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    const refreshProjects = useCallback(async () => {
        if (!user || !activeCompany) return;
        setLoading(true);
        try {
            const data = await getProjects({});
            setProjects(data);
        } catch (error) {
            console.error('Failed to fetch projects', error);
        } finally {
            setLoading(false);
        }
    }, [user, activeCompany]);

    useEffect(() => {
        if (user && activeCompany) {
            refreshProjects();
        } else {
            setProjects([]);
            setActiveProjectId(null);
        }
    }, [user, activeCompany, refreshProjects]);

    return (
        <ProjectContext.Provider value={{ 
            activeProjectId, 
            setActiveProjectId,
            projects,
            loading,
            refreshProjects
        }}>
            {children}
        </ProjectContext.Provider>
    );
};
