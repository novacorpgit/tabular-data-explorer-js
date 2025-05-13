
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type Component = {
  id: string;
  name: string;
  category: string;
  image: string;
  dimensions: { width: number; height: number };
};

const initialComponents: Component[] = [
  {
    id: 'breaker-1',
    name: 'Circuit Breaker 1P',
    category: 'breakers',
    image: '/placeholder.svg',
    dimensions: { width: 40, height: 80 },
  },
  {
    id: 'breaker-2',
    name: 'Circuit Breaker 2P',
    category: 'breakers',
    image: '/placeholder.svg',
    dimensions: { width: 40, height: 100 },
  },
  {
    id: 'terminal-1',
    name: 'Terminal Block',
    category: 'terminals',
    image: '/placeholder.svg',
    dimensions: { width: 30, height: 40 },
  },
  {
    id: 'relay-1',
    name: 'Control Relay',
    category: 'relays',
    image: '/placeholder.svg',
    dimensions: { width: 60, height: 80 },
  },
  {
    id: 'contactor-1',
    name: 'Contactor',
    category: 'contactors',
    image: '/placeholder.svg',
    dimensions: { width: 80, height: 120 },
  },
];

const ComponentLibrary = () => {
  const [components, setComponents] = useState(initialComponents);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  
  const categories = [...new Set(components.map(c => c.category))];

  const onDragStart = (event: React.DragEvent, component: Component) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleUpdateImage = () => {
    if (editingComponent && imageUrl) {
      setComponents(components.map(comp => 
        comp.id === editingComponent.id 
          ? { ...comp, image: imageUrl } 
          : comp
      ));
      setEditingComponent(null);
      setImageUrl('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Component Library</h2>
      
      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-2">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-2 p-1">
                {components
                  .filter(c => c.category === category)
                  .map(component => (
                    <div
                      key={component.id}
                      className="flex items-center p-2 border rounded-md cursor-grab hover:bg-gray-50 transition-colors"
                      draggable
                      onDragStart={(e) => onDragStart(e, component)}
                    >
                      <div className="relative w-12 h-12 bg-gray-200 rounded flex items-center justify-center mr-3">
                        <img 
                          src={component.image} 
                          alt={component.name}
                          className="max-w-full max-h-full"
                        />
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingComponent(component);
                              }}
                            >
                              ✎
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Component Image</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="image">Image URL</Label>
                                <Input 
                                  id="image" 
                                  value={imageUrl} 
                                  onChange={(e) => setImageUrl(e.target.value)}
                                  placeholder="https://example.com/component.png"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setImageUrl('')}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleUpdateImage}>
                                  Update Image
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{component.name}</p>
                        <p className="text-xs text-gray-500">
                          {component.dimensions.width} × {component.dimensions.height} px
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ComponentLibrary;
