import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Container,
  Heading,
  Card,
  CardBody,
  Stack,
  Divider,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Textarea,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  HStack,
  ButtonGroup,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tooltip,
} from '@chakra-ui/react';
import { EditIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon, DeleteIcon } from '@chakra-ui/icons';
import { timeIn, timeOut, getTodayLog, getLogs } from '../services/api';
import axios from 'axios';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [todayLog, setTodayLog] = useState(null);
  const [logs, setLogs] = useState([]);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [description, setDescription] = useState('');
  const [editingLog, setEditingLog] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const cancelRef = React.useRef();

  const fetchTodayLog = useCallback(async () => {
    try {
      const response = await getTodayLog();
      
      // If no log found for today but there's an ongoing session in the logs,
      // use that as today's log
      if (!response.data && logs.length > 0) {
        const ongoingLog = logs.find(log => log.status === 'ongoing');
        if (ongoingLog) {
          setTodayLog(ongoingLog);
          if (ongoingLog.timeIn) {
            const timeIn = new Date(ongoingLog.timeIn);
            const now = new Date();
            const duration = (now - timeIn) / (1000 * 60 * 60); // Convert to hours
            setCurrentDuration(duration);
          }
          return;
        }
      }
      
      setTodayLog(response.data);
    } catch (error) {
      console.error('Error fetching today\'s log:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch today\'s log',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [logs]);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await getLogs();
      setLogs(response.data);

      // Calculate total duration from all completed logs
      const total = response.data.reduce((acc, log) => {
        return acc + (log.totalHours || 0);
      }, 0);
      setTotalDuration(total);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch logs history',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, []);

  // Update current duration every second if there's an ongoing session
  useEffect(() => {
    let intervalId;
    
    const updateDuration = () => {
      const activeLog = todayLog?.status === 'ongoing' ? todayLog : logs.find(log => log.status === 'ongoing');
      
      if (activeLog?.timeIn) {
        const timeIn = new Date(activeLog.timeIn);
        const now = new Date();
        const duration = (now - timeIn) / (1000 * 60 * 60); // Convert to hours
        setCurrentDuration(duration);
      } else {
        setCurrentDuration(0);
      }
    };

    if (todayLog?.status === 'ongoing' || logs.some(log => log.status === 'ongoing')) {
      // Initial calculation
      updateDuration();

      // Update every 30 seconds instead of every second
      intervalId = setInterval(updateDuration, 30000);
    } else {
      setCurrentDuration(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [todayLog, logs]);

  // Initial data fetch
  useEffect(() => {
    fetchTodayLog();
    fetchLogs();

    // Refresh data every 5 minutes instead of every minute
    const refreshInterval = setInterval(() => {
      fetchTodayLog();
      fetchLogs();
    }, 300000); // Changed from 60000 to 300000 (5 minutes)

    return () => clearInterval(refreshInterval);
  }, [fetchTodayLog, fetchLogs]);

  useEffect(() => {
    // Filter logs based on search query
    const filtered = logs.filter(log => {
      const searchLower = searchQuery.toLowerCase();
      const date = new Date(log.date).toLocaleDateString().toLowerCase();
      const timeIn = new Date(log.timeIn).toLocaleString().toLowerCase();
      const timeOut = log.timeOut ? new Date(log.timeOut).toLocaleString().toLowerCase() : '';
      const description = (log.description || '').toLowerCase();
      const status = log.status.toLowerCase();

      return (
        date.includes(searchLower) ||
        timeIn.includes(searchLower) ||
        timeOut.includes(searchLower) ||
        description.includes(searchLower) ||
        status.includes(searchLower)
      );
    });
    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [logs, searchQuery]);

  // Calculate pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredLogs.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredLogs.length / entriesPerPage);

  // Handle page changes
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle entries per page change
  const handleEntriesPerPageChange = (event) => {
    setEntriesPerPage(Number(event.target.value));
    setCurrentPage(1); // Reset to first page when changing entries per page
  };

  const handleTimeIn = async () => {
    setIsLoading(true);
    try {
      console.log('Recording time in...');
      await timeIn({ description });
      setDescription('');
      toast({
        title: 'Time In recorded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await fetchTodayLog();
      await fetchLogs();
    } catch (error) {
      console.error('Error recording time in:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to record Time In',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeOut = async () => {
    setIsLoading(true);
    try {
      console.log('Recording time out...');
      await timeOut({ description });
      setDescription('');
      toast({
        title: 'Time Out recorded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await fetchTodayLog();
      await fetchLogs();
    } catch (error) {
      console.error('Error recording time out:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to record Time Out',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDescription = async () => {
    if (!editingLog) return;

    setIsLoading(true);
    try {
      await axios.patch(`/api/intern-logs/${editingLog._id}/description`, {
        description: description
      });
      toast({
        title: 'Description updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await fetchTodayLog();
      await fetchLogs();
      onClose();
    } catch (error) {
      console.error('Error updating description:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update description',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (log) => {
    setEditingLog(log);
    setDescription(log.description || '');
    onOpen();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  // Add new function to format time only
  const formatTimeOnly = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = (hours) => {
    if (!hours && hours !== 0) return '00:00:00';
    const totalSeconds = Math.floor(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Add delete handler
  const handleDelete = async () => {
    if (!logToDelete) return;

    setIsLoading(true);
    try {
      await axios.delete(`/api/intern-logs/${logToDelete._id}`);
      toast({
        title: 'Log deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await fetchLogs(); // Refresh the logs
      setIsDeleteDialogOpen(false);
      setLogToDelete(null);
    } catch (error) {
      console.error('Error deleting log:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete log',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (log) => {
    setLogToDelete(log);
    setIsDeleteDialogOpen(true);
  };

  console.log('Current state:', { todayLog, logs, currentDuration });

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Card>
          <CardBody>
            <Stack spacing={4}>
              <Heading size="md">Today's Time Log</Heading>
              <Divider />
              <StatGroup>
                <Stat>
                  <StatLabel>Current Session</StatLabel>
                  <StatNumber>
                    {(todayLog?.status === 'ongoing' || logs.some(log => log.status === 'ongoing')) 
                      ? formatDuration(currentDuration) 
                      : '00:00:00'}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Total Hours Worked</StatLabel>
                  <StatNumber>
                    {formatDuration(totalDuration)}
                  </StatNumber>
                </Stat>
              </StatGroup>
              {todayLog ? (
                <VStack align="stretch" spacing={2}>
                  <Text>
                    Time In: {todayLog.timeIn ? formatDate(todayLog.timeIn) : 'Not yet recorded'}
                  </Text>
                  <Text>
                    Time Out: {todayLog.timeOut ? formatDate(todayLog.timeOut) : 'Not yet recorded'}
                  </Text>
                  {todayLog.totalHours > 0 && (
                    <Text>
                      Total Duration: {formatDuration(todayLog.totalHours)}
                    </Text>
                  )}
                  <Badge colorScheme={todayLog.status === 'ongoing' ? 'green' : 'blue'}>
                    {todayLog.status}
                  </Badge>
                  {todayLog.description && (
                    <Text>
                      Description: {todayLog.description}
                      <IconButton
                        size="sm"
                        icon={<EditIcon />}
                        ml={2}
                        onClick={() => openEditModal(todayLog)}
                        aria-label="Edit description"
                      />
                    </Text>
                  )}
                </VStack>
              ) : logs.some(log => log.status === 'ongoing') ? (
                <VStack align="stretch" spacing={2}>
                  <Text>
                    Time In: {formatDate(logs.find(log => log.status === 'ongoing').timeIn)}
                  </Text>
                  <Text>
                    Time Out: Not yet recorded
                  </Text>
                  <Badge colorScheme="green">ongoing</Badge>
                </VStack>
              ) : (
                <Text>No time log for today</Text>
              )}
              <Textarea
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                resize="vertical"
                rows={3}
              />
              <Stack direction="row" spacing={4} justify="center">
                <Button
                  colorScheme="blue"
                  onClick={handleTimeIn}
                  isLoading={isLoading}
                  isDisabled={todayLog?.status === 'ongoing' || logs.some(log => log.status === 'ongoing')}
                >
                  Time In
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleTimeOut}
                  isLoading={isLoading}
                  isDisabled={!(todayLog?.status === 'ongoing' || logs.some(log => log.status === 'ongoing'))}
                >
                  Time Out
                </Button>
              </Stack>
            </Stack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stack spacing={4}>
              <Heading size="md">Time Log History</Heading>
              <Divider />
              
              <HStack justify="space-between" align="center">
                <HStack>
                  <Text whiteSpace="nowrap">Show</Text>
                  <Select
                    value={entriesPerPage}
                    onChange={handleEntriesPerPageChange}
                    width="70px"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                  </Select>
                  <Text whiteSpace="nowrap">entries</Text>
                </HStack>

                {/* Search Input */}
                <InputGroup maxW="300px">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </HStack>

              {/* Scrollable Table */}
              <Box 
                overflowX="auto" 
                overflowY="auto" 
                maxHeight="400px"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px',
                  },
                }}
              >
                <Table variant="simple" size="sm">
                  <Thead position="sticky" top={0} bg="white" zIndex={1}>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Time In</Th>
                      <Th>Time Out</Th>
                      <Th>Duration</Th>
                      <Th>Description</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {currentEntries.map((log) => (
                      <Tr key={log._id} _hover={{ bg: "gray.50" }}>
                        <Td whiteSpace="nowrap">{new Date(log.date).toLocaleDateString()}</Td>
                        <Td whiteSpace="nowrap">{formatTimeOnly(log.timeIn)}</Td>
                        <Td whiteSpace="nowrap">{log.timeOut ? formatTimeOnly(log.timeOut) : '-'}</Td>
                        <Td whiteSpace="nowrap">{log.totalHours ? formatDuration(log.totalHours) : '-'}</Td>
                        <Td maxW="300px" overflow="hidden" textOverflow="ellipsis">
                          <Text noOfLines={2}>
                            {log.description || '-'}
                          </Text>
                          <IconButton
                            size="sm"
                            icon={<EditIcon />}
                            ml={2}
                            onClick={() => openEditModal(log)}
                            aria-label="Edit description"
                          />
                        </Td>
                        <Td>
                          <Badge colorScheme={log.status === 'ongoing' ? 'green' : 'blue'}>
                            {log.status}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Tooltip label="Edit log" hasArrow>
                              <IconButton
                                size="sm"
                                icon={<EditIcon />}
                                onClick={() => openEditModal(log)}
                                colorScheme="blue"
                                aria-label="Edit log"
                              />
                            </Tooltip>
                            <Tooltip label="Delete log" hasArrow>
                              <IconButton
                                size="sm"
                                icon={<DeleteIcon />}
                                onClick={() => openDeleteDialog(log)}
                                colorScheme="red"
                                aria-label="Delete log"
                                isDisabled={log.status === 'ongoing'}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              {/* Pagination and Results Info */}
              <HStack justify="space-between" align="center" pt={4}>
                <Text fontSize="sm" color="gray.600">
                  Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredLogs.length)} of {filteredLogs.length} entries
                </Text>
                
                <ButtonGroup variant="outline" size="sm" isAttached>
                  <IconButton
                    icon={<ChevronLeftIcon />}
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                    aria-label="Previous page"
                  />
                  {[...Array(totalPages)].map((_, index) => (
                    <Button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      colorScheme={currentPage === index + 1 ? "blue" : "gray"}
                      variant={currentPage === index + 1 ? "solid" : "outline"}
                    >
                      {index + 1}
                    </Button>
                  ))}
                  <IconButton
                    icon={<ChevronRightIcon />}
                    onClick={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                    aria-label="Next page"
                  />
                </ButtonGroup>
              </HStack>

              {/* No Results Message */}
              {filteredLogs.length === 0 && (
                <Text textAlign="center" color="gray.500" py={4}>
                  No logs found matching your search
                </Text>
              )}
            </Stack>
          </CardBody>
        </Card>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Description</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              size="sm"
              resize="vertical"
              rows={4}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleEditDescription} isLoading={isLoading}>
              Save
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setLogToDelete(null);
        }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Time Log
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this time log?
              {logToDelete && (
                <Box mt={2}>
                  <Text>
                    <strong>Date:</strong> {new Date(logToDelete.date).toLocaleDateString()}
                  </Text>
                  <Text>
                    <strong>Time In:</strong> {formatTimeOnly(logToDelete.timeIn)}
                  </Text>
                  {logToDelete.timeOut && (
                    <Text>
                      <strong>Time Out:</strong> {formatTimeOnly(logToDelete.timeOut)}
                    </Text>
                  )}
                </Box>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => {
                setIsDeleteDialogOpen(false);
                setLogToDelete(null);
              }}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3} isLoading={isLoading}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

    </Container>
  );
};

export default Dashboard; 