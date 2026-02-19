import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Heading,
    VStack,
    HStack,
    Checkbox,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    FormControl,
    FormLabel,
    useToast,
    Spinner,
    Text
} from '@chakra-ui/react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { getPermissions } from '../../api/permission.api';

const RoleSchema = Yup.object().shape({
    name: Yup.string().required('Required'),
    status: Yup.string().required('Required'),
});

const RoleForm = ({ initialValues, onSubmit, title, isSubmitting: parentSubmitting }) => {
    const [permissionsList, setPermissionsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        const fetchPerms = async () => {
            try {
                const data = await getPermissions();
                console.log("permissions", data);

                setPermissionsList(data);
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to load permissions',
                    status: 'error',
                });
            } finally {
                setLoading(false);
            }
        };
        fetchPerms();
    }, [toast]);

    // Group permissions by module

    const actions = ['read', 'create', 'update', 'delete'];

    if (loading) return <Spinner />;

    return (
        <Box maxW="container.xl" mx="auto" mt={8}>
            <Heading mb={6} size="lg">{title}</Heading>
            <Box p={8} bg="white" borderRadius="md" shadow="sm">
                <Formik
                    initialValues={initialValues}
                    validationSchema={RoleSchema}
                    onSubmit={onSubmit}
                    enableReinitialize
                >
                    {({ values, setFieldValue, isSubmitting }) => (
                        <Form>
                            <VStack spacing={6} align="stretch">
                                <HStack spacing={4}>
                                    <Input name="name" label="Role Name" placeholder="e.g. Manager" />
                                    <Select
                                        name="status"
                                        label="Status"
                                        options={[
                                            { label: 'Active', value: 'Active' },
                                            { label: 'Inactive', value: 'Inactive' }
                                        ]}
                                    />
                                </HStack>

                                <Box>
                                    <Heading size="md" mb={4}>Permissions</Heading>
                                    <Table variant="simple" size="sm">
                                        <Thead bg="gray.50">
                                            <Tr>
                                                <Th>PERMISSION</Th>
                                                <Th textAlign="center">ALL</Th>
                                                <Th textAlign="center">READ</Th>
                                                <Th textAlign="center">CREATE</Th>
                                                <Th textAlign="center">UPDATE</Th>
                                                <Th textAlign="center">DELETE</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {permissionsList.map((group) => {
                                                const rowPermissionValues = actions.map(
                                                    action => `${group.value}-${action}`
                                                );

                                                return (
                                                    <Tr key={group.value}>
                                                        <Td fontWeight="bold" textTransform="capitalize">{group.name}</Td>
                                                        <Td textAlign="center">
                                                            <Checkbox
                                                                isChecked={rowPermissionValues.every(p =>
                                                                    values.permissions.includes(p)
                                                                )}

                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    let newPermissions = [...values.permissions];

                                                                    if (checked) {
                                                                        // add all
                                                                        rowPermissionValues.forEach(p => {
                                                                            if (!newPermissions.includes(p)) {
                                                                                newPermissions.push(p);
                                                                            }
                                                                        });
                                                                    } else {
                                                                        // remove all
                                                                        newPermissions = newPermissions.filter(
                                                                            p => !rowPermissionValues.includes(p)
                                                                        );
                                                                    }

                                                                    setFieldValue('permissions', newPermissions);
                                                                }}
                                                            />

                                                        </Td>
                                                        {actions.map(action => (
                                                            <Td key={action} textAlign="center">

                                                                <Checkbox
                                                                    value={`${group.value}-${action}`}
                                                                    isChecked={values.permissions.includes(`${group.value}-${action}`)}
                                                                    onChange={(e) => {
                                                                        console.log("e", e.target.value);
                                                                        if (e.target.checked) {
                                                                            setFieldValue('permissions', [...values.permissions, `${group.value}-${action}`]);
                                                                        } else {
                                                                            setFieldValue('permissions', values.permissions.filter(id => id !== `${group.value}-${action}`));
                                                                        }
                                                                    }}
                                                                />


                                                            </Td>
                                                        ))}
                                                    </Tr>
                                                );
                                            })}
                                        </Tbody>
                                    </Table>
                                </Box>

                                <HStack spacing={4} justify="flex-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                        isDisabled={isSubmitting || parentSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" isLoading={isSubmitting || parentSubmitting} colorScheme="brand">
                                        Save Role
                                    </Button>
                                </HStack>
                            </VStack>
                        </Form>
                    )}
                </Formik>
            </Box>
        </Box>
    );
};

export default RoleForm;
