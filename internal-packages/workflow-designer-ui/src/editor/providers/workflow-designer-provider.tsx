import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NodeUIState } from '../types';
import { Edge, Node } from 'reactflow';

interface WorkflowDesignerContextType {
  nodes: Node[];
  edges: Edge[];
  uiNodeStates: Record<string, NodeUIState>;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setUiNodeState: (nodeId: string, state: Partial<NodeUIState>) => void;
}

const WorkflowDesignerContext = createContext<WorkflowDesignerContextType | null>(null);

export const useWorkflowDesigner = () => {
  const context = useContext(WorkflowDesignerContext);
  if (!context) {
    throw new Error('useWorkflowDesigner must be used within a WorkflowDesignerProvider');
  }
  return context;
};

interface WorkflowDesignerProviderProps {
  children: ReactNode;
}

export const WorkflowDesignerProvider: React.FC<WorkflowDesignerProviderProps> = ({ children }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [uiNodeStates, setUiNodeStates] = useState<Record<string, NodeUIState>>({});

  const setUiNodeState = useCallback((nodeId: string, state: Partial<NodeUIState>) => {
    setUiNodeStates((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        ...state,
      },
    }));
  }, []);

  return (
    <WorkflowDesignerContext.Provider
      value={{
        nodes,
        edges,
        uiNodeStates,
        setNodes,
        setEdges,
        setUiNodeState,
      }}
    >
      {children}
    </WorkflowDesignerContext.Provider>
  );
}; 