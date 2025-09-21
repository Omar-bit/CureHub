import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  Grid3X3,
  List,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { SearchBar } from '../components/ui/search-bar';
import ConsultationTypeForm from '../components/ConsultationTypeForm';
import DataTable from '../components/DataTable';
import { consultationTypesAPI } from '../services/api';
import { showSuccess, showError } from '../lib/toast';

const ConsultationTypesPage = () => {
  const [consultationTypes, setConsultationTypes] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    type: null,
  });

  // Load consultation types
  const loadConsultationTypes = async () => {
    try {
      setLoading(true);
      const response = await consultationTypesAPI.getAll();
      setConsultationTypes(response);
      setFilteredTypes(response);
    } catch (error) {
      console.error('Error loading consultation types:', error);
      showError('Failed to load consultation types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultationTypes();
  }, []);

  // Filter consultation types based on search term
  useEffect(() => {
    console.log('Filtering types with search term:', searchTerm);
    if (!searchTerm.trim()) {
      setFilteredTypes(consultationTypes);
    } else {
      const filtered = consultationTypes.filter(
        (type) =>
          type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          type.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          type.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTypes(filtered);
    }
  }, [searchTerm, consultationTypes]);

  const handleAddNew = () => {
    setEditingType(null);
    setShowForm(true);
  };

  const handleEdit = (consultationType) => {
    setEditingType(consultationType);
    setShowForm(true);
  };

  const handleDelete = (consultationType) => {
    setDeleteDialog({ isOpen: true, type: consultationType });
  };

  const confirmDelete = async () => {
    try {
      await consultationTypesAPI.delete(deleteDialog.type.id);
      showSuccess('Consultation type deleted successfully');
      setDeleteDialog({ isOpen: false, type: null });
      loadConsultationTypes();
    } catch (error) {
      console.error('Error deleting consultation type:', error);
      showError('Failed to delete consultation type');
    }
  };

  const handleFormSuccess = () => {
    loadConsultationTypes();
  };

  const getLocationDisplay = (location) => {
    switch (location) {
      case 'ONSITE':
        return 'Onsite';
      case 'ONLINE':
        return 'Online';
      case 'ATHOME':
        return 'At Home';
      default:
        return location;
    }
  };

  const getTypeDisplay = (type) => {
    switch (type) {
      case 'REGULAR':
        return 'Regular';
      case 'URGENT':
        return 'Urgent';
      default:
        return type;
    }
  };

  const getLocationIcon = (location) => {
    switch (location) {
      case 'ONSITE':
        return '🏥';
      case 'ONLINE':
        return '💻';
      case 'ATHOME':
        return '🏠';
      default:
        return '📍';
    }
  };

  // Table columns definition
  const tableColumns = [
    {
      key: 'name',
      title: 'Name',
      render: (value, row) => (
        <div className='flex items-center gap-3'>
          <div
            className='w-3 h-3 rounded-full border border-gray-300'
            style={{ backgroundColor: row.color }}
          />
          <span className='font-medium'>{value}</span>
        </div>
      ),
    },
    {
      key: 'location',
      title: 'Location',
      render: (value) => (
        <div className='flex items-center gap-2'>
          <span>{getLocationIcon(value)}</span>
          <span>{getLocationDisplay(value)}</span>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Type',
      render: (value) => getTypeDisplay(value),
    },
    {
      key: 'duration',
      title: 'Duration',
      render: (value, row) => (
        <div className='flex items-center gap-1'>
          <Clock className='h-4 w-4 text-muted-foreground' />
          <span>{value} min</span>
          {row.restAfter > 0 && (
            <span className='text-muted-foreground text-sm'>
              + {row.restAfter} min
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'price',
      title: 'Price',
      render: (value) => (
        <div className='flex items-center gap-1'>
          <DollarSign className='h-4 w-4 text-muted-foreground' />
          <span className='font-medium'>${value}</span>
        </div>
      ),
    },
    {
      key: 'enabled',
      title: 'Status',
      render: (value) => (
        <div className='flex items-center gap-2'>
          {value ? (
            <>
              <Eye className='h-4 w-4 text-green-600' />
              <span className='text-green-600'>Enabled</span>
            </>
          ) : (
            <>
              <EyeOff className='h-4 w-4 text-red-600' />
              <span className='text-red-600'>Disabled</span>
            </>
          )}
        </div>
      ),
    },
  ];

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    try {
      await Promise.all(
        selectedRows.map((id) => consultationTypesAPI.delete(id))
      );
      showSuccess(
        `${selectedRows.length} consultation type(s) deleted successfully`
      );
      setSelectedRows([]);
      loadConsultationTypes();
    } catch (error) {
      console.error('Error deleting consultation types:', error);
      showError('Failed to delete consultation types');
    }
  };

  // Handle table row actions
  const renderRowActions = (row) => [
    <Button
      key='edit'
      variant='ghost'
      size='sm'
      onClick={() => handleEdit(row)}
      className='h-8 w-8 p-0'
    >
      <Edit className='h-4 w-4' />
    </Button>,
    <Button
      key='delete'
      variant='ghost'
      size='sm'
      onClick={() => handleDelete(row)}
      className='h-8 w-8 p-0 text-red-600 hover:text-red-700'
    >
      <Trash2 className='h-4 w-4' />
    </Button>,
  ];

  if (loading) {
    return (
      <div className='p-6 space-y-6'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold'>Consultation Types</h1>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[...Array(6)].map((_, index) => (
            <Card key={index} className='p-6'>
              <div className='animate-pulse'>
                <div className='h-4 bg-gray-200 rounded w-3/4 mb-4'></div>
                <div className='h-3 bg-gray-200 rounded w-1/2 mb-2'></div>
                <div className='h-3 bg-gray-200 rounded w-2/3'></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold'>Consultation Types</h1>
          <p className='text-muted-foreground'>
            Manage the types of consultations you offer to patients
          </p>
        </div>
        <div className='flex items-center gap-3'>
          {/* View Toggle */}
          <div className='flex items-center border rounded-lg p-1'>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('grid')}
              className='h-8 px-3'
            >
              <Grid3X3 className='h-4 w-4' />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('table')}
              className='h-8 px-3'
            >
              <List className='h-4 w-4' />
            </Button>
          </div>
          <Button onClick={handleAddNew} className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Add New Type
          </Button>
        </div>
      </div>

      {/* Search and Actions */}
      <div className='flex justify-between items-center'>
        <div className='flex items-center gap-4'>
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='Search consultation types...'
            className='max-w-md'
          />
          {viewMode === 'table' && selectedRows.length > 0 && (
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleBulkDelete}
                className='text-red-600 hover:text-red-700'
              >
                <Trash2 className='h-4 w-4 mr-1' />
                Delete Selected ({selectedRows.length})
              </Button>
            </div>
          )}
        </div>
        <div className='text-sm text-muted-foreground'>
          {filteredTypes.length} of {consultationTypes.length} types
        </div>
      </div>

      {/* Consultation Types Content */}
      {filteredTypes.length === 0 ? (
        <Card className='p-12 text-center'>
          <div className='mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4'>
            <Plus className='h-8 w-8 text-muted-foreground' />
          </div>
          <h3 className='text-lg font-semibold mb-2'>
            {searchTerm
              ? 'No consultation types found'
              : 'No consultation types yet'}
          </h3>
          <p className='text-muted-foreground mb-6'>
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Create your first consultation type to get started'}
          </p>
          {!searchTerm && (
            <Button onClick={handleAddNew}>
              <Plus className='h-4 w-4 mr-2' />
              Add Your First Type
            </Button>
          )}
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            // Grid View
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredTypes.map((consultationType) => (
                <Card
                  key={consultationType.id}
                  className='p-6 hover:shadow-md transition-shadow'
                >
                  {/* Header with color indicator */}
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div
                        className='w-4 h-4 rounded-full border-2 border-white shadow-sm'
                        style={{ backgroundColor: consultationType.color }}
                      />
                      <div>
                        <h3 className='font-semibold text-lg'>
                          {consultationType.name}
                        </h3>
                        <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                          <span>
                            {getLocationIcon(consultationType.location)}
                          </span>
                          <span>
                            {getLocationDisplay(consultationType.location)}
                          </span>
                          <span className='mx-1'>•</span>
                          <span>{getTypeDisplay(consultationType.type)}</span>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-1'>
                      {consultationType.enabled ? (
                        <Eye
                          className='h-4 w-4 text-green-600'
                          title='Enabled'
                        />
                      ) : (
                        <EyeOff
                          className='h-4 w-4 text-red-600'
                          title='Disabled'
                        />
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className='space-y-3 mb-6'>
                    <div className='flex items-center gap-2 text-sm'>
                      <Clock className='h-4 w-4 text-muted-foreground' />
                      <span>{consultationType.duration} min duration</span>
                      {consultationType.restAfter > 0 && (
                        <span className='text-muted-foreground'>
                          + {consultationType.restAfter} min rest
                        </span>
                      )}
                    </div>

                    <div className='flex items-center gap-2 text-sm'>
                      <DollarSign className='h-4 w-4 text-muted-foreground' />
                      <span className='font-medium'>
                        ${consultationType.price}
                      </span>
                    </div>

                    {consultationType.canBookBefore > 0 && (
                      <div className='text-sm text-muted-foreground'>
                        Can book {consultationType.canBookBefore} min before
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className='flex justify-end gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleEdit(consultationType)}
                      className='flex items-center gap-1'
                    >
                      <Edit className='h-3 w-3' />
                      Edit
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleDelete(consultationType)}
                      className='flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300'
                    >
                      <Trash2 className='h-3 w-3' />
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            // Table View
            <DataTable
              data={filteredTypes}
              columns={tableColumns}
              selectable={true}
              sortable={true}
              pagination={true}
              pageSize={10}
              selectedRows={selectedRows}
              onMultiSelect={setSelectedRows}
              rowActions={renderRowActions}
              emptyMessage='No consultation types found'
            />
          )}
        </>
      )}

      {/* Form Modal */}
      <ConsultationTypeForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        consultationType={editingType}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, type: null })}
        onConfirm={confirmDelete}
        title='Delete Consultation Type'
        description={`Are you sure you want to delete "${deleteDialog.type?.name}"? This action cannot be undone and may affect existing appointments.`}
        confirmText='Delete'
        variant='destructive'
      />
    </div>
  );
};

export default ConsultationTypesPage;
