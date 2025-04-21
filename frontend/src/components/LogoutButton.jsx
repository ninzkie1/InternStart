import {
  Button,
  useToast
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';

const LogoutButton = () => {
  const { logout } = useAuth();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Simple redirect without using React Router
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Button
      colorScheme="blue"
      variant="outline"
      onClick={handleLogout}
    >
      Logout
    </Button>
  );
};

export default LogoutButton; 