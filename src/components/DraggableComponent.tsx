
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface DraggableComponentProps extends NodeProps {
  data: {
    name: string;
    image: string;
    dimensions: {
      width: number;
      height: number;
    };
    isOutsideEnclosure?: boolean;
    isOverlapping?: boolean;
    intersections?: Array<{ id: string; x: number; y: number }>;
  };
}

const DraggableComponent = ({ data, id }: DraggableComponentProps) => {
  // Determine border style based on component status
  const getBorderStyle = () => {
    if (data.isOutsideEnclosure) return 'border-red-500 border-2';
    if (data.isOverlapping) return 'border-orange-400 border-2';
    return 'border-gray-300';
  };

  return (
    <div 
      className={`relative bg-white border rounded shadow-sm ${getBorderStyle()}`}
      style={{
        width: data.dimensions?.width || 80, 
        height: data.dimensions?.height || 80
      }}
    >
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />

      <div className="h-full w-full flex flex-col">
        <div className="flex-grow flex items-center justify-center p-1">
          <img 
            src={data.image} 
            alt={data.name} 
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <div className="bg-gray-100 p-1 text-xs text-center border-t border-gray-200 truncate">
          {data.name}
        </div>
      </div>
      
      {data.isOverlapping && (
        <div className="absolute -top-6 left-0 right-0 text-xs font-bold text-center bg-orange-400 text-white px-1 py-0.5 rounded-t-md">
          Overlap detected
        </div>
      )}
      
      {data.isOutsideEnclosure && (
        <div className="absolute -top-6 left-0 right-0 text-xs font-bold text-center bg-red-500 text-white px-1 py-0.5 rounded-t-md">
          Outside enclosure
        </div>
      )}

      {/* Render intersection points */}
      {data.intersections && data.intersections.map((intersection, index) => (
        <div 
          key={`${id}-${intersection.id}-${index}`}
          className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white z-10"
          style={{
            left: intersection.x - 6, // Adjust for dot size
            top: intersection.y - 6,  // Adjust for dot size
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
    </div>
  );
};

export default DraggableComponent;
