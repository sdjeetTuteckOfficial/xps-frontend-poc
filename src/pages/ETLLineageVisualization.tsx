import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  EdgeLabelRenderer,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import {
  AppShell, Group, Title, Text, Button, Paper, Badge,
  Stack, Box, useMantineColorScheme, ActionIcon, ThemeIcon,
  Tooltip, MantineProvider, Drawer, Divider, Code, ScrollArea
} from '@mantine/core';
import {
  Key, Sparkles, Filter, Layers, ArrowRight, ArrowDown,
  Table as TableIcon, LayoutDashboard, FileJson, ArrowRightCircle,
  Database, Info
} from 'lucide-react';

// ... [Keep your existing sampleTables, columnLineage, constants, and Layout Engine here] ...
// (I am omitting the Data and Layout sections for brevity as they remain unchanged from the previous code)

// ============================================================================
// [PASTE DATA DEFINITIONS & LAYOUT ENGINE HERE IF STARTING FRESH]
// ============================================================================
// ... (Insert sampleTables, columnLineage, NODE_WIDTH, getLayoutedElements, etc.)

const sampleTables = [
  // BRONZE
  {
    id: 'b_crm_users', name: 'CRM_Users', schema: 'Raw_Salesforce', layer: 'bronze',
    columns: [
      { name: 'uuid', dataType: 'UUID', isPrimaryKey: true },
      { name: 'email_addr', dataType: 'VARCHAR' },
      { name: 'first_nm', dataType: 'VARCHAR' },
      { name: 'last_nm', dataType: 'VARCHAR' },
      { name: 'created_at', dataType: 'TIMESTAMP' },
    ],
  },
  {
    id: 'b_erp_subs', name: 'ERP_Subscriptions', schema: 'Raw_SAP', layer: 'bronze',
    columns: [
      { name: 'sub_id', dataType: 'INT', isPrimaryKey: true },
      { name: 'user_uuid', dataType: 'UUID' },
      { name: 'plan_type', dataType: 'VARCHAR' },
      { name: 'monthly_amt', dataType: 'DECIMAL' },
    ],
  },
  // SILVER
  {
    id: 's_dim_customers', name: 'Dim_Customers', schema: 'Core', layer: 'silver',
    columns: [
      { name: 'customer_key', dataType: 'BIGINT', isPrimaryKey: true },
      { name: 'source_id', dataType: 'UUID' },
      { name: 'full_name', dataType: 'VARCHAR' },
      { name: 'email', dataType: 'VARCHAR' },
      { name: 'is_active', dataType: 'BOOLEAN' },
    ],
  },
  {
    id: 's_fact_subs', name: 'Fact_Subscriptions', schema: 'Core', layer: 'silver',
    columns: [
      { name: 'sub_key', dataType: 'BIGINT', isPrimaryKey: true },
      { name: 'customer_key', dataType: 'BIGINT' },
      { name: 'revenue', dataType: 'DECIMAL' },
      { name: 'start_date', dataType: 'DATE' },
    ],
  },
  // GOLD
  {
    id: 'g_mrr_report', name: 'Rpt_Monthly_Revenue', schema: 'Analytics', layer: 'gold',
    columns: [
      { name: 'report_month', dataType: 'DATE' },
      { name: 'total_mrr', dataType: 'DECIMAL' },
      { name: 'customer_count', dataType: 'INT' },
    ],
  },
];

const columnLineage = [
  { id: 'l1', sourceTable: 'b_crm_users', sourceColumn: 'uuid', targetTable: 's_dim_customers', targetColumn: 'source_id', label: 'Transform' },
  { id: 'l2', sourceTable: 'b_crm_users', sourceColumn: 'email_addr', targetTable: 's_dim_customers', targetColumn: 'email', label: 'Direct Map' },
  { id: 'l3', sourceTable: 'b_crm_users', sourceColumn: 'first_nm', targetTable: 's_dim_customers', targetColumn: 'full_name', label: 'Concat' },
  { id: 'l4', sourceTable: 'b_erp_subs', sourceColumn: 'monthly_amt', targetTable: 's_fact_subs', targetColumn: 'revenue', label: 'Direct Map' },
  { id: 'l5', sourceTable: 'b_erp_subs', sourceColumn: 'user_uuid', targetTable: 's_dim_customers', targetColumn: 'source_id', label: 'Lookup' },
  { id: 'l6', sourceTable: 's_fact_subs', sourceColumn: 'revenue', targetTable: 'g_mrr_report', targetColumn: 'total_mrr', label: 'Sum Agg' },
  { id: 'l7', sourceTable: 's_dim_customers', sourceColumn: 'customer_key', targetTable: 'g_mrr_report', targetColumn: 'customer_count', label: 'Count Agg' },
];

