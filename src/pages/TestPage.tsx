import React, { useCallback, useState, useMemo, useEffect, memo } from 'react';

// 1. Value Imports
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,

  ReactFlowProvider,
  useReactFlow,
  ConnectionLineType,
  Panel,
  MiniMap
} from 'reactflow';

// 2. Type Imports (Must be separate for Vite)
import type { 
  Node, 
  Edge, 
  NodeProps 
} from 'reactflow';

import 'reactflow/dist/style.css';
import { 
  Paper, 
  Text, 
  Group, 
  Stack, 
  Badge, 
  ThemeIcon, 
  Box, 
  ScrollArea, 
  ActionIcon, 
  useMantineTheme, 
  MantineProvider,
  TextInput
} from '@mantine/core';
import { 
  Database, 
  Activity,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Link as LinkIcon
} from 'lucide-react';
import dagre from 'dagre';
import accountLineageData from '../../account_lineage_reactflow.json';

// --- 1. Types ---

type AttributeStatus = 'ok' | 'reference' | 'standard';

interface AttributeData {
  name: string;
  type: string;
  status: AttributeStatus;
}

interface EntityNodeData {
  label: string;
  description: string;
  attributes: AttributeData[];
  expanded: boolean;
  onToggle: (id: string) => void;
  onAttributeClick?: (nodeId: string, attrName: string) => void;
  highlightedAttr?: string | null;
}

interface LineageNode {
  id: string;
  type: string;
  data: {
    label: string;
    description: string;
    attributes: Array<{
      "Field Name": string;
      "Data Type": string;
    }>;
  };
  position: { x: number; y: number };
}

interface LineageEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  animated: boolean;
  style: { stroke: string };
  data?: Record<string, unknown>;
}

// --- 2. Data Transformation ---

const transformLineageData = () => {
  const nodes: Node<EntityNodeData>[] = [];
  
  const lineageNodes = accountLineageData.nodes as LineageNode[];
  const lineageEdges = accountLineageData.edges as LineageEdge[];

  // Transform nodes
  lineageNodes.forEach((node) => {
    const transformedNode: Node<EntityNodeData> = {
      id: node.id,
      type: 'entity',
      position: { x: 0, y: 0 },
      data: {
        label: node.data.label,
        description: node.data.description,
        attributes: node.data.attributes.map((attr) => ({
          name: attr["Field Name"],
          type: attr["Data Type"],
          status: attr["Data Type"] === 'reference' ? 'reference' : 'standard'
        })),
        expanded: false,
        onToggle: () => {},
      }
    };
    nodes.push(transformedNode);
  });

  // Transform edges
  const edges: Edge[] = lineageEdges
    .map((edge) => {
      // Parse the map data to get source and target attributes
      // Format: "SourceEntity.SourceAttribute -> TargetEntity.TargetAttribute"
      const mapString = (edge.data as Record<string, unknown>)?.map as string || '';
      const [sourceMapping, targetMapping] = mapString.split(' -> ');
      
      const sourceAttr = sourceMapping?.split('.')[1] || edge.label;
      const targetAttr = targetMapping?.split('.')[1] || 'Id';

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        // Use node-level handles as fallback for when nodes are collapsed
        sourceHandle: `${sourceAttr}-source`,
        targetHandle: `${targetAttr}-target`,
        type: 'smoothstep',
        animated: edge.animated,
        label: edge.label,
        style: { 
          stroke: edge.style?.stroke || '#adb5bd',
          strokeWidth: 2,
          opacity: 0.6 
        },
        data: {
          ...edge.data,
          attributeSource: sourceAttr,
          attributeTarget: targetAttr
        }
      };
    })
    .filter((edge) => {
      // Verify that source and target nodes exist
      return nodes.some(n => n.id === edge.source) && 
             nodes.some(n => n.id === edge.target);
    });

  return { nodes, edges };
};

