
import React from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';

const ResizableEnclosure = ({ data, selected }: NodeProps) => {
  return (
    <div 
      className="relative bg-white border-2 border-gray-300 rounded-md"
      style={{
        width: '100%',
        height: '100%',
        cursor: 'move',
        zIndex: 0 // Ensure enclosure stays behind components
      }}
    >
      {/* Use React Flow's built-in NodeResizer component */}
      <NodeResizer 
        minWidth={200}
        minHeight={200}
        isVisible={selected} 
        handleStyle={{ 
          width: 8, 
          height: 8,
          backgroundColor: '#1a192b',
          borderColor: 'white' 
        }}
        lineStyle={{
          borderColor: '#1a192b',
          borderWidth: 1
        }}
        keepAspectRatio={false}
      />
      
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />

      <div className="p-2 bg-gray-100 border-b border-gray-200">
        <h3 className="font-medium text-sm">{data.label || 'Electrical Panel'}</h3>
      </div>

      {/* Dimensions display */}
      <div className="absolute -bottom-8 left-0 text-xs font-medium bg-blue-100 px-2 py-1 rounded-md">
        {Math.round(data.width || 300)} × {Math.round(data.height || 400)} px
      </div>
    </div>
  );
};

export default ResizableEnclosure;
