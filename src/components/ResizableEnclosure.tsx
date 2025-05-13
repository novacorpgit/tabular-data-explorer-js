
import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const ResizableEnclosure = ({ data, selected }: NodeProps) => {
  const [size, setSize] = useState({ width: 300, height: 400 });
  const [resizing, setResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setResizing(true);
    setResizeDirection(direction);
  }, []);

  const handleResizeEnd = useCallback(() => {
    setResizing(false);
    setResizeDirection('');
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!resizing) return;
    
    switch (resizeDirection) {
      case 'right':
        setSize(prevSize => ({
          ...prevSize,
          width: Math.max(100, prevSize.width + e.movementX)
        }));
        break;
      case 'bottom':
        setSize(prevSize => ({
          ...prevSize,
          height: Math.max(100, prevSize.height + e.movementY)
        }));
        break;
      case 'left':
        setSize(prevSize => ({
          ...prevSize,
          width: Math.max(100, prevSize.width - e.movementX)
        }));
        break;
      case 'top':
        setSize(prevSize => ({
          ...prevSize,
          height: Math.max(100, prevSize.height - e.movementY)
        }));
        break;
      case 'bottom-right':
        setSize(prevSize => ({
          width: Math.max(100, prevSize.width + e.movementX),
          height: Math.max(100, prevSize.height + e.movementY)
        }));
        break;
      case 'bottom-left':
        setSize(prevSize => ({
          width: Math.max(100, prevSize.width - e.movementX),
          height: Math.max(100, prevSize.height + e.movementY)
        }));
        break;
      case 'top-right':
        setSize(prevSize => ({
          width: Math.max(100, prevSize.width + e.movementX),
          height: Math.max(100, prevSize.height - e.movementY)
        }));
        break;
      case 'top-left':
        setSize(prevSize => ({
          width: Math.max(100, prevSize.width - e.movementX),
          height: Math.max(100, prevSize.height - e.movementY)
        }));
        break;
      default:
        break;
    }
  }, [resizing, resizeDirection]);

  React.useEffect(() => {
    if (resizing) {
      window.addEventListener('mouseup', handleResizeEnd);
      window.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
      return () => {
        window.removeEventListener('mouseup', handleResizeEnd);
        window.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      };
    }
  }, [resizing, handleResizeEnd, handleMouseMove]);

  return (
    <div 
      className="relative bg-white border-2 border-gray-300 rounded-md"
      style={{
        width: size.width,
        height: size.height,
        cursor: resizing ? `${resizeDirection}-resize` : 'move'
      }}
    >
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />

      <div className="p-2 bg-gray-100 border-b border-gray-200">
        <h3 className="font-medium text-sm">{data.label || 'Electrical Panel'}</h3>
      </div>

      {/* Resize handles */}
      {/* Right edge */}
      <div 
        className="absolute top-0 right-0 w-2 h-full cursor-e-resize"
        onMouseDown={(e) => handleResizeStart(e, 'right')}
        style={{ backgroundColor: 'transparent' }}
      />
      
      {/* Bottom edge */}
      <div 
        className="absolute bottom-0 left-0 w-full h-2 cursor-s-resize"
        onMouseDown={(e) => handleResizeStart(e, 'bottom')}
        style={{ backgroundColor: 'transparent' }}
      />
      
      {/* Left edge */}
      <div 
        className="absolute top-0 left-0 w-2 h-full cursor-w-resize"
        onMouseDown={(e) => handleResizeStart(e, 'left')}
        style={{ backgroundColor: 'transparent' }}
      />
      
      {/* Top edge */}
      <div 
        className="absolute top-0 left-0 w-full h-2 cursor-n-resize"
        onMouseDown={(e) => handleResizeStart(e, 'top')}
        style={{ backgroundColor: 'transparent' }}
      />
      
      {/* Corner handles */}
      <div 
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize bg-gray-300 flex items-center justify-center"
        onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M0 10 L10 0 L10 10 Z" fill="rgba(0,0,0,0.3)" />
        </svg>
      </div>
      
      <div 
        className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize bg-gray-300 flex items-center justify-center"
        onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M10 10 L0 0 L0 10 Z" fill="rgba(0,0,0,0.3)" />
        </svg>
      </div>
      
      <div 
        className="absolute top-0 right-0 w-6 h-6 cursor-ne-resize bg-gray-300 flex items-center justify-center"
        onMouseDown={(e) => handleResizeStart(e, 'top-right')}
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M0 0 L10 10 L10 0 Z" fill="rgba(0,0,0,0.3)" />
        </svg>
      </div>
      
      <div 
        className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize bg-gray-300 flex items-center justify-center"
        onMouseDown={(e) => handleResizeStart(e, 'top-left')}
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M10 0 L0 10 L0 0 Z" fill="rgba(0,0,0,0.3)" />
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
