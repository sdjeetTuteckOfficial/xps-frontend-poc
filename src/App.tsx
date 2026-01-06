import React, { useMemo, useRef } from 'react';
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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import ForceGraph2D from 'react-force-graph-2d';
import * as d3 from 'd3-force';

// Import from your context and component files
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeToggle } from './components/ThemeToggle';

// --- 1. VISUAL CONFIGURATION (NEO4J STYLE) ---
const GRAPH_BG = '#0B0B0B'; // Deep, almost black background
const LINK_LABEL_SIZE = 1.8; // Tiny, crisp text size

// Exact Neo4j Bloom Palette
const NODE_COLORS: Record<string, string> = {
  Person: '#F25A92', // Hot Pink (Melinda/Bill style)
  Organization: '#4CB5AE', // Teal/Green
  Technology: '#57C7E3', // Sky Blue
  Concept: '#F5C452', // Yellow/Orange
  Default: '#8DCC93', // Light Green
};

// --- 2. LOGIN SCREEN COMPONENT ---
const LoginScreen = () => {
  const { login } = useAuth();
  return (
    <Container
      size='xs'
      style={{ height: '100vh', display: 'grid', placeItems: 'center' }}
    >
      <Paper radius='md' p='xl' withBorder style={{ width: '100%' }}>
        <Stack>
          <Title order={2} ta='center' c='primary'>
            XPS 🚀
          </Title>
          <Text c='dimmed' size='sm' ta='center'>
            Sign in to access the Graph Dashboard
          </Text>
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

// --- 3. MAIN DASHBOARD LAYOUT ---
const DashboardLayout = () => {
  const [opened, { toggle }] = useDisclosure();
  const { logout, user } = useAuth();
  const fgRef = useRef<any>();

  // --- DATASET MIMICKING THE IMAGE ---
  // A dense main cluster and a smaller detached satellite cluster
  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];

    // 1. The "Main Hub" (Green Node in center of your image)
    nodes.push({
      id: 'hub',
      label: 'Organization',
      name: 'Neo4j Inc',
      val: 30,
    });

    // 2. Star Cluster around Main Hub (Blue & Pink nodes)
    for (let i = 0; i < 20; i++) {
      const id = `node_${i}`;
      const type = i % 2 === 0 ? 'Person' : 'Technology';
      nodes.push({
        id,
        label: type,
        name: type === 'Person' ? `User ${i}` : `Tech ${i}`,
        val: 10,
      });

      // Connect to Hub
      links.push({
        source: 'hub',
        target: id,
        type: i % 3 === 0 ? 'DEVELOPED' : 'USES',
        curve: 0,
      });

      // Interconnect some nodes to create the "web" look
      if (i > 0 && i % 4 === 0) {
        links.push({
          source: id,
          target: `node_${i - 1}`,
          type: 'RELATED',
          curve: 0.2,
        });
      }
    }

    // 3. The "Detached Cluster" (Like the right side of your image)
    const subHub = 'sub_hub';
    nodes.push({ id: subHub, label: 'Concept', name: 'Graph Theory', val: 20 });

    for (let i = 0; i < 8; i++) {
      const id = `sub_${i}`;
      nodes.push({ id, label: 'Person', name: `Res_${i}`, val: 8 });
      links.push({ source: subHub, target: id, type: 'STUDIES', curve: 0 });
    }

    // Connect the two clusters loosely
    links.push({ source: 'hub', target: subHub, type: 'BASED_ON', curve: 0 });

    return { nodes, links };
  }, []);

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
            <Title order={3} c='primary'>
              XPS 🚀
            </Title>
          </Group>
          <Group>
            <ThemeToggle />
            <Button variant='subtle' color='red' onClick={logout}>
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p='md'>
        <Text size='xs' fw={700} c='dimmed' tt='uppercase' mb='sm'>
          Menu
        </Text>
        <Stack gap='xs'>
          <Button variant='light' justify='flex-start'>
            Graph View
          </Button>
          <Button variant='subtle' justify='flex-start'>
            Settings
          </Button>
        </Stack>
        <Stack mt='auto'>
          <Paper withBorder p='sm' radius='md' bg='var(--mantine-color-body)'>
            <Text size='sm' fw={500}>
              {user?.name}
            </Text>
            <Text size='xs' c='dimmed'>
              Admin Access
            </Text>
          </Paper>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Stack>
          <Paper
            p='0'
            withBorder
            radius='md'
            style={{ overflow: 'hidden', position: 'relative' }}
          >
            {/* --- GRAPH CONTAINER --- */}
            <div style={{ height: '75vh', background: '#000' }}>
              <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                backgroundColor={GRAPH_BG}
                // --- PHYSICS ENGINE (Cluster Feel) ---
                d3VelocityDecay={0.3}
                d3AlphaDecay={0.01}
                cooldownTicks={100}
                onEngineStop={() => fgRef.current.zoomToFit(400, 50)}
                d3Force={(d3, nodes) => {
                  // Strong repulsion to spread the "Web"
                  fgRef.current.d3Force('charge').strength(-120);
                  // Springy links
                  fgRef.current.d3Force('link').distance(60);
                  // Hard collision to prevent overlap
                  fgRef.current.d3Force('collide', d3.forceCollide(15));
                }}
                // --- NODES (Solid Pastel Circles) ---
                nodeLabel='name'
                nodeRelSize={1}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.name;
                  const fontSize = 10 / globalScale; // Text scales with zoom
                  ctx.font = `${fontSize}px Sans-Serif`;

                  // Fixed radius for uniform Neo4j look, or slightly dynamic based on val
                  const r = node.val ? node.val / 2 : 5;

                  // 1. Node Body
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                  ctx.fillStyle =
                    NODE_COLORS[node.label] || NODE_COLORS.Default;
                  ctx.fill();

                  // 2. White Border (Halo effect)
                  ctx.strokeStyle = '#fff';
                  ctx.lineWidth = 0.5;
                  ctx.stroke();

                  // 3. Text Inside (Tiny)
                  // Only show text if zoomed in enough or if node is big
                  if (globalScale > 1.5 || node.val > 20) {
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#000'; // Black text on pastel nodes
                    ctx.fillText(label, node.x, node.y);
                  }
                }}
                // --- LINKS (Thin Arrows) ---
                linkCurvature='curve'
                linkWidth={0.5} // Ultra thin lines
                linkDirectionalArrowLength={3} // Subtle arrows at end
                linkDirectionalArrowRelPos={1}
                linkColor={() => '#808080'} // Light Grey
                // --- EDGE LABELS (Floating) ---
                linkCanvasObjectMode={() => 'after'}
                linkCanvasObject={(link: any, ctx, globalScale) => {
                  const start = link.source;
                  const end = link.target;
                  if (typeof start !== 'object' || typeof end !== 'object')
                    return;

                  // 1. Position Calculation with Curve
                  let textPos = {
                    x: start.x + (end.x - start.x) / 2,
                    y: start.y + (end.y - start.y) / 2,
                  };

                  if (link.curve) {
                    const dx = end.x - start.x;
                    const dy = end.y - start.y;
                    const offsetX = dy * link.curve * 0.5;
                    const offsetY = -dx * link.curve * 0.5;
                    textPos = {
                      x: textPos.x + offsetX,
                      y: textPos.y + offsetY,
                    };
                  }

                  // 2. Draw Label
                  const label = link.type;
                  ctx.font = `${LINK_LABEL_SIZE}px Sans-Serif`; // Tiny font

                  ctx.save();
                  ctx.translate(textPos.x, textPos.y);

                  // Rotation
                  const relLink = { x: end.x - start.x, y: end.y - start.y };
                  let textAngle = Math.atan2(relLink.y, relLink.x);
                  if (textAngle > Math.PI / 2)
                    textAngle = -(Math.PI - textAngle);
                  if (textAngle < -Math.PI / 2)
                    textAngle = -(-Math.PI - textAngle);
                  ctx.rotate(textAngle);

                  // NO RECTANGLE BACKGROUND - Just Floating Text
                  // Add a tiny black outline to make it pop against lines if needed,
                  // or just draw it plain like the image.

                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = '#C0C0C0'; // Whitish-Grey text
                  ctx.fillText(label, 0, 0);

                  ctx.restore();
                }}
              />
            </div>

            {/* OVERLAY LEGEND */}
            <div
              style={{
                position: 'absolute',
                top: 20,
                left: 20,
                pointerEvents: 'none',
              }}
            >
              <Paper
                p='xs'
                radius='sm'
                withBorder
                bg='rgba(0,0,0,0.8)'
                style={{ color: 'white' }}
              >
                <Text size='xs' fw={700} c='dimmed' mb={5}>
                  LEGEND
                </Text>
                {Object.entries(NODE_COLORS).map(([label, color]) => (
                  <Group gap='xs' key={label} mb={4}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        background: color,
                        borderRadius: '50%',
                      }}
                    ></div>
                    <Text size='xs' c='dimmed'>
                      {label}
                    </Text>
                  </Group>
                ))}
              </Paper>
            </div>
          </Paper>
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
};

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
