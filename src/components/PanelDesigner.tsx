import React, { useState, useCallback, useRef, useEffect, CSSProperties } from 'react';
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
  Node,
  SnapGrid,
  CoordinateExtent
} from 'reactflow';
import 'reactflow/dist/style.css';
import ComponentLibrary, { Component } from './ComponentLibrary';
import ResizableEnclosure from './ResizableEnclosure';
import DraggableComponent from './DraggableComponent';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Helper function to check if a position is inside an enclosure
const isPositionInsideEnclosure = (position: XYPosition, enclosure: Node): boolean => {
  if (!enclosure.style) return false;
  
  const encWidth = enclosure.style.width as number;
  const encHeight = enclosure.style.height as number;
  const encX = enclosure.position.x;
  const encY = enclosure.position.y;
  
  return (
    position.x >= encX && 
    position.y >= encY && 
    position.x <= encX + encWidth && 
    position.y <= encY + encHeight
  );
};

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

// Helper to calculate snap lines between nodes
const getSnapLines = (draggingNode: Node, nodes: Node[]) => {
  // Skip if no dragging node
  if (!draggingNode) return [];
  
  const snapLines = [];
  const draggingNodeWidth = draggingNode.data.dimensions?.width || 80;
  const draggingNodeHeight = draggingNode.data.dimensions?.height || 80;

  // Calculate center, left, right, top, bottom of dragging node
  const draggingCenterX = draggingNode.position.x + draggingNodeWidth / 2;
  const draggingCenterY = draggingNode.position.y + draggingNodeHeight / 2;
  const draggingLeft = draggingNode.position.x;
  const draggingRight = draggingNode.position.x + draggingNodeWidth;
  const draggingTop = draggingNode.position.y;
  const draggingBottom = draggingNode.position.y + draggingNodeHeight;

  // Compare with all other nodes
  nodes.forEach(node => {
    if (node.id === draggingNode.id || node.type === 'enclosure') return;
    
    const nodeWidth = node.data.dimensions?.width || 80;
    const nodeHeight = node.data.dimensions?.height || 80;
    
    // Calculate center, left, right, top, bottom of other node
    const nodeCenterX = node.position.x + nodeWidth / 2;
    const nodeCenterY = node.position.y + nodeHeight / 2;
    const nodeLeft = node.position.x;
    const nodeRight = node.position.x + nodeWidth;
    const nodeTop = node.position.y;
    const nodeBottom = node.position.y + nodeHeight;

    // Horizontal center alignment
    if (Math.abs(draggingCenterX - nodeCenterX) < 5) {
      snapLines.push({
        id: `center-x-${node.id}`,
        type: 'horizontal',
        position: nodeCenterY,
        from: Math.min(draggingLeft, nodeLeft),
        to: Math.max(draggingRight, nodeRight)
      });
    }

    // Vertical center alignment
    if (Math.abs(draggingCenterY - nodeCenterY) < 5) {
      snapLines.push({
        id: `center-y-${node.id}`,
        type: 'vertical',
        position: nodeCenterX,
        from: Math.min(draggingTop, nodeTop),
        to: Math.max(draggingBottom, nodeBottom)
      });
    }

    // Left alignment
    if (Math.abs(draggingLeft - nodeLeft) < 5) {
      snapLines.push({
        id: `left-${node.id}`,
        type: 'vertical',
        position: nodeLeft,
        from: Math.min(draggingTop, nodeTop),
        to: Math.max(draggingBottom, nodeBottom)
      });
    }

    // Right alignment
    if (Math.abs(draggingRight - nodeRight) < 5) {
      snapLines.push({
        id: `right-${node.id}`,
        type: 'vertical',
        position: nodeRight,
        from: Math.min(draggingTop, nodeTop),
        to: Math.max(draggingBottom, nodeBottom)
      });
    }

    // Top alignment
    if (Math.abs(draggingTop - nodeTop) < 5) {
      snapLines.push({
        id: `top-${node.id}`,
        type: 'horizontal',
        position: nodeTop,
        from: Math.min(draggingLeft, nodeLeft),
        to: Math.max(draggingRight, nodeRight)
      });
    }

    // Bottom alignment
    if (Math.abs(draggingBottom - nodeBottom) < 5) {
      snapLines.push({
        id: `bottom-${node.id}`,
        type: 'horizontal',
        position: nodeBottom,
        from: Math.min(draggingLeft, nodeLeft),
        to: Math.max(draggingRight, nodeRight)
      });
    }
  });

  return snapLines;
};

