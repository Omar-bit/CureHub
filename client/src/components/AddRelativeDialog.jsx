import React, { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { patientAPI } from '../services/api';
import { showSuccess, showError } from '../lib/toast';

const FAMILY_RELATIONSHIPS = [
  { value: 'SON', label: 'Fils' },
  { value: 'DAUGHTER', label: 'Fille' },
  { value: 'FATHER', label: 'Père' },
  { value: 'MOTHER', label: 'Mère' },
  { value: 'BROTHER', label: 'Frère' },
  { value: 'SISTER', label: 'Sœur' },
  { value: 'SPOUSE', label: 'Conjoint(e)' },
  { value: 'GRANDFATHER', label: 'Grand-père' },
  { value: 'GRANDMOTHER', label: 'Grand-mère' },
  { value: 'GRANDSON', label: 'Petit-fils' },
  { value: 'GRANDDAUGHTER', label: 'Petite-fille' },
  { value: 'UNCLE', label: 'Oncle' },
  { value: 'AUNT', label: 'Tante' },
  { value: 'NEPHEW', label: 'Neveu' },
  { value: 'NIECE', label: 'Nièce' },
  { value: 'COUSIN', label: 'Cousin(e)' },
];

const AddRelativeDialog = ({ open, onOpenChange, mainPatient, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('new');
  const [loading, setLoading] = useState(false);

  // New patient form state
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phoneNumber: '',
    address: '',
  });

  // Relationship form state
  const [relationshipForm, setRelationshipForm] = useState({
    relationshipType: 'FAMILY',
    familyRelationship: '',
    customRelationship: '',
  });

  // Existing patient selection
  const [existingPatients, setExistingPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const resetForms = () => {
    setNewPatientForm({
      name: '',
      dateOfBirth: '',
      gender: '',
      email: '',
      phoneNumber: '',
      address: '',
    });
    setRelationshipForm({
      relationshipType: 'FAMILY',
      familyRelationship: '',
      customRelationship: '',
    });
    setSelectedPatientId('');
    setSearchQuery('');
  };

  const handleClose = () => {
    resetForms();
    onOpenChange(false);
  };

  // Search for existing patients
  const searchPatients = async (query) => {
    if (!query || query.length < 2) {
      setExistingPatients([]);
      return;
    }

    try {
      const data = await patientAPI.getAll({ search: query });
      // Filter out the main patient and already related patients
      const filtered = data.filter((p) => p.id !== mainPatient.id);
      setExistingPatients(filtered);
    } catch (error) {
      console.error('Error searching patients:', error);
      showError('Erreur lors de la recherche');
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchPatients(query);
  };

  const handleSubmitNewPatient = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate relationship
      if (
        relationshipForm.relationshipType === 'FAMILY' &&
        !relationshipForm.familyRelationship
      ) {
        showError('Veuillez sélectionner le type de relation familiale');
        setLoading(false);
        return;
      }

      if (
        relationshipForm.relationshipType === 'OTHER' &&
        !relationshipForm.customRelationship
      ) {
        showError('Veuillez spécifier le type de relation');
        setLoading(false);
        return;
      }

      const payload = {
        patient: newPatientForm,
        relationship: relationshipForm,
      };

      await patientAPI.createWithRelationship(mainPatient.id, payload);
      showSuccess('Proche ajouté avec succès');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating patient with relationship:', error);
      showError(
        error.response?.data?.message || 'Erreur lors de la création du proche'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExistingPatient = async (e) => {
    e.preventDefault();

    if (!selectedPatientId) {
      showError('Veuillez sélectionner un patient');
      return;
    }

    setLoading(true);

    try {
      // Validate relationship
      if (
        relationshipForm.relationshipType === 'FAMILY' &&
        !relationshipForm.familyRelationship
      ) {
        showError('Veuillez sélectionner le type de relation familiale');
        setLoading(false);
        return;
      }

      if (
        relationshipForm.relationshipType === 'OTHER' &&
        !relationshipForm.customRelationship
      ) {
        showError('Veuillez spécifier le type de relation');
        setLoading(false);
        return;
      }

      await patientAPI.addExistingRelative(
        mainPatient.id,
        selectedPatientId,
        relationshipForm
      );
      showSuccess('Proche ajouté avec succès');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error adding existing patient as relative:', error);
      showError(
        error.response?.data?.message || "Erreur lors de l'ajout du proche"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Ajouter un proche</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau patient ou sélectionnez un patient existant comme
            proche de <strong>{mainPatient?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='new'>
              <Plus className='w-4 h-4 mr-2' />
              Nouveau patient
            </TabsTrigger>
            <TabsTrigger value='existing'>
              <UserPlus className='w-4 h-4 mr-2' />
              Patient existant
            </TabsTrigger>
          </TabsList>

          <TabsContent value='new' className='space-y-4'>
            <form onSubmit={handleSubmitNewPatient} className='space-y-4'>
              {/* Patient Information */}
              <div className='space-y-3'>
                <h3 className='font-semibold text-sm'>
                  Informations du patient
                </h3>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='col-span-2'>
                    <Label htmlFor='name'>
                      Nom complet <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='name'
                      value={newPatientForm.name}
                      onChange={(e) =>
                        setNewPatientForm({
                          ...newPatientForm,
                          name: e.target.value,
                        })
                      }
                      placeholder='Nom et prénom'
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor='dateOfBirth'>
                      Date de naissance <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='dateOfBirth'
                      type='date'
                      value={newPatientForm.dateOfBirth}
                      onChange={(e) =>
                        setNewPatientForm({
                          ...newPatientForm,
                          dateOfBirth: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor='gender'>
                      Genre <span className='text-red-500'>*</span>
                    </Label>
                    <Select
                      value={newPatientForm.gender}
                      onValueChange={(value) =>
                        setNewPatientForm({ ...newPatientForm, gender: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Sélectionner' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='MALE'>Homme</SelectItem>
                        <SelectItem value='FEMALE'>Femme</SelectItem>
                        <SelectItem value='OTHER'>Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      value={newPatientForm.email}
                      onChange={(e) =>
                        setNewPatientForm({
                          ...newPatientForm,
                          email: e.target.value,
                        })
                      }
                      placeholder='email@exemple.com'
                    />
                  </div>

                  <div>
                    <Label htmlFor='phoneNumber'>Téléphone</Label>
                    <Input
                      id='phoneNumber'
                      type='tel'
                      value={newPatientForm.phoneNumber}
                      onChange={(e) =>
                        setNewPatientForm({
                          ...newPatientForm,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder='+212 6XX XXX XXX'
                    />
                  </div>

                  <div className='col-span-2'>
                    <Label htmlFor='address'>Adresse</Label>
                    <Input
                      id='address'
                      value={newPatientForm.address}
                      onChange={(e) =>
                        setNewPatientForm({
                          ...newPatientForm,
                          address: e.target.value,
                        })
                      }
                      placeholder='Adresse complète'
                    />
                  </div>
                </div>
              </div>

              {/* Relationship Information */}
              <div className='space-y-3 border-t pt-4'>
                <h3 className='font-semibold text-sm'>
                  Relation avec {mainPatient?.name}
                </h3>

                <div className='space-y-3'>
                  <div>
                    <Label htmlFor='relationshipType'>
                      Type de relation <span className='text-red-500'>*</span>
                    </Label>
                    <Select
                      value={relationshipForm.relationshipType}
                      onValueChange={(value) =>
                        setRelationshipForm({
                          ...relationshipForm,
                          relationshipType: value,
                          familyRelationship: '',
                          customRelationship: '',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='FAMILY'>Famille</SelectItem>
                        <SelectItem value='OTHER'>Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {relationshipForm.relationshipType === 'FAMILY' && (
                    <div>
                      <Label htmlFor='familyRelationship'>
                        Lien familial <span className='text-red-500'>*</span>
                      </Label>
                      <Select
                        value={relationshipForm.familyRelationship}
                        onValueChange={(value) =>
                          setRelationshipForm({
                            ...relationshipForm,
                            familyRelationship: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Sélectionner le lien' />
                        </SelectTrigger>
                        <SelectContent>
                          {FAMILY_RELATIONSHIPS.map((rel) => (
                            <SelectItem key={rel.value} value={rel.value}>
                              {rel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {relationshipForm.relationshipType === 'OTHER' && (
                    <div>
                      <Label htmlFor='customRelationship'>
                        Spécifier la relation{' '}
                        <span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        id='customRelationship'
                        value={relationshipForm.customRelationship}
                        onChange={(e) =>
                          setRelationshipForm({
                            ...relationshipForm,
                            customRelationship: e.target.value,
                          })
                        }
                        placeholder='Ex: Ami, Voisin, Tuteur, etc.'
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className='flex justify-end gap-2 pt-4 border-t'>
                <Button type='button' variant='outline' onClick={handleClose}>
                  Annuler
                </Button>
                <Button type='submit' disabled={loading}>
                  {loading ? 'Création...' : 'Créer et lier'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value='existing' className='space-y-4'>
            <form onSubmit={handleSubmitExistingPatient} className='space-y-4'>
              {/* Search existing patients */}
              <div className='space-y-3'>
                <h3 className='font-semibold text-sm'>
                  Rechercher un patient existant
                </h3>

                <div>
                  <Label htmlFor='search'>Rechercher</Label>
                  <Input
                    id='search'
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder='Nom, email ou téléphone...'
                  />
                </div>

                {existingPatients.length > 0 && (
                  <div className='border rounded-lg max-h-48 overflow-y-auto'>
                    {existingPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className={`p-3 cursor-pointer hover:bg-muted transition-colors border-b last:border-b-0 ${
                          selectedPatientId === patient.id
                            ? 'bg-primary/10'
                            : ''
                        }`}
                        onClick={() => setSelectedPatientId(patient.id)}
                      >
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='font-medium'>{patient.name}</p>
                            <p className='text-sm text-muted-foreground'>
                              {new Date(patient.dateOfBirth).toLocaleDateString(
                                'fr-FR'
                              )}{' '}
                              ·{' '}
                              {patient.gender === 'MALE'
                                ? 'Homme'
                                : patient.gender === 'FEMALE'
                                ? 'Femme'
                                : 'Autre'}
                            </p>
                          </div>
                          {selectedPatientId === patient.id && (
                            <div className='w-5 h-5 bg-primary rounded-full flex items-center justify-center'>
                              <span className='text-white text-xs'>✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Relationship Information */}
              {selectedPatientId && (
                <div className='space-y-3 border-t pt-4'>
                  <h3 className='font-semibold text-sm'>
                    Relation avec {mainPatient?.name}
                  </h3>

                  <div className='space-y-3'>
                    <div>
                      <Label htmlFor='relationshipType2'>
                        Type de relation <span className='text-red-500'>*</span>
                      </Label>
                      <Select
                        value={relationshipForm.relationshipType}
                        onValueChange={(value) =>
                          setRelationshipForm({
                            ...relationshipForm,
                            relationshipType: value,
                            familyRelationship: '',
                            customRelationship: '',
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='FAMILY'>Famille</SelectItem>
                          <SelectItem value='OTHER'>Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {relationshipForm.relationshipType === 'FAMILY' && (
                      <div>
                        <Label htmlFor='familyRelationship2'>
                          Lien familial <span className='text-red-500'>*</span>
                        </Label>
                        <Select
                          value={relationshipForm.familyRelationship}
                          onValueChange={(value) =>
                            setRelationshipForm({
                              ...relationshipForm,
                              familyRelationship: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Sélectionner le lien' />
                          </SelectTrigger>
                          <SelectContent>
                            {FAMILY_RELATIONSHIPS.map((rel) => (
                              <SelectItem key={rel.value} value={rel.value}>
                                {rel.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {relationshipForm.relationshipType === 'OTHER' && (
                      <div>
                        <Label htmlFor='customRelationship2'>
                          Spécifier la relation{' '}
                          <span className='text-red-500'>*</span>
                        </Label>
                        <Input
                          id='customRelationship2'
                          value={relationshipForm.customRelationship}
                          onChange={(e) =>
                            setRelationshipForm({
                              ...relationshipForm,
                              customRelationship: e.target.value,
                            })
                          }
                          placeholder='Ex: Ami, Voisin, Tuteur, etc.'
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className='flex justify-end gap-2 pt-4 border-t'>
                <Button type='button' variant='outline' onClick={handleClose}>
                  Annuler
                </Button>
                <Button type='submit' disabled={loading || !selectedPatientId}>
                  {loading ? 'Liaison...' : 'Lier le patient'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddRelativeDialog;
