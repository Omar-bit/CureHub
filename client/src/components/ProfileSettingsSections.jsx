import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';

/**
 * ProfessionalInfoSection Component
 * Displays and manages doctor's professional information (RPPS, SIREN, languages, etc.)
 */
export const ProfessionalInfoSection = ({ profile, onChange, isEditing }) => {
  const [languages, setLanguages] = useState([]);
  const [langInput, setLangInput] = useState('');

  useEffect(() => {
    if (profile?.languagesSpoken) {
      try {
        setLanguages(Array.isArray(profile.languagesSpoken) 
          ? profile.languagesSpoken 
          : JSON.parse(profile.languagesSpoken || '[]'));
      } catch {
        setLanguages([]);
      }
    }
  }, [profile?.languagesSpoken]);

  const handleAddLanguage = () => {
    if (langInput.trim() && !languages.includes(langInput.trim())) {
      const newLangs = [...languages, langInput.trim()];
      setLanguages(newLangs);
      onChange('languagesSpoken', JSON.stringify(newLangs));
      setLangInput('');
    }
  };

  const handleRemoveLanguage = (lang) => {
    const newLangs = languages.filter(l => l !== lang);
    setLanguages(newLangs);
    onChange('languagesSpoken', JSON.stringify(newLangs));
  };

  const handleDiplomChange = (e) => {
    onChange('diplomas', e.target.value);
  };

  const handleAdditionalDiplomChange = (e) => {
    onChange('additionalDiplomas', e.target.value);
  };

  return (
    <Card className="rounded-xl shadow-soft border-0 bg-white">
      <CardHeader className="pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <span className="text-lg">💼</span>
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Votre activité
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* RPPS Number */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Numéro RPPS
          </label>
          <Input
            value={profile?.rppsNumber || ''}
            onChange={(e) => onChange('rppsNumber', e.target.value)}
            placeholder="10100381721"
            disabled={!isEditing}
            className="text-gray-900 border-gray-200"
          />
          <p className="text-xs text-gray-500">
            Où trouver mon numéro RPPS ? <a href="#" className="text-teal-600 hover:underline">annuaire.sante.fr</a>
          </p>
        </div>

        {/* SIREN Number */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Numéro SIREN
          </label>
          <Input
            value={profile?.sirenNumber || ''}
            onChange={(e) => onChange('sirenNumber', e.target.value)}
            placeholder="Numéro SIREN"
            disabled={!isEditing}
            className="text-gray-900 border-gray-200"
          />
          <p className="text-xs text-gray-500">
            Où trouver mon numéro SIREN ? <a href="#" className="text-teal-600 hover:underline">societe.com</a>
          </p>
        </div>

        {/* Languages */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Langues parlées
          </label>
          {isEditing && (
            <div className="flex gap-2 mb-3">
              <Input
                value={langInput}
                onChange={(e) => setLangInput(e.target.value)}
                placeholder="Ex: Français"
                onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
              />
              <Button
                type="button"
                onClick={handleAddLanguage}
                variant="outline"
                size="sm"
              >
                Ajouter
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <div
                key={lang}
                className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                {lang}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveLanguage(lang)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {!isEditing && languages.length === 0 && (
            <p className="text-sm text-gray-500">Aucune langue renseignée</p>
          )}
        </div>

        {/* Diplomas */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Diplômes
          </label>
          <Textarea
            value={profile?.diplomas || ''}
            onChange={handleDiplomChange}
            placeholder="D.E.S. Médecine générale"
            disabled={!isEditing}
            className="text-gray-900 border-gray-200 resize-none"
            rows={3}
          />
        </div>

        {/* Additional Diplomas */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Autres diplômes et formations
          </label>
          <Textarea
            value={profile?.additionalDiplomas || ''}
            onChange={handleAdditionalDiplomChange}
            placeholder="Maître de stage universitaire"
            disabled={!isEditing}
            className="text-gray-900 border-gray-200 resize-none"
            rows={3}
          />
        </div>

        {/* Publications */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Publications
          </label>
          <Textarea
            value={profile?.publications || ''}
            onChange={(e) => onChange('publications', e.target.value)}
            placeholder="Vos publications..."
            disabled={!isEditing}
            className="text-gray-900 border-gray-200 resize-none"
            rows={3}
          />
        </div>

        {/* Signature */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Signature
          </label>
          <div className="flex items-center gap-3">
            <Input
              value={profile?.signature || ''}
              onChange={(e) => onChange('signature', e.target.value)}
              placeholder="Dr DAVID"
              disabled={!isEditing}
              maxLength="32"
              className="text-gray-900 border-gray-200"
            />
            <span className="text-2xl text-gray-400">32</span>
          </div>
        </div>

        {/* Absence Message */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            En cas d'absence
          </label>
          <Textarea
            value={profile?.absenceMessage || ''}
            onChange={(e) => onChange('absenceMessage', e.target.value)}
            placeholder="Votre absence a été préjudiciable au bon fonctionnement du cabinet..."
            disabled={!isEditing}
            className="text-gray-900 border-gray-200 resize-none"
            rows={4}
          />
          <p className="text-xs text-gray-500">
            Rédiger votre modèle de message, prêt à envoyer...
          </p>
        </div>

        {/* Too Many Absences Info */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Trop d'absences !
          </label>
          <Textarea
            value={profile?.tooManyAbsencesInfo || ''}
            onChange={(e) => onChange('tooManyAbsencesInfo', e.target.value)}
            placeholder="Vos absences répétées ont empêché d'autres patients d'accéder aux consultations sur ces créneaux-là..."
            disabled={!isEditing}
            className="text-gray-900 border-gray-200 resize-none"
            rows={4}
          />
          <p className="text-xs text-gray-500">
            En cas d'absences répétées, expliquez pourquoi la réservation est bloquée...
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * CabinetInfoSection Component
 * Displays and manages clinic/cabinet information
 */
export const CabinetInfoSection = ({ profile, onChange, isEditing }) => {
  return (
    <Card className="rounded-xl shadow-soft border-0 bg-white">
      <CardHeader className="pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <span className="text-lg">🏥</span>
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Votre cabinet
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Cabinet Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Nom complet du cabinet
          </label>
          <Input
            value={profile?.cabinetName || ''}
            onChange={(e) => onChange('cabinetName', e.target.value)}
            placeholder="Cabinet médical du Dr DAVID"
            disabled={!isEditing}
            className="text-gray-900 border-gray-200"
          />
        </div>

        {/* Cabinet Gender */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Genre du cabinet
          </label>
          <select
            value={profile?.cabinetGender || 'masculin'}
            onChange={(e) => onChange('cabinetGender', e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-gray-900 bg-white disabled:bg-gray-50"
          >
            <option value="masculin">masculin (ex: LE cabinet...)</option>
            <option value="feminin">féminin (ex: LA cabinet...)</option>
          </select>
        </div>

        {/* Address Line 1 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Adresse (ligne 1)
          </label>
          <Input
            value={profile?.clinicAddress || ''}
            onChange={(e) => onChange('clinicAddress', e.target.value)}
            placeholder="12 Rue Nationale"
            disabled={!isEditing}
            className="text-gray-900 border-gray-200"
          />
        </div>

        {/* Address Line 2 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Adresse (ligne 2)
          </label>
          <Input
            value={profile?.clinicAddress2 || ''}
            onChange={(e) => onChange('clinicAddress2', e.target.value)}
            placeholder="Apt, Bureau, etc."
            disabled={!isEditing}
            className="text-gray-900 border-gray-200"
          />
        </div>

        {/* Postal Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Code postal
          </label>
          <Input
            value={profile?.clinicPostalCode || ''}
            onChange={(e) => onChange('clinicPostalCode', e.target.value)}
            placeholder="32320"
            disabled={!isEditing}
            className="text-gray-900 border-gray-200"
          />
        </div>

        {/* City */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Ville
          </label>
          <Input
            value={profile?.clinicCity || ''}
            onChange={(e) => onChange('clinicCity', e.target.value)}
            placeholder="MONTESQUIOU"
            disabled={!isEditing}
            className="text-gray-900 border-gray-200"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Téléphone
          </label>
          <Input
            value={profile?.clinicPhone || ''}
            onChange={(e) => onChange('clinicPhone', e.target.value)}
            placeholder="Téléphone du cabinet"
            disabled={!isEditing}
            type="tel"
            className="text-gray-900 border-gray-200"
          />
        </div>

        {/* Amenities Section */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <label className="text-sm font-semibold text-gray-700">
            Aménagement
          </label>
          
          <div className="flex items-center gap-3">
            <Checkbox
              checked={profile?.prmAccess || false}
              onCheckedChange={(checked) => onChange('prmAccess', checked)}
              disabled={!isEditing}
            />
            <label
              className="text-sm text-gray-700 cursor-pointer"
            >
              Accès PMR
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              checked={profile?.videoSurveillance || false}
              onCheckedChange={(checked) => onChange('videoSurveillance', checked)}
              disabled={!isEditing}
            />
            <label
              className="text-sm text-gray-700 cursor-pointer"
            >
              Vidéo surveillance
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
