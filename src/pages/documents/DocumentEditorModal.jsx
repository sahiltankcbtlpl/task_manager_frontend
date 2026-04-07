import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Heading, Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
    Input, useToast, VStack, Flex, Text, Switch, Badge, Box,
    IconButton, Divider, HStack,
    AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
    AlertDialogContent, AlertDialogOverlay
} from '@chakra-ui/react';
import {
    FiSave, FiCheck, FiRefreshCw, FiAlertCircle,
    FiEdit2, FiTrash2, FiDownload
} from 'react-icons/fi';
import {
    createDocument, updateDocument, autosaveDocument,
    requestAccess, getDocumentPages, syncDocumentPages
} from '../../api/document.api';
import { updateProfile } from '../../api/auth.api';
import { useProject } from '../../context/ProjectContext';
import { getProjectMembers } from '../../api/project.api';
import useAuth from '../../hooks/useAuth';
import Select from 'react-select';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    DecoupledEditor,
    AccessibilityHelp,
    Alignment,
    AutoLink,
    Autosave,
    BlockQuote,
    Bold,
    CloudServices,
    Essentials,
    FontSize,
    FontColor,
    FontBackgroundColor,
    Heading as CKEditorHeading,
    Image as CKEditorImage,
    ImageCaption,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    Indent,
    IndentBlock,
    Italic,
    Link as CKEditorLink,
    List,
    ListProperties,
    Paragraph,
    SelectAll,
    Strikethrough,
    Subscript,
    Superscript,
    Table,
    TableCaption,
    TableProperties,
    TableToolbar,
    TextTransformation,
    TodoList,
    Underline,
    Undo
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import html2pdf from 'html2pdf.js';



// ─── Global styles injected once ─────────────────────────────────────────────
const EDITOR_STYLES = `
/* ── Sticky toolbar wrapper ────────────────────────────── */
#ck-toolbar-wrapper .ck.ck-toolbar {
    border: none !important;
    border-radius: 0 !important;
    background: #ffffff !important;
    padding: 4px 8px !important;
    box-shadow: none !important;
}
#ck-toolbar-wrapper .ck.ck-toolbar .ck-toolbar__items {
    flex-wrap: wrap !important;
}

/* ── A4 document canvas ─────────────────────────────────── */
.docx-editor .ck.ck-editor__editable {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm;
    margin: 24px auto;
    background: transparent;
    box-shadow: none;
    box-sizing: border-box;
    overflow: hidden;
}
.docx-editor {
    position: relative;
    --page-gap: 24px;
}
.docx-editor .page-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--page-gap);
    padding: var(--page-gap) 0;
    pointer-events: none;
    z-index: 0;
}
.docx-editor .page-sheet {
    width: 210mm;
    height: 297mm;
    background: #ffffff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border: 1px solid #e2e8f0;
    box-sizing: border-box;
}
.docx-editor .ck.ck-editor__editable {
    position: relative;
    z-index: 1;
}

/* ── Plain text editor ──────────────────────────────────── */
.txt-editor .ck.ck-editor__editable {
    min-height: calc(100vh - 180px) !important;
    padding: 24px 32px !important;
    outline: none !important;
    background: #ffffff !important;
    border: none !important;
}

/* ── Page break element (CKEditor built-in PageBreak plugin) */
.ck.ck-editor__editable .page-break {
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
    pointer-events: auto !important;
    user-select: none !important;
    cursor: default !important;
    page-break-after: always !important;
    break-after: page !important;
    /* height is controlled dynamically by the pagination engine */
    min-height: var(--page-gap) !important;
}
/* Hide default CKEditor page-break dashed label */
.ck.ck-editor__editable .page-break .page-break__label {
    display: none !important;
}

/* ── Typography ────────────────────────────────────────── */
.ck-content h1 { font-size: 2.5rem !important; font-weight: 700 !important; line-height: 1.2 !important; margin: 0 0 0.75rem !important; }
.ck-content h2 { font-size: 2rem   !important; font-weight: 700 !important; line-height: 1.3 !important; margin: 0 0 0.5rem  !important; }
.ck-content h3 { font-size: 1.5rem !important; font-weight: 600 !important; line-height: 1.4 !important; margin: 0 0 0.5rem  !important; }
.ck-content p  { margin: 0 0 0.75em !important; line-height: 1.6 !important; font-size: 11pt !important; }
.ck-content ul, .ck-content ol { padding-left: 2.5em !important; margin-bottom: 0.75em !important; }
.ck-content li { line-height: 1.6 !important; margin-bottom: 0.2em !important; }
.ck-content table { border-collapse: collapse !important; width: 100% !important; margin-bottom: 1em !important; }
.ck-content td, .ck-content th { border: 1px solid #ccc !important; padding: 6px 10px !important; }
.ck-content th { background: #f7fafc !important; font-weight: 600 !important; }
.ck-content blockquote { border-left: 3px solid #cbd5e0 !important; padding: 0.5em 1em !important; margin: 0 0 0.75em !important; font-style: italic !important; color: #4a5568 !important; }
.ck-content a { color: #3182ce !important; text-decoration: underline !important; }

/* ── Editor scrollbar ──────────────────────────────────── */
.editor-scroll-area::-webkit-scrollbar { width: 8px; height: 8px; }
.editor-scroll-area::-webkit-scrollbar-track { background: transparent; }
.editor-scroll-area::-webkit-scrollbar-thumb { background: #bec3cc; border-radius: 4px; }
.editor-scroll-area::-webkit-scrollbar-thumb:hover { background: #8a909e; }

/* ── Utility ────────────────────────────────────────────── */
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; display: inline-block; }
`;

