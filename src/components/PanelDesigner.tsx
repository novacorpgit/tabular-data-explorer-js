
import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  NodeTypes,
  Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import ComponentLibrary, { Component } from './ComponentLibrary';
import ResizableEnclosure from './ResizableEnclosure';
import DraggableComponent from './DraggableComponent';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Helper function to check if a component is inside an enclosure
const isInsideEnclosure = (component: Node, enclosure: Node): boolean => {
  if (!enclosure.style || !component.position) return false;
  
  const encWidth = enclosure.style.width as number;
  const encHeight = enclosure.style.height as number;
  const encX = enclosure.position.x;
  const encY = enclosure.position.y;
  
  // Get component dimensions
  const compWidth = component.data.dimensions?.width || 80;
  const compHeight = component.data.dimensions?.height || 80;
  const compX = component.position.x;
  const compY = component.position.y;
  
  // Check if component is fully inside the enclosure
  return (
    compX >= encX && 
    compY >= encY && 
    compX + compWidth <= encX + encWidth && 
    compY + compHeight <= encY + encHeight
  );
};

// Helper function to check if two components overlap
const doComponentsOverlap = (comp1: Node, comp2: Node): boolean => {
  const comp1Width = comp1.data.dimensions?.width || 80;
  const comp1Height = comp1.data.dimensions?.height || 80;
  const comp2Width = comp2.data.dimensions?.width || 80;
  const comp2Height = comp2.data.dimensions?.height || 80;
  
  // Check if there's no overlap (one is to the left/right/top/bottom of the other)
  return !(
    comp1.position.x + comp1Width < comp2.position.x ||
    comp2.position.x + comp2Width < comp1.position.x ||
    comp1.position.y + comp1Height < comp2.position.y ||
    comp2.position.y + comp2Height < comp1.position.y
  );
};

// Calculate the intersection points between components
const getIntersections = (nodes: Node[]) => {
  const componentNodes = nodes.filter(node => node.type === 'component');
  const intersections: Array<{ id: string; intersections: Array<{ id: string; x: number; y: number }> }> = [];

  // Create a map to track nodes by their ID for easier lookups
  const nodeMap = new Map<string, Node>();
  componentNodes.forEach(node => {
    nodeMap.set(node.id, node);
  });

  // Find intersections between all component pairs
  for (let i = 0; i < componentNodes.length; i++) {
    const node1 = componentNodes[i];
    const intersectionPoints = [];

    for (let j = 0; j < componentNodes.length; j++) {
      if (i !== j) {
        const node2 = componentNodes[j];
        
        if (doComponentsOverlap(node1, node2)) {
          // Calculate intersection point (center of the intersection area)
          const n1x1 = node1.position.x;
          const n1y1 = node1.position.y;
          const n1x2 = n1x1 + (node1.data.dimensions?.width || 80);
          const n1y2 = n1y1 + (node1.data.dimensions?.height || 80);
          
          const n2x1 = node2.position.x;
          const n2y1 = node2.position.y;
          const n2x2 = n2x1 + (node2.data.dimensions?.width || 80);
          const n2y2 = n2y1 + (node2.data.dimensions?.height || 80);
          
          // Calculate the intersection rectangle
          const ix1 = Math.max(n1x1, n2x1);
          const iy1 = Math.max(n1y1, n2y1);
          const ix2 = Math.min(n1x2, n2x2);
          const iy2 = Math.min(n1y2, n2y2);
          
          // Calculate center of intersection area
          const x = ix1 + (ix2 - ix1) / 2;
          const y = iy1 + (iy2 - iy1) / 2;
          
          intersectionPoints.push({
            id: node2.id,
            x,
            y
          });
        }
      }
    }

    if (intersectionPoints.length > 0) {
      intersections.push({
        id: node1.id,
        intersections: intersectionPoints
      });
    }
  }

  return intersections;
};