const NODE_WIDTH = 260;
const NODE_HEADER_HEIGHT = 85;
const NODE_ROW_HEIGHT = 36;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: isHorizontal ? 250 : 150,
    nodesep: 60
  });

  nodes.forEach((node) => {
    const colCount = node.data.table.columns.length;
    const height = NODE_HEADER_HEIGHT + (colCount * NODE_ROW_HEIGHT) + 20;
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};


// ============================================================================
// 3. CUSTOM COMPONENTS
// ============================================================================

const CustomEdge = ({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  style = {}, markerEnd, data, label
}: EdgeProps) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });

  const isHighlighted = data?.isHighlighted;
  const isDimmed = data?.isDimmed;

  const strokeColor = isHighlighted ? '#3b82f6' : (isDimmed ? '#94a3b8' : '#64748b');
  const opacity = isDimmed ? 0.2 : 1;
  const strokeWidth = isHighlighted ? 2.5 : 1.5;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth,
          stroke: strokeColor,
          opacity,
          transition: 'stroke 0.4s ease, opacity 0.4s ease',
          cursor: 'pointer' // Add pointer cursor
        }}
      />
      {label && !isDimmed && (
         <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                background: isDark ? '#1e293b' : 'white',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                border: `1px solid ${isHighlighted ? '#3b82f6' : (isDark ? '#334155' : '#cbd5e1')}`,
                color: isHighlighted ? '#3b82f6' : (isDark ? '#94a3b8' : '#64748b'),
                pointerEvents: 'all', // Allow clicking label
                cursor: 'pointer',
                transition: 'all 0.4s ease',
                zIndex: 10
              }}
              className="nodrag nopan" // Allows clicking without dragging map
            >
              {label}
            </div>
         </EdgeLabelRenderer>
      )}
      {/* Invisible wider path for easier clicking */}
      <BaseEdge
        path={edgePath}
        style={{ strokeWidth: 20, stroke: 'transparent', fill: 'none', cursor: 'pointer' }}
      />
      
      {isHighlighted && (
        <circle r="3" fill="#3b82f6">
          <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
};

const TableNode: React.FC<NodeProps> = ({ data, id }) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const { table, onColumnClick, highlightedColumns, isDimmed } = data;

  const themes = {
    bronze: { color: '#d97706', label: 'Bronze', bg: 'rgba(217, 119, 6, 0.1)' },
    silver: { color: '#6366f1', label: 'Silver', bg: 'rgba(99, 102, 241, 0.1)' },
    gold: { color: '#10b981', label: 'Gold', bg: 'rgba(16, 185, 129, 0.1)' },
  };
  const theme = themes[table.layer as keyof typeof themes];

  return (
    <Paper
      shadow="lg"
      radius="md"
      withBorder
      style={{
        width: NODE_WIDTH,
        opacity: isDimmed ? 0.25 : 1,
        transition: 'opacity 0.3s, background-color 0.3s, border-color 0.3s',
        borderColor: isDark ? (isDimmed ? '#1e293b' : '#334155') : (isDimmed ? '#e2e8f0' : '#cbd5e1'),
        backgroundColor: isDark ? '#0f172a' : '#fff',
        overflow: 'hidden'
      }}
    >
      <Box p="sm" style={{ borderBottom: `2px solid ${theme.color}`, background: isDark ? '#1e293b' : '#f8fafc' }}>
        <Group justify="space-between" mb={4}>
          <Badge
            variant="transparent"
            color={theme.color}
            styles={{ root: { backgroundColor: theme.bg, color: theme.color, textTransform: 'uppercase' } }}
          >
            {theme.label}
          </Badge>
          <Text size="10px" c="dimmed" fw={700} ff="monospace">{table.schema}</Text>
        </Group>
        <Group gap="xs">
          <ThemeIcon size="sm" radius="xl" variant="light" color="gray"><TableIcon size={12} /></ThemeIcon>
          <Text fw={700} size="sm" truncate>{table.name}</Text>
        </Group>
      </Box>

      <Stack gap={0}>
        {table.columns.map((col: any) => {
          const isColHighlighted = highlightedColumns?.includes(col.name);
          return (
            <Box
              key={col.name}
              onClick={(e) => { e.stopPropagation(); onColumnClick(id, col.name); }}
              style={{
                position: 'relative',
                padding: '8px 12px',
                height: NODE_ROW_HEIGHT,
                cursor: 'pointer',
                background: isColHighlighted
                  ? (isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff')
                  : 'transparent',
                transition: 'background 0.2s',
                borderBottom: '1px solid',
                borderColor: isDark ? '#1e293b' : '#f1f5f9'
              }}
            >
              <Handle
                type="target" position={Position.Left} id={`${id}-${col.name}-target`}
                style={{ left: -4, width: 8, height: 8, background: isColHighlighted ? '#3b82f6' : '#94a3b8', border: '2px solid white' }}
              />
              <Group justify="space-between">
                <Group gap={8}>
                  {col.isPrimaryKey && <Key size={10} color="#eab308" fill="#eab308" />}
                  <Text size="xs" fw={isColHighlighted ? 700 : 500} c={isColHighlighted ? 'blue' : undefined}>{col.name}</Text>
                </Group>
                <Text size="9px" c="dimmed" ff="monospace">{col.dataType}</Text>
              </Group>
              <Handle
                type="source" position={Position.Right} id={`${id}-${col.name}-source`}
                style={{ right: -4, width: 8, height: 8, background: isColHighlighted ? '#3b82f6' : '#94a3b8', border: '2px solid white' }}
              />
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
};

// ============================================================================
// 4. MAIN FLOW COMPONENT
// ============================================================================
const LineageFlow = () => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const reactFlowInstance = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedColumn, setSelectedColumn] = useState<{ nodeId: string, colName: string } | null>(null);
  
  // DRAWER STATE
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: 'node' | 'edge', data: any } | null>(null);

  const initializeGraph = useCallback((direction = 'LR') => {
    const initialNodes: Node[] = sampleTables.map((t) => ({
      id: t.id,
      type: 'table',
      data: { table: t, onColumnClick: handleColumnClick, highlightedColumns: [], isDimmed: false },
      position: { x: 0, y: 0 },
    }));

    const initialEdges: Edge[] = columnLineage.map((l) => ({
      id: l.id,
      source: l.sourceTable,
      target: l.targetTable,
      sourceHandle: `${l.sourceTable}-${l.sourceColumn}-source`,
      targetHandle: `${l.targetTable}-${l.targetColumn}-target`,
      type: 'custom',
      animated: false,
      label: l.label,
      data: { isHighlighted: false, isDimmed: false, lineageInfo: l } // Pass full lineage info
    }));

    const layout = getLayoutedElements(initialNodes, initialEdges, direction);
    setNodes(layout.nodes);
    setEdges(layout.edges);
    setSelectedColumn(null);

    setTimeout(() => reactFlowInstance.fitView({ duration: 800 }), 50);
  }, [reactFlowInstance, setNodes, setEdges]);

  useEffect(() => {
    initializeGraph();
  }, [initializeGraph]);

  const onLayout = useCallback((direction: 'LR' | 'TB') => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, direction);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    setTimeout(() => reactFlowInstance.fitView({ duration: 800 }), 10);
  }, [nodes, edges, setNodes, setEdges, reactFlowInstance]);

  // Click Handlers
  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedItem({ type: 'node', data: node.data.table });
    setDrawerOpen(true);
  };

  const onEdgeClick = (event: React.MouseEvent, edge: Edge) => {
    // We stored extra info in data.lineageInfo during initialization
    setSelectedItem({ type: 'edge', data: edge.data.lineageInfo || { label: edge.label, id: edge.id } });
    setDrawerOpen(true);
  };

  const handleColumnClick = (nodeId: string, colName: string) => {
    setSelectedColumn({ nodeId, colName });

    const visitedEdges = new Set<string>();
    const visitedNodes = new Set<string>();
    const highlightedCols: Record<string, string[]> = {};

    const traverse = (currentId: string, direction: 'up' | 'down') => {
      const relevantEdges = edges.filter(edge => {
        if (direction === 'up') return edge.targetHandle === currentId;
        return edge.sourceHandle === currentId;
      });

      relevantEdges.forEach(edge => {
        visitedEdges.add(edge.id);
        const nextNodeId = direction === 'up' ? edge.source : edge.target;
        const nextHandleId = direction === 'up' ? edge.sourceHandle : edge.targetHandle;

        visitedNodes.add(nextNodeId);

        const colPart = nextHandleId?.split(`${nextNodeId}-`)[1].replace(/-source|-target/, '');
        if (colPart) {
          if (!highlightedCols[nextNodeId]) highlightedCols[nextNodeId] = [];
          if (!highlightedCols[nextNodeId].includes(colPart)) highlightedCols[nextNodeId].push(colPart);
        }
        traverse(nextHandleId!, direction);
      });
    };

    visitedNodes.add(nodeId);
    highlightedCols[nodeId] = [colName];
    traverse(`${nodeId}-${colName}-source`, 'down');
    traverse(`${nodeId}-${colName}-target`, 'up');

    setNodes(nds => nds.map(n => ({
      ...n,
      data: {
        ...n.data,
        isDimmed: !visitedNodes.has(n.id),
        highlightedColumns: highlightedCols[n.id] || [],
      }
    })));

    setEdges(eds => eds.map(e => ({
      ...e,
      zIndex: visitedEdges.has(e.id) ? 10 : 0,
      data: {
        ...e.data,
        isHighlighted: visitedEdges.has(e.id),
        isDimmed: !visitedEdges.has(e.id),
      }
    })));
  };

  const nodeTypes = useMemo(() => ({ table: TableNode }), []);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  // Drawer Content Renderer
  const renderDrawerContent = () => {
    if (!selectedItem) return null;

    if (selectedItem.type === 'node') {
      const table = selectedItem.data;
      return (
        <Stack gap="md">
          <Group align="center" gap="xs">
            <ThemeIcon size="lg" variant="light" color="blue"><Database size={20} /></ThemeIcon>
            <Box>
              <Text fw={700} size="lg">{table.name}</Text>
              <Badge variant="dot" color="gray">{table.id}</Badge>
            </Box>
          </Group>
          <Divider />
          
          <Stack gap="xs">
            <Text size="sm" c="dimmed" fw={700}>METADATA</Text>
            <Paper p="xs" withBorder bg="transparent">
               <Stack gap={4}>
                  <Group justify="space-between"><Text size="sm">Schema:</Text><Code>{table.schema}</Code></Group>
                  <Group justify="space-between"><Text size="sm">Layer:</Text><Badge size="sm" variant="outline">{table.layer}</Badge></Group>
               </Stack>
            </Paper>
          </Stack>

          <Stack gap="xs">
             <Text size="sm" c="dimmed" fw={700}>COLUMNS ({table.columns.length})</Text>
             <ScrollArea h={300} offsetScrollbars>
                <Stack gap={8}>
                  {table.columns.map((col: any) => (
                    <Paper key={col.name} p="sm" withBorder shadow="none" bg={isDark ? 'rgba(255,255,255,0.03)' : 'gray.0'}>
                        <Group justify="space-between">
                           <Group gap="xs">
                              {col.isPrimaryKey && <Key size={14} color="#eab308" fill="#eab308" />}
                              <Text fw={600} size="sm">{col.name}</Text>
                           </Group>
                           <Badge size="xs" color="gray" variant="light">{col.dataType}</Badge>
                        </Group>
                    </Paper>
                  ))}
                </Stack>
             </ScrollArea>
          </Stack>
        </Stack>
      );
    }

    if (selectedItem.type === 'edge') {
      const edgeInfo = selectedItem.data;
      return (
        <Stack gap="md">
           <Group align="center" gap="xs">
            <ThemeIcon size="lg" variant="light" color="teal"><ArrowRightCircle size={20} /></ThemeIcon>
            <Box>
              <Text fw={700} size="lg">Transformation</Text>
              <Text size="xs" c="dimmed">Lineage Rule ID: {edgeInfo.id}</Text>
            </Box>
          </Group>
          <Divider />

          <Paper p="md" withBorder bg={isDark ? 'rgba(59, 130, 246, 0.1)' : 'blue.0'} style={{ borderColor: '#3b82f6' }}>
             <Stack align="center" gap={4}>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Logic Type</Text>
                <Badge size="xl" variant="filled" color="blue">{edgeInfo.label}</Badge>
             </Stack>
          </Paper>

          <Stack gap="xs">
            <Text size="sm" c="dimmed" fw={700}>FLOW DETAILS</Text>
            
            <Paper p="sm" withBorder>
               <Text size="xs" c="dimmed">SOURCE</Text>
               <Group justify="space-between" mt={4}>
                  <Code color="orange">{edgeInfo.sourceTable}</Code>
                  <ArrowRight size={14} />
                  <Text fw={700} size="sm">{edgeInfo.sourceColumn}</Text>
               </Group>
            </Paper>

            <Group justify="center"><ArrowDown size={20} color="gray" /></Group>

            <Paper p="sm" withBorder>
               <Text size="xs" c="dimmed">TARGET</Text>
               <Group justify="space-between" mt={4}>
                   <Code color="teal">{edgeInfo.targetTable}</Code>
                   <ArrowRight size={14} />
                   <Text fw={700} size="sm">{edgeInfo.targetColumn}</Text>
               </Group>
            </Paper>
          </Stack>

          <Box mt="md">
            <Text size="sm" c="dimmed" fw={700} mb="xs">DESCRIPTION</Text>
            <Text size="sm">
               Data is moved from the <b>{edgeInfo.sourceColumn}</b> column in the source table 
               to the <b>{edgeInfo.targetColumn}</b> column in the target table using a 
               <b> {edgeInfo.label}</b> operation.
            </Text>
          </Box>
        </Stack>
      );
    }
  };

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick} // Added Handler
        onEdgeClick={onEdgeClick} // Added Handler
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.2}
        maxZoom={2}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color={isDark ? "#334155" : "#cbd5e1"} variant="dots" gap={20} size={1} />
        <Controls style={{ background: isDark ? '#1e293b' : 'white', borderColor: isDark ? '#334155' : '#e2e8f0' }} showInteractive={false} />
        <MiniMap
          style={{ height: 100, background: isDark ? '#0f172a' : 'white', border: '1px solid #334155', borderRadius: 8 }}
          nodeColor={n => {
            if (n.data.table.layer === 'bronze') return '#d97706';
            if (n.data.table.layer === 'silver') return '#6366f1';
            return '#10b981';
          }}
        />
        <Panel position="top-right">
          <Paper p={4} radius="md" shadow="xs" withBorder style={{ display: 'flex', gap: 6, background: isDark ? '#1e293b' : 'white' }}>
            <Tooltip label="Horizontal Layout">
              <ActionIcon variant="default" size="lg" onClick={() => onLayout('LR')}><ArrowRight size={18} /></ActionIcon>
            </Tooltip>
            <Tooltip label="Vertical Layout">
              <ActionIcon variant="default" size="lg" onClick={() => onLayout('TB')}><ArrowDown size={18} /></ActionIcon>
            </Tooltip>
          </Paper>
        </Panel>
        {selectedColumn && (
          <Panel position="top-center">
            <Paper p="sm" withBorder shadow="md" radius="md" style={{ background: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
              <Group>
                <Sparkles size={16} color="#3b82f6" />
                <Text size="sm">Lineage: <Text span fw={700} c="blue">{selectedColumn.colName}</Text> in {selectedColumn.nodeId}</Text>
                <Button size="compact-xs" variant="light" onClick={() => initializeGraph()}>Reset</Button>
              </Group>
            </Paper>
          </Panel>
        )}
      </ReactFlow>

      {/* SIDE DRAWER */}
      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        position="right"
        title={<Text fw={700} size="lg">Details</Text>}
        padding="md"
        size="md"
        overlayProps={{ backgroundOpacity: 0.1, blur: 2 }}
        styles={{ content: { backgroundColor: isDark ? '#0f172a' : '#fff' }, header: { backgroundColor: isDark ? '#0f172a' : '#fff' }}}
      >
        {renderDrawerContent()}
      </Drawer>
    </>
  );
};

// ... [Keep Default Application Wrapper] ...
// (Omitting export default LineageExplorer for brevity as it remains unchanged)

export default function LineageExplorer() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <MantineProvider defaultColorScheme="dark">
      <AppShell header={{ height: 60 }} padding={0}>
        <AppShell.Header p="md" style={{ background: colorScheme === 'dark' ? '#020617' : '#fff', borderBottom: '1px solid #334155' }}>
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon size="lg" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
                <Layers size={20} />
              </ThemeIcon>
              <Stack gap={0}>
                <Title order={5}>DataLineage Pro</Title>
              </Stack>
            </Group>
            <Group>
              <Button variant="default" size="xs" onClick={toggleColorScheme} leftSection={<LayoutDashboard size={14} />}>
                {colorScheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </Button>
              <Button variant="filled" color="blue" size="xs" leftSection={<Filter size={14} />}>
                Filter View
              </Button>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Main style={{ height: 'calc(100vh - 60px)', background: colorScheme === 'dark' ? '#0b1121' : '#f8fafc' }}>
          <ReactFlowProvider>
            <LineageFlow />
          </ReactFlowProvider>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}