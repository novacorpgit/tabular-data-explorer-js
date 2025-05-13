
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
  };
}

const DraggableComponent = ({ data }: DraggableComponentProps) => {
  return (
    <div 
      className="relative bg-white border border-gray-300 rounded shadow-sm"
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
    </div>
  );
};

export default DraggableComponent;
