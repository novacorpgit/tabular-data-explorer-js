
import React from 'react';
import PanelDesigner from '@/components/PanelDesigner';

const Designer = () => {
  return (
    <div className="container mx-auto p-4 h-screen">
      <h1 className="text-2xl font-bold mb-4">Electrical Panel Designer</h1>
      <div className="text-sm text-gray-600 mb-4">
        Drag components from the library onto the panel to design your electrical layout. 
        Components must be placed inside an enclosure.
      </div>
      <PanelDesigner />
    </div>
  );
};

export default Designer;
