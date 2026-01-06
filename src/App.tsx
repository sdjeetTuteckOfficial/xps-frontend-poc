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
  useMantineColorScheme, // <--- 1. Import Hook
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import ForceGraph2D from 'react-force-graph-2d';
import * as d3 from 'd3-force';

// --- IMPORT YOUR DATA HERE ---
import importedData from './graphData.json';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeToggle } from './components/ThemeToggle';

// --- VISUAL CONFIGURATION ---
const FIXED_NODE_SIZE = 12;
const LINK_WIDTH = 1.5;

// Palette - Neo4j Bloom Style
const NODE_COLORS: Record<string, string> = {
  Person: '#68BC00',
  Organization: '#FF756E',
  Location: '#57C7E3',
  Award: '#FFD86E',
  Technology: '#A5ABB6',
  Concept: '#A5ABB6',
  Default: '#A5ABB6',
};

// --- LOGIN SCREEN (Unchanged) ---
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

// --- MAIN DASHBOARD LAYOUT ---
const DashboardLayout = () => {
  const [opened, { toggle }] = useDisclosure();
  const { logout, user } = useAuth();
  const fgRef = useRef<any>();

  // --- 2. DARK MODE DETECTION ---
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  // Dynamic Styles based on Theme
  const GRAPH_BG = isDark ? '#0B0B0B' : '#FAFAFA';
  const LEGEND_BG = isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
  const LEGEND_TEXT = isDark ? '#fff' : '#333';
  const LINK_LABEL_BG = isDark
    ? 'rgba(0, 0, 0, 0.8)'
    : 'rgba(255, 255, 255, 0.9)';
  const LINK_LABEL_TEXT = isDark ? '#E0E0E0' : '#555';

  // --- DATA PROCESSING ---
  const graphData = useMemo(() => {
    const links = importedData.links.map((link) => ({ ...link }));

    // Calculate In-Degree
    const inDegreeMap: Record<string, number> = {};
    links.forEach((link) => {
      const targetId =
        typeof link.target === 'object' ? link.target.id : link.target;
      inDegreeMap[targetId] = (inDegreeMap[targetId] || 0) + 1;
    });

    // Curvature Logic
    const pairMap = new Map();
    links.forEach((link) => {
      const s = typeof link.source === 'object' ? link.source.id : link.source;
      const t = typeof link.target === 'object' ? link.target.id : link.target;
      const ids = [s, t].sort();
      const pairId = ids.join('-');
      if (!pairMap.has(pairId)) pairMap.set(pairId, []);
      pairMap.get(pairId).push(link);
    });

    const curvatureSpread = 0.5;
    pairMap.forEach((pairLinks) => {
      const len = pairLinks.length;
      if (pairLinks[0].source === pairLinks[0].target) {
        pairLinks.forEach((link, i) => {
          link.curvature = 1 + i * 0.2;
        });
        return;
      }
      pairLinks.forEach((link, i) => {
        if (len === 1) link.curvature = 0;
        else link.curvature = (i - (len - 1) / 2) * curvatureSpread;
      });
    });

    // Process Nodes
    const nodes = importedData.nodes.map((node) => ({
      ...node,
      val: FIXED_NODE_SIZE,
      inDegree: inDegreeMap[node.id] || 0,
    }));

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
            <div style={{ height: '75vh', background: GRAPH_BG }}>
              <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                backgroundColor={GRAPH_BG}
                warmupTicks={100}
                cooldownTicks={0}
                d3Force={(d3, nodes) => {
                  fgRef.current.d3Force('charge').strength(-1000);
                  fgRef.current.d3Force(
                    'collide',
                    d3.forceCollide(FIXED_NODE_SIZE + 10)
                  );
                  fgRef.current.d3Force(
                    'radial',
                    d3
                      .forceRadial(
                        (node) => {
                          const connections = node.inDegree || 0;
                          return 50 + connections * 100;
                        },
                        0,
                        0
                      )
                      .strength(0.8)
                  );
                }}
                onEngineStop={() => fgRef.current.zoomToFit(400, 50)}
                onNodeDragEnd={(node) => {
                  node.fx = node.x;
                  node.fy = node.y;
                }}
                // --- 3. NODE LABELS INSIDE CIRCLE ---
                nodeLabel='name'
                nodeRelSize={1}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.name;
                  // Decrease font size slightly so it fits inside
                  const fontSize = 10 / globalScale;
                  ctx.font = `bold ${fontSize}px Sans-Serif`;

                  // Draw Node
                  ctx.beginPath();
                  ctx.arc(
                    node.x,
                    node.y,
                    FIXED_NODE_SIZE,
                    0,
                    2 * Math.PI,
                    false
                  );
                  ctx.fillStyle =
                    NODE_COLORS[node.label] || NODE_COLORS.Default;
                  ctx.fill();

                  // White Border
                  ctx.strokeStyle = '#fff';
                  ctx.lineWidth = 2;
                  ctx.stroke();

                  // Text Label (Centered Inside)
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle'; // Vertically centered
                  ctx.fillStyle = '#fff'; // White text always visible on dark nodes

                  if (globalScale > 0.6) {
                    ctx.fillText(label, node.x, node.y);
                  }
                }}
                // Links
                linkCurvature='curvature'
                linkWidth={LINK_WIDTH}
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                linkColor={() => '#CCCCCC'}
                // Link Labels (Colors adapted to Dark Mode)
                linkCanvasObjectMode={() => 'after'}
                linkCanvasObject={(link: any, ctx, globalScale) => {
                  if (globalScale < 0.7) return;

                  const start = link.source;
                  const end = link.target;
                  if (typeof start !== 'object' || typeof end !== 'object')
                    return;

                  const dx = end.x - start.x;
                  const dy = end.y - start.y;
                  const distance = Math.sqrt(dx * dx + dy * dy);

                  let textX = start.x + dx / 2;
                  let textY = start.y + dy / 2;

                  if (link.curvature && distance > 0) {
                    const nx = dy / distance;
                    const ny = -dx / distance;
                    const offset = distance * link.curvature * 0.5;
                    textX += nx * offset;
                    textY += ny * offset;
                  }

                  const label = link.type;
                  const fontSize = 3.5;
                  ctx.font = `${fontSize}px Arial`;

                  ctx.save();
                  ctx.translate(textX, textY);
                  let angle = Math.atan2(dy, dx);
                  if (angle > Math.PI / 2) angle = -(Math.PI - angle);
                  if (angle < -Math.PI / 2) angle = -(-Math.PI - angle);
                  ctx.rotate(angle);

                  const textWidth = ctx.measureText(label).width;
                  const pad = 1;

                  // Dynamic Background for Link Labels
                  ctx.fillStyle = LINK_LABEL_BG;
                  ctx.fillRect(
                    -(textWidth / 2) - pad,
                    -(fontSize / 2) - pad,
                    textWidth + pad * 2,
                    fontSize + pad * 2
                  );

                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = LINK_LABEL_TEXT;
                  ctx.fillText(label, 0, 0);
                  ctx.restore();
                }}
              />
            </div>

            {/* LEGEND (Dynamic Colors) */}
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
                bg={LEGEND_BG}
                style={{ color: LEGEND_TEXT }}
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
