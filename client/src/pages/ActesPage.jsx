import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Globe,
  Phone,
  User,
  Clock,
  MessageSquare,
  Star,
  Stethoscope,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import ActeForm from '../components/actes/ActeForm';
import { acteAPI } from '../services/api';
import { showSuccess, showError } from '../lib/toast';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { ContentContainer, PageHeader } from '../components/Layout';

const ActesPage = () => {
  const navigate = useNavigate();
  const [actes, setActes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingActe, setEditingActe] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    acte: null,
  });

  const loadActes = async () => {
    try {
      setLoading(true);
      const data = await acteAPI.getAll();
      setActes(data);
    } catch (error) {
      console.error('Failed to load actes:', error);
      showError('Failed to load actes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActes();
  }, []);

  const handleAddNew = () => {
    setEditingActe(null);
    setShowForm(true);
  };

  const handleEdit = (acte) => {
    setEditingActe(acte);
    setShowForm(true);
  };

  const handleDelete = (acte) => {
    setDeleteDialog({ isOpen: true, acte });
  };

  const confirmDelete = async () => {
    try {
      await acteAPI.delete(deleteDialog.acte.id);
      showSuccess('Acte deleted successfully');
      setDeleteDialog({ isOpen: false, acte: null });
      loadActes();
    } catch (error) {
      console.error('Error deleting acte:', error);
      showError('Failed to delete acte');
    }
  };

  const formatDelay = (min, max) => {
    if (!min && !max) return '';
    const minText = min ? `${min} sem.` : '';
    const maxText = max ? `${max} mois` : '';
    if (minText && maxText) return `${minText} → ${maxText}`;
    return minText || maxText;
  };

  const getEligibilityIcons = (rule) => {
    const isAll = rule === 'ALL' || !rule;
    const isNew = rule === 'NEW';
    const isKnown = rule === 'KNOWN';

    return (
      <div className='flex space-x-1'>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isAll || isNew ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'
          }`}
        >
          N
        </div>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isAll || isKnown
              ? 'bg-black text-white'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          V
        </div>
      </div>
    );
  };

  return (
    <ContentContainer>
      <div className='flex justify-between items-start mb-6'>
        <div>
          <PageHeader
            title='Actes'
            description='Définissez tous les actes dont vous avez besoin pour décrire votre organisation (durée, règles de réservation, ...). Basculez ensuite sur vos types de consultations, nécessaires pour construire votre semaine type.'
          />
        </div>
        <div className='flex items-center space-x-2'>
          <span className='text-sm text-gray-500'>Groupez vos actes dans</span>
          <Button
            variant='secondary'
            className='bg-purple-600 text-white hover:bg-purple-700'
            onClick={() => navigate('/settings/consultation-types')}
          >
            Vos types de Cs →
          </Button>
        </div>
      </div>

      <Card className='p-6 bg-white shadow-sm'>
        <div className='mb-4'>
          <h2 className='text-xl font-bold flex items-center'>
            <span className='text-orange-400 mr-2'>
              <Stethoscope className='w-6 h-6' />
            </span>{' '}
            Médecine générale
          </h2>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b text-left text-sm font-medium text-gray-500'>
                <th className='py-3 pl-4'>Nom dans votre agenda</th>
                <th className='py-3'>Pour qui ?</th>
                <th className='py-3'>Canal</th>
                <th className='py-3'>Autonomie</th>
                <th className='py-3 pr-4 text-right'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {actes.map((acte) => (
                <tr key={acte.id} className='hover:bg-gray-50'>
                  <td className='py-4 pl-4'>
                    <div className='flex items-center space-x-3'>
                      <Star className='w-4 h-4 text-orange-200 fill-orange-200' />
                      <div
                        className='w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-medium'
                        style={{ backgroundColor: acte.color }}
                      >
                        {acte.duration}'
                      </div>
                      <div>
                        <div className='font-medium text-gray-900'>
                          {acte.name}
                        </div>
                        <div className='text-xs text-gray-500 flex items-center mt-0.5'>
                          <Clock className='w-3 h-3 mr-1' />
                          {formatDelay(
                            acte.minReservationGap,
                            acte.stopUntilNextAppt
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className='py-4'>
                    {getEligibilityIcons(acte.eligibilityRule)}
                  </td>
                  <td className='py-4'>
                    <div className='flex space-x-2 text-gray-600'>
                      {acte.canals && acte.canals.includes('INTERNET') && (
                        <Globe className='w-4 h-4' />
                      )}
                      {acte.canals && acte.canals.includes('TELEPHONE') && (
                        <Phone className='w-4 h-4' />
                      )}
                    </div>
                  </td>
                  <td className='py-4'>
                    <div className='flex space-x-2 text-gray-600'>
                      <User className='w-4 h-4' />
                      {acte.instructions && (
                        <MessageSquare className='w-4 h-4' />
                      )}
                    </div>
                  </td>
                  <td className='py-4 pr-4 text-right'>
                    <div className='flex justify-end space-x-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleEdit(acte)}
                        className='h-8'
                      >
                        Editer <Edit className='w-3 h-3 ml-2' />
                      </Button>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleDelete(acte)}
                        className='h-8 w-8 p-0 bg-red-500 hover:bg-red-600'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {actes.length === 0 && !loading && (
                <tr>
                  <td colSpan='5' className='py-8 text-center text-gray-500'>
                    Aucun acte défini. Cliquez sur "Ajouter" pour commencer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='mt-6'>
          <Button
            onClick={handleAddNew}
            className='bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6'
          >
            <Plus className='w-4 h-4 mr-2' /> Ajouter
          </Button>
        </div>
      </Card>

      <ActeForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        acte={editingActe}
        onSuccess={loadActes}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, acte: null })}
        onConfirm={confirmDelete}
        title="Supprimer l'acte"
        description={`Êtes-vous sûr de vouloir supprimer l'acte "${deleteDialog.acte?.name}" ? Cette action est irréversible.`}
      />
    </ContentContainer>
  );
};

export default ActesPage;