const PAGE_RATIO = 297 / 210; // A4 height/width ratio
const PAGINATION_DEBOUNCE_MS = 200;
const ENTER_PAGE_BREAK_THRESHOLD_PX = 24;
const PAGE_GAP_PX = 24;

// ─── Component ───────────────────────────────────────────────────────────────
const DocumentEditorModal = ({ isOpen, onClose, onSuccess, document = null, readOnly = false }) => {
    const [name, setName] = useState('Untitled.txt');
    const [description, setDescription] = useState('Text document');
    const [content, setContent] = useState('');
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savingStatus, setSavingStatus] = useState('idle'); // idle | saving | saved | unsaved
    const [isEditingName, setIsEditingName] = useState(false);
    const [memberOptions, setMemberOptions] = useState([]);
    const [currentDoc, setCurrentDoc] = useState(document);
    const [pageCount, setPageCount] = useState(1);

    const { activeProjectId } = useProject();
    const { user: currentUser, updateUser: updateAuthUser, activeCompany } = useAuth();
    const toast = useToast();

    // Confirmation dialog state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const cancelRef = useRef();

    // Refs for pagination (avoids stale closures in callbacks)

    const isDocxRef = useRef(false);
    const editorRef = useRef(null);
    const toolbarWrapperRef = useRef(null);
    const isPaginatingRef = useRef(false); // prevent infinite loop
    const paginateTimer = useRef(null);

    useEffect(() => {
        return () => clearTimeout(paginateTimer.current);
    }, []);

    const isDocx = name.toLowerCase().endsWith('.docx');
    isDocxRef.current = isDocx; // always up-to-date in callbacks

    const getPageMetrics = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) return null;

        const editable = editor.ui.view.editable.element;
        if (!editable) return null;

        const rect = editable.getBoundingClientRect();
        const styles = window.getComputedStyle(editable);

        const paddingTop = parseFloat(styles.paddingTop) || 0;
        const paddingBottom = parseFloat(styles.paddingBottom) || 0;
        const pageHeight = rect.width * PAGE_RATIO || 1122;
        const contentHeight = Math.max(1, pageHeight - paddingTop - paddingBottom);
        const contentTop = rect.top + paddingTop;

        return {
            editor,
            editable,
            rect,
            pageHeight,
            contentHeight,
            contentTop,
            paddingTop,
            paddingBottom,
        };
    }, []);

    const applyPageBreakHeights = useCallback(() => {
        if (!isDocxRef.current) return;

        const metrics = getPageMetrics();
        if (!metrics) return;

        const { editable, pageHeight, paddingTop } = metrics;
        const children = Array.from(editable.children);
        const pageStride = pageHeight + PAGE_GAP_PX;

        children.forEach(child => {
            if (!child.classList?.contains('page-break')) return;

            const offsetInContent = Math.max(0, child.offsetTop - paddingTop);
            const mod = offsetInContent % pageStride;
            let remaining = (pageStride - mod) % pageStride;
            if (remaining === 0) remaining = pageStride;
            child.style.height = `${remaining}px`;
        });
    }, [getPageMetrics]);

    const insertPageBreakAtSelection = useCallback((editor, { auto = false, withParagraph = false } = {}) => {
        if (!editor) return;
        if (!editor.model.schema.isRegistered('pageBreak')) return;

        editor.model.change(writer => {
            const selection = editor.model.document.selection;
            const root = editor.model.document.getRoot();

            let position = selection.getFirstPosition();
            if (!position) {
                position = writer.createPositionAt(root, 'end');
            }

            const nodeBefore = position?.nodeBefore;
            if (nodeBefore?.name === 'pageBreak') return;

            const attrs = auto ? { 'data-auto': 'true' } : undefined;
            const pageBreak = writer.createElement('pageBreak', attrs);
            editor.model.insertContent(pageBreak, position);

            if (withParagraph) {
                const paragraph = writer.createElement('paragraph');
                const after = writer.createPositionAfter(pageBreak);
                writer.insert(paragraph, after);
                writer.setSelection(paragraph, 'in');
            }
        });
    }, []);

    const isCaretNearPageBottom = useCallback(() => {
        const metrics = getPageMetrics();
        if (!metrics) return false;

        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return false;

        const range = selection.getRangeAt(0);
        if (!range.collapsed) return false;

        const rect = range.getClientRects()[0] || range.getBoundingClientRect();
        if (!rect || rect.height === 0) return false;

        const offset = rect.bottom - metrics.contentTop;
        if (offset < 0) return false;

        const pageIndex = Math.floor(offset / metrics.contentHeight);
        const pageBottom = metrics.contentTop + (pageIndex + 1) * metrics.contentHeight;

        return pageBottom - rect.bottom <= ENTER_PAGE_BREAK_THRESHOLD_PX;
    }, [getPageMetrics]);

    // ── Load document ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;

        if (document) {
            setName(document.name || 'Untitled.txt');
            setDescription(document.description || (document.name?.toLowerCase().endsWith('.docx') ? 'Doc document' : 'Text document'));
            setPermissions(document.permissions || []);
            setCurrentDoc(document);
            setSavingStatus(document._id ? 'saved' : 'idle');

            if (document._id && document.name?.toLowerCase().endsWith('.docx')) {
                getDocumentPages(document._id)
                    .then(pages => {
                        if (pages?.length) {
                            const full = pages
                                .sort((a, b) => a.pageNo - b.pageNo)
                                .map(p => p.pageContent)
                                .join('');
                            setContent(full);
                        } else {
                            setContent(document.content || '');
                        }
                    });
            } else {
                setContent(document.content || '');
            }
        } else {
            setName('Untitled.txt');
            setDescription('Text document');
            setContent('');
            setPermissions([]);
            setCurrentDoc(null);
            setSavingStatus('idle');
        }
    }, [isOpen, document]);// eslint-disable-line react-hooks/exhaustive-deps

    const fetchMembers = async () => {
        try {
            const members = await getProjectMembers(activeProjectId);
            setMemberOptions(
                members
                    .filter(m =>
                        m._id !== currentUser?._id &&
                        m._id !== document?.owner?._id &&
                        m._id !== document?.owner
                    )
                    .map(m => ({ value: m._id, label: m.name }))
            );
        } catch (err) {
            console.error('Failed to fetch project members', err);
        }
    };

    useEffect(() => {
        if (isOpen && activeProjectId) {
            fetchMembers();
        }
    }, [isOpen, activeProjectId]);

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async (isAuto = false) => {
        if (!name.trim()) {
            toast({ title: 'Document name is required', status: 'error' });
            return;
        }

        // Prevent double saving
        if (savingStatus === 'saving') return;

        try {
            if (!isAuto) {
                setLoading(true);
                setSavingStatus('saving');
            }

            let savedDoc = currentDoc;

            const docPayload = {
                name,
                content: isDocxRef.current ? '' : content,
                permissions,
            };

            if (currentDoc?._id) {
                savedDoc = isAuto
                    ? await autosaveDocument(currentDoc._id, { ...docPayload, description })
                    : await updateDocument(currentDoc._id, { ...docPayload, description });
            } else {
                savedDoc = await createDocument({
                    project: activeProjectId,
                    ...docPayload,
                    description,
                    isEditorDocument: true,
                });
            }

            setCurrentDoc(savedDoc);

            if (isDocxRef.current && savedDoc._id) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');

                const pages = [];
                let currentPage = [];

                Array.from(doc.body.childNodes).forEach(node => {
                    if (
                        node.nodeType === 1 &&
                        node.classList?.contains('page-break')
                    ) {
                        pages.push(currentPage.join(''));
                        currentPage = [];
                    } else {
                        currentPage.push(node.outerHTML || node.textContent);
                    }
                });

                if (currentPage.length) pages.push(currentPage.join(''));

                await syncDocumentPages(savedDoc._id, pages);
            }

            setSavingStatus('saved');
            if (!isAuto) {
                toast({ title: 'Document saved', status: 'success' });
            }
        } catch (error) {
            console.error('Save failed:', error);
            setSavingStatus('unsaved');

            if (!isAuto) {
                toast({
                    title: 'Save failed',
                    description:
                        error.response?.data?.message ||
                        'Check your connection or permissions',
                    status: 'error',
                });
            }
        } finally {
            if (!isAuto) setLoading(false);
        }
    };

    // ── Autosave ──────────────────────────────────────────────────────────────
    const autosaveTimer = useRef(null);

    useEffect(() => {
        if (!currentUser?.autosavePreference || savingStatus !== 'unsaved') return;

        clearTimeout(autosaveTimer.current);

        autosaveTimer.current = setTimeout(() => {
            handleSave(true);
        }, 2000);

        return () => clearTimeout(autosaveTimer.current);
    }, [name, content, permissions]);
    // ── Request edit access ───────────────────────────────────────────────────
    const handleRequestEditAccess = async () => {
        try {
            setLoading(true);
            const updatedDoc = await requestAccess(currentDoc?._id, 'edit');
            setCurrentDoc(updatedDoc);
            toast({ title: 'Edit access request sent', status: 'success' });
        } catch (err) {
            toast({
                title: 'Request failed',
                description: err.response?.data?.message || 'Could not send request',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };



    // ── Content / name change helpers ────────────────────────────────────────
    const handleContentChange = (newContent) => {
        setContent(newContent);
        if (savingStatus === 'saved' || savingStatus === 'idle') {
            setSavingStatus('unsaved');
        }

        if (isDocxRef.current && !isPaginatingRef.current) {
            clearTimeout(paginateTimer.current);
            paginateTimer.current = setTimeout(() => autoPaginate(), PAGINATION_DEBOUNCE_MS);
        }
    };

    const handleNameChange = (newName) => {
        const currentExt = name.toLowerCase().endsWith('.docx') ? '.docx' : '.txt';
        let updated = newName;
        if (!updated.toLowerCase().endsWith(currentExt)) {
            const dot = updated.lastIndexOf('.');
            updated = dot !== -1 && updated.length - dot <= 5
                ? updated.substring(0, dot) + currentExt
                : updated + currentExt;
        }
        setName(updated);

        // Auto-update description if it's the default one
        const isCurrentlyDocx = name.toLowerCase().endsWith('.docx');
        const isUpdatedDocx = updated.toLowerCase().endsWith('.docx');
        if (description === (isCurrentlyDocx ? 'Doc document' : 'Text document') || description === 'Text document' || description === 'Doc document') {
            setDescription(isUpdatedDocx ? 'Doc document' : 'Text document');
        }

        if (savingStatus === 'saved' || savingStatus === 'idle') setSavingStatus('unsaved');
    };

    const handleAddPermission = (userId, access) => {
        if (permissions.some(p => p.user === userId)) return;
        setPermissions(prev => [...prev, { user: userId, access }]);
        setSavingStatus('unsaved');
    };

    const handleRemovePermission = (userId) => {
        setPermissions(prev => prev.filter(p => p.user !== userId));
        setSavingStatus('unsaved');
    };

    // ── Helper to convert image to base64 ───────────────────────────────────
    const getBase64Image = async (url) => {
        try {
            const response = await fetch(url, {
                headers: {
                    'X-Tunnel-Skip-AntiPhish': 'true'
                }
            });
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            const blob = await response.blob();
            
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (err) {
            console.error('Logo fetch error:', err);
            return null;
        }
    };

    // ── Export PDF ────────────────────────────────────────────────────────────
    const handleExportPDF = async () => {
        const el = window.document.querySelector('.ck-content');
        if (!el) {
            toast({ title: 'Could not find document content', status: 'error' });
            return;
        }

        const origFilter = el.style.filter;
        const origBg = el.style.background;
        el.style.filter = 'none';
        el.style.background = 'white';

        const lists = Array.from(el.querySelectorAll('ul, ol'));
        const origListStyles = lists.map((l) => l.style.cssText);
        lists.forEach((l) => {
            l.style.marginLeft = '20px';
            l.style.paddingLeft = '40px';
        });

        // Get company logo
        let logoBase64 = null;
        // console.log('Building logo URL. activeCompany:', activeCompany);
        // console.log('currentUser companies:', currentUser?.companies);

        const targetCompanyId = currentDoc?.company || activeCompany;
        const companyData = currentUser?.companies?.find((c) => compareIds(c._id, targetCompanyId));
        // console.log('Target companyData:', companyData);

        if (companyData?.logo) {
            try {
                let logoUrl = companyData.logo;
                if (!logoUrl.startsWith('http')) {
                    const { hostname, host, protocol } = window.location;
                    let apiBase = '';

                    // 1. If we are on localhost, always use local backend to avoid CORS/Tunnel issues
                    if (hostname === 'localhost' || hostname === '127.0.0.1') {
                        apiBase = 'http://localhost:5000';
                    } 
                    // 2. If no VITE_API_URL but on Dev Tunnel, resolve port dynamically
                    else if (hostname.includes('devtunnels.ms')) {
                        const backendHost = host.replace(/-(?:\d+)(\.inc1\.devtunnels\.ms)/, '-5000$1');
                        apiBase = `${protocol}//${backendHost}`;
                    }
                    // 3. Fallback to VITE_API_URL
                    else if (import.meta.env.VITE_API_URL) {
                        apiBase = import.meta.env.VITE_API_URL.replace(/\/api$/, '');
                    }
                    // 4. Ultimate fallback
                    else {
                        apiBase = window.location.origin;
                    }

                    logoUrl = `${apiBase}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
                }
                console.log('Final Logo URL:', logoUrl);
                logoBase64 = await getBase64Image(logoUrl);
            } catch (err) {
                console.error('Failed to resolve company logo:', err);
            }
        }

        const opt = {
            margin: [25, 15, 15, 15],
            filename: name.replace(/\.[^/.]+$/, '') + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] },
        };

        const restore = () => {
            el.style.filter = origFilter;
            el.style.background = origBg;
            lists.forEach((l, i) => {
                l.style.cssText = origListStyles[i];
            });
        };

        try {
            // Start the worker chain
            let worker = html2pdf().set(opt).from(el).toPdf();

            // Add the logo to every page if it exists
            if (logoBase64) {
                worker = worker.get('pdf').then((pdf) => {
                    const totalPages = pdf.internal.getNumberOfPages();
                    for (let i = 1; i <= totalPages; i++) {
                        pdf.setPage(i);
                        // Add logo at top-left (x=15mm, y=8mm, width=30mm)
                        try {
                            pdf.addImage(logoBase64, 'PNG', 15, 8, 30, 0);
                        } catch (imgErr) {
                            console.warn(`Failed to add logo to page ${i}:`, imgErr);
                        }
                    }
                });
            }

            // Execute the chain and save
            await worker.save();
        } catch (err) {
            console.error('PDF Export Error:', err);
            toast({ title: 'PDF export failed', status: 'error' });
        } finally {
            restore();
        }
    };

    // ── Export TXT ────────────────────────────────────────────────────────────
    const handleExportTxt = () => {
        if (!content) {
            toast({ title: 'Document is empty', status: 'warning' });
            return;
        }

        // Basic HTML to plain text conversion
        // 1. Replace block elements with newlines
        let text = content
            .replace(/<\/p>/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/h[1-6]>/gi, '\n\n')
            .replace(/<li>/gi, '• ')
            .replace(/<\/li>/gi, '\n');

        // 2. Strip all remaining HTML tags
        text = text.replace(/<[^>]*>/g, '');

        // 3. Decode common HTML entities
        const entities = {
            '&nbsp;': ' ',
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'"
        };
        Object.entries(entities).forEach(([entity, val]) => {
            text = text.replace(new RegExp(entity, 'g'), val);
        });

        const blob = new Blob([text.trim()], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = name || 'document.txt';
        a.click();
        URL.revokeObjectURL(url);

        toast({ title: 'Text file downloaded', status: 'success' });
    };

    // ── Close ─────────────────────────────────────────────────────────────────
    const handleClose = async () => {
        if (savingStatus === 'unsaved' && !readOnly) {
            if (currentUser?.autosavePreference) {
                await handleSave(true);
                onClose();
            } else {
                setIsConfirmOpen(true);
            }
        } else {
            onClose();
        }
    };

    // ── Permission helpers ────────────────────────────────────────────────────
    const compareIds = (id1, id2) => {
        if (!id1 || !id2) return false;
        const s = v => String(typeof v === 'object' ? v?._id ?? v : v);
        return s(id1) === s(id2);
    };

    const isOwner = !currentDoc?._id || compareIds(currentDoc.owner, currentUser);
    const hasEditPermission = currentDoc?.permissions?.some(
        p => compareIds(p.user, currentUser) && p.access === 'edit'
    );
    const isSuperAdmin =
        currentUser?.role === 'Super Admin' || currentUser?.role?.name === 'Super Admin';
    const canEdit = (isOwner || hasEditPermission || isSuperAdmin) && !readOnly;

    const hasPendingEditRequest = currentDoc?.reviewRequests?.some(
        r =>
            compareIds(r.requestedBy, currentUser) &&
            r.requestType === 'edit' &&
            r.status === 'pending'
    );

    // ── CKEditor onReady ──────────────────────────────────────────────────────
    const handleEditorReady = (editor) => {
        editorRef.current = editor;

        // Ensure pageBreak exists (fallback if build doesn't include plugin)
        if (!editor.model.schema.isRegistered('pageBreak')) {
            editor.model.schema.register('pageBreak', {
                allowWhere: '$block',
                isBlock: true,
                isObject: true,
            });

            editor.conversion.for('upcast').elementToElement({
                view: { name: 'div', classes: 'page-break' },
                model: 'pageBreak',
            });

            editor.conversion.for('dataDowncast').elementToElement({
                model: 'pageBreak',
                view: (modelElement, { writer }) => writer.createEmptyElement('div', { class: 'page-break' }),
            });

            editor.conversion.for('editingDowncast').elementToElement({
                model: 'pageBreak',
                view: (modelElement, { writer }) => {
                    const viewElement = writer.createEmptyElement('div', {
                        class: 'page-break',
                        contenteditable: 'false',
                    });
                    return viewElement;
                },
            });
        }

        // Allow auto-pagination to tag breaks without affecting manual ones
        editor.model.schema.extend('pageBreak', { allowAttributes: ['data-auto'] });
        editor.conversion.attributeToAttribute({ model: 'data-auto', view: 'data-auto' });

        // 1. Mark as ready
        editorRef.current = editor;

        // 2. Initial Toolbar Movement (Robustness)
        const toolbar = editor.ui.view.toolbar.element;
        const wrapper = toolbarWrapperRef.current;
        if (wrapper && toolbar && !wrapper.contains(toolbar)) {
            wrapper.innerHTML = '';
            wrapper.appendChild(toolbar);
        }

        const schedulePaginate = (delay = 0) => {
            clearTimeout(paginateTimer.current);
            paginateTimer.current = setTimeout(() => autoPaginate(), delay);
        };

        // 2. Shift+Enter → Page Break
        editor.keystrokes.set('Shift+Enter', (data, cancel) => {
            if (isDocxRef.current) {
                insertPageBreakAtSelection(editor, { withParagraph: true });
                schedulePaginate();
                cancel();
            }
        }, { priority: 'high' });

        // 3. Enter near page bottom → Page Break
        editor.keystrokes.set('Enter', (data, cancel) => {
            if (!isDocxRef.current) return;
            if (isCaretNearPageBottom()) {
                insertPageBreakAtSelection(editor, { auto: true, withParagraph: true });
                schedulePaginate();
                cancel();
            }
        }, { priority: 'high' });

        const paginateOnChange = () => {
            if (!isDocxRef.current) return;
            if (isPaginatingRef.current) return;
            schedulePaginate(PAGINATION_DEBOUNCE_MS);
        };

        // 4. Auto scroll + selection normalization
        const selectionHandler = () => {
            const selection = editor.model.document.selection;
            const selectedElement = selection.getSelectedElement();
            const position = selection.getFirstPosition();

            if (selectedElement?.name === 'pageBreak' || position?.parent?.name === 'pageBreak') {
                editor.model.change(writer => {
                    const target = selectedElement
                        ? writer.createPositionAfter(selectedElement)
                        : writer.createPositionAfter(position.parent);
                    writer.setSelection(target);
                });
            }

            requestAnimationFrame(() => {
                const area = window.document.querySelector('.editor-scroll-area');
                if (!area) return;

                const sel = window.getSelection();
                if (!sel || !sel.rangeCount) return;

                const rect = sel.getRangeAt(0).getBoundingClientRect();
                const aRect = area.getBoundingClientRect();
                const MARGIN = 60;

                if (rect.bottom > aRect.bottom - MARGIN) {
                    area.scrollTop += rect.bottom - (aRect.bottom - MARGIN);
                } else if (rect.top < aRect.top + MARGIN) {
                    area.scrollTop -= (aRect.top + MARGIN) - rect.top;
                }
            });
        };

        editor.editing.view.document.on('selectionChange', selectionHandler);
        editor.model.document.on('change:data', paginateOnChange);

        // cleanup
        editor.on('destroy', () => {
            editor.editing.view.document.off('selectionChange', selectionHandler);
            editor.model.document.off('change:data', paginateOnChange);
        });

        // Initial pagination pass
        if (!isPaginatingRef.current) {
            schedulePaginate(PAGINATION_DEBOUNCE_MS);
        }
    };

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        if (!canEdit) {
            editor.enableReadOnlyMode('view');
        } else {
            editor.disableReadOnlyMode('view');
            
            // Re-ensure toolbar is in place when switching to edit mode
            const toolbar = editor.ui.view.toolbar.element;
            const wrapper = toolbarWrapperRef.current;
            if (wrapper && toolbar && !wrapper.contains(toolbar)) {
                wrapper.innerHTML = '';
                wrapper.appendChild(toolbar);
            }
        }
    }, [canEdit, isOpen]);

    const autoPaginate = useCallback(() => {
        if (!isDocxRef.current) return;
        if (!editorRef.current) return;
        if (isPaginatingRef.current) return;
        if (!editorRef.current.model.schema.isRegistered('pageBreak')) return;

        const metrics = getPageMetrics();
        if (!metrics) return;

        const editor = editorRef.current;

        isPaginatingRef.current = true;

        try {
            editor.model.change(writer => {
                const root = editor.model.document.getRoot();

                const removeAutoBreaks = (element) => {
                    for (const child of Array.from(element.getChildren())) {
                        if (child.name === 'pageBreak' && child.getAttribute('data-auto')) {
                            writer.remove(child);
                        } else if (child.is('element')) {
                            removeAutoBreaks(child);
                        }
                    }
                };

                removeAutoBreaks(root);
            });
        } catch (err) {
            console.error('Pagination error:', err);
            isPaginatingRef.current = false;
            return;
        }

        requestAnimationFrame(() => {
            const refreshed = getPageMetrics();
            if (!refreshed) {
                isPaginatingRef.current = false;
                return;
            }

            const { editable, contentHeight, paddingTop, pageHeight } = refreshed;
            const children = Array.from(editable.children);
            const breakPoints = [];
            const pageStride = pageHeight + PAGE_GAP_PX;
            let pageLimit = contentHeight;

            children.forEach(child => {
                if (!child) return;

                if (child.classList?.contains('page-break')) {
                    const breakTop = child.offsetTop - paddingTop;
                    while (breakTop > pageLimit) {
                        pageLimit += pageStride;
                    }
                    pageLimit += pageStride;
                    return;
                }

                const bottom = child.offsetTop + child.offsetHeight - paddingTop;

                if (bottom > pageLimit) {
                    breakPoints.push(child);
                    pageLimit += pageStride;
                    while (bottom > pageLimit) {
                        pageLimit += pageStride;
                    }
                }
            });

            if (breakPoints.length) {
                editor.model.change(writer => {
                    breakPoints.forEach(domNode => {
                        const viewElem = editor.editing.view.domConverter.domToView(domNode);
                        if (!viewElem) return;

                        const modelElem = editor.editing.mapper.toModelElement(viewElem);
                        if (!modelElem) return;

                        if (modelElem.previousSibling?.name === 'pageBreak') return;

                        const position = writer.createPositionBefore(modelElem);
                        if (!position) return;

                        const pageBreak = writer.createElement('pageBreak', { 'data-auto': 'true' });
                        writer.insert(pageBreak, position);
                    });
                });
            }

            requestAnimationFrame(() => {
                applyPageBreakHeights();
                const refreshedMetrics = getPageMetrics();
                if (refreshedMetrics) {
                    const total = Math.max(
                        1,
                        refreshedMetrics.editable.scrollHeight -
                        refreshedMetrics.paddingTop -
                        refreshedMetrics.paddingBottom
                    );
                    const pages = Math.max(1, Math.ceil(total / pageStride));
                    setPageCount(pages);
                }
                isPaginatingRef.current = false;
            });
        });
    }, [applyPageBreakHeights, getPageMetrics]);

    useEffect(() => {
        if (!isDocx || !editorRef.current) return;
        clearTimeout(paginateTimer.current);
        paginateTimer.current = setTimeout(() => autoPaginate(), PAGINATION_DEBOUNCE_MS);
        return () => clearTimeout(paginateTimer.current);
    }, [autoPaginate, content, isDocx]);

    useEffect(() => {
        if (!isDocx) setPageCount(1);
    }, [isDocx]);

    useEffect(() => {
        const handleResize = () => {
            if (!isDocxRef.current) return;
            clearTimeout(paginateTimer.current);
            paginateTimer.current = setTimeout(() => autoPaginate(), PAGINATION_DEBOUNCE_MS);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [autoPaginate]);

    // ── CKEditor config (stable object — no deps on state) ───────────────────
    const hasPlugin = (pluginName) =>
        Array.isArray(DecoupledEditor.builtinPlugins)
            ? DecoupledEditor.builtinPlugins.some(
                plugin => plugin?.pluginName === pluginName
            )
            : false;

    const hasPageBreakButton = Array.isArray(DecoupledEditor.builtinPlugins)
        ? DecoupledEditor.builtinPlugins.some(
            plugin => plugin?.pluginName === 'PageBreak'
        )
        : false;

    const editorConfig = {
        licenseKey: 'GPL',
        plugins: [
            AccessibilityHelp,
            Alignment,
            AutoLink,
            Autosave,
            BlockQuote,
            Bold,
            CloudServices,
            Essentials,
            FontSize,
            FontColor,
            FontBackgroundColor,
            CKEditorHeading,
            CKEditorImage,
            ImageCaption,
            ImageStyle,
            ImageToolbar,
            ImageUpload,
            Indent,
            IndentBlock,
            Italic,
            CKEditorLink,
            List,
            ListProperties,
            Paragraph,
            SelectAll,
            Strikethrough,
            Subscript,
            Superscript,
            Table,
            TableCaption,
            TableProperties,
            TableToolbar,
            TextTransformation,
            TodoList,
            Underline,
            Undo
        ],
        placeholder: 'Start typing your document here...',
        toolbar: {
            items: [
                'heading', '|',
                'fontSize', 'fontColor', 'fontBackgroundColor', '|',
                'bold', 'italic', 'underline', 'strikethrough',
                ...(hasPlugin('Subscript') ? ['subscript'] : []),
                ...(hasPlugin('Superscript') ? ['superscript'] : []),
                '|',
                'link', 'insertTable', 'blockQuote', '|',
                'bulletedList', 'numberedList',
                ...(hasPlugin('TodoList') ? ['todoList'] : []),
                '|',
                'outdent', 'indent', 'alignment', '|',
                ...(hasPageBreakButton ? ['pageBreak', '|'] : []),
                'undo', 'redo',
            ],
            shouldNotGroupWhenFull: true,
        },
        heading: {
            options: [
                { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
            ],
        },
        fontSize: {
            options: [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72],
            supportAllValues: true,
        },
        table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
        },
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <Modal isOpen={isOpen} onClose={handleClose} size="full">
                {/* Inject global styles once */}
                <style>{EDITOR_STYLES}</style>

            <ModalOverlay />

            {/*
             * ModalContent is forced to be a flex-column so we can stack:
             *   ModalHeader  →  sticky toolbar  →  flex-row content
             * without any of the upper elements scrolling away.
             */}
            <ModalContent
                display="flex"
                flexDirection="column"
                h="100vh"
                maxH="100vh"
                m={0}
                maxW="100%"
                borderRadius={0}
                overflow="hidden"
            >
                {/* ── Document Header ─────────────────────────────────────── */}
                <ModalHeader borderBottomWidth="1px" py={2} px={4} flexShrink={0}>
                    <Flex justify="space-between" align="center" pr={10}>
                        {/* Left: name + save status */}
                        <HStack spacing={4}>
                            {isEditingName ? (
                                <Input
                                    value={name}
                                    onChange={e => handleNameChange(e.target.value)}
                                    onBlur={() => setIsEditingName(false)}
                                    autoFocus
                                    size="sm"
                                    maxW="300px"
                                    fontWeight="700"
                                />
                            ) : (
                                <HStack
                                    spacing={2}
                                    onClick={() => canEdit && setIsEditingName(true)}
                                    cursor={canEdit ? 'pointer' : 'default'}
                                >
                                    <Heading size="md">{name}</Heading>
                                    {canEdit && <FiEdit2 size={12} color="gray" />}
                                </HStack>
                            )}
                            <Box>
                                {!readOnly && savingStatus === 'saving' && (
                                    <Badge colorScheme="blue">
                                        <FiRefreshCw className="spin" style={{ display: 'inline', marginRight: 4 }} />
                                        Saving...
                                    </Badge>
                                )}
                                {!readOnly && savingStatus === 'saved' && (
                                    <Badge colorScheme="green">
                                        <FiCheck style={{ display: 'inline', marginRight: 4 }} />
                                        Saved
                                    </Badge>
                                )}
                                {!readOnly && savingStatus === 'unsaved' && (
                                    <Badge colorScheme="orange">
                                        <FiAlertCircle style={{ display: 'inline', marginRight: 4 }} />
                                        Unsaved changes
                                    </Badge>
                                )}
                            </Box>
                        </HStack>

                        {/* Right: controls */}
                        <HStack spacing={6}>
                            {canEdit && (
                                <HStack spacing={2} minW="120px">
                                    <Text fontSize="sm" fontWeight="medium">Autosave</Text>
                                    <Switch
                                        isChecked={currentUser?.autosavePreference || false}
                                        colorScheme="brand"
                                        isDisabled={!canEdit}
                                        onChange={async () => {
                                            try {
                                                const newPref = !currentUser?.autosavePreference;
                                                const updatedUser = await updateProfile({ autosavePreference: newPref });
                                                updateAuthUser(updatedUser);
                                                toast({
                                                    title: `Autosave ${newPref ? 'Enabled' : 'Disabled'}`,
                                                    status: 'success',
                                                    duration: 2000,
                                                });
                                            } catch {
                                                toast({ title: 'Failed to update autosave preference', status: 'error' });
                                            }
                                        }}
                                    />
                                </HStack>
                            )}

                            <Box display="flex" gap={2} minW="140px" justifyContent="center">
                                {isDocx && (
                                    <Button
                                        leftIcon={<FiDownload />}
                                        colorScheme="blue"
                                        variant="outline"
                                        onClick={handleExportPDF}
                                        size="sm"
                                    >
                                        Export PDF
                                    </Button>
                                )}
                                {!isDocx && (
                                    <Button
                                        leftIcon={<FiDownload />}
                                        colorScheme="blue"
                                        variant="outline"
                                        onClick={handleExportTxt}
                                        size="sm"
                                    >
                                        Download TXT
                                    </Button>
                                )}
                                {!currentUser?.autosavePreference && canEdit && (
                                    <Button
                                        leftIcon={<FiSave />}
                                        colorScheme="brand"
                                        onClick={() => handleSave()}
                                        isLoading={loading}
                                        size="sm"
                                    >
                                        Save
                                    </Button>
                                )}
                                {!canEdit && !isOwner && !isSuperAdmin && currentDoc && !readOnly && (
                                    <Button
                                        leftIcon={
                                            hasPendingEditRequest ? <FiCheck /> : <FiEdit2 />
                                        }
                                        colorScheme="orange"
                                        onClick={handleRequestEditAccess}
                                        isLoading={loading}
                                        size="sm"
                                        isDisabled={hasPendingEditRequest}
                                    >
                                        {hasPendingEditRequest ? 'Requested' : 'Request Edit Access'}
                                    </Button>
                                )}
                            </Box>

                            <ModalCloseButton position="static" />
                        </HStack>
                    </Flex>
                </ModalHeader>

                {/*                 
                 * ── Sticky CKEditor Toolbar ─────────────────────────────────
                 *
                 * This div sits BETWEEN the header and the scrollable body.
                 * CKEditor's toolbar element is moved here in `handleEditorReady`
                 * via `document.getElementById('ck-toolbar-wrapper')`.
                 *
                 * Because it is a sibling of ModalBody (not inside it), it
                 * never scrolls, even when the user adds many pages.
                 */}
                {canEdit && (
                    <Box
                        ref={toolbarWrapperRef}
                        flexShrink={0}
                        borderBottomWidth="1px"
                        borderColor="gray.200"
                        bg="white"
                        minH="44px"
                        overflow="visible"
                        zIndex={10}
                    />
                )}

                {/* ── Main content (editor + sidebar) ─────────────────────── */}
                <ModalBody
                    p={0}
                    display="flex"
                    flexDirection="row"
                    flex={1}
                    overflow="hidden"
                    bg={isDocx ? '#cdd1d8' : 'white'}
                >
                    {/*
                     * ── Editor scroll area ─────────────────────────────────
                     *
                     * This is the ONLY element that scrolls.
                     * The toolbar (above) and sidebar (right) stay fixed.
                     */}
                    <Box
                        flex={1}
                        overflowY="auto"
                        overflowX={isDocx ? 'auto' : 'hidden'}
                        className="editor-scroll-area"
                        pb={isDocx ? 12 : 0}
                    >
                        <Box className={isDocx ? 'docx-editor' : 'txt-editor'}>
                            {isDocx && (
                                <Box className="page-overlay" aria-hidden="true">
                                    {Array.from({ length: pageCount }, (_, idx) => (
                                        <Box key={idx} className="page-sheet" />
                                    ))}
                                </Box>
                            )}
                            <CKEditor
                                editor={DecoupledEditor}
                                data={content}
                                disabled={!canEdit}
                                onChange={(event, editor) => handleContentChange(editor.getData())}
                                onReady={handleEditorReady}
                                config={editorConfig}
                            />
                        </Box>
                    </Box>

                    {/* ── Sidebar ──────────────────────────────────────────── */}
                    <Box
                        w="300px"
                        borderLeftWidth="1px"
                        p={4}
                        bg="white"
                        overflowY="auto"
                        flexShrink={0}
                    >
                        <VStack align="stretch" spacing={6}>
                            {/* Permissions */}
                            <Box>
                                <Heading size="xs" mb={3} textTransform="uppercase" color="gray.500">
                                    Document Settings
                                </Heading>
                                <FormControl>
                                    <FormLabel fontSize="sm">Permissions</FormLabel>
                                    {isOwner || isSuperAdmin ? (
                                        <VStack align="stretch" spacing={3}>
                                            <Select
                                                options={memberOptions.filter(
                                                    opt => !permissions.some(p => compareIds(p.user, opt.value))
                                                )}
                                                placeholder="Add user..."
                                                onChange={opt => opt && handleAddPermission(opt.value, 'view')}
                                                value={null}
                                            />
                                            <VStack align="stretch" spacing={2}>
                                                {permissions.map((p, idx) => (
                                                    <Flex
                                                        key={idx}
                                                        justify="space-between"
                                                        align="center"
                                                        p={2}
                                                        bg="gray.50"
                                                        borderRadius="md"
                                                        fontSize="sm"
                                                    >
                                                        <Text isTruncated maxW="150px">
                                                            {memberOptions.find(m => m.value === p.user)?.label || 'User'}
                                                        </Text>
                                                        <HStack>
                                                            <Select
                                                                size="sm"
                                                                options={[
                                                                    { value: 'view', label: 'View' },
                                                                    { value: 'edit', label: 'Edit' },
                                                                ]}
                                                                defaultValue={{
                                                                    value: p.access,
                                                                    label: p.access.charAt(0).toUpperCase() + p.access.slice(1),
                                                                }}
                                                                onChange={opt => {
                                                                    const updated = [...permissions];
                                                                    updated[idx].access = opt.value;
                                                                    setPermissions([...updated]);
                                                                    setSavingStatus('unsaved');
                                                                }}
                                                                styles={{
                                                                    control: base => ({ ...base, minHeight: '24px', fontSize: '12px' }),
                                                                }}
                                                            />
                                                            <IconButton
                                                                icon={<FiTrash2 />}
                                                                aria-label="Remove permission"
                                                                size="xs"
                                                                variant="ghost"
                                                                colorScheme="red"
                                                                onClick={() => handleRemovePermission(p.user)}
                                                            />
                                                        </HStack>
                                                    </Flex>
                                                ))}
                                            </VStack>
                                        </VStack>
                                    ) : (
                                        <Text fontSize="sm" color="gray.500">
                                            Only the owner can manage permissions.
                                        </Text>
                                    )}
                                </FormControl>
                            </Box>

                            <Divider />

                            {/* Info */}
                            <Box>
                                <Heading size="xs" mb={3} textTransform="uppercase" color="gray.500">
                                    Info
                                </Heading>
                                <VStack align="stretch" spacing={2} fontSize="sm">
                                    <Flex justify="space-between">
                                        <Text color="gray.500">Owner:</Text>
                                        <Text fontWeight="medium">
                                            {currentDoc?.owner?.name || currentUser?.name}
                                        </Text>
                                    </Flex>
                                    <Flex justify="space-between">
                                        <Text color="gray.500">Last Updated:</Text>
                                        <Text fontWeight="medium">
                                            {currentDoc?._id
                                                ? new Date(currentDoc.updatedAt).toLocaleString()
                                                : 'Just now'}
                                        </Text>
                                    </Flex>
                                    {isDocx && (
                                        <Flex justify="space-between">
                                            <Text color="gray.500">Tip:</Text>
                                            <Text color="gray.400" fontSize="xs">
                                                Shift+Enter = new page
                                            </Text>
                                        </Flex>
                                    )}
                                </VStack>
                            </Box>
                        </VStack>
                    </Box>
                </ModalBody>
            </ModalContent>
            </Modal>

            {/* Custom confirmation dialog for unsaved changes */}
            <AlertDialog
                isOpen={isConfirmOpen}
                leastDestructiveRef={cancelRef}
                onClose={() => setIsConfirmOpen(false)}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Unsaved Changes
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Unsaved changes will be lost. Close anyway?
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={() => setIsConfirmOpen(false)}>
                                Cancel
                            </Button>
                            <Button 
                                colorScheme="red" 
                                onClick={() => {
                                    setIsConfirmOpen(false);
                                    onClose();
                                }} 
                                ml={3}
                            >
                                Close Anyway
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );
};

export default DocumentEditorModal;
