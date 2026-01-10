import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Search,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { SearchBar } from '../components/ui/search-bar';
import ModeExerciceForm from '../components/ModeExerciceForm';
import { modeExerciceAPI } from '../services/api';
import { showSuccess, showError } from '../lib/toast';

const ModeExercicePage = () => {
  const navigate = useNavigate();
  const [modeExercices, setModeExercices] = useState([]);
  const [filteredModeExercices, setFilteredModeExercices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingModeExercice, setEditingModeExercice] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    modeExercice: null,
  });

  // Load mode exercices
  const loadModeExercices = async () => {
    try {
      setLoading(true);
      const response = await modeExerciceAPI.getAll();
      setModeExercices(response);
      setFilteredModeExercices(response);
    } catch (error) {
      console.error('Error loading mode exercices:', error);
      showError('Erreur lors du chargement des modes d\'exercice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModeExercices();
  }, []);

  // Filter mode exercices based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredModeExercices(modeExercices);
    } else {
      const filtered = modeExercices.filter(
        (mode) =>
          mode.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (mode.description &&
            mode.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredModeExercices(filtered);
    }
  }, [searchTerm, modeExercices]);

  const handleAddNew = () => {
    setEditingModeExercice(null);
    setShowForm(true);
  };

  const handleEdit = (modeExercice) => {
    setEditingModeExercice(modeExercice);
    setShowForm(true);
  };

  const handleDelete = (modeExercice) => {
    setDeleteDialog({ isOpen: true, modeExercice });
  };

  const confirmDelete = async () => {
    try {
      await modeExerciceAPI.delete(deleteDialog.modeExercice.id);
      showSuccess('Mode d\'exercice supprimé avec succès');
      setDeleteDialog({ isOpen: false, modeExercice: null });
      loadModeExercices();
    } catch (error) {
      console.error('Error deleting mode exercice:', error);
      showError('Erreur lors de la suppression');
    }
  };

  const handleFormSuccess = () => {
    loadModeExercices();
  };

  if (loading) {
    return (
      <div className='p-6 space-y-6'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold'>Mode d'exercice</h1>
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
          <h1 className='text-2xl font-bold'>Mode d'exercice</h1>
          <p className='text-muted-foreground'>
            Gérez les modes d'exercice de votre cabinet
          </p>
        </div>
        <Button onClick={handleAddNew} className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          Ajouter
        </Button>
      </div>

      {/* Search */}
      <div className='flex justify-between items-center'>
        <div className='flex items-center gap-4'>
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un mode d'exercice..."
            className='max-w-md'
          />
        </div>
        <div className='text-sm text-muted-foreground'>
          {filteredModeExercices.length} sur {modeExercices.length} modes
        </div>
      </div>

      {/* Mode Exercices Content */}
      {filteredModeExercices.length === 0 ? (
        <Card className='p-12 text-center'>
          <div className='mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4'>
            <BookOpen className='h-8 w-8 text-muted-foreground' />
          </div>
          <h3 className='text-lg font-semibold mb-2'>
            {searchTerm
              ? 'Aucun mode d\'exercice trouvé'
              : 'Aucun mode d\'exercice pour le moment'}
          </h3>
          <p className='text-muted-foreground mb-6'>
            {searchTerm
              ? 'Essayez de modifier vos critères de recherche'
              : 'Créez votre premier mode d\'exercice pour commencer'}
          </p>
          {!searchTerm && (
            <Button onClick={handleAddNew}>
              <Plus className='h-4 w-4 mr-2' />
              Ajouter votre premier mode
            </Button>
          )}
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredModeExercices.map((modeExercice) => (
            <Card
              key={modeExercice.id}
              className='p-6 hover:shadow-md transition-shadow'
            >
              {/* Header with color indicator */}
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <div
                    className='w-4 h-4 rounded-full border-2 border-white shadow-sm'
                    style={{ backgroundColor: modeExercice.color }}
                  />
                  <div>
                    <h3 className='font-semibold text-lg'>
                      {modeExercice.name}
                    </h3>
                    {modeExercice.nomDesPlages && (
                      <div className='flex items-center gap-1 text-sm text-muted-foreground mt-1'>
                        <span className='px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs'>
                          Nom des plages activé
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {modeExercice.description && (
                <div className='mb-4'>
                  <p className='text-sm text-gray-600 line-clamp-2'>
                    {modeExercice.description}
                  </p>
                </div>
              )}

              {/* Color display */}
              <div className='mb-4'>
                <div className='flex items-center gap-2'>
                  <div
                    className='w-8 h-8 rounded-lg border border-gray-200'
                    style={{ backgroundColor: modeExercice.color }}
                  />
                  <span className='text-xs text-muted-foreground'>
                    {modeExercice.color}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleEdit(modeExercice)}
                  className='flex items-center gap-1'
                >
                  <Edit className='h-3 w-3' />
                  Modifier
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleDelete(modeExercice)}
                  className='flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300'
                >
                  <Trash2 className='h-3 w-3' />
                  Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <ModeExerciceForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingModeExercice(null);
        }}
        modeExercice={editingModeExercice}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, modeExercice: null })}
        onConfirm={confirmDelete}
        title="Supprimer Mode d'exercice"
        description={`Êtes-vous sûr de vouloir supprimer "${deleteDialog.modeExercice?.name}" ? Cette action est irréversible.`}
        confirmText='Supprimer'
        cancelText='Annuler'
        variant='destructive'
      />
    </div>
  );
};

export default ModeExercicePage;

