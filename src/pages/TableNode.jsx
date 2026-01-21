import React, { memo } from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';

// Styles for the "Ghost" column (The missing one causing the crash)
const ghostStyle = {
  background: '#FEF2F2',
  border: '1px dashed #EF4444',
  color: '#B91C1C',
  fontWeight: 'bold',
  animation: 'pulse 2s infinite',
};

const TableNode = ({ data, selected }) => {
  // Only show columns if the user has clicked (selected) the node
  // OR if we explicitly force it open via data.expanded
  const isExpanded = selected || data.expanded;

  return (
    <div
      style={{
        background: 'white',
        border: `2px solid ${data.status === 'error' ? '#EF4444' : '#64748B'}`,
        borderRadius: '8px',
        minWidth: '200px',
        boxShadow: selected ? '0 0 10px rgba(0,0,0,0.2)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {/* 1. HEADER (Always Visible) */}
      <div
        style={{
          padding: '10px',
          background: data.status === 'error' ? '#EF4444' : '#F1F5F9',
          color: data.status === 'error' ? 'white' : '#1E293B',
          borderTopLeftRadius: '6px',
          borderTopRightRadius: '6px',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{data.label}</span>
        {data.status === 'error' && (
          <span style={{ fontSize: '10px' }}>⚠️ CRASHED</span>
        )}
      </div>

      {/* 2. COLUMNS (Visible only when Expanded) */}
      {isExpanded && (
        <div style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
          {data.columns.map((col, index) => (
            <div
              key={col.name}
              style={{
                position: 'relative',
                padding: '8px 15px',
                borderBottom: '1px solid #E2E8F0',
                fontSize: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                // If this is the "Ghost" column causing the break, apply special styles
                ...(col.isGhost ? ghostStyle : {}),
              }}
            >
              {/* TARGET HANDLE (Left side - Receives data) */}
              <Handle
                type='target'
                position={Position.Left}
                id={col.name} // Unique ID for this specific attribute
                style={{ left: '-5px', background: '#94A3B8' }}
              />

              <span>{col.name}</span>

              {/* Special Error Label */}
              {col.isGhost && (
                <span style={{ fontSize: '10px' }}>⛔ NO MATCH</span>
              )}
              {col.isNew && (
                <span style={{ color: '#059669', fontWeight: 'bold' }}>
                  + NEW
                </span>
              )}

              {/* SOURCE HANDLE (Right side - Sends data) */}
              <Handle
                type='source'
                position={Position.Right}
                id={col.name}
                style={{ right: '-5px', background: '#94A3B8' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Helper text when collapsed */}
      {!isExpanded && (
        <div
          style={{
            padding: '5px',
            textAlign: 'center',
            fontSize: '10px',
            color: '#94A3B8',
          }}
        >
          Click to see schema
        </div>
      )}
    </div>
  );
};

export default memo(TableNode);
