import {
    Modal as ChakraModal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
} from '@chakra-ui/react';
import PropTypes from 'prop-types';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
    return (
        <ChakraModal isOpen={isOpen} onClose={onClose} size={size}>
            <ModalOverlay />
            <ModalContent>
                {title && <ModalHeader>{title}</ModalHeader>}
                <ModalCloseButton />
                <ModalBody>{children}</ModalBody>
                {footer && <ModalFooter>{footer}</ModalFooter>}
            </ModalContent>
        </ChakraModal>
    );
};

Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    footer: PropTypes.node,
    size: PropTypes.string,
};

export default Modal;
