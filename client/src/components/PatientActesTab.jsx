import React, { useState, useEffect } from 'react';
import { Switch } from './ui/switch';
import { Loader2, Clock, Euro } from 'lucide-react';
import { patientAPI } from '../services/api';
import { showSuccess, showError } from '../lib/toast';

const PatientActesTab = ({ patient }) => {
  const [actes, setActes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (patient?.id) {
      loadActeAccess();
    }
  }, [patient?.id]);

  const loadActeAccess = async () => {
    try {
      setLoading(true);
      const data = await patientAPI.getActeAccess(patient.id);
      setActes(data);
    } catch (error) {
      console.error('Failed to load acte access:', error);
      showError('Échec du chargement des actes');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccess = async (acteId, currentStatus) => {
    try {
      setUpdating(acteId);
      await patientAPI.updateActeAccess(patient.id, {
        acteId,
        isEnabled: !currentStatus,
      });

      // Update local state
      setActes((prev) =>
        prev.map((acte) =>
          acte.id === acteId ? { ...acte, isEnabled: !currentStatus } : acte
        )
      );

      showSuccess(!currentStatus ? 'Acte activé' : 'Acte désactivé');
    } catch (error) {
      console.error('Failed to update acte access:', error);
      showError('Échec de la mise à jour');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='w-6 h-6 animate-spin text-primary' />
        <span className='ml-2 text-muted-foreground'>
          Chargement des actes...
        </span>
      </div>
    );
  }

  if (actes.length === 0) {
    return (
      <div className='text-center text-muted-foreground py-8'>
        <p>Aucun acte disponible</p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h3 className='text-sm font-medium text-muted-foreground'>
            Gérer l'accès aux actes
          </h3>
          <p className='text-xs text-muted-foreground mt-1'>
            Activer ou désactiver les actes pour ce patient
          </p>
        </div>
      </div>

      {actes.map((acte) => (
        <div
          key={acte.id}
          className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
            acte.isEnabled
              ? 'bg-white hover:bg-muted/30'
              : 'bg-muted/50 opacity-60'
          }`}
        >
          <div className='flex items-center gap-3 flex-1'>
            <div
              className='w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 font-semibold text-white'
              style={{
                backgroundColor: acte.isEnabled
                  ? acte.color || '#3B82F6'
                  : '#d1d5db',
              }}
            >
              {acte.name?.charAt(0)?.toUpperCase() || '•'}
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2'>
                <p className='font-medium text-foreground truncate'>
                  {acte.name}
                </p>
              </div>
              <div className='flex items-center gap-4 mt-1 text-xs text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Clock className='w-3 h-3' />
                  <span>{acte.duration} min</span>
                </div>
                <div className='flex items-center gap-1'>
                  <Euro className='w-3 h-3' />
                  <span>{(acte.regularPrice || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            {updating === acte.id ? (
              <Loader2 className='w-4 h-4 animate-spin text-muted-foreground' />
            ) : (
              <Switch
                checked={acte.isEnabled}
                onCheckedChange={() =>
                  handleToggleAccess(acte.id, acte.isEnabled)
                }
                disabled={updating !== null}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PatientActesTab;