// --- 3. Auto Layout (Dagre) ---

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // LR = Left to Right. ranksep = dist between cols, nodesep = dist between nodes vertically
  // Increased spacing for better edge visibility
  dagreGraph.setGraph({ rankdir: 'LR', ranksep: 200, nodesep: 80, marginx: 50, marginy: 50 });

  nodes.forEach((node) => {
    const height = node.data.expanded 
      ? 70 + (node.data.attributes.length * 28) 
      : 50;
      
    dagreGraph.setNode(node.id, { width: 300, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    node.targetPosition = Position.Left;
    node.sourcePosition = Position.Right;
    node.position = {
      x: nodeWithPosition.x - 300 / 2,
      y: nodeWithPosition.y - nodeWithPosition.height / 2,
    };

    return node;
  });

  return { nodes: layoutedNodes, edges };
};

// --- 4. Custom Node Component ---

const AttributeTypeIcon = ({ type }: { type: string }) => {
  if (type === 'reference') return <LinkIcon size={12} color="#5c7cfa" />;
  return <Database size={12} color="#868e96" />;
};

const EntityNode: React.FC<NodeProps<EntityNodeData>> = memo(({ id, data, selected }) => {
  const theme = useMantineTheme();

  return (
    <Paper 
      shadow={selected ? "xl" : "sm"}
      radius="md" 
      withBorder 
      w={300}
      style={{ 
        borderColor: selected ? theme.colors.blue[6] : theme.colors.gray[3],
        borderWidth: selected ? 2 : 1,
        transition: 'all 0.3s ease',
        overflow: 'visible',
        height: 'fit-content'
      }}
    >
      {/* Node-level handles (always present for collapsed state) */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-node-target`}
        style={{ width: 8, height: 8, background: theme.colors.blue[5], left: -4, opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-node-source`}
        style={{ width: 8, height: 8, background: theme.colors.blue[5], right: -4, opacity: 0 }}
      />

      {/* Header with Toggle */}
      <Box 
        p="xs" 
        bg="blue.0" 
        style={{ 
          borderBottom: data.expanded ? `1px solid ${theme.colors.gray[3]}` : 'none',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={(e) => { e.stopPropagation(); data.onToggle(id); }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = theme.colors.blue[1];
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = theme.colors.blue[0];
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap={6} wrap="nowrap">
            <ActionIcon size="sm" variant="transparent" color="dark">
              {data.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </ActionIcon>
            <Database size={14} color={theme.colors.blue[7]} />
            <Stack gap={0} style={{ flex: 1 }}>
              <Text fw={700} size="xs" c="dark.9" truncate style={{ maxWidth: 200 }}>
                {data.label}
              </Text>
              <Text size="xs" c="dimmed" truncate style={{ maxWidth: 200 }}>
                {data.description?.substring(0, 40)}...
              </Text>
            </Stack>
          </Group>
        </Group>
      </Box>

      {/* Attributes Count Badge */}
      {!data.expanded && (
        <Box p={6} bg="gray.0" style={{ borderTop: `1px solid ${theme.colors.gray[2]}` }}>
          <Text size="xs" c="dimmed" ta="center">
            {data.attributes.length} attributes • Click to expand
          </Text>
        </Box>
      )}

      {/* Attributes List (Conditional Rendering) */}
      {data.expanded && (
        <Stack gap={0} bg="white" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {data.attributes.map((attr, index) => {
            const isHighlighted = data.highlightedAttr === attr.name;
            
            let bg = 'transparent';
            if (isHighlighted) bg = 'yellow.1';
            else if (attr.status === 'reference') bg = 'blue.0';

            return (
              <Box 
                key={attr.name} 
                pos="relative" 
                bg={bg}
                p={6}
                style={{ 
                  borderBottom: index === data.attributes.length - 1 ? 'none' : `1px solid ${theme.colors.gray[1]}`,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (data.onAttributeClick) data.onAttributeClick(id, attr.name);
                }}
                onMouseEnter={(e) => {
                  if (!isHighlighted) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = theme.colors.gray[0];
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isHighlighted) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = bg;
                  }
                }}
              >
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${attr.name}-target`}
                  style={{ width: 6, height: 6, background: theme.colors.gray[5], left: -3 }}
                />

                <Group justify="space-between" align="center">
                  <Group gap={6}>
                    <AttributeTypeIcon type={attr.type} />
                    <Text size="xs" fw={500} ff="monospace" c="dark.9">
                      {attr.name}
                    </Text>
                  </Group>
                  <Badge size="xs" variant="light" color={attr.status === 'reference' ? 'blue' : 'gray'}>
                    {attr.type}
                  </Badge>
                </Group>

                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${attr.name}-source`}
                  style={{ width: 6, height: 6, background: theme.colors.gray[5], right: -3 }}
                />
              </Box>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
});

const nodeTypes = { entity: EntityNode };

// --- 5. Main Visualizer Logic ---

const ETLVisualizer = () => {
  const theme = useMantineTheme();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [search, setSearch] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { fitView, setCenter, getEdges, getNodes } = useReactFlow();

  // 1. Trace Highlighting Logic
  const handleAttributeClick = useCallback((nodeId: string, attrName: string) => {
    const allEdges = getEdges();
    const allNodes = getNodes();

    // Reset styles
    const resetEdges = allEdges.map(e => ({
      ...e,
      style: { ...e.style, opacity: 0.1, strokeWidth: 1 },
      animated: false
    }));

    const resetNodes = allNodes.map(n => ({
      ...n,
      style: { ...n.style, opacity: 0.3 },
      data: { ...n.data, highlightedAttr: null }
    }));

    // Trace
    const relatedEdgeIds = new Set<string>();
    const relatedNodeIds = new Set<string>([nodeId]);

    const traverse = (cNodeId: string, cAttrHandle: string, direction: 'up' | 'down') => {
      const connectedEdges = allEdges.filter(e => {
        if (direction === 'down') return e.source === cNodeId && e.sourceHandle === `${cAttrHandle}-source`;
        return e.target === cNodeId && e.targetHandle === `${cAttrHandle}-target`;
      });

      connectedEdges.forEach(edge => {
        relatedEdgeIds.add(edge.id);
        const nextNodeId = direction === 'down' ? edge.target : edge.source;
        const nextAttrHandle = direction === 'down' 
          ? edge.targetHandle?.replace('-target', '') 
          : edge.sourceHandle?.replace('-source', '');

        relatedNodeIds.add(nextNodeId);
        if (nextAttrHandle) traverse(nextNodeId, nextAttrHandle, direction);
      });
    };

    traverse(nodeId, attrName, 'up');
    traverse(nodeId, attrName, 'down');

    // Apply Highlighting
    setEdges(resetEdges.map(e => {
      if (relatedEdgeIds.has(e.id)) {
        return {
          ...e,
          style: { ...e.style, opacity: 1, strokeWidth: 3, stroke: '#228be6' },
          animated: true,
          zIndex: 999
        };
      }
      return e;
    }));

    setNodes(resetNodes.map(n => {
      if (relatedNodeIds.has(n.id)) {
        return {
          ...n,
          style: { ...n.style, opacity: 1 },
          data: { ...n.data, highlightedAttr: n.id === nodeId ? attrName : n.data.highlightedAttr }
        };
      }
      return n;
    }));
  }, [getEdges, getNodes, setNodes, setEdges]);

  // 2. Toggle Collapse Logic
  const handleNodeToggle = useCallback((nodeId: string) => {
    setNodes((prevNodes) => {
      const updatedNodes = prevNodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, expanded: !node.data.expanded } };
        }
        return node;
      });
      
      // Re-run layout with new 'expanded' states
      const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(updatedNodes, getEdges());
      
      // Adjust edge handles based on new expansion state
      const adjustedEdges = layoutEdges.map(edge => {
        const sourceNode = layoutNodes.find(n => n.id === edge.source);
        const targetNode = layoutNodes.find(n => n.id === edge.target);
        
        return {
          ...edge,
          sourceHandle: sourceNode?.data.expanded ? edge.sourceHandle : `${edge.source}-node-source`,
          targetHandle: targetNode?.data.expanded ? edge.targetHandle : `${edge.target}-node-target`
        };
      });
      
      setEdges(adjustedEdges);
      return layoutNodes;
    });
  }, [getEdges, setEdges, setNodes]);

  // 3. Toggle All Nodes
  const handleExpandAll = useCallback(() => {
    setNodes((prevNodes) => {
      const updatedNodes = prevNodes.map((node) => ({
        ...node,
        data: { ...node.data, expanded: true }
      }));
      
      const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(updatedNodes, getEdges());
      setEdges(layoutEdges);
      return layoutNodes;
    });
  }, [getEdges, setEdges, setNodes]);

  const handleCollapseAll = useCallback(() => {
    setNodes((prevNodes) => {
      const updatedNodes = prevNodes.map((node) => ({
        ...node,
        data: { ...node.data, expanded: false }
      }));
      
      const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(updatedNodes, getEdges());
      
      const adjustedEdges = layoutEdges.map(edge => {
        const sourceNode = layoutNodes.find(n => n.id === edge.source);
        const targetNode = layoutNodes.find(n => n.id === edge.target);
        
        return {
          ...edge,
          sourceHandle: sourceNode?.data.expanded ? edge.sourceHandle : `${edge.source}-node-source`,
          targetHandle: targetNode?.data.expanded ? edge.targetHandle : `${edge.target}-node-target`
        };
      });
      
      setEdges(adjustedEdges);
      return layoutNodes;
    });
  }, [getEdges, setEdges, setNodes]);

  // 4. Init Graph
  const initGraph = useCallback(() => {
    const { nodes: genNodes, edges: genEdges } = transformLineageData();
    
    const nodesWithHandlers = genNodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        onToggle: handleNodeToggle,
        onAttributeClick: handleAttributeClick
      }
    }));

    const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(nodesWithHandlers, genEdges);
    
    // Adjust edge handles based on node expansion state
    const adjustedEdges = layoutEdges.map(edge => {
      const sourceNode = layoutNodes.find(n => n.id === edge.source);
      const targetNode = layoutNodes.find(n => n.id === edge.target);
      
      return {
        ...edge,
        sourceHandle: sourceNode?.data.expanded ? edge.sourceHandle : `${edge.source}-node-source`,
        targetHandle: targetNode?.data.expanded ? edge.targetHandle : `${edge.target}-node-target`
      };
    });

    setNodes(layoutNodes);
    setEdges(adjustedEdges);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [setNodes, setEdges, fitView, handleNodeToggle, handleAttributeClick]);

  useEffect(() => { initGraph(); }, [initGraph]);

  // 5. Sidebar interactions
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => n.data.label.toLowerCase().includes(search.toLowerCase()));
  }, [nodes, search]);

  const handleFocusNode = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (node) {
      setSelectedNodeId(id);
      setCenter(node.position.x + 150, node.position.y + 100, { zoom: 1.2, duration: 800 });
      
      // Auto-expand the focused node
      setNodes((prevNodes) => {
        const updatedNodes = prevNodes.map((n) => {
          if (n.id === id && !n.data.expanded) {
            return { ...n, data: { ...n.data, expanded: true } };
          }
          return n;
        });
        
        const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(updatedNodes, getEdges());
        
        const adjustedEdges = layoutEdges.map(edge => {
          const sourceNode = layoutNodes.find(n => n.id === edge.source);
          const targetNode = layoutNodes.find(n => n.id === edge.target);
          
          return {
            ...edge,
            sourceHandle: sourceNode?.data.expanded ? edge.sourceHandle : `${edge.source}-node-source`,
            targetHandle: targetNode?.data.expanded ? edge.targetHandle : `${edge.target}-node-target`
          };
        });
        
        setEdges(adjustedEdges);
        return layoutNodes;
      });
    }
  };

  return (
    <Box w="100%" h="100vh" display="flex" bg="gray.0">
      {/* Sidebar */}
      <Paper w={360} h="100%" radius={0} style={{ borderRight: `1px solid ${theme.colors.gray[3]}`, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <Box p="md" bg="white" style={{ borderBottom: `1px solid ${theme.colors.gray[3]}` }}>
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <ThemeIcon variant="filled" color="blue" size="lg" radius="md">
                <Activity size={20} />
              </ThemeIcon>
              <Box>
                <Text fw={700} size="sm" lh={1.2}>Account Lineage</Text>
                <Text size="xs" c="dimmed">{nodes.length} Entities • Interactive</Text>
              </Box>
            </Group>
            <ActionIcon variant="light" color="gray" onClick={initGraph} title="Refresh graph">
              <RefreshCw size={16} />
            </ActionIcon>
          </Group>
          <TextInput 
            placeholder="Search entities..." 
            leftSection={<Search size={14} />} 
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
        </Box>

        {/* Control Buttons */}
        <Box p="xs" style={{ borderBottom: `1px solid ${theme.colors.gray[2]}` }}>
          <Group grow gap="xs">
            <ActionIcon 
              variant="light" 
              color="blue"
              onClick={handleExpandAll}
              title="Expand all nodes"
              size="sm"
            >
              <ChevronDown size={16} />
            </ActionIcon>
            <ActionIcon 
              variant="light" 
              color="gray"
              onClick={handleCollapseAll}
              title="Collapse all nodes"
              size="sm"
            >
              <ChevronRight size={16} />
            </ActionIcon>
          </Group>
          <Text size="xs" c="dimmed" ta="center" mt="xs">
            Expand / Collapse All
          </Text>
        </Box>

        <ScrollArea style={{ flex: 1 }} bg="gray.0">
          <Stack p="xs" gap="xs">
            {filteredNodes.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">No entities found</Text>
            ) : (
              filteredNodes.map(node => {
                const refAttributes = node.data.attributes.filter((a: AttributeData) => a.status === 'reference').length;
                return (
                  <Paper
                    key={node.id}
                    p="xs"
                    withBorder
                    onClick={() => handleFocusNode(node.id)}
                    style={{ 
                      borderColor: selectedNodeId === node.id ? theme.colors.blue[5] : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px ${theme.colors.gray[2]}`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <Group justify="space-between">
                      <Text size="sm" fw={600} c={selectedNodeId === node.id ? 'blue' : 'dark'}>
                        {node.data.label}
                      </Text>
                      <Group gap={4}>
                        <Badge size="xs" variant="light">{node.data.attributes.length}</Badge>
                        {refAttributes > 0 && <Badge size="xs" color="blue" variant="light">{refAttributes}ref</Badge>}
                      </Group>
                    </Group>
                    <Text size="xs" c="dimmed" truncate>{node.data.description}</Text>
                  </Paper>
                );
              })
            )}
          </Stack>
        </ScrollArea>
      </Paper>

      {/* Canvas */}
      <Box style={{ flex: 1, height: '100%', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          minZoom={0.1}
          maxZoom={4}
          fitView
        >
          <Background color="#cbd5e1" gap={24} />
          <Controls />
          <MiniMap 
            nodeStrokeWidth={3} 
            zoomable 
            pannable 
            nodeColor={() => theme.colors.blue[2]}
          />
          <Panel position="top-right">
            <Paper p="xs" shadow="sm" radius="md" withBorder>
              <Stack gap={6}>
                <Group gap="xs">
                  <LinkIcon size={16} className="text-blue-500" />
                  <Text size="xs" fw={500} c="dimmed">Click attributes to trace</Text>
                </Group>
                <Group gap="xs">
                  <Database size={16} className="text-gray-500" />
                  <Text size="xs" fw={500} c="dimmed">Click header to toggle node</Text>
                </Group>
              </Stack>
            </Paper>
          </Panel>
        </ReactFlow>
      </Box>
    </Box>
  );
};

export default function App() {
  return (
    <MantineProvider>
      <ReactFlowProvider>
        <ETLVisualizer />
      </ReactFlowProvider>
    </MantineProvider>
  );
}