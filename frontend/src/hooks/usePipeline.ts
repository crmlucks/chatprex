import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface PipelineStage {
  id: number;
  name: string;
  color: string;
  visible: boolean;
  order: number;
}

export function usePipeline() {
  const { token } = useAuth();
  const [stages, setStages] = useState<PipelineStage[]>([]);

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/api/data/pipeline`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setStages(data);
          }
        })
        .catch(console.error);
    }
  }, [token]);

  const getStage = (name: string) => stages.find(s => s.name === name);
  
  const getStageColor = (name: string, defaultColor = '#64748b') => {
    return getStage(name)?.color || defaultColor;
  };

  const getStatusBadgeStyle = (name: string) => {
    const color = getStageColor(name);
    return {
      backgroundColor: `${color}1A`,
      color: color,
      borderColor: `${color}33`
    };
  };

  return { stages, getStage, getStageColor, getStatusBadgeStyle };
}