const PanelDesigner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [enclosures, setEnclosures] = useState<any[]>([]);
  const [showDimensions, setShowDimensions] = useState(false);
  const [overlappingComponents, setOverlappingComponents] = useState<string[]>([]);
  const [componentsOutsideEnclosure, setComponentsOutsideEnclosure] = useState<string[]>([]);
  const [intersections, setIntersections] = useState<Array<{ id: string; intersections: Array<{ id: string; x: number; y: number }> }>>([]);
  
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
      data: { label: `Panel ${enclosures.length + 1}` },
      zIndex: 0 // Ensure enclosures are behind components
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
        draggable: true, // Make sure components are draggable
        zIndex: 1 // Ensure components are on top of enclosures
      };

      // Check if the component is being dropped inside an enclosure
      const insideAnyEnclosure = enclosures.some(enc => 
        isInsideEnclosure({...newNode, position: position} as Node, enc)
      );

      if (!insideAnyEnclosure && enclosures.length > 0) {
        toast.error('Components must be placed inside an enclosure!');
        // Try to position the component inside the first enclosure
        const firstEnclosure = enclosures[0];
        newNode.position = {
          x: firstEnclosure.position.x + 20,
          y: firstEnclosure.position.y + 50
        };
      } else if (enclosures.length === 0) {
        toast.error('Please add an enclosure first before adding components!');
        return;
      }

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, enclosures]
  );

  // Function to check component positions and overlaps
  const checkComponentPositions = useCallback(() => {
    const componentNodes = nodes.filter(node => node.type === 'component');
    const enclosureNodes = nodes.filter(node => node.type === 'enclosure');
    
    // Check components outside enclosures
    const outsideComponents: string[] = [];
    componentNodes.forEach(comp => {
      const insideAnyEnclosure = enclosureNodes.some(enc => isInsideEnclosure(comp, enc));
      if (!insideAnyEnclosure) {
        outsideComponents.push(comp.id);
      }
    });
    setComponentsOutsideEnclosure(outsideComponents);
    
    // Check overlapping components
    const overlapping: string[] = [];
    for (let i = 0; i < componentNodes.length; i++) {
      for (let j = i + 1; j < componentNodes.length; j++) {
        if (doComponentsOverlap(componentNodes[i], componentNodes[j])) {
          overlapping.push(componentNodes[i].id, componentNodes[j].id);
        }
      }
    }
    setOverlappingComponents([...new Set(overlapping)]);
    
    // Calculate intersections
    const newIntersections = getIntersections(nodes);
    setIntersections(newIntersections);
    
    // Apply visual indicators by updating node data
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.type !== 'component') return node;
        
        return {
          ...node,
          data: {
            ...node.data,
            isOutsideEnclosure: outsideComponents.includes(node.id),
            isOverlapping: overlapping.includes(node.id),
            intersections: newIntersections.find(i => i.id === node.id)?.intersections || []
          }
        };
      })
    );
    
  }, [nodes, setNodes]);

  // Run checks when nodes change
  useEffect(() => {
    checkComponentPositions();
  }, [nodes, checkComponentPositions]);

  // When component is moved, check if it's outside an enclosure
  const onNodeDragStop = useCallback((event: any, node: Node) => {
    if (node.type === 'component') {
      const insideAnyEnclosure = enclosures.some(enc => isInsideEnclosure(node, enc));
      
      if (!insideAnyEnclosure) {
        toast.error('Components must be placed inside an enclosure!');
        // Move component back inside the closest enclosure
        if (enclosures.length > 0) {
          // Find the closest enclosure
          let closestEnclosure = enclosures[0];
          let closestDistance = Number.MAX_VALUE;
          
          enclosures.forEach(enc => {
            const dx = node.position.x - enc.position.x;
            const dy = node.position.y - enc.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestEnclosure = enc;
            }
          });
          
          // Calculate a safe position within the closest enclosure
          const safeX = Math.min(
            Math.max(node.position.x, closestEnclosure.position.x + 10),
            closestEnclosure.position.x + (closestEnclosure.style?.width as number) - 100
          );
          
          const safeY = Math.min(
            Math.max(node.position.y, closestEnclosure.position.y + 10),
            closestEnclosure.position.y + (closestEnclosure.style?.height as number) - 100
          );
          
          setNodes(nds => 
            nds.map(n => 
              n.id === node.id 
                ? {
                    ...n,
                    position: { x: safeX, y: safeY }
                  }
                : n
            )
          );
        }
      }
    }
  }, [enclosures, setNodes]);

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
            onNodeDragStop={onNodeDragStop}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            nodeTypes={nodeTypes}
            elementsSelectable={true}
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
