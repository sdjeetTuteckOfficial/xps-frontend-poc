import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  AppShell,
  Burger,
  Group,
  Title,
  Button,
  Text,
  Paper,
  Stack,
  Container,
  TextInput,
  PasswordInput,
  useMantineColorScheme,
  Badge,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import CytoscapeComponent from 'react-cytoscapejs';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeToggle } from './components/ThemeToggle';

// Your data import
import importedData from './graphData.json';

const NODE_COLORS = {
  Person: '#68BC00',
  Organization: '#FF756E',
  Location: '#57C7E3',
  Award: '#FFD86E',
  Technology: '#9D70FF',
  Concept: '#F16667',
  Default: '#A5ABB6',
};

// --- LOGIN SCREEN (Kept original) ---
const LoginScreen = () => {
  const { login } = useAuth();
  return (
    <Container
      size='xs'
      style={{ height: '100vh', display: 'grid', placeItems: 'center' }}
    >
      <Paper radius='md' p='xl' withBorder style={{ width: '100%' }}>
        <Stack>
          <Title order={2} ta='center' c='blue'>
            XPS 🚀
          </Title>
          <TextInput label='Email' placeholder='you@company.com' required />
          <PasswordInput
            label='Password'
            placeholder='Your password'
            required
          />
          <Button
            fullWidth
            mt='md'
            onClick={() => login('fake-token', { name: 'Admin' })}
          >
            Sign In
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

// --- MAIN DASHBOARD ---
const DashboardLayout = () => {
  const [opened, { toggle }] = useDisclosure();
  const { logout, user } = useAuth();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const cyRef = useRef(null);
  const animationRef = useRef(null);

  // Theme Constants
  const GRAPH_BG = isDark ? '#0f172a' : '#F8F9FA';
  const TEXT_COLOR = isDark ? '#cbd5e1' : '#212529';
  const LINE_COLOR = isDark ? '#475569' : '#ADB5BD';

  // 1. Format data for Cytoscape
  const elements = useMemo(() => {
    const nodes = importedData.nodes.map((n) => ({
      data: {
        ...n,
        label: n.name,
        // Ensure status exists for animation logic
        status: n.status || (Math.random() > 0.8 ? 'warn' : 'ok'),
        color: NODE_COLORS[n.label] || NODE_COLORS.Default,
      },
    }));

    const edges = importedData.links.map((l, index) => ({
      data: {
        id: `e${index}`,
        source: l.source,
        target: l.target,
        type: l.type,
      },
    }));

    return [...nodes, ...edges];
  }, []);

  // 2. Animation Logic (Pulse and Traffic)
  const startAnimations = (cy) => {
    // A. Pulse Animation for Warn/Err nodes
    const errorNodes = cy.nodes('[status="err"], [status="warn"]');
    const animateNode = (node) => {
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
              style: { 'border-width': 2, 'border-opacity': 1 },
              duration: 800,
            })
            .play()
            .promise()
            .then(() => animateNode(node));
        });
    };
    errorNodes.forEach(animateNode);

    // B. Traffic Animation (Marching Ants)
    let offset = 0;
    const step = () => {
      offset = (offset - 1) % 50;
      cy.edges().style({ 'line-dash-offset': offset });
      animationRef.current = requestAnimationFrame(step);
    };
    step();
  };

  // 3. Cleanup animations on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // 4. Cytoscape Stylesheet
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
        'border-width': 2,
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
        'font-size': '9px',
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
              XPS 🚀
            </Title>
          </Group>
          <Group>
            <ThemeToggle />
            <Button variant='subtle' color='red' size='xs' onClick={logout}>
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p='md'>
        <Stack gap='md' h='100%'>
          <Text size='xs' fw={700} c='dimmed' tt='uppercase'>
            Infrastructure
          </Text>
          <Button variant='light' onClick={() => cyRef.current?.fit(null, 50)}>
            Center View
          </Button>

          <Box style={{ marginTop: 'auto' }}>
            {selectedNodeData && (
              <Paper p='sm' withBorder mb='md' radius='md'>
                <Group justify='space-between' mb='xs'>
                  <Badge color={NODE_COLORS[selectedNodeData.label]}>
                    {selectedNodeData.label}
                  </Badge>
                  <Badge
                    variant='dot'
                    color={selectedNodeData.status === 'ok' ? 'green' : 'red'}
                  >
                    {selectedNodeData.status}
                  </Badge>
                </Group>
                <Text fw={600} size='sm'>
                  {selectedNodeData.name}
                </Text>
                <Text size='xs' c='dimmed'>
                  ID: {selectedNodeData.id}
                </Text>
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
          {/* Background Grid Decoration */}
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
              nodeRepulsion: 400000,
              componentSpacing: 100,
            }}
            cy={(cy) => {
              cyRef.current = cy;

              // Event Listeners
              cy.on('tap', 'node', (evt) =>
                setSelectedNodeData(evt.target.data())
              );
              cy.on('tap', (evt) => {
                if (evt.target === cy) setSelectedNodeData(null);
              });

              cy.on('mouseover', 'node', (e) => {
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

              // Start Animations once ready
              cy.ready(() => startAnimations(cy));
            }}
          />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};

// --- ROOT APP ---
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <DashboardLayout /> : <LoginScreen />;
}
