import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  User,
  Calendar,
  Phone,
  Mail,
  Loader2,
  UserPlus,
  Shield,
  Info,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { patientAPI } from '../services/api';
import { showSuccess, showError } from '../lib/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import AddRelativeDialog from './AddRelativeDialog';

const PatientRelativesTab = ({ patient }) => {
  console.log({ patient });
  const [relatives, setRelatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [addRelativeOpen, setAddRelativeOpen] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Local state for permissions
  const [permissions, setPermissions] = useState({
    canAddRelatives: false,
    canBookForRelatives: false,
  });

  useEffect(() => {
    fetchRelatives();
    // Initialize permissions from patient prop
    if (patient) {
      setPermissions({
        canAddRelatives: patient.canAddRelatives || false,
        canBookForRelatives: patient.canBookForRelatives || false,
      });
    }
  }, [patient?.id]);

  const fetchRelatives = async () => {
    if (!patient?.id) return;

    setLoading(true);
    try {
      const data = await patientAPI.getRelatives(patient.id);
      setRelatives(data);
    } catch (error) {
      console.error('Error fetching relatives:', error);
      showError('Erreur lors du chargement des proches');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRelationship = async () => {
    if (!selectedRelationship) return;

    try {
      await patientAPI.removeRelationship(selectedRelationship.id);
      showSuccess('Relation supprimée avec succès');
      setDeleteDialogOpen(false);
      setSelectedRelationship(null);
      fetchRelatives();
    } catch (error) {
      console.error('Error deleting relationship:', error);
      showError('Erreur lors de la suppression de la relation');
    }
  };

  const openDeleteDialog = (relationship) => {
    setSelectedRelationship(relationship);
    setDeleteDialogOpen(true);
  };

  const handlePermissionChange = async (permissionKey, value) => {
    // Optimistically update UI
    setPermissions((prev) => ({ ...prev, [permissionKey]: value }));

    setSavingPermissions(true);
    try {
      await patientAPI.updatePermissions(patient.id, {
        [permissionKey]: value,
      });
      showSuccess('Autorisation mise à jour');
    } catch (error) {
      console.error('Error updating permission:', error);
      showError('Erreur lors de la mise à jour');
      // Revert on error
      setPermissions((prev) => ({ ...prev, [permissionKey]: !value }));
    } finally {
      setSavingPermissions(false);
    }
  };

  const getRelationshipLabel = (relationship) => {
    if (relationship.relationshipType === 'FAMILY') {
      const familyLabels = {
        SON: 'Fils',
        DAUGHTER: 'Fille',
        FATHER: 'Père',
        MOTHER: 'Mère',
        BROTHER: 'Frère',
        SISTER: 'Sœur',
        SPOUSE: 'Conjoint(e)',
        GRANDFATHER: 'Grand-père',
        GRANDMOTHER: 'Grand-mère',
        GRANDSON: 'Petit-fils',
        GRANDDAUGHTER: 'Petite-fille',
        UNCLE: 'Oncle',
        AUNT: 'Tante',
        NEPHEW: 'Neveu',
        NIECE: 'Nièce',
        COUSIN: 'Cousin(e)',
      };
      return (
        familyLabels[relationship.familyRelationship] ||
        relationship.familyRelationship
      );
    }
    return relationship.customRelationship || 'Autre';
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='w-6 h-6 animate-spin text-primary' />
        <span className='ml-2 text-muted-foreground'>
          Chargement des proches...
        </span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Permissions Section */}
      <Card className='p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'>
        <div className='space-y-4'>
          {/* Header */}
          <div className='flex items-start gap-3'>
            <Shield className='w-6 h-6 text-blue-600 mt-0.5 shrink-0' />
            <div className='flex-1'>
              <h4 className='font-semibold text-lg text-blue-900 mb-1'>
                Autorisations pour ce patient
              </h4>
              <p className='text-sm text-blue-700 flex items-start gap-2'>
                <Info className='w-4 h-4 mt-0.5 shrink-0' />
                <span>
                  Ces autorisations sont spécifiques à ce patient et
                  représentent des exceptions par rapport aux règles générales
                  de votre cabinet.
                </span>
              </p>
            </div>
          </div>

          {/* Permissions Toggles */}
          <div className='space-y-3 mt-4'>
            {/* Permission 1: Add Relatives */}
            <div className='flex items-start justify-between p-4 bg-white rounded-lg border border-blue-100 hover:border-blue-200 transition-colors'>
              <div className='flex-1 space-y-1 pr-4'>
                <Label
                  htmlFor='canAddRelatives'
                  className='text-base font-medium cursor-pointer text-gray-900'
                >
                  Ajouter des proches
                </Label>
                <p className='text-sm text-gray-600'>
                  Permet à ce patient d'ajouter de nouveaux proches à son profil
                  depuis son espace personnel.
                </p>
              </div>
              <Switch
                id='canAddRelatives'
                checked={permissions.canAddRelatives}
                onCheckedChange={(checked) =>
                  handlePermissionChange('canAddRelatives', checked)
                }
                disabled={savingPermissions}
              />
            </div>

            {/* Permission 2: Book for Relatives */}
            <div className='flex items-start justify-between p-4 bg-white rounded-lg border border-blue-100 hover:border-blue-200 transition-colors'>
              <div className='flex-1 space-y-1 pr-4'>
                <Label
                  htmlFor='canBookForRelatives'
                  className='text-base font-medium cursor-pointer text-gray-900'
                >
                  Prendre RDV pour un proche existant
                </Label>
                <p className='text-sm text-gray-600'>
                  Permet à ce patient de prendre des rendez-vous au nom de ses
                  proches déjà enregistrés.
                </p>
              </div>
              <Switch
                id='canBookForRelatives'
                checked={permissions.canBookForRelatives}
                onCheckedChange={(checked) =>
                  handlePermissionChange('canBookForRelatives', checked)
                }
                disabled={savingPermissions}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Header with actions */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h3 className='text-lg font-semibold'>Proches du patient</h3>
          {relatives.length > 0 && (
            <Badge variant='secondary' className='rounded-full'>
              {relatives.length}
            </Badge>
          )}
        </div>
        <Button size='sm' onClick={() => setAddRelativeOpen(true)}>
          <Plus className='w-4 h-4 mr-2' />
          Ajouter un proche
        </Button>
      </div>

      {/* Relatives List */}
      {relatives.length === 0 ? (
        <div className='text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg'>
          <Users className='w-12 h-12 mx-auto mb-4 opacity-50' />
          <p className='text-lg font-medium mb-2'>Aucun proche enregistré</p>
          <p className='text-sm mb-4'>
            Ajoutez des membres de la famille ou d'autres proches de ce patient
          </p>
          <Button onClick={() => setAddRelativeOpen(true)}>
            <Plus className='w-4 h-4 mr-2' />
            Ajouter un proche
          </Button>
        </div>
      ) : (
        <div className='space-y-3'>
          {relatives.map((relationship) => {
            const relative = relationship.relatedPatient;
            return (
              <Card
                key={relationship.id}
                className='p-4 hover:shadow-md transition-shadow'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex items-start gap-4 flex-1'>
                    {/* Avatar */}
                    <div className='w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-lg shrink-0'>
                      {relative.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className='flex-1 space-y-2'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <h4 className='font-semibold text-lg'>
                          {relative.name}
                        </h4>
                        <Badge
                          variant='secondary'
                          className='bg-purple-100 text-purple-700'
                        >
                          {getRelationshipLabel(relationship)}
                        </Badge>
                        <Badge variant='outline' className='text-xs'>
                          {relative.gender === 'MALE'
                            ? 'Homme'
                            : relative.gender === 'FEMALE'
                            ? 'Femme'
                            : 'Autre'}
                        </Badge>
                      </div>

                      <div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground'>
                        <div className='flex items-center gap-2'>
                          <Calendar className='w-4 h-4' />
                          <span>
                            {new Date(relative.dateOfBirth).toLocaleDateString(
                              'fr-FR'
                            )}
                            {' · '}
                            {calculateAge(relative.dateOfBirth)} ans
                          </span>
                        </div>

                        {relative.phoneNumber && (
                          <div className='flex items-center gap-2'>
                            <Phone className='w-4 h-4' />
                            <span>{relative.phoneNumber}</span>
                          </div>
                        )}

                        {relative.email && (
                          <div className='flex items-center gap-2 col-span-2'>
                            <Mail className='w-4 h-4' />
                            <span className='text-blue-600'>
                              {relative.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-red-600 hover:text-red-700 hover:bg-red-50'
                    onClick={() => openDeleteDialog(relationship)}
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Relative Dialog */}
      <AddRelativeDialog
        open={addRelativeOpen}
        onOpenChange={setAddRelativeOpen}
        mainPatient={patient}
        onSuccess={fetchRelatives}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette relation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette relation ? Cette action
              ne supprimera pas le patient, uniquement le lien de parenté avec{' '}
              {patient.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRelationship}
              className='bg-red-600 hover:bg-red-700'
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PatientRelativesTab;
