
import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const ResizableEnclosure = ({ data, selected }: NodeProps) => {
  const [size, setSize] = useState({ width: 300, height: 400 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(false);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing(true);
  }, []);

  const handleResizeEnd = useCallback(() => {
    setResizing(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!resizing) return;
    
    setSize(prevSize => ({
      width: prevSize.width + e.movementX,
      height: prevSize.height + e.movementY
    }));
  }, [resizing]);

  React.useEffect(() => {
    if (resizing) {
      window.addEventListener('mouseup', handleResizeEnd);
      return () => window.removeEventListener('mouseup', handleResizeEnd);
    }
  }, [resizing, handleResizeEnd]);

  return (
    <div 
      className="relative bg-white border-2 border-gray-300 rounded-md"
      style={{
        width: size.width,
        height: size.height,
        cursor: resizing ? 'nwse-resize' : 'move'
      }}
      onMouseMove={handleMouseMove}
    >
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />

      <div className="p-2 bg-gray-100 border-b border-gray-200">
        <h3 className="font-medium text-sm">{data.label || 'Electrical Panel'}</h3>
      </div>

      {/* Resize handle */}
      <div 
        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize bg-gray-300 flex items-center justify-center"
        onMouseDown={handleResizeStart}
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path 
            d="M0 10 L10 0 L10 10 Z" 
            fill="rgba(0,0,0,0.3)" 
          />
        </svg>
      </div>

      {/* Dimensions display */}
      <div className="absolute -bottom-8 left-0 text-xs font-medium bg-blue-100 px-2 py-1 rounded-md">
        {Math.round(size.width)} × {Math.round(size.height)} px
      </div>
    </div>
  );
};

export default ResizableEnclosure;
