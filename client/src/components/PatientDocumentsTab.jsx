import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Edit3,
  Trash2,
  Eye,
  Plus,
  X,
  Loader2,
  File,
  FileImage,
  Grid,
  List,
  MoreVertical,
  CloudUpload,
  Lock,
  Pin,
  RefreshCw,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { FormSelect } from './ui/form-field';
import { ConfirmDialog } from './ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { documentsApi } from '../services/api';
import { showSuccess, showError } from './../lib/toast';

const PatientDocumentsTab = ({ patient }) => {
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState('category');
  const [editingDocument, setEditingDocument] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (patient?.id) {
      fetchDocuments();
      fetchCategories();
    }
  }, [patient?.id]);

  useEffect(() => {
    if (patient?.id) {
      fetchDocuments();
    }
  }, [searchTerm]);

  const fetchDocuments = async () => {
    if (!patient?.id) return;

    setLoading(true);
    try {
      const filters = {};
      if (searchTerm) filters.search = searchTerm;

      const data = await documentsApi.getByPatient(patient.id, filters);
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await documentsApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !patient?.id) return;

    setUploading(true);
    try {
      // Upload files one by one
      for (const file of selectedFiles) {
        await documentsApi.upload(
          file,
          patient.id,
          uploadCategory,
          uploadDescription,
          uploadName || undefined
        );
      }

      showSuccess(`${selectedFiles.length} document(s) uploaded successfully`);
      setSelectedFiles([]);
      setUploadCategory('');
      setUploadDescription('');
      setUploadName('');
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading documents:', error);
      showError('Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (document) => {
    setEditingDocument({ ...document });
  };

  const handleCancelEdit = () => {
    setEditingDocument(null);
  };

  const handleUpdateDocument = async () => {
    if (!editingDocument) return;

    try {
      await documentsApi.update(editingDocument.id, {
        originalName: editingDocument.originalName,
        category: editingDocument.category,
        description: editingDocument.description,
      });

      showSuccess('Document updated successfully');
      setEditingDocument(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      showError('Echec Enregistrement');
    }
  };

  const handleDelete = (documentId) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      await documentsApi.delete(documentToDelete);
      showSuccess('Document deleted successfully');
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      showError('Failed to delete document');
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await documentsApi.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalName);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      showError('Failed to download document');
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) {
      return <FileImage className='w-8 h-8 text-blue-500' />;
    }
    return <File className='w-8 h-8 text-gray-500' />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find((c) => c.value === category);
    return cat?.label || category;
  };

  const getDocumentDate = (doc) => {
    return doc.uploadDate || doc.createdAt;
  };

  const togglePin = async (document) => {
    try {
      const updated = await documentsApi.update(document.id, {
        pinned: !document.pinned,
      });
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === updated.id ? updated : doc))
      );
    } catch (error) {
      console.error('Error updating document pin status:', error);
      showError('Failed to update pin status');
    }
  };

  const toggleLock = async (document) => {
    try {
      const updated = await documentsApi.update(document.id, {
        locked: !document.locked,
      });
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === updated.id ? updated : doc))
      );
    } catch (error) {
      console.error('Error updating document lock status:', error);
      showError('Failed to update lock status');
    }
  };

  const getGroupedDocuments = () => {
    if (!Array.isArray(documents)) return [];

    const docs = [...documents];

    const pinnedDocs = docs.filter((doc) => doc.pinned);
    const otherDocs = docs.filter((doc) => !doc.pinned);

    const groups = [];

    if (pinnedDocs.length > 0) {
      const sortedPinned = [...pinnedDocs].sort(
        (a, b) =>
          new Date(getDocumentDate(b)).getTime() -
          new Date(getDocumentDate(a)).getTime()
      );
      groups.push({
        key: 'pinned',
        label: 'Épinglés',
        documents: sortedPinned,
      });
    }

    if (showPinnedOnly) {
      return groups;
    }

    if (sortMode === 'name') {
      const sorted = [...otherDocs].sort((a, b) =>
        (a.originalName || '').localeCompare(b.originalName || '', 'fr', {
          sensitivity: 'base',
        })
      );
      groups.push({ key: 'all', label: null, documents: sorted });
      return groups;
    }

    if (sortMode === 'date') {
      const sorted = [...otherDocs].sort(
        (a, b) =>
          new Date(getDocumentDate(b)).getTime() -
          new Date(getDocumentDate(a)).getTime()
      );
      groups.push({ key: 'all', label: null, documents: sorted });
      return groups;
    }

    if (sortMode === 'direction') {
      const received = [];
      const sent = [];

      otherDocs.forEach((doc) => {
        if (doc.isAppointmentDocument) {
          sent.push(doc);
          return;
        }

        if (doc.senderId && doc.senderId === doc.patientId) {
          received.push(doc);
        } else {
          sent.push(doc);
        }
      });

      const sortByDate = (list) =>
        list.sort(
          (a, b) =>
            new Date(getDocumentDate(b)).getTime() -
            new Date(getDocumentDate(a)).getTime()
        );

      if (received.length > 0) {
        groups.push({
          key: 'received',
          label: 'Reçus',
          documents: sortByDate(received),
        });
      }

      if (sent.length > 0) {
        groups.push({
          key: 'sent',
          label: 'Envoyés',
          documents: sortByDate(sent),
        });
      }

      return groups;
    }

    const categoryGroups = new Map();

    otherDocs.forEach((doc) => {
      const key = doc.category || 'UNCATEGORIZED';
      const label = doc.category
        ? getCategoryLabel(doc.category)
        : 'Non catégorisés';

      if (!categoryGroups.has(key)) {
        categoryGroups.set(key, { key, label, documents: [] });
      }

      categoryGroups.get(key).documents.push(doc);
    });

    const sortedCategoryGroups = Array.from(categoryGroups.values()).sort(
      (a, b) =>
        (a.label || '').localeCompare(b.label || '', 'fr', {
          sensitivity: 'base',
        })
    );

    sortedCategoryGroups.forEach((group) => {
      group.documents.sort(
        (a, b) =>
          new Date(getDocumentDate(b)).getTime() -
          new Date(getDocumentDate(a)).getTime()
      );
    });

    groups.push(...sortedCategoryGroups);

    return groups;
  };

  const groupedDocuments = getGroupedDocuments();

  return (
    <div className='space-y-6'>
      {/* File Upload Section */}
      <div className='space-y-4'>
        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className='space-y-4'>
            <div className='flex justify-center'>
              <CloudUpload
                className={`w-12 h-12 ${isDragOver ? 'text-primary' : 'text-muted-foreground'
                  }`}
              />
            </div>
            <div>
              <p className='text-lg font-medium text-foreground mb-2'>
                Glissez-déposez vos fichiers ici
              </p>
              <p className='text-sm text-muted-foreground mb-4'>
                ou cliquez pour sélectionner des fichiers
              </p>
              <Button
                variant='outline'
                onClick={() => fileInputRef.current?.click()}
                className='mb-4'
              >
                <Upload className='w-4 h-4 mr-2' />
                Sélectionner des fichiers
              </Button>
              <input
                ref={fileInputRef}
                type='file'
                multiple
                className='hidden'
                accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif'
                onChange={handleFileSelect}
              />
              <p className='text-xs text-muted-foreground'>
                Formats supportés: PDF, DOC, DOCX, JPG, PNG, GIF
              </p>
            </div>
          </div>
        </div>

        {/* Selected Files Display */}
        {selectedFiles.length > 0 && (
          <div className='space-y-4 border rounded-lg p-4 bg-muted/5'>
            <div className='flex items-center justify-between'>
              <h4 className='font-medium text-foreground'>
                Fichiers sélectionnés ({selectedFiles.length})
              </h4>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSelectedFiles([])}
              >
                <X className='w-4 h-4' />
              </Button>
            </div>

            {/* Files List */}
            <div className='space-y-2'>
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 bg-background border rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    {file.type?.startsWith('image/') ? (
                      <FileImage className='w-6 h-6 text-blue-500' />
                    ) : (
                      <File className='w-6 h-6 text-gray-500' />
                    )}
                    <div>
                      <p className='font-medium text-sm'>{file.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => removeFile(index)}
                  >
                    <X className='w-4 h-4' />
                  </Button>
                </div>
              ))}
            </div>

            {/* Upload Configuration */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <Label htmlFor='uploadName'>Nom du document</Label>
                <Input
                  id='uploadName'
                  placeholder='Nom affiché du fichier'
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='uploadCategory'>Catégorie</Label>
                <FormSelect
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  options={categories}
                  placeholder='Sélectionnez une catégorie'
                />
              </div>
              {/* <div>
                <Label htmlFor='uploadDescription'>
                  Description (optionnel)
                </Label>
                <Textarea
                  id='uploadDescription'
                  placeholder='Ajoutez une description...'
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={2}
                />
              </div> */}
            </div>

            {/* Upload Button */}
            <div className='flex justify-end'>
              <Button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className='min-w-[120px]'
              >
                {uploading ? (
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                ) : (
                  <Upload className='w-4 h-4 mr-2' />
                )}
                {uploading ? 'Téléversement...' : 'Téléverser'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Header with search and controls */}
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <div className='flex-1 flex gap-2'>
          {/* <div className='relative flex-1 max-w-md'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              placeholder='Rechercher des documents...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div> */}
          <FormSelect
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            options={[
              { value: 'category', label: 'Par catégorie' },
              { value: 'name', label: 'Par nom' },
              { value: 'date', label: 'Par date' },
              { value: 'direction', label: 'Reçus / Envoyés' },
            ]}
            placeholder='Par catégorie'
            className='w-48'
          />
        </div>

        <div className='flex gap-2 items-center'>
          <Button
            variant='ghost'
            size='sm'
            onClick={fetchDocuments}
            disabled={loading}
          >
            <RefreshCw className='w-4 h-4' />
          </Button>
          <Button
            variant={showPinnedOnly ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setShowPinnedOnly((prev) => !prev)}
          >
            <Pin className='w-4 h-4' />
          </Button>
          <div className='flex border rounded-md'>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('grid')}
            >
              <Grid className='w-4 h-4' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('list')}
            >
              <List className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Documents display */}
      {loading ? (
        <div className='flex items-center justify-center py-8'>
          <Loader2 className='w-6 h-6 animate-spin text-primary' />
          <span className='ml-2 text-muted-foreground'>
            Chargement des documents...
          </span>
        </div>
      ) : documents.length === 0 ? (
        <div className='text-center text-muted-foreground py-8'>
          <FileText className='w-12 h-12 mx-auto mb-4 opacity-50' />
          <p>Aucun document trouvé</p>
          <p className='text-sm mt-2'>
            Utilisez la section de téléversement ci-dessus pour ajouter des
            documents
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className='space-y-4'>
          {groupedDocuments.map((group) => (
            <div key={group.key} className='space-y-2'>
              {group.label && (
                <h3 className='font-semibold text-sm text-foreground'>
                  {group.label}
                </h3>
              )}
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4'>
                {group.documents.map((document) => {
                  const isPinned = !!document.pinned;
                  const isLocked = !!document.locked;

                  return (
                    <div
                      key={document.id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${editingDocument?.id === document.id
                        ? 'ring-2 ring-primary'
                        : ''
                        }`}
                    >
                      {editingDocument?.id === document.id ? (
                        <div className='space-y-3'>
                          <div className='flex items-start justify-between mb-3'>
                            {getFileIcon(document.mimeType)}
                            <div className='flex gap-1'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={handleUpdateDocument}
                              >
                                <Edit3 className='w-3 h-3 text-green-600' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={handleCancelEdit}
                              >
                                <X className='w-3 h-3 text-red-600' />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label className='text-xs'>Nom du fichier</Label>
                            <Input
                              value={editingDocument.originalName}
                              onChange={(e) =>
                                setEditingDocument({
                                  ...editingDocument,
                                  originalName: e.target.value,
                                })
                              }
                              className='text-xs h-8'
                            />
                          </div>

                          <div>
                            <Label className='text-xs'>Catégorie</Label>
                            <FormSelect
                              value={editingDocument.category}
                              onChange={(e) =>
                                setEditingDocument({
                                  ...editingDocument,
                                  category: e.target.value,
                                })
                              }
                              options={categories}
                              className='h-8 text-xs'
                            />
                          </div>

                          <div className='space-y-1 text-xs text-muted-foreground'>
                            <div className='flex justify-between'>
                              <span>Taille:</span>
                              <span>{formatFileSize(document.fileSize)}</span>
                            </div>
                            <div className='flex justify-between'>
                              <span>Date:</span>
                              <span>{formatDate(document.uploadDate)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className='flex items-start justify-between mb-3'>
                            {getFileIcon(document.mimeType)}
                            <div className='flex items-center gap-1'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => togglePin(document)}
                              >
                                <Pin
                                  className={`w-4 h-4 ${isPinned
                                    ? 'text-yellow-500'
                                    : 'text-muted-foreground'
                                    }`}
                                />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => toggleLock(document)}
                              >
                                <Lock
                                  className={`w-4 h-4 ${isLocked
                                    ? 'text-red-500'
                                    : 'text-muted-foreground'
                                    }`}
                                />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant='ghost' size='sm'>
                                    <MoreVertical className='w-4 h-4' />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (isLocked) return;
                                      handleDownload(document);
                                    }}
                                    className={
                                      isLocked
                                        ? 'opacity-50 cursor-not-allowed'
                                        : ''
                                    }
                                  >
                                    <Download className='w-4 h-4 mr-2' />
                                    Télécharger
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (isLocked) return;
                                      handleEdit(document);
                                    }}
                                    className={
                                      isLocked
                                        ? 'opacity-50 cursor-not-allowed'
                                        : ''
                                    }
                                  >
                                    <Edit3 className='w-4 h-4 mr-2' />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (isLocked) return;
                                      handleDelete(document.id);
                                    }}
                                    className={`text-red-600 ${isLocked
                                      ? 'opacity-50 cursor-not-allowed'
                                      : ''
                                      }`}
                                  >
                                    <Trash2 className='w-4 h-4 mr-2' />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <h4 className='font-medium text-sm mb-2 line-clamp-2'>
                            {document.originalName}
                          </h4>

                          <div className='space-y-1 text-xs text-muted-foreground'>
                            <div className='flex justify-between'>
                              <span>Taille:</span>
                              <span>{formatFileSize(document.fileSize)}</span>
                            </div>
                            <div className='flex justify-between'>
                              <span>Date:</span>
                              <span>{formatDate(document.uploadDate)}</span>
                            </div>
                            <div className='flex justify-between items-center'>
                              <span>Catégorie:</span>
                              <span className='text-blue-600 text-xs px-2 py-1 bg-blue-50 rounded'>
                                {getCategoryLabel(document.category)}
                              </span>
                            </div>
                            {isLocked && (
                              <div className='flex items-center justify-between text-xs text-red-600'>
                                <span>Paiement requis</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='space-y-4'>
          {groupedDocuments.map((group) => (
            <div key={group.key} className='space-y-2'>
              {group.label && (
                <h3 className='font-semibold text-sm text-foreground'>
                  {group.label}
                </h3>
              )}
              <div className='space-y-2'>
                {group.documents.map((document) => {
                  const isPinned = !!document.pinned;
                  const isLocked = !!document.locked;

                  return (
                    <div
                      key={document.id}
                      className={`border rounded-lg p-3 transition-colors ${editingDocument?.id === document.id
                        ? 'ring-2 ring-primary bg-muted/20'
                        : 'hover:bg-muted/50'
                        }`}
                    >
                      {editingDocument?.id === document.id ? (
                        <div className='space-y-3'>
                          <div className='flex items-center gap-3'>
                            {getFileIcon(document.mimeType)}
                            <div className='flex-1 grid grid-cols-1 md:grid-cols-3 gap-3'>
                              <div>
                                <Label className='text-xs'>
                                  Nom du fichier
                                </Label>
                                <Input
                                  value={editingDocument.originalName}
                                  onChange={(e) =>
                                    setEditingDocument({
                                      ...editingDocument,
                                      originalName: e.target.value,
                                    })
                                  }
                                  className='text-sm h-8'
                                />
                              </div>
                              <div>
                                <Label className='text-xs'>Catégorie</Label>
                                <FormSelect
                                  value={editingDocument.category}
                                  onChange={(e) =>
                                    setEditingDocument({
                                      ...editingDocument,
                                      category: e.target.value,
                                    })
                                  }
                                  options={categories}
                                  className='h-8 text-sm'
                                />
                              </div>
                            </div>
                            <div className='flex gap-1 flex-shrink-0'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={handleUpdateDocument}
                                className='text-green-600 hover:text-green-700'
                              >
                                <Edit3 className='w-4 h-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={handleCancelEdit}
                                className='text-red-600 hover:text-red-700'
                              >
                                <X className='w-4 h-4' />
                              </Button>
                            </div>
                          </div>
                          <div className='flex items-center gap-4 text-xs text-muted-foreground pl-11'>
                            <span>{formatFileSize(document.fileSize)}</span>
                            <span>{formatDate(document.uploadDate)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className='flex items-center gap-3'>
                          {getFileIcon(document.mimeType)}

                          <div className='flex-1 min-w-0'>
                            <h4 className='font-medium text-sm truncate'>
                              {document.originalName}
                            </h4>
                            <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                              <span>{formatFileSize(document.fileSize)}</span>
                              <span>{formatDate(document.uploadDate)}</span>
                              <span className='text-blue-600 bg-blue-50 px-2 py-1 rounded'>
                                {getCategoryLabel(document.category)}
                              </span>
                              {isLocked && (
                                <span className='text-red-600'>
                                  Paiement requis
                                </span>
                              )}
                            </div>
                          </div>

                          <div className='flex gap-1 items-center'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => togglePin(document)}
                            >
                              <Pin
                                className={`w-4 h-4 ${isPinned
                                  ? 'text-yellow-500'
                                  : 'text-muted-foreground'
                                  }`}
                              />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => toggleLock(document)}
                            >
                              <Lock
                                className={`w-4 h-4 ${isLocked
                                  ? 'text-red-500'
                                  : 'text-muted-foreground'
                                  }`}
                              />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                if (isLocked) return;
                                handleDownload(document);
                              }}
                              disabled={isLocked}
                            >
                              <Download className='w-4 h-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                if (isLocked) return;
                                handleEdit(document);
                              }}
                              disabled={isLocked}
                            >
                              <Edit3 className='w-4 h-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                if (isLocked) return;
                                handleDelete(document.id);
                              }}
                              className='text-red-600 hover:text-red-700'
                              disabled={isLocked}
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDocumentToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer le document"
        description="Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </div>
  );
};

export default PatientDocumentsTab;
