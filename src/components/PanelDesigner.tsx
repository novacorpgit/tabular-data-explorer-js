
import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import ComponentLibrary from './ComponentLibrary';
import ResizableEnclosure from './ResizableEnclosure';
import { Button } from '@/components/ui/button';

const PanelDesigner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [enclosures, setEnclosures] = useState([]);
  const [showDimensions, setShowDimensions] = useState(false);
  
  const onConnect = useCallback((params: Connection) => 
    setEdges((eds) => addEdge(params, eds)), [setEdges]);
  
  const handleAddEnclosure = () => {
    const id = `enclosure-${enclosures.length}`;
    const newEnclosure = {
      id,
      type: 'enclosure',
      position: { x: 100, y: 100 },
      style: { width: 300, height: 400 },
      data: { label: `Panel ${enclosures.length + 1}` }
    };
    
    setNodes((nds) => [...nds, newEnclosure]);
    setEnclosures((enc) => [...enc, newEnclosure]);
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex">
      <div className="w-1/6 border-r border-gray-200 p-4 overflow-y-auto">
        <ComponentLibrary />
      </div>
      <div className="w-5/6 relative">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            nodeTypes={{ enclosure: ResizableEnclosure }}
          >
            <Background color="#aaa" gap={20} />
            <Controls />
            <MiniMap />
            <Panel position="top-left">
              <div className="bg-white p-3 rounded-lg shadow-md space-y-3">
                <Button onClick={handleAddEnclosure} variant="outline" className="w-full">
                  Add Enclosure
                </Button>
                <Button 
                  onClick={() => setShowDimensions(!showDimensions)} 
                  variant={showDimensions ? "default" : "outline"}
                  className="w-full"
                >
                  {showDimensions ? "Hide" : "Show"} Dimensions
                </Button>
              </div>
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default PanelDesigner;
