import React, { useState, useEffect } from 'react';
import { Shield, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Card } from './ui/card';
import { patientAPI } from '../services/api';
import { showSuccess, showError } from '../lib/toast';

const PatientPermissionsDialog = ({ open, onOpenChange, patient }) => {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState({
    canAddRelatives: false,
    canBookForRelatives: false,
  });

  useEffect(() => {
    if (patient) {
      setPermissions({
        canAddRelatives: patient.canAddRelatives || false,
        canBookForRelatives: patient.canBookForRelatives || false,
      });
    }
  }, [patient]);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await patientAPI.updatePermissions(patient.id, permissions);
      showSuccess('Autorisations mises à jour avec succès');
      onOpenChange(false);
      // Optionally refresh patient data in parent component
      window.location.reload(); // Simple reload for now
    } catch (error) {
      console.error('Error updating permissions:', error);
      showError(
        error.response?.data?.message ||
          'Erreur lors de la mise à jour des autorisations'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Shield className='w-5 h-5' />
            Autorisations pour {patient?.name}
          </DialogTitle>
          <DialogDescription>
            Gérez les autorisations de ce patient concernant l'ajout de proches
            et la prise de rendez-vous.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Info Card */}
          <Card className='p-4 bg-blue-50 border-blue-200'>
            <div className='flex items-start gap-3'>
              <Info className='w-5 h-5 text-blue-600 mt-0.5 shrink-0' />
              <div className='text-sm text-blue-900'>
                <p className='font-medium mb-1'>
                  Exceptions par rapport aux règles du cabinet
                </p>
                <p className='text-blue-700'>
                  Ces autorisations sont spécifiques à ce patient et peuvent
                  être différentes des règles générales de votre cabinet.
                </p>
              </div>
            </div>
          </Card>

          {/* Permission 1: Add Relatives */}
          <div className='flex items-start justify-between space-x-4 p-4 border rounded-lg'>
            <div className='flex-1 space-y-1'>
              <Label
                htmlFor='canAddRelatives'
                className='text-base font-medium cursor-pointer'
              >
                Ajouter des proches
              </Label>
              <p className='text-sm text-muted-foreground'>
                Permet à ce patient d'ajouter de nouveaux proches à son profil
                depuis son espace personnel.
              </p>
            </div>
            <Switch
              id='canAddRelatives'
              checked={permissions.canAddRelatives}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, canAddRelatives: checked })
              }
            />
          </div>

          {/* Permission 2: Book for Relatives */}
          <div className='flex items-start justify-between space-x-4 p-4 border rounded-lg'>
            <div className='flex-1 space-y-1'>
              <Label
                htmlFor='canBookForRelatives'
                className='text-base font-medium cursor-pointer'
              >
                Prendre RDV pour un proche existant
              </Label>
              <p className='text-sm text-muted-foreground'>
                Permet à ce patient de prendre des rendez-vous au nom de ses
                proches déjà enregistrés.
              </p>
            </div>
            <Switch
              id='canBookForRelatives'
              checked={permissions.canBookForRelatives}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, canBookForRelatives: checked })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PatientPermissionsDialog;