// Helper component to render snap lines
const SnapLine = ({ line }: { line: any }) => {
  const style: CSSProperties = {
    position: 'absolute',
    backgroundColor: '#ff0072',
    zIndex: 999,
    pointerEvents: 'none',
  };

  if (line.type === 'horizontal') {
    return (
      <div
        style={{
          ...style,
          height: '1px',
          left: `${line.from}px`,
          top: `${line.position}px`,
          width: `${line.to - line.from}px`,
        }}
      />
    );
  }

  return (
    <div
      style={{
        ...style,
        width: '1px',
        left: `${line.position}px`,
        top: `${line.from}px`,
        height: `${line.to - line.from}px`,
      }}
    />
  );
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
  const [snapLines, setSnapLines] = useState<any[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [errorCheckingEnabled, setErrorCheckingEnabled] = useState<boolean>(true);
  
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
      zIndex: 0, // Ensure enclosures are behind components
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

      // Find enclosure that contains this position
      let parentId = undefined;
      let targetEnclosure = null;
      
      for (const enclosure of enclosures) {
        if (isPositionInsideEnclosure(position, enclosure)) {
          parentId = enclosure.id;
          targetEnclosure = enclosure;
          break;
        }
      }

      // Only prompt for enclosure if error checking is enabled
      if (errorCheckingEnabled && !parentId && enclosures.length > 0) {
        toast.error('Components must be placed inside an enclosure!');
        // Use the first enclosure as default
        parentId = enclosures[0].id;
        targetEnclosure = enclosures[0];
      } else if (enclosures.length === 0) {
        toast.error('Please add an enclosure first before adding components!');
        return;
      }

      // Create the new node with the correct type for 'extent'
      const newNode = {
        id: `${component.id}-${Math.floor(Math.random() * 10000)}`,
        type: 'component',
        position: targetEnclosure ? {
          // Position relative to the parent when using parentId
          x: position.x - targetEnclosure.position.x,
          y: position.y - targetEnclosure.position.y
        } : position,
        data: {
          name: component.name,
          image: component.image,
          dimensions: component.dimensions,
        },
        parentId, // Set the parent ID to create the relationship
        extent: 'parent' as const, // Using 'as const' to specify it's specifically the string literal "parent"
        draggable: true,
        zIndex: 1 // Ensure components are on top of enclosures
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, enclosures, errorCheckingEnabled]
  );

  // Function to check component positions and overlaps
  const checkComponentPositions = useCallback(() => {
    // Skip checking if error checking is disabled
    if (!errorCheckingEnabled) {
      setComponentsOutsideEnclosure([]);
      setOverlappingComponents([]);
      setIntersections([]);
      // Clear visual indicators on nodes
      setNodes(prevNodes => 
        prevNodes.map(node => {
          if (node.type !== 'component') return node;
          
          return {
            ...node,
            data: {
              ...node.data,
              isOutsideEnclosure: false,
              isOverlapping: false,
              intersections: []
            }
          };
        })
      );
      return;
    }
    
    const componentNodes = nodes.filter(node => node.type === 'component');
    
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
            isOverlapping: overlapping.includes(node.id),
            intersections: newIntersections.find(i => i.id === node.id)?.intersections || []
          }
        };
      })
    );
    
  }, [nodes, setNodes, errorCheckingEnabled]);

  // Run checks when nodes change
  useEffect(() => {
    checkComponentPositions();
  }, [nodes, checkComponentPositions]);

  // Handle node drag start
  const onNodeDragStart = useCallback((event: any, node: Node) => {
    if (node.type === 'component') {
      setDraggingNodeId(node.id);
    }
  }, []);

  // Update snap lines during drag
  const onNodeDrag = useCallback((event: any, node: Node) => {
    if (node.type === 'component') {
      const lines = getSnapLines(node, nodes);
      setSnapLines(lines);
    }
  }, [nodes]);

  // When drag stops
  const onNodeDragStop = useCallback((event: any, node: Node) => {
    // Clear snap lines when drag ends
    setSnapLines([]);
    setDraggingNodeId(null);
  }, []);

  const toggleErrorChecking = () => {
    setErrorCheckingEnabled(!errorCheckingEnabled);
    if (!errorCheckingEnabled) {
      toast.info('Error checking turned ON');
    } else {
      toast.info('Error checking turned OFF');
    }
  };

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
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            nodeTypes={nodeTypes}
            elementsSelectable={true}
            deleteKeyCode={['Backspace', 'Delete']} // Allow deleting nodes with Backspace or Delete keys
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
                <div className="flex items-center justify-between rounded-lg border p-2">
                  <div className="text-sm font-medium">Error Checking</div>
                  <Switch 
                    checked={errorCheckingEnabled} 
                    onCheckedChange={toggleErrorChecking} 
                    aria-label="Toggle error checking"
                  />
                </div>
              </div>
            </Panel>
            
            {/* Render snap lines - position them in the flow container */}
            <div className="react-flow__snaplines">
              {snapLines.map((line) => (
                <SnapLine key={line.id} line={line} />
              ))}
            </div>
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default PanelDesigner;
