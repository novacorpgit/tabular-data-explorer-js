
import React, { useState, useCallback, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const ResizableEnclosure = ({ data, selected }: NodeProps) => {
  const [size, setSize] = useState({ width: 300, height: 400 });
  const [resizing, setResizing] = useState<string | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing(direction);
  }, []);

  const handleResizeEnd = useCallback(() => {
    setResizing(null);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!resizing) return;
    
    const { movementX, movementY } = e;
    
    setSize(prevSize => {
      let newWidth = prevSize.width;
      let newHeight = prevSize.height;
      
      if (resizing.includes('right')) {
        newWidth = Math.max(100, prevSize.width + movementX);
      }
      if (resizing.includes('bottom')) {
        newHeight = Math.max(100, prevSize.height + movementY);
      }
      if (resizing.includes('left')) {
        newWidth = Math.max(100, prevSize.width - movementX);
      }
      if (resizing.includes('top')) {
        newHeight = Math.max(100, prevSize.height - movementY);
      }
      
      return { width: newWidth, height: newHeight };
    });
  }, [resizing]);

  React.useEffect(() => {
    if (resizing) {
      window.addEventListener('mouseup', handleResizeEnd);
      return () => window.removeEventListener('mouseup', handleResizeEnd);
    }
  }, [resizing, handleResizeEnd]);

  const getCursorType = (direction: string) => {
    if (direction === 'top' || direction === 'bottom') return 'ns-resize';
    if (direction === 'left' || direction === 'right') return 'ew-resize';
    if (direction === 'topright' || direction === 'bottomleft') return 'nesw-resize';
    if (direction === 'topleft' || direction === 'bottomright') return 'nwse-resize';
    return 'move';
  };

  return (
    <div 
      ref={nodeRef}
      className="relative bg-white border-2 border-gray-300 rounded-md"
      style={{
        width: size.width,
        height: size.height,
        cursor: resizing ? getCursorType(resizing) : 'move'
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

      {/* Resize handles - top */}
      <div 
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize"
        onMouseDown={(e) => handleResizeStart(e, 'top')}
      />
      
      {/* Resize handles - right */}
      <div 
        className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize"
        onMouseDown={(e) => handleResizeStart(e, 'right')}
      />
      
      {/* Resize handles - bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
        onMouseDown={(e) => handleResizeStart(e, 'bottom')}
      />
      
      {/* Resize handles - left */}
      <div 
        className="absolute top-0 left-0 bottom-0 w-2 cursor-ew-resize"
        onMouseDown={(e) => handleResizeStart(e, 'left')}
      />
      
      {/* Resize handles - corners */}
      <div 
        className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize"
        onMouseDown={(e) => handleResizeStart(e, 'topleft')}
      />
      <div 
        className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize"
        onMouseDown={(e) => handleResizeStart(e, 'topright')}
      />
      <div 
        className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize"
        onMouseDown={(e) => handleResizeStart(e, 'bottomleft')}
      />
      <div 
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-gray-300 flex items-center justify-center"
        onMouseDown={(e) => handleResizeStart(e, 'bottomright')}
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
