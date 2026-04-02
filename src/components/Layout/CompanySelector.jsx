import React from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverHeader
} from '@chakra-ui/react';
import { FiBriefcase, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';

const CompanySelector = () => {
  const { user, activeCompany, switchCompany } = useAuth();
  
  const companies = user?.companies || [];
  const activeCompanyData = companies.find(c => c._id === activeCompany);

  if (companies.length <= 1 && activeCompanyData) {
      return (
        <Flex align="center" px={3} py={2}>
            <Flex align="center" justify="center" bg="brand.50" color="brand.500" p={2} borderRadius="md" mr={3}>
                <Icon as={FiBriefcase} boxSize={4} />
            </Flex>
            <Text fontWeight="bold" fontSize="sm" color="brand.600">
                {activeCompanyData.name}
            </Text>
        </Flex>
      );
  }

  return (
    <Popover placement="bottom-start">
      {({ isOpen, onClose }) => (
        <>
          <PopoverTrigger>
            <Flex
              align="center"
              cursor="pointer"
              px={3}
              py={2}
              borderRadius="md"
              bg={isOpen ? 'brand.50' : 'transparent'}
              _hover={{ bg: 'gray.50' }}
              transition="all 0.2s"
            >
              <Flex
                align="center"
                justify="center"
                bg="brand.50"
                color="brand.500"
                p={2}
                borderRadius="md"
                mr={3}
              >
                <Icon as={FiBriefcase} boxSize={4} />
              </Flex>

              <Box mr={2}>
                <Text
                  as="span"
                  fontWeight="bold"
                  fontSize="sm"
                  color="brand.600"
                >
                  {activeCompanyData ? activeCompanyData.name : 'Select Company'}
                </Text>
              </Box>

              <Icon
                as={isOpen ? FiChevronUp : FiChevronDown}
                boxSize={4}
                color="brand.500"
              />
            </Flex>
          </PopoverTrigger>

          <PopoverContent
            w="280px"
            border="none"
            borderRadius="xl"
            boxShadow="xl"
            overflow="hidden"
          >
            <PopoverHeader pt={4} pb={2} px={4} borderBottom="none">
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Your Companies
              </Text>
            </PopoverHeader>

            <PopoverBody p={0} maxH="300px" overflowY="auto">
              {companies.map(company => {
                const isActive = company._id === activeCompany;

                return (
                  <Box
                    key={company._id}
                    px={4}
                    py={3}
                    cursor="pointer"
                    bg={isActive ? 'brand.50' : 'transparent'}
                    borderLeft="4px solid"
                    borderColor={isActive ? 'brand.500' : 'transparent'}
                    _hover={{ bg: isActive ? 'brand.50' : 'gray.50' }}
                    onClick={() => {
                        if (!isActive) switchCompany(company._id);
                        onClose();
                    }}
                  >
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      color={isActive ? 'brand.600' : 'gray.800'}
                    >
                      {company.name}
                    </Text>
                  </Box>
                );
              })}
            </PopoverBody>
          </PopoverContent>
        </>
      )}
    </Popover>
  );
};

export default CompanySelector;
