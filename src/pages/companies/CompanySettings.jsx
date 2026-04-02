import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Flex,
    Text,
    VStack,
    HStack,
    Input,
    Button,
    Icon,
    FormControl,
    FormLabel,
    Image,
    IconButton,
    InputGroup,
    InputLeftElement,
    useToast,
    Spinner,
    Divider,
    Grid,
    GridItem,
    Switch
} from '@chakra-ui/react';
import { FiBriefcase,FiSave, FiImage, FiClock, FiCalendar, FiTrash2, FiPlus, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';
import { getCompany, updateCompany } from '../../api/company.api';
import api from '../../api/axios';

const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CompanySettings = () => {
    const { user, activeCompany, updateUser } = useAuth();
    const toast = useToast();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);

    // Working Hours State
    const [workingHours, setWorkingHours] = useState(
        DEFAULT_DAYS.map(day => ({
            day,
            isActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day),
            shift: { start: '10:00', end: '18:00' },
            break: { start: '13:00', end: '14:00' }
        }))
    );
    const [selectedDay, setSelectedDay] = useState('Mon');

    // Holidays State
    const [holidays, setHolidays] = useState([]);

    useEffect(() => {
        if (activeCompany) {
            fetchCompanyDetails();
        }
    }, [activeCompany]);

    const getApiUrl = () => {
        // Use the baseURL from axios instance which handles dynamic devtunnel detection
        const apiUrl = api.defaults.baseURL || 'http://localhost:5000/api';
        return apiUrl.replace(/\/api\/?$/, '');
    };

    const fetchCompanyDetails = async () => {
        try {
            setLoading(true);
            const data = await getCompany(activeCompany);
            setName(data.name || '');
            setEmail(data.email || '');
            setPhone(data.phone || '');
            setAddress(data.address || '');
            if (data.logo) {
                const logoUrl = data.logo.startsWith('http') ? data.logo : getApiUrl() + data.logo;
                setLogoPreview(logoUrl);
            } else {
                setLogoPreview(null);
            }
            
            if (data.workingHours && data.workingHours.length > 0) {
                // Merge to ensure all 7 days exist
                const mergedHours = DEFAULT_DAYS.map(d => {
                    const existing = data.workingHours.find(wh => wh.day === d);
                    return existing || { day: d, isActive: false, shift: { start: '10:00', end: '18:00' }, break: { start: '13:00', end: '14:00' } };
                });
                setWorkingHours(mergedHours);
            }

            if (data.holidays && Array.isArray(data.holidays)) {
                const formattedHolidays = data.holidays
                    .map(h => {
                        try {
                            const date = new Date(h.date);
                            if (isNaN(date.getTime())) return null;
                            return { ...h, date: date.toISOString().split('T')[0] };
                        } catch (e) {
                            return null;
                        }
                    })
                    .filter(h => h !== null);
                setHolidays(formattedHolidays);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast({ title: 'Failed to load company details', status: 'error', isClosable: true });
        } finally {
            setLoading(false);
        }
    };

    const handleLogoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleWorkingHourChange = (field, type, value) => {
        setWorkingHours(prev => prev.map(wh => {
            if (wh.day === selectedDay) {
                return { ...wh, [field]: { ...wh[field], [type]: value } };
            }
            return wh;
        }));
    };

    const toggleDayActive = () => {
        setWorkingHours(prev => prev.map(wh => wh.day === selectedDay ? { ...wh, isActive: !wh.isActive } : wh));
    };

    const handleAddHoliday = () => {
        setHolidays([...holidays, { name: '', date: '' }]);
    };

    const handleUpdateHoliday = (index, field, value) => {
        const newHolidays = [...holidays];
        newHolidays[index][field] = value;
        setHolidays(newHolidays);
    };

    const handleRemoveHoliday = (index) => {
        setHolidays(holidays.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('address', address);
            if (logoFile) formData.append('logo', logoFile);
            
            formData.append('workingHours', JSON.stringify(workingHours));
            formData.append('holidays', JSON.stringify(holidays));

            const response = await updateCompany(activeCompany, formData);
            
            // Sync global state if company data changed
            const updatedCompany = response.company || response;
            if (updatedCompany) {
                const updatedUser = { ...user };
                if (updatedUser.companies) {
                    updatedUser.companies = updatedUser.companies.map(c => 
                        c._id === activeCompany ? { ...c, ...updatedCompany } : c
                    );
                    updateUser(updatedUser);
                }

                // Update local state directly with returned data to avoid jarring re-fetch
                setName(updatedCompany.name || '');
                setEmail(updatedCompany.email || '');
                setPhone(updatedCompany.phone || '');
                setAddress(updatedCompany.address || '');
                if (updatedCompany.logo) {
                    const logoUrl = updatedCompany.logo.startsWith('http') ? updatedCompany.logo : getApiUrl() + updatedCompany.logo;
                    setLogoPreview(logoUrl);
                }
                
                if (updatedCompany.workingHours) {
                    const mergedHours = DEFAULT_DAYS.map(d => {
                        const existing = updatedCompany.workingHours.find(wh => wh.day === d);
                        return existing || { day: d, isActive: false, shift: { start: '10:00', end: '18:00' }, break: { start: '13:00', end: '14:00' } };
                    });
                    setWorkingHours(mergedHours);
                }
                
                if (updatedCompany.holidays) {
                    setHolidays(updatedCompany.holidays.map(h => ({ 
                        ...h, 
                        date: new Date(h.date).toISOString().split('T')[0] 
                    })));
                }
            }

            setLogoFile(null); // Clear pending file upload
            toast({ title: 'Company settings saved!', status: 'success', isClosable: true });
        } catch (error) {
            console.error('Save error:', error);
            toast({ title: error.response?.data?.message || 'Failed to save settings', status: 'error', isClosable: true });
        } finally {
            setSaving(false);
        }
    };

    const isOwner = user?.role === 'Company Owner' || user?.role?.name === 'Company Owner';
    
    if (!isOwner) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Text fontSize="xl" color="gray.500">You do not have permission to view Company Settings.</Text>
            </Flex>
        );
    }

    if (loading) return <Flex justify="center" align="center" h="100vh"><Spinner size="xl" /></Flex>;

    const currentDayConfig = workingHours.find(wh => wh.day === selectedDay);

    return (
        <Box p={6} maxW="1200px" mx="auto">
            {/* Header */}
            <Flex justify="space-between" align="flex-start" mb={8}>
                <Box>
                    <Flex align="center" mb={1}>
                        <Icon as={FiBriefcase} boxSize={6} mr={3} color="brand.600" />
                        <Text fontSize="2xl" fontWeight="bold" color="gray.800">Company Settings</Text>
                    </Flex>
                    <Text color="gray.500" fontSize="sm">Manage organization details, logo & working hours.</Text>
                </Box>
                <Button 
                    colorScheme="blue" 
                    leftIcon={<FiSave />} 
                    onClick={handleSave} 
                    isLoading={saving}
                    px={8}
                    borderRadius="md"
                    size="md"
                >
                    Save Changes
                </Button>
            </Flex>

            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
                
                {/* Left Column: General Info */}
                <GridItem>
                    <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
                        <Flex align="center" mb={6}>
                            <Icon as={FiBriefcase} color="gray.400" mr={2} />
                            <Text fontSize="lg" fontWeight="bold">General Info</Text>
                        </Flex>

                        {/* Logo Upload */}
                        <HStack spacing={6} mb={8} align="center">
                            <Box 
                                w="80px" h="80px" borderRadius="xl" border="1px dashed" borderColor="gray.300"
                                display="flex" alignItems="center" justify="center" overflow="hidden" bg="gray.50"
                            >
                                {logoPreview ? (
                                    <Image src={logoPreview} alt="Logo" objectFit="contain" w="full" h="full" />
                                ) : (
                                    <Icon as={FiImage} color="gray.400" boxSize={6} />
                                )}
                            </Box>
                            <Box>
                                <Text fontWeight="bold" fontSize="sm" mb={1}>Company Logo</Text>
                                <Text fontSize="xs" color="gray.500" mb={3}>PNG/JPG. Used in headers.</Text>
                                <input type="file" ref={fileInputRef} hidden accept="image/png, image/jpeg" onChange={handleLogoSelect} />
                                <Button size="sm" variant="outline" onClick={() => fileInputRef.current.click()}>
                                    Change
                                </Button>
                            </Box>
                        </HStack>

                        <VStack spacing={5}>
                            <FormControl>
                                <FormLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Company Name</FormLabel>
                                <Input value={name} onChange={(e) => setName(e.target.value)} bg="gray.50" />
                            </FormControl>

                            <HStack w="full" spacing={4}>
                                <FormControl>
                                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Email</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none"><Icon as={FiMail} color="gray.400" /></InputLeftElement>
                                        <Input value={email} onChange={(e) => setEmail(e.target.value)} bg="gray.50" />
                                    </InputGroup>
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Phone</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none"><Icon as={FiPhone} color="gray.400" /></InputLeftElement>
                                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} bg="gray.50" />
                                    </InputGroup>
                                </FormControl>
                            </HStack>

                            <FormControl>
                                <FormLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Full Address</FormLabel>
                                <InputGroup>
                                    <InputLeftElement pointerEvents="none"><Icon as={FiMapPin} color="gray.400" /></InputLeftElement>
                                    <Input value={address} onChange={(e) => setAddress(e.target.value)} bg="gray.50" />
                                </InputGroup>
                            </FormControl>
                        </VStack>
                    </Box>
                </GridItem>

                {/* Right Column: Working Hours & Holidays */}
                <GridItem>
                    <VStack spacing={6} align="stretch">
                        
                        {/* Working Hours */}
                        <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
                            <Flex align="center" mb={6}>
                                <Icon as={FiClock} color="gray.400" mr={2} />
                                <Text fontSize="lg" fontWeight="bold">Working Hours</Text>
                            </Flex>

                            {/* Day Selector */}
                            <HStack spacing={2} mb={6} overflowX="auto" pb={2}>
                                {DEFAULT_DAYS.map(day => {
                                    const isSelected = selectedDay === day;
                                    const isActive = workingHours.find(w => w.day === day)?.isActive;
                                    return (
                                        <Box 
                                            key={day}
                                            cursor="pointer"
                                            px={4} py={1}
                                            borderRadius="full"
                                            fontWeight="bold"
                                            fontSize="sm"
                                            bg={isSelected ? (isActive ? 'blue.50' : 'gray.100') : 'transparent'}
                                            color={isSelected ? (isActive ? 'blue.600' : 'gray.600') : (isActive ? 'gray.700' : 'gray.400')}
                                            onClick={() => setSelectedDay(day)}
                                            transition="all 0.2s"
                                        >
                                            {day}
                                        </Box>
                                    );
                                })}
                            </HStack>

                            <Flex align="center" justify="space-between" mb={4}>
                                <Text fontSize="sm" fontWeight="bold" color={currentDayConfig.isActive ? 'blue.600' : 'gray.500'}>
                                    {currentDayConfig.isActive ? 'Active Working Day' : 'Day Off / Weekend'}
                                </Text>
                                <Switch isChecked={currentDayConfig.isActive} onChange={toggleDayActive} colorScheme="blue" />
                            </Flex>

                            {currentDayConfig.isActive && (
                                <HStack spacing={6} align="flex-end">
                                    <Box flex="1">
                                        <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={2} textTransform="uppercase">Shift</Text>
                                        <HStack>
                                            <Input type="time" value={currentDayConfig.shift.start} onChange={(e) => handleWorkingHourChange('shift', 'start', e.target.value)} bg="gray.50" />
                                            <Input type="time" value={currentDayConfig.shift.end} onChange={(e) => handleWorkingHourChange('shift', 'end', e.target.value)} bg="gray.50" />
                                        </HStack>
                                    </Box>
                                    <Box flex="1">
                                        <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={2} textTransform="uppercase">Break</Text>
                                        <HStack>
                                            <Input type="time" value={currentDayConfig.break.start} onChange={(e) => handleWorkingHourChange('break', 'start', e.target.value)} bg="gray.50" />
                                            <Input type="time" value={currentDayConfig.break.end} onChange={(e) => handleWorkingHourChange('break', 'end', e.target.value)} bg="gray.50" />
                                        </HStack>
                                    </Box>
                                </HStack>
                            )}
                        </Box>

                        {/* Holidays */}
                        <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
                            <Flex align="center" justify="space-between" mb={6}>
                                <Flex align="center">
                                    <Icon as={FiCalendar} color="gray.400" mr={2} />
                                    <Text fontSize="lg" fontWeight="bold">Holidays</Text>
                                </Flex>
                                <IconButton icon={<FiPlus />} size="xs" colorScheme="blue" variant="ghost" onClick={handleAddHoliday} aria-label="Add Holiday" />
                            </Flex>

                            <VStack spacing={3} align="stretch" maxH="250px" overflowY="auto">
                                {holidays.length === 0 ? (
                                    <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>No holidays added yet.</Text>
                                ) : (
                                    holidays.map((holiday, idx) => (
                                        <HStack key={idx} spacing={3}>
                                            <Input 
                                                placeholder="Holiday Name (e.g. Christmas)" 
                                                value={holiday.name} 
                                                onChange={(e) => handleUpdateHoliday(idx, 'name', e.target.value)} 
                                                bg="gray.50" 
                                            />
                                            <Input 
                                                type="date" 
                                                w="180px"
                                                value={holiday.date} 
                                                onChange={(e) => handleUpdateHoliday(idx, 'date', e.target.value)} 
                                                bg="gray.50" 
                                            />
                                            <IconButton 
                                                icon={<FiTrash2 />} 
                                                variant="ghost" 
                                                colorScheme="red" 
                                                size="sm"
                                                onClick={() => handleRemoveHoliday(idx)}
                                                aria-label="Remove"
                                            />
                                        </HStack>
                                    ))
                                )}
                            </VStack>
                        </Box>
                    </VStack>
                </GridItem>
            </Grid>
        </Box>
    );
};

export default CompanySettings;
