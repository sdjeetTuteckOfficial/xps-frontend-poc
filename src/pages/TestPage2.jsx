// import React, { useCallback, useState, useEffect, useMemo } from 'react';
// import ReactFlow, {
//   Background,
//   Controls,
//   Handle,
//   Position,
//   useNodesState, // <--- 1. We need the hook
//   useEdgesState,
//   MarkerType,
//   ReactFlowProvider,
//   useReactFlow,
// } from 'reactflow';
// import dagre from 'dagre';
// import { ChevronDown, ChevronRight, Minimize2, Maximize2 } from 'lucide-react';
// import 'reactflow/dist/style.css';

// // ... [KEEP RAW_DATA CONSTANT EXACTLY AS BEFORE] ...
// const RAW_DATA = {
//   entities: [
//     {
//       entity_name: 'Customer',
//       entity_type: 'base',
//       attributes: [
//         { attribute_name: 'customer_id', data_type: 'string' },
//         { attribute_name: 'first_name', data_type: 'string' },
//         { attribute_name: 'last_name', data_type: 'string' },
//         { attribute_name: 'date_of_birth', data_type: 'date' },
//         { attribute_name: 'gender', data_type: 'string' },
//         { attribute_name: 'customer_type', data_type: 'string' },
//       ],
//     },
//     {
//       entity_name: 'Policy',
//       entity_type: 'base',
//       attributes: [
//         { attribute_name: 'policy_id', data_type: 'string' },
//         { attribute_name: 'policy_number', data_type: 'string' },
//         { attribute_name: 'policy_type', data_type: 'string' },
//         { attribute_name: 'issue_date', data_type: 'date' },
//         { attribute_name: 'expiry_date', data_type: 'date' },
//         { attribute_name: 'policy_status', data_type: 'string' },
//       ],
//     },
//     {
//       entity_name: 'Claim',
//       entity_type: 'base',
//       attributes: [
//         { attribute_name: 'claim_id', data_type: 'string' },
//         { attribute_name: 'policy_id', data_type: 'string' },
//         { attribute_name: 'claim_date', data_type: 'date' },
//         { attribute_name: 'claim_amount', data_type: 'decimal' },
//         { attribute_name: 'claim_status', data_type: 'string' },
//       ],
//     },
//     {
//       entity_name: 'PremiumPayment',
//       entity_type: 'base',
//       attributes: [
//         { attribute_name: 'payment_id', data_type: 'string' },
//         { attribute_name: 'policy_id', data_type: 'string' },
//         { attribute_name: 'payment_date', data_type: 'date' },
//         { attribute_name: 'payment_amount', data_type: 'decimal' },
//       ],
//     },
//     {
//       entity_name: 'InsuredAsset',
//       entity_type: 'base',
//       attributes: [
//         { attribute_name: 'asset_id', data_type: 'string' },
//         { attribute_name: 'policy_id', data_type: 'string' },
//         { attribute_name: 'asset_type', data_type: 'string' },
//         { attribute_name: 'asset_value', data_type: 'decimal' },
//       ],
//     },
//     {
//       entity_name: 'RiskProfile',
//       entity_type: 'derived',
//       attributes: [
//         { attribute_name: 'risk_profile_id', data_type: 'string' },
//         { attribute_name: 'customer_id', data_type: 'string' },
//         { attribute_name: 'risk_score', data_type: 'integer' },
//         { attribute_name: 'risk_category', data_type: 'string' },
//       ],
//     },
//     {
//       entity_name: 'PolicyFinancialSummary',
//       entity_type: 'derived',
//       attributes: [
//         { attribute_name: 'policy_id', data_type: 'string' },
//         { attribute_name: 'total_premium_paid', data_type: 'decimal' },
//         { attribute_name: 'total_claim_amount', data_type: 'decimal' },
//         { attribute_name: 'loss_ratio', data_type: 'decimal' },
//       ],
//     },
//     {
//       entity_name: 'CustomerPolicyPortfolio',
//       entity_type: 'derived',
//       attributes: [
//         { attribute_name: 'customer_id', data_type: 'string' },
//         { attribute_name: 'active_policy_count', data_type: 'integer' },
//         { attribute_name: 'total_sum_insured', data_type: 'decimal' },
//       ],
//     },
//     {
//       entity_name: 'UnderwritingDecision',
//       entity_type: 'derived',
//       attributes: [
//         { attribute_name: 'decision_id', data_type: 'string' },
//         { attribute_name: 'policy_id', data_type: 'string' },
//         { attribute_name: 'decision_status', data_type: 'string' },
//         { attribute_name: 'decision_reason', data_type: 'string' },
//       ],
//     },
//     {
//       entity_name: 'CustomerLifetimeValue',
//       entity_type: 'derived',
//       attributes: [
//         { attribute_name: 'customer_id', data_type: 'string' },
//         { attribute_name: 'lifetime_premium', data_type: 'decimal' },
//         { attribute_name: 'lifetime_claims', data_type: 'decimal' },
//         { attribute_name: 'net_value', data_type: 'decimal' },
//       ],
//     },
//   ],
//   relations: [
//     {
//       source_object_name: 'Customer',
//       target_object_name: 'RiskProfile',
//       field_mappings: [
//         { source_field_name: 'date_of_birth', target_field_name: 'risk_score' },
//         {
//           source_field_name: 'customer_type',
//           target_field_name: 'risk_category',
//         },
//       ],
//     },
//     {
//       source_object_name: 'Policy',
//       target_object_name: 'CustomerPolicyPortfolio',
//       field_mappings: [
//         {
//           source_field_name: 'policy_status',
//           target_field_name: 'active_policy_count',
//         },
//       ],
//     },
//     {
//       source_object_name: 'InsuredAsset',
//       target_object_name: 'CustomerPolicyPortfolio',
//       field_mappings: [
//         {
//           source_field_name: 'asset_value',
//           target_field_name: 'total_sum_insured',
//         },
//       ],
//     },
//     {
//       source_object_name: 'PremiumPayment',
//       target_object_name: 'PolicyFinancialSummary',
//       field_mappings: [
//         {
//           source_field_name: 'payment_amount',
//           target_field_name: 'total_premium_paid',
//         },
//       ],
//     },
//     {
//       source_object_name: 'Claim',
//       target_object_name: 'PolicyFinancialSummary',
//       field_mappings: [
//         {
//           source_field_name: 'claim_amount',
//           target_field_name: 'total_claim_amount',
//         },
//       ],
//     },
//     {
//       source_object_name: 'PolicyFinancialSummary',
//       target_object_name: 'PolicyFinancialSummary',
//       field_mappings: [
//         {
//           source_field_name: 'total_claim_amount',
//           target_field_name: 'loss_ratio',
//         },
//         {
//           source_field_name: 'total_premium_paid',
//           target_field_name: 'loss_ratio',
//         },
//       ],
//     },
//     {
//       source_object_name: 'RiskProfile',
//       target_object_name: 'UnderwritingDecision',
//       field_mappings: [
//         {
//           source_field_name: 'risk_category',
//           target_field_name: 'decision_status',
//         },
//       ],
//     },
//     {
//       source_object_name: 'Policy',
//       target_object_name: 'UnderwritingDecision',
//       field_mappings: [
//         {
//           source_field_name: 'policy_type',
//           target_field_name: 'decision_reason',
//         },
//       ],
//     },
//     {
//       source_object_name: 'PremiumPayment',
//       target_object_name: 'CustomerLifetimeValue',
//       field_mappings: [
//         {
//           source_field_name: 'payment_amount',
//           target_field_name: 'lifetime_premium',
//         },
//       ],
//     },
//     {
//       source_object_name: 'Claim',
//       target_object_name: 'CustomerLifetimeValue',
//       field_mappings: [
//         {
//           source_field_name: 'claim_amount',
//           target_field_name: 'lifetime_claims',
//         },
//       ],
//     },
//     {
//       source_object_name: 'CustomerLifetimeValue',
//       target_object_name: 'CustomerLifetimeValue',
//       field_mappings: [
//         {
//           source_field_name: 'lifetime_premium',
//           target_field_name: 'net_value',
//         },
//         {
//           source_field_name: 'lifetime_claims',
//           target_field_name: 'net_value',
//         },
//       ],
//     },
//   ],
// };

