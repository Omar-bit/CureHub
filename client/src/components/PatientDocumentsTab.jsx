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
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { FormSelect } from './ui/form-field';
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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingDocument, setEditingDocument] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
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
  }, [searchTerm, selectedCategory]);

  const fetchDocuments = async () => {
    if (!patient?.id) return;

    setLoading(true);
    try {
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedCategory) filters.category = selectedCategory;

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
          uploadDescription
        );
      }

      showSuccess(`${selectedFiles.length} document(s) uploaded successfully`);
      setSelectedFiles([]);
      setUploadCategory('');
      setUploadDescription('');
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
      showError('Failed to update document');
    }
  };

  const handleDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentsApi.delete(documentId);
      showSuccess('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      showError('Failed to delete document');
    }
  };

  const handleDownload = async (document) => {
    try {
      const response = await documentsApi.download(document.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.originalName);
      document.body.appendChild(link);
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

  const getCategoryOptions = () => {
    return [{ value: '', label: 'Toutes catégories' }, ...categories];
  };

  return (
    <div className='space-y-6'>
      {/* File Upload Section */}
      <div className='space-y-4'>
        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver
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
                className={`w-12 h-12 ${
                  isDragOver ? 'text-primary' : 'text-muted-foreground'
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
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='uploadCategory'>Catégorie</Label>
                <FormSelect
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  options={categories}
                  placeholder='Sélectionnez une catégorie'
                />
              </div>
              <div>
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
              </div>
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
          <div className='relative flex-1 max-w-md'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              placeholder='Rechercher des documents...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
          <FormSelect
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={getCategoryOptions()}
            placeholder='Filtrer par catégorie'
            className='w-48'
          />
        </div>

        <div className='flex gap-2'>
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
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {documents.map((document) => (
            <div
              key={document.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                editingDocument?.id === document.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              {editingDocument?.id === document.id ? (
                // Editing mode
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

                  <div>
                    <Label className='text-xs'>Description</Label>
                    <Textarea
                      value={editingDocument.description || ''}
                      onChange={(e) =>
                        setEditingDocument({
                          ...editingDocument,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                      className='text-xs'
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
                // View mode
                <>
                  <div className='flex items-start justify-between mb-3'>
                    {getFileIcon(document.mimeType)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='sm'>
                          <MoreVertical className='w-4 h-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem
                          onClick={() => handleDownload(document)}
                        >
                          <Download className='w-4 h-4 mr-2' />
                          Télécharger
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(document)}>
                          <Edit3 className='w-4 h-4 mr-2' />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(document.id)}
                          className='text-red-600'
                        >
                          <Trash2 className='w-4 h-4 mr-2' />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                    <div className='flex justify-between'>
                      <span>Catégorie:</span>
                      <span className='text-blue-600 text-xs px-2 py-1 bg-blue-50 rounded'>
                        {getCategoryLabel(document.category)}
                      </span>
                    </div>
                  </div>

                  {document.description && (
                    <p className='text-xs text-muted-foreground mt-2 line-clamp-2'>
                      {document.description}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className='space-y-2'>
          {documents.map((document) => (
            <div
              key={document.id}
              className={`border rounded-lg p-3 transition-colors ${
                editingDocument?.id === document.id
                  ? 'ring-2 ring-primary bg-muted/20'
                  : 'hover:bg-muted/50'
              }`}
            >
              {editingDocument?.id === document.id ? (
                // Editing mode for list view
                <div className='space-y-3'>
                  <div className='flex items-center gap-3'>
                    {getFileIcon(document.mimeType)}
                    <div className='flex-1 grid grid-cols-1 md:grid-cols-3 gap-3'>
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
                      <div>
                        <Label className='text-xs'>Description</Label>
                        <Input
                          value={editingDocument.description || ''}
                          onChange={(e) =>
                            setEditingDocument({
                              ...editingDocument,
                              description: e.target.value,
                            })
                          }
                          className='text-sm h-8'
                          placeholder='Description...'
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
                // View mode for list view
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
                    </div>
                    {document.description && (
                      <p className='text-xs text-muted-foreground mt-1 truncate'>
                        {document.description}
                      </p>
                    )}
                  </div>

                  <div className='flex gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDownload(document)}
                    >
                      <Download className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleEdit(document)}
                    >
                      <Edit3 className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDelete(document.id)}
                      className='text-red-600 hover:text-red-700'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientDocumentsTab;
