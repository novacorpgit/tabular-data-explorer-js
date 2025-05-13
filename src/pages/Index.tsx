
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-6">Electrical Panel Design Tool</h1>
      <p className="text-lg text-center mb-8 max-w-2xl">
        Design and visualize electrical panels with our drag-and-drop interface.
        Create enclosures, add components, and plan your layouts.
      </p>
      <Link to="/designer">
        <Button size="lg">
          Open Panel Designer
        </Button>
      </Link>
    </div>
  );
};

export default Index;
