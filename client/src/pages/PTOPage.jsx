import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Edit2, Trash2, Calendar, Users } from 'lucide-react';
import { ContentContainer, PageHeader } from '../components/Layout';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { ptoAPI } from '../services/api';
import { showError, showSuccess } from '../lib/toast';

const PTOPage = () => {
  const [ptos, setPtos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPTO, setEditingPTO] = useState(null);
  const [selectedPTO, setSelectedPTO] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    startDate: '',
    endDate: '',
    announcements: 2,
  });

  useEffect(() => {
    loadPTOs();
  }, []);

  const loadPTOs = async () => {
    try {
      setLoading(true);
      const data = await ptoAPI.getAll();
      setPtos(data);
    } catch (error) {
      showError(
        error.response?.data?.message ||
          'Failed to load PTO periods. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (pto = null) => {
    if (pto) {
      setEditingPTO(pto);
      setFormData({
        label: pto.label,
        startDate: format(new Date(pto.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(pto.endDate), 'yyyy-MM-dd'),
        announcements: pto.announcements,
      });
    } else {
      setEditingPTO(null);
      setFormData({
        label: '',
        startDate: '',
        endDate: '',
        announcements: 2,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPTO(null);
    setFormData({
      label: '',
      startDate: '',
      endDate: '',
      announcements: 2,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.label.trim()) {
      showError('Please enter a label');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      showError('Please select both start and end dates');
      return;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      showError('Start date must be before or equal to end date');
      return;
    }

    try {
      if (editingPTO) {
        await ptoAPI.update(editingPTO.id, formData);
        showSuccess('PTO period updated successfully');
      } else {
        await ptoAPI.create(formData);
        showSuccess('PTO period created successfully');
      }
      handleCloseDialog();
      loadPTOs();
    } catch (error) {
      showError(
        error.response?.data?.message ||
          `Failed to ${editingPTO ? 'update' : 'create'} PTO period`
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedPTO) return;

    try {
      await ptoAPI.delete(selectedPTO.id);
      showSuccess('PTO period deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedPTO(null);
      loadPTOs();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete PTO period');
    }
  };

  const openDeleteDialog = (pto) => {
    setSelectedPTO(pto);
    setDeleteDialogOpen(true);
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${format(start, 'dd/MM/yyyy', { locale: fr })} - ${format(
      end,
      'dd/MM/yyyy',
      { locale: fr }
    )}`;
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <PageHeader
          title='Congés'
          subtitle='Gérez vos périodes de congés et de formation'
        />
        <ContentContainer className='py-8'>
          <div className='flex justify-center items-center h-64'>
            <div className='text-gray-500'>Chargement...</div>
          </div>
        </ContentContainer>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <PageHeader
        title='Congés'
        subtitle='Dr Nicole David | Cabinet médical du Dr DAVID'
      />

      <ContentContainer className='py-8'>
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>
                  Ajoutez, modifiez ou supprimez vos congés...
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* PTO Table */}
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b bg-gray-50'>
                    <th className='text-left p-3 font-medium text-gray-700'>
                      Libellé
                    </th>
                    <th className='text-left p-3 font-medium text-gray-700'>
                      Début (inclus)
                    </th>
                    <th className='text-left p-3 font-medium text-gray-700'>
                      Fin (inclus)
                    </th>
                    <th className='text-left p-3 font-medium text-gray-700'>
                      Annonces
                    </th>
                    <th className='text-left p-3 font-medium text-gray-700'>
                      Nb RDV
                    </th>
                    <th className='text-left p-3 font-medium text-gray-700'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ptos.map((pto) => (
                    <tr key={pto.id} className='border-b hover:bg-gray-50'>
                      <td className='p-3'>
                        <div className='flex items-center gap-2'>
                          <Users className='h-4 w-4 text-gray-500' />
                          <span>{pto.label}</span>
                        </div>
                      </td>
                      <td className='p-3'>
                        {format(new Date(pto.startDate), 'dd/MM/yyyy')}
                      </td>
                      <td className='p-3'>
                        {format(new Date(pto.endDate), 'dd/MM/yyyy')}
                      </td>
                      <td className='p-3'>{pto.announcements}</td>
                      <td className='p-3'>{pto.appointmentsCount}</td>
                      <td className='p-3'>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleOpenDialog(pto)}
                            className='text-blue-600 hover:text-blue-800'
                          >
                            <Edit2 className='h-4 w-4' />
                            Editer
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => openDeleteDialog(pto)}
                            className='text-red-600 hover:text-red-800'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {ptos.length === 0 && (
                    <tr>
                      <td colSpan='6' className='p-8 text-center text-gray-500'>
                        Aucun congé configuré. Cliquez sur "Ajouter un congé"
                        pour commencer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Button */}
            <div className='mt-6'>
              <Button
                onClick={() => handleOpenDialog()}
                className='bg-purple-600 hover:bg-purple-700 text-white'
              >
                <Plus className='h-4 w-4 mr-2' />
                Ajouter un congé
              </Button>
            </div>
          </CardContent>
        </Card>
      </ContentContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>
              {editingPTO ? 'Modifier le congé' : 'Ajouter un congé'}
            </DialogTitle>
            <DialogDescription>
              Ajoutez, modifiez ou supprimez vos congés...
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='label'>Libellé</Label>
                <Input
                  id='label'
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  placeholder='Formation'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='startDate'>Date de début</Label>
                <div className='relative'>
                  <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    id='startDate'
                    type='date'
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className='pl-10'
                    required
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='endDate'>Date de fin</Label>
                <div className='relative'>
                  <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    id='endDate'
                    type='date'
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className='pl-10'
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={handleCloseDialog}
              >
                Annuler
              </Button>
              <Button
                type='submit'
                className='bg-purple-600 hover:bg-purple-700'
              >
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title='Supprimer le congé'
        description={`Êtes-vous sûr de vouloir supprimer le congé "${selectedPTO?.label}" ?`}
        onConfirm={handleDelete}
        confirmText='Supprimer'
        cancelText='Annuler'
      />
    </div>
  );
};

export default PTOPage;
