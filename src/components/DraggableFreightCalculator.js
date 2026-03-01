import React, { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DraggableFreightCalculator = ({ 
  QuoteCalculatorComponent,
  TotalQuoteComponent,
  MapComponent,
  UnitConverterComponent,
  RouteCalculatorComponent
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Default layout configuration
  const [layouts, setLayouts] = useState({
    lg: [
      { i: 'quote-calc', x: 0, y: 0, w: 4, h: 8, minW: 3, minH: 6 },
      { i: 'total-quote', x: 0, y: 8, w: 4, h: 5, minW: 3, minH: 4 },
      { i: 'map', x: 4, y: 0, w: 8, h: 8, minW: 6, minH: 6 },
      { i: 'unit-converter', x: 4, y: 8, w: 4, h: 5, minW: 3, minH: 4 },
      { i: 'route-calc', x: 8, y: 8, w: 4, h: 5, minW: 3, minH: 4 }
    ]
  });

  const handleLayoutChange = (layout, layouts) => {
    setLayouts(layouts);
  };

  const resetLayout = () => {
    setLayouts({
      lg: [
        { i: 'quote-calc', x: 0, y: 0, w: 4, h: 8, minW: 3, minH: 6 },
        { i: 'total-quote', x: 0, y: 8, w: 4, h: 5, minW: 3, minH: 4 },
        { i: 'map', x: 4, y: 0, w: 8, h: 8, minW: 6, minH: 6 },
        { i: 'unit-converter', x: 4, y: 8, w: 4, h: 5, minW: 3, minH: 4 },
        { i: 'route-calc', x: 8, y: 8, w: 4, h: 5, minW: 3, minH: 4 }
      ]
    });
    toast.success('Layout reset to default');
  };

  const saveLayout = () => {
    localStorage.setItem('freightCalculatorLayout', JSON.stringify(layouts));
    toast.success('Layout saved successfully');
  };

  const loadLayout = () => {
    const saved = localStorage.getItem('freightCalculatorLayout');
    if (saved) {
      setLayouts(JSON.parse(saved));
      toast.success('Layout loaded successfully');
    } else {
      toast.info('No saved layout found');
    }
  };

  // Load saved layout on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('freightCalculatorLayout');
    if (saved) {
      setLayouts(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <i className={`fas ${isEditMode ? 'fa-lock-open' : 'fa-lock'} text-gray-500`}></i>
          <span className="text-sm font-medium text-gray-700">
            {isEditMode ? 'Edit Mode: Drag & Resize Enabled' : 'View Mode: Layout Locked'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsEditMode(!isEditMode)}
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            className={isEditMode ? "bg-primary hover:bg-primary/90 text-white" : ""}
          >
            <i className={`fas ${isEditMode ? 'fa-lock' : 'fa-edit'} mr-2`}></i>
            {isEditMode ? 'Lock Layout' : 'Edit Layout'}
          </Button>
          {isEditMode && (
            <>
              <Button onClick={saveLayout} variant="outline" size="sm">
                <i className="fas fa-save mr-2"></i>
                Save
              </Button>
              <Button onClick={loadLayout} variant="outline" size="sm">
                <i className="fas fa-folder-open mr-2"></i>
                Load
              </Button>
              <Button onClick={resetLayout} variant="outline" size="sm">
                <i className="fas fa-undo mr-2"></i>
                Reset
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className={`bg-gray-50 rounded-lg p-4 ${isEditMode ? 'border-2 border-dashed border-primary' : 'border border-gray-200'}`}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          onLayoutChange={handleLayoutChange}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          compactType="vertical"
          preventCollision={false}
          margin={[16, 16]}
        >
          {/* Quote Calculator */}
          <div key="quote-calc" className={`${isEditMode ? 'cursor-move' : ''}`}>
            <Card className="h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-full overflow-y-auto">
                {QuoteCalculatorComponent}
              </div>
              {isEditMode && (
                <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                  <i className="fas fa-arrows-alt mr-1"></i>
                  Drag
                </div>
              )}
            </Card>
          </div>

          {/* Total Quote */}
          <div key="total-quote" className={`${isEditMode ? 'cursor-move' : ''}`}>
            <div className="h-full">
              {TotalQuoteComponent}
              {isEditMode && (
                <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                  <i className="fas fa-arrows-alt mr-1"></i>
                  Drag
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div key="map" className={`${isEditMode ? 'cursor-move' : ''}`}>
            <div className="h-full">
              {MapComponent}
              {isEditMode && (
                <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full z-50">
                  <i className="fas fa-arrows-alt mr-1"></i>
                  Drag
                </div>
              )}
            </div>
          </div>

          {/* Unit Converter */}
          <div key="unit-converter" className={`${isEditMode ? 'cursor-move' : ''}`}>
            <div className="h-full">
              {UnitConverterComponent}
              {isEditMode && (
                <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                  <i className="fas fa-arrows-alt mr-1"></i>
                  Drag
                </div>
              )}
            </div>
          </div>

          {/* Route Calculator */}
          <div key="route-calc" className={`${isEditMode ? 'cursor-move' : ''}`}>
            <Card className="h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-full overflow-y-auto">
                {RouteCalculatorComponent}
              </div>
              {isEditMode && (
                <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                  <i className="fas fa-arrows-alt mr-1"></i>
                  Drag
                </div>
              )}
            </Card>
          </div>
        </ResponsiveGridLayout>
      </div>

      {/* Help Text */}
      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <i className="fas fa-info-circle text-foreground mt-0.5"></i>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Edit Mode Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Drag:</strong> Click and hold the title bar or badge, then drag to move</li>
                <li><strong>Resize:</strong> Drag the bottom-right corner handle to resize</li>
                <li><strong>Save:</strong> Click "Save" to remember your custom layout</li>
                <li><strong>Reset:</strong> Click "Reset" to restore the default layout</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraggableFreightCalculator;
