import React from 'react';

const DepartmentPanel = ({ activeDepartment, onDepartmentChange }) => {
  const departments = [
    {
      id: 'dispatch',
      label: 'Dispatch Operations',
      icon: '🚚',
      description: 'Route planning, load assignment, driver dispatch'
    },
    {
      id: 'accounting',
      label: 'Accounting',
      icon: '💰',
      description: 'Invoicing, payments, financial reporting'
    },
    {
      id: 'sales',
      label: 'Sales/Business Development',
      icon: '📈',
      description: 'Lead generation, CRM, rate quotes'
    },
    {
      id: 'hr',
      label: 'HR',
      icon: '👥',
      description: 'Recruitment, training, employee management'
    },
    {
      id: 'maintenance',
      label: 'Fleet Maintenance',
      icon: '🔧',
      description: 'Preventive maintenance, repairs, inspections'
    },
    {
      id: 'safety',
      label: 'Fleet Safety',
      icon: '🛡️',
      description: 'Safety compliance, accident prevention, training'
    }
  ];

  return (
    <div className="w-full h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-sidebar-border">
        <h2 className="font-bold text-base text-sidebar-foreground">Departments</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Select workspace</p>
      </div>

      {/* Department List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {departments.map((dept) => (
          <button
            key={dept.id}
            onClick={() => onDepartmentChange(dept.id)}
            className={`w-full text-center p-4 transition-all ${
              activeDepartment === dept.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            <div className="font-bold text-lg">
              {dept.label}
            </div>
            <div className={`text-xs mt-1 ${
              activeDepartment === dept.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
            }`}>
              {dept.description}
            </div>
          </button>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar">
        <div className="text-xs text-muted-foreground text-center">
          <div className="font-semibold mb-1 text-sidebar-foreground">🤖 AI Assistant</div>
          <div>Context-aware help</div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentPanel;
