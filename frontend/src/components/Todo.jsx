import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  IconButton,
  Checkbox,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Divider,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';

const Todo = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const toast = useToast();

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const handleAddTodo = () => {
    if (!newTodo.trim()) {
      toast({
        title: 'Error',
        description: 'Todo cannot be empty',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const todo = {
      id: Date.now(),
      text: newTodo,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTodos([...todos, todo]);
    setNewTodo('');
  };

  const handleToggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleDeleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleEditStart = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const handleEditSave = (id) => {
    if (!editText.trim()) {
      toast({
        title: 'Error',
        description: 'Todo cannot be empty',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, text: editText } : todo
    ));
    setEditingId(null);
    setEditText('');
  };

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Todo List</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <HStack>
            <Input
              placeholder="Add a new todo"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
            />
            <Button colorScheme="blue" onClick={handleAddTodo}>
              Add
            </Button>
          </HStack>

          <Divider />

          <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
            {todos.map(todo => (
              <HStack key={todo.id} spacing={4} bg="white" p={2} borderRadius="md" shadow="sm">
                <Checkbox
                  isChecked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id)}
                />
                {editingId === todo.id ? (
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => handleEditSave(todo.id)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEditSave(todo.id)}
                    autoFocus
                  />
                ) : (
                  <Text
                    flex="1"
                    textDecoration={todo.completed ? 'line-through' : 'none'}
                    color={todo.completed ? 'gray.500' : 'black'}
                  >
                    {todo.text}
                  </Text>
                )}
                <IconButton
                  icon={<EditIcon />}
                  size="sm"
                  onClick={() => handleEditStart(todo)}
                  aria-label="Edit todo"
                />
                <IconButton
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleDeleteTodo(todo.id)}
                  aria-label="Delete todo"
                />
              </HStack>
            ))}
            {todos.length === 0 && (
              <Text color="gray.500" textAlign="center" py={4}>
                No todos yet. Add one above!
              </Text>
            )}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default Todo; 