// // ... [KEEP HELPER FUNCTIONS EXACTLY AS BEFORE] ...
// const getLayoutedElements = (nodes, edges, direction = 'LR') => {
//   const dagreGraph = new dagre.graphlib.Graph();
//   dagreGraph.setDefaultEdgeLabel(() => ({}));
//   dagreGraph.setGraph({ rankdir: direction });

//   nodes.forEach((node) => {
//     const height = node.data.expanded
//       ? 40 + node.data.attributes.length * 28
//       : 50;
//     dagreGraph.setNode(node.id, { width: 220, height: height });
//   });

//   edges.forEach((edge) => {
//     if (edge.sourceHandle === 'main' || !edge.sourceHandle) {
//       dagreGraph.setEdge(edge.source, edge.target);
//     }
//   });

//   dagre.layout(dagreGraph);

//   const layoutedNodes = nodes.map((node) => {
//     const nodeWithPosition = dagreGraph.node(node.id);
//     return {
//       ...node,
//       // We only set position if it doesn't exist yet, OR if we want to enforce layout
//       // But for dragging to work, we usually overwrite.
//       // In this specific useEffect below, we overwrite positions on expand/collapse.
//       position: {
//         x: nodeWithPosition.x - 110,
//         y:
//           nodeWithPosition.y -
//           (node.data.expanded
//             ? (40 + node.data.attributes.length * 28) / 2
//             : 25),
//       },
//     };
//   });

//   return { nodes: layoutedNodes, edges };
// };

// // ... [KEEP ExpandableNode COMPONENT EXACTLY AS BEFORE] ...
// const ExpandableNode = ({ data, id }) => {
//   const isBase = data.type === 'base';
//   const isExpanded = data.expanded;
//   const headerColor = isBase ? '#3b82f6' : '#8b5cf6';
//   const bgColor = 'white';

//   const toggleExpand = (e) => {
//     e.stopPropagation();
//     data.onToggle(id);
//   };

//   return (
//     <div
//       style={{
//         border: `1px solid ${headerColor}`,
//         borderRadius: '8px',
//         background: bgColor,
//         minWidth: '220px',
//         fontSize: '12px',
//         boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
//       }}
//     >
//       <Handle
//         type='target'
//         position={Position.Left}
//         id='main'
//         style={{
//           top: 25,
//           background: '#555',
//           width: 10,
//           height: 10,
//           zIndex: 10,
//         }}
//       />
//       <div
//         onClick={toggleExpand}
//         style={{
//           background: headerColor,
//           color: 'white',
//           padding: '8px',
//           fontWeight: 'bold',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           cursor: 'pointer',
//           borderTopLeftRadius: '7px',
//           borderTopRightRadius: '7px',
//         }}
//       >
//         <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
//           {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
//           {data.label}
//         </span>
//       </div>
//       {isExpanded && (
//         <div style={{ padding: '8px 0', background: '#f8fafc' }}>
//           {data.attributes.map((attr, idx) => (
//             <div
//               key={idx}
//               style={{
//                 position: 'relative',
//                 padding: '6px 12px',
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 borderBottom:
//                   idx < data.attributes.length - 1 ? '1px solid #eee' : 'none',
//               }}
//             >
//               <Handle
//                 type='target'
//                 position={Position.Left}
//                 id={attr.attribute_name}
//                 style={{ left: -6, background: '#7c3aed', width: 6, height: 6 }}
//               />
//               <span style={{ fontWeight: '500', marginRight: '10px' }}>
//                 {attr.attribute_name}
//               </span>
//               <span style={{ color: '#888', fontSize: '10px' }}>
//                 {attr.data_type}
//               </span>
//               <Handle
//                 type='source'
//                 position={Position.Right}
//                 id={attr.attribute_name}
//                 style={{
//                   right: -6,
//                   background: '#2563eb',
//                   width: 6,
//                   height: 6,
//                 }}
//               />
//             </div>
//           ))}
//         </div>
//       )}
//       <Handle
//         type='source'
//         position={Position.Right}
//         id='main'
//         style={{
//           top: 25,
//           background: '#555',
//           width: 10,
//           height: 10,
//           zIndex: 10,
//         }}
//       />
//     </div>
//   );
// };

// // -----------------------------------------------------------------------------
// // MAIN COMPONENT
// // -----------------------------------------------------------------------------
// const EntityDerivationGraph = () => {
//   const [expandedNodes, setExpandedNodes] = useState(new Set());

//   // 1. FIX: Destructure onNodesChange and onEdgesChange
//   const [nodes, setNodes, onNodesChange] = useNodesState([]);
//   const [edges, setEdges, onEdgesChange] = useEdgesState([]);

//   const nodeTypes = useMemo(() => ({ expandableNode: ExpandableNode }), []);

//   const onToggleNode = useCallback((nodeId) => {
//     setExpandedNodes((prev) => {
//       const next = new Set(prev);
//       if (next.has(nodeId)) next.delete(nodeId);
//       else next.add(nodeId);
//       return next;
//     });
//   }, []);

//   const expandAll = () => {
//     const allIds = RAW_DATA.entities.map((e) => e.entity_name);
//     setExpandedNodes(new Set(allIds));
//   };
//   const collapseAll = () => setExpandedNodes(new Set());

//   // This effect runs ONLY when expandedNodes changes.
//   // This allows you to drag nodes freely in between expansions.
//   useEffect(() => {
//     const newNodes = RAW_DATA.entities.map((e) => ({
//       id: e.entity_name,
//       type: 'expandableNode',
//       data: {
//         label: e.entity_name,
//         type: e.entity_type,
//         attributes: e.attributes,
//         expanded: expandedNodes.has(e.entity_name),
//         onToggle: onToggleNode,
//       },
//       position: { x: 0, y: 0 },
//     }));

//     const newEdges = [];
//     RAW_DATA.relations.forEach((rel, idx) => {
//       const isSourceExpanded = expandedNodes.has(rel.source_object_name);
//       const isTargetExpanded = expandedNodes.has(rel.target_object_name);

//       if (isSourceExpanded && isTargetExpanded) {
//         rel.field_mappings.forEach((mapping, mapIdx) => {
//           const sourceFields = mapping.source_field_name
//             .split(',')
//             .map((s) => s.trim());
//           sourceFields.forEach((srcField, subIdx) => {
//             newEdges.push({
//               id: `e-${idx}-${mapIdx}-${subIdx}`,
//               source: rel.source_object_name,
//               target: rel.target_object_name,
//               sourceHandle: srcField,
//               targetHandle: mapping.target_field_name,
//               animated: true,
//               style: { stroke: '#2563eb', strokeWidth: 2 },
//               type: 'smoothstep',
//             });
//           });
//         });
//       } else {
//         newEdges.push({
//           id: `e-main-${idx}`,
//           source: rel.source_object_name,
//           target: rel.target_object_name,
//           sourceHandle: 'main',
//           targetHandle: 'main',
//           animated: false,
//           style: {
//             stroke: '#94a3b8',
//             strokeWidth: 1.5,
//             strokeDasharray: '5 5',
//           },
//           markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
//           type: 'smoothstep',
//         });
//       }
//     });

//     // We recalculate layout based on expansion state
//     const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
//       newNodes,
//       newEdges,
//     );

//     setNodes(layoutedNodes);
//     setEdges(layoutedEdges);
//   }, [expandedNodes, onToggleNode, setNodes, setEdges]);

//   return (
//     <div
//       style={{
//         width: '100%',
//         height: '700px',
//         border: '1px solid #ddd',
//         position: 'relative',
//       }}
//     >
//       <div
//         style={{
//           position: 'absolute',
//           top: 10,
//           right: 10,
//           zIndex: 10,
//           display: 'flex',
//           gap: '8px',
//         }}
//       >
//         <button onClick={expandAll} style={btnStyle} title='Expand All'>
//           <Maximize2 size={16} /> Expand All
//         </button>
//         <button onClick={collapseAll} style={btnStyle} title='Collapse All'>
//           <Minimize2 size={16} /> Collapse All
//         </button>
//       </div>

//       <ReactFlow
//         nodes={nodes}
//         edges={edges}
//         nodeTypes={nodeTypes}
//         onNodesChange={onNodesChange} // <--- 2. FIX: Pass the handler
//         onEdgesChange={onEdgesChange} // <--- 2. FIX: Pass the handler
//         nodesDraggable={true} // <--- 3. FIX: Ensure draggable
//         fitView
//       >
//         <Controls />
//         <Background color='#f1f5f9' gap={16} />
//       </ReactFlow>
//     </div>
//   );
// };

// const btnStyle = {
//   display: 'flex',
//   alignItems: 'center',
//   gap: '5px',
//   padding: '6px 12px',
//   background: 'white',
//   border: '1px solid #ccc',
//   borderRadius: '4px',
//   cursor: 'pointer',
//   fontSize: '12px',
//   fontWeight: '600',
//   boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
// };

// export default function App() {
//   return (
//     <ReactFlowProvider>
//       <EntityDerivationGraph />
//     </ReactFlowProvider>
//   );
// }
import React, { useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import TableNode from './TableNode'; // Import the component above

const nodeTypes = { table: TableNode };

// --- DATA SETUP ---

// 1. Bronze Node (The Source of the change)
const bronzeNode = {
  id: 'bronze',
  type: 'table',
  position: { x: 50, y: 100 },
  data: {
    label: 'Bronze_Transactions',
    status: 'healthy',
    columns: [
      { name: 'tx_id' },
      { name: 'amount' },
      { name: 'customer_id' },
      // This is the NEW column that appeared
      { name: 'vehicle_type', isNew: true },
    ],
  },
};

// 2. Silver Node (The Crashed Entity)
const silverNode = {
  id: 'silver',
  type: 'table',
  position: { x: 450, y: 100 },
  data: {
    label: 'Silver_Enriched',
    status: 'error',
    columns: [
      { name: 'tx_id' },
      { name: 'amount' },
      { name: 'customer_id' },
      // "GHOST COLUMN": This doesn't exist in the database,
      // but we render it to show WHERE the data tried to go.
      { name: 'vehicle_type', isGhost: true },
    ],
  },
};

const initialNodes = [bronzeNode, silverNode];

// 3. Edges (The Lineage)
const initialEdges = [
  // Healthy connections (Grey lines)
  {
    id: 'e1',
    source: 'bronze',
    target: 'silver',
    sourceHandle: 'tx_id',
    targetHandle: 'tx_id',
    type: 'smoothstep',
  },
  {
    id: 'e2',
    source: 'bronze',
    target: 'silver',
    sourceHandle: 'amount',
    targetHandle: 'amount',
    type: 'smoothstep',
  },
  {
    id: 'e3',
    source: 'bronze',
    target: 'silver',
    sourceHandle: 'customer_id',
    targetHandle: 'customer_id',
    type: 'smoothstep',
  },

  // THE CRASH CONNECTION (Red Line)
  {
    id: 'e_crash',
    source: 'bronze',
    target: 'silver',
    sourceHandle: 'vehicle_type', // From the New Column
    targetHandle: 'vehicle_type', // To the Ghost/Missing Column
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#EF4444', strokeWidth: 3 }, // Thick Red Line
    label: 'Schema Mismatch',
    labelStyle: { fill: '#EF4444', fontWeight: 'bold' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#EF4444' },
  },
];

export default function LineageCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // When a user clicks a node, we can ensure connections are visible
  const onNodeClick = (event, node) => {
    console.log('User is inspecting:', node.data.label);
    // You could trigger auto-zoom here if you wanted
  };

  return (
    <div style={{ width: '100%', height: '100vh', background: '#F8FAFC' }}>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Production Crash Analysis</h3>
        <p>
          Click the <b>Red Silver Node</b> to expand connection details.
        </p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
