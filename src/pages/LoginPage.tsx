import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Stack,
  Title,
  TextInput,
  PasswordInput,
  Button,
} from '@mantine/core';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      login('fake-token', { name: 'Admin' });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      size='xs'
      style={{ height: '100vh', display: 'grid', placeItems: 'center' }}
    >
      <Paper radius='md' p='xl' withBorder style={{ width: '100%' }}>
        <Stack>
          <Title order={2} ta='center' c='blue'>
            Data Lineage 🚀
          </Title>
          <TextInput label='Email' placeholder='you@company.com' required />
          <PasswordInput
            label='Password'
            placeholder='Your password'
            required
          />
          <Button fullWidth mt='md' loading={loading} onClick={handleLogin}>
            Sign In
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};
