import React, { useState, useEffect } from 'react';
import { Switch } from './ui/switch';
import { Loader2, MapPin, Clock, Euro } from 'lucide-react';
import { patientAPI } from '../services/api';
import { showSuccess, showError } from '../lib/toast';

const PatientActesTab = ({ patient }) => {
  const [consultationTypes, setConsultationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (patient?.id) {
      loadConsultationTypeAccess();
    }
  }, [patient?.id]);

  const loadConsultationTypeAccess = async () => {
    try {
      setLoading(true);
      const data = await patientAPI.getConsultationTypeAccess(patient.id);
      setConsultationTypes(data);
    } catch (error) {
      console.error('Failed to load consultation type access:', error);
      showError('Échec du chargement des types de consultation');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccess = async (consultationTypeId, currentStatus) => {
    try {
      setUpdating(consultationTypeId);
      await patientAPI.updateConsultationTypeAccess(patient.id, {
        consultationTypeId,
        isEnabled: !currentStatus,
      });

      // Update local state
      setConsultationTypes((prev) =>
        prev.map((ct) =>
          ct.id === consultationTypeId
            ? { ...ct, isEnabled: !currentStatus }
            : ct
        )
      );

      showSuccess(
        !currentStatus
          ? 'Type de consultation activé'
          : 'Type de consultation désactivé'
      );
    } catch (error) {
      console.error('Failed to update consultation type access:', error);
      showError('Échec de la mise à jour');
    } finally {
      setUpdating(null);
    }
  };

  const getLocationLabel = (location) => {
    const labels = {
      ONSITE: 'Au cabinet',
      ONLINE: 'Téléconsultation',
      ATHOME: 'À domicile',
    };
    return labels[location] || location;
  };

  const getLocationIcon = (location) => {
    switch (location) {
      case 'ONLINE':
        return '🌐';
      case 'ATHOME':
        return '🏠';
      case 'ONSITE':
      default:
        return '🏥';
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

  if (consultationTypes.length === 0) {
    return (
      <div className='text-center text-muted-foreground py-8'>
        <p>Aucun type de consultation disponible</p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h3 className='text-sm font-medium text-muted-foreground'>
            Gérer l'accès aux types de consultation
          </h3>
          <p className='text-xs text-muted-foreground mt-1'>
            Activer ou désactiver les types de consultation pour ce patient
          </p>
        </div>
      </div>

      {consultationTypes.map((consultationType) => (
        <div
          key={consultationType.id}
          className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
            consultationType.isEnabled
              ? 'bg-white hover:bg-muted/30'
              : 'bg-muted/50 opacity-60'
          }`}
        >
          <div className='flex items-center gap-3 flex-1'>
            <div
              className='w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0'
              style={{
                backgroundColor: consultationType.isEnabled
                  ? `${consultationType.color}20`
                  : '#e5e7eb',
              }}
            >
              {getLocationIcon(consultationType.location)}
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2'>
                <p className='font-medium text-foreground truncate'>
                  {consultationType.name}
                </p>
                <span
                  className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium'
                  style={{
                    backgroundColor: consultationType.isEnabled
                      ? `${consultationType.color}20`
                      : '#e5e7eb',
                    color: consultationType.isEnabled
                      ? consultationType.color
                      : '#6b7280',
                  }}
                >
                  {getLocationLabel(consultationType.location)}
                </span>
              </div>
              <div className='flex items-center gap-4 mt-1 text-xs text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Clock className='w-3 h-3' />
                  <span>{consultationType.duration} min</span>
                </div>
                <div className='flex items-center gap-1'>
                  <Euro className='w-3 h-3' />
                  <span>{consultationType.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            {updating === consultationType.id ? (
              <Loader2 className='w-4 h-4 animate-spin text-muted-foreground' />
            ) : (
              <Switch
                checked={consultationType.isEnabled}
                onCheckedChange={() =>
                  handleToggleAccess(
                    consultationType.id,
                    consultationType.isEnabled
                  )
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
