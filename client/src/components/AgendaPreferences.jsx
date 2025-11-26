import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Minus, Plus } from 'lucide-react';
import { showSuccess, showError } from '../lib/toast';
import { agendaPreferencesAPI } from '../services/api';

const SCHOOL_ZONES = {
  A: 'Besançon, Bordeaux, Clermont-Ferrand, Dijon, Grenoble, Limoges, Lyon, Poitiers',
  B: 'Aix-Marseille, Amiens, Caen, Lille, Nancy-Metz, Nantes, Nice, Orléans-Tours, Reims, Rennes, Rouen, Strasbourg',
  C: 'Créteil, Montpellier, Paris, Toulouse, Versailles',
};

const COLORS = [
  '#FFA500', // Orange
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DFE6E9', // Gray
  '#A29BFE', // Purple
  '#FD79A8', // Pink
  '#6C5CE7', // Indigo
];

const AgendaPreferences = () => {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState({
    mainColor: '#FFA500',
    startHour: 8,
    endHour: 20,
    verticalZoom: 1,
    schoolVacationZone: 'C',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const data = await agendaPreferencesAPI.get();
      if (data) {
        setPreferences({
          mainColor: data.mainColor || '#FFA500',
          startHour: data.startHour || 8,
          endHour: data.endHour || 20,
          verticalZoom: data.verticalZoom || 1,
          schoolVacationZone: data.schoolVacationZone || 'C',
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      await agendaPreferencesAPI.update(preferences);
      showSuccess('Préférences enregistrées avec succès');
      // Dispatch event to update calendar
      window.dispatchEvent(
        new CustomEvent('agendaPreferencesUpdated', { detail: preferences })
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
      showError("Erreur lors de l'enregistrement des préférences");
    }
  };

  const handleColorChange = (color) => {
    setPreferences({ ...preferences, mainColor: color });
  };

  const handleHourChange = (type, delta) => {
    const newValue = preferences[type] + delta;
    if (
      type === 'startHour' &&
      newValue >= 0 &&
      newValue < preferences.endHour
    ) {
      setPreferences({ ...preferences, [type]: newValue });
    } else if (
      type === 'endHour' &&
      newValue > preferences.startHour &&
      newValue <= 24
    ) {
      setPreferences({ ...preferences, [type]: newValue });
    }
  };

  const handleZoomChange = (delta) => {
    const newZoom = Math.max(
      0.5,
      Math.min(3, preferences.verticalZoom + delta * 0.1)
    );
    setPreferences({
      ...preferences,
      verticalZoom: parseFloat(newZoom.toFixed(1)),
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-gray-500'>Chargement...</div>
      </div>
    );
  }

  return (
    <div className='h-full bg-white'>
      {/* Header */}
      <div className='border-b border-gray-200 p-6'>
        <h2 className='text-xl font-semibold text-gray-900'>
          Préférences de l'agenda
        </h2>
        <p className='text-sm text-gray-500 mt-1'>
          Personnalisez l'apparence et les paramètres de votre agenda
        </p>
      </div>

      {/* Content */}
      <div className='p-6 space-y-8'>
        {/* Main Color */}
        <div className='space-y-3'>
          <Label className='text-sm font-medium text-gray-700'>
            Couleur principale
          </Label>
          <div className='flex items-center gap-3'>
            <div
              className='w-12 h-12 rounded-lg border-2 border-gray-300 flex-shrink-0'
              style={{ backgroundColor: preferences.mainColor }}
            />
            <div className='flex flex-wrap gap-2'>
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-8 h-8 rounded-md transition-all ${
                    preferences.mainColor === color
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Start Hour */}
        <div className='space-y-3'>
          <Label className='text-sm font-medium text-gray-700'>
            Heure de début
          </Label>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-full bg-gray-500 text-white flex items-center justify-center font-medium'>
              {preferences.startHour}
            </div>
            <div className='flex gap-2'>
              <button
                onClick={() => handleHourChange('startHour', -1)}
                className='w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors'
              >
                <Minus className='w-4 h-4' />
              </button>
              <button
                onClick={() => handleHourChange('startHour', 1)}
                className='w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors'
              >
                <Plus className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>

        {/* End Hour */}
        <div className='space-y-3'>
          <Label className='text-sm font-medium text-gray-700'>
            Heure de fin
          </Label>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-full bg-gray-500 text-white flex items-center justify-center font-medium'>
              {preferences.endHour}
            </div>
            <div className='flex gap-2'>
              <button
                onClick={() => handleHourChange('endHour', -1)}
                className='w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors'
              >
                <Minus className='w-4 h-4' />
              </button>
              <button
                onClick={() => handleHourChange('endHour', 1)}
                className='w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors'
              >
                <Plus className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>

        {/* Vertical Zoom */}
        <div className='space-y-3'>
          <Label className='text-sm font-medium text-gray-700'>
            Zoom vertical
          </Label>
          <div className='flex items-center gap-3'>
            <div className='flex gap-2'>
              <button
                onClick={() => handleZoomChange(-1)}
                className='w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors'
              >
                <Minus className='w-4 h-4' />
              </button>
              <button
                onClick={() => handleZoomChange(1)}
                className='w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors'
              >
                <Plus className='w-4 h-4' />
              </button>
            </div>
            <span className='text-sm text-gray-600'>
              {preferences.verticalZoom.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* School Vacation Zone */}
        <div className='space-y-3'>
          <Label className='text-sm font-medium text-gray-700'>
            Vacances scolaires
          </Label>
          <Select
            value={preferences.schoolVacationZone}
            onValueChange={(value) =>
              setPreferences({ ...preferences, schoolVacationZone: value })
            }
          >
            <SelectTrigger className='w-full max-w-xs'>
              <SelectValue placeholder='Sélectionner une zone' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='A'>Zone A</SelectItem>
              <SelectItem value='B'>Zone B</SelectItem>
              <SelectItem value='C'>Zone C</SelectItem>
            </SelectContent>
          </Select>

          {/* Zone information */}
          <div className='mt-4 space-y-2'>
            {Object.entries(SCHOOL_ZONES).map(([zone, cities]) => (
              <div
                key={zone}
                className={`p-3 rounded-lg ${
                  preferences.schoolVacationZone === zone
                    ? 'bg-purple-50 border border-purple-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className='font-medium text-sm text-purple-700'>
                  Zone {zone}
                </div>
                <div className='text-xs text-gray-600 mt-1'>{cities}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className='pt-4 border-t border-gray-200'>
          <Button onClick={savePreferences} className='w-full'>
            Enregistrer les préférences
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgendaPreferences;
