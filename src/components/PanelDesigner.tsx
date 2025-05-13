
import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  Connection,
  XYPosition,
  OnConnectStartParams,
  NodeTypes
} from 'reactflow';
import 'reactflow/dist/style.css';
import ComponentLibrary, { Component } from './ComponentLibrary';
import ResizableEnclosure from './ResizableEnclosure';
import DraggableComponent from './DraggableComponent';
import { Button } from '@/components/ui/button';

const PanelDesigner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [enclosures, setEnclosures] = useState<any[]>([]);
  const [showDimensions, setShowDimensions] = useState(false);
  
  // Define node types
  const nodeTypes: NodeTypes = {
    enclosure: ResizableEnclosure,
    component: DraggableComponent
  };
  
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

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const componentData = event.dataTransfer.getData('application/reactflow');
      
      if (!componentData || !reactFlowBounds || !reactFlowInstance) {
        return;
      }

      const component = JSON.parse(componentData) as Component;
      
      // Calculate position of the drop
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `${component.id}-${Math.floor(Math.random() * 10000)}`,
        type: 'component',
        position,
        data: {
          name: component.name,
          image: component.image,
          dimensions: component.dimensions,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex">
      <div className="w-1/6 border-r border-gray-200 p-4 overflow-y-auto">
        <ComponentLibrary />
      </div>
      <div className="w-5/6 relative" ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            nodeTypes={nodeTypes}
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
