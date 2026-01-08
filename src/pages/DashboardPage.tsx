import { useMemo, useState, useEffect, useRef } from 'react';
import {
  AppShell,
  Burger,
  Group,
  Title,
  Button,
  Text,
  Paper,
  Stack,
  Box,
  Badge,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import CytoscapeComponent from 'react-cytoscapejs';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import importedData from '../graphData.json';

export const DashboardPage = () => {
  const [opened, { toggle }] = useDisclosure();
  const { logout, user } = useAuth();
  const { colorScheme } = useMantineColorScheme();
  const navigate = useNavigate();
  const isDark = colorScheme === 'dark';

  const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
  const cyRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  // Theme Constants
  const GRAPH_BG = isDark ? '#0f172a' : '#F8F9FA';
  const TEXT_COLOR = isDark ? '#cbd5e1' : '#212529';
  const LINE_COLOR = isDark ? '#475569' : '#ADB5BD';

  // --- MAP IMPORTED DATA TO CYTOSCAPE ---
  const elements = useMemo(() => {
    const COLOR_SCHEMA = '#FFD700'; // Yellow/Gold
    const COLOR_TABLE = '#228BE6'; // Blue

    const nodes = importedData.nodes.map((n) => {
      const isSchema = n.label === 'Schema';

      return {
        data: {
          id: n.id,
          label: n.name,
          type: n.label,
          color: isSchema ? COLOR_SCHEMA : COLOR_TABLE,
          status: 'ok',
          schema: n.schema || 'Root',
        },
      };
    });

    const edges = importedData.links.map((l) => {
      let readableDate = null;
      if (l.updated_at) {
        readableDate = new Date(l.updated_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }

      return {
        data: {
          id: l.id,
          source: l.source,
          target: l.target,
          type: l.type,
          logic: l.logic,
          script: l.script_name,
          updatedAt: readableDate,
        },
      };
    });

    return [...nodes, ...edges];
  }, []);

  const startAnimations = (cy: any) => {
    const errorNodes = cy.nodes('[status="err"], [status="warn"]');
    const animateNode = (node: any) => {
      if (!node.inside()) return;
      node
        .animation({
          style: { 'border-width': 6, 'border-opacity': 0.5 },
          duration: 800,
        })
        .play()
        .promise()
        .then(() => {
          if (!node.inside()) return;
          node
            .animation({
              style: { 'border-width': 3, 'border-opacity': 1 },
              duration: 800,
            })
            .play()
            .promise()
            .then(() => animateNode(node));
        });
    };
    errorNodes.forEach(animateNode);

    let offset = 0;
    const step = () => {
      offset = (offset - 1) % 50;
      cy.edges().style({ 'line-dash-offset': offset });
      animationRef.current = requestAnimationFrame(step);
    };
    step();
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const stylesheet = [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        'background-color': isDark ? '#1e293b' : 'data(color)',
        color: TEXT_COLOR,
        'font-size': '11px',
        'font-weight': 600,
        'text-valign': 'bottom',
        'text-margin-y': '6px',
        width: 30,
        height: 30,
        'border-width': 3,
        'border-color': 'data(color)',
        'text-outline-width': 2,
        'text-outline-color': GRAPH_BG,
      },
    },
    {
      selector: 'node[status="warn"]',
      style: {
        'border-color': '#f59e0b',
        'shadow-blur': 15,
        'shadow-color': '#f59e0b',
      },
    },
    {
      selector: 'node[status="err"]',
      style: {
        'border-color': '#ef4444',
        'shadow-blur': 25,
        'shadow-color': '#ef4444',
        'z-index': 99,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 2,
        'line-color': LINE_COLOR,
        'target-arrow-color': LINE_COLOR,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'line-style': 'dashed',
        'line-dash-pattern': [6, 3],
        opacity: 0.4,
        label: 'data(type)',
        'font-size': '8px',
        color: TEXT_COLOR,
        'text-rotation': 'autorotate',
        'text-background-opacity': 0.8,
        'text-background-color': GRAPH_BG,
      },
    },
    {
      selector: '.highlight',
      style: {
        'border-width': 4,
        'border-color': '#38bdf8',
        'line-color': '#38bdf8',
        'target-arrow-color': '#38bdf8',
        opacity: 1,
        'line-style': 'solid',
        'z-index': 999,
      },
    },
    {
      selector: '.dimmed',
      style: {
        opacity: 0.1,
        'text-opacity': 0,
        'shadow-color': 'transparent',
      },
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding='md'
    >
      <AppShell.Header>
        <Group h='100%' px='md' justify='space-between'>
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom='sm'
              size='sm'
            />
            <Title order={3} c='blue'>
              Data Lineage 🚀
            </Title>
          </Group>
          <Group>
            <ThemeToggle />
            <Button
              variant='subtle'
              color='red'
              size='xs'
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p='md'>
        <Stack gap='md' h='100%'>
          <Text size='xs' fw={700} c='dimmed' tt='uppercase'>
            Details
          </Text>
          <Button variant='light' onClick={() => cyRef.current?.fit(null, 50)}>
            Center View
          </Button>

          <Box style={{ marginTop: 'auto' }}>
            {selectedNodeData && (
              <Paper p='sm' withBorder mb='md' radius='md'>
                <Group justify='space-between' mb='xs'>
                  <Badge
                    color={selectedNodeData.color || 'blue'}
                    variant='filled'
                  >
                    {selectedNodeData.type}
                  </Badge>
                  {selectedNodeData.status && (
                    <Badge
                      variant='dot'
                      color={selectedNodeData.status === 'ok' ? 'green' : 'red'}
                    >
                      {selectedNodeData.status}
                    </Badge>
                  )}
                </Group>

                <Text fw={600} size='sm'>
                  {selectedNodeData.label}
                </Text>

                {selectedNodeData.schema && (
                  <Text size='xs' c='dimmed'>
                    Schema: {selectedNodeData.schema}
                  </Text>
                )}

                {selectedNodeData.logic && (
                  <Stack gap={2} mt='md'>
                    <Text size='xs' fw={700} c='dimmed'>
                      Logic:
                    </Text>
                    <Text size='xs' style={{ lineHeight: 1.4 }}>
                      {selectedNodeData.logic}
                    </Text>
                  </Stack>
                )}
                {selectedNodeData.script && (
                  <Text size='xs' c='dimmed' mt='xs'>
                    Script:{' '}
                    <Text span c='blue' inherit>
                      {selectedNodeData.script}
                    </Text>
                  </Text>
                )}

                {selectedNodeData.updatedAt && (
                  <Text size='xs' c='dimmed' mt={4}>
                    Last Updated: {selectedNodeData.updatedAt}
                  </Text>
                )}
              </Paper>
            )}

            <Paper withBorder p='sm' radius='md'>
              <Text size='sm' fw={500}>
                {user?.name}
              </Text>
              <Text size='xs' c='dimmed'>
                Admin Access
              </Text>
            </Paper>
          </Box>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box
          style={{
            width: '100%',
            height: 'calc(100vh - 100px)',
            background: GRAPH_BG,
            borderRadius: '12px',
            border: `1px solid ${isDark ? '#1e293b' : '#DEE2E6'}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `radial-gradient(${
                isDark ? '#334155' : '#cbd5e1'
              } 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              opacity: 0.2,
              pointerEvents: 'none',
            }}
          />

          <CytoscapeComponent
            elements={elements}
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              zIndex: 1,
            }}
            stylesheet={stylesheet}
            layout={{
              name: 'cose',
              animate: true,
              nodeRepulsion: 800000,
              componentSpacing: 100,
              nodeOverlap: 20,
              idealEdgeLength: 100,
            }}
            cy={(cy: any) => {
              cyRef.current = cy;
              cy.on('tap', 'node', (evt: any) =>
                setSelectedNodeData(evt.target.data())
              );
              cy.on('tap', 'edge', (evt: any) =>
                setSelectedNodeData({
                  ...evt.target.data(),
                  label: evt.target.data('type'),
                })
              );
              cy.on('tap', (evt: any) => {
                if (evt.target === cy) setSelectedNodeData(null);
              });
              cy.on('mouseover', 'node', (e: any) => {
                cy.elements().addClass('dimmed');
                e.target.addClass('highlight').removeClass('dimmed');
                e.target
                  .neighborhood()
                  .addClass('highlight')
                  .removeClass('dimmed');
              });
              cy.on('mouseout', 'node', () =>
                cy.elements().removeClass('dimmed highlight')
              );
              cy.ready(() => startAnimations(cy));
            }}
          />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};
