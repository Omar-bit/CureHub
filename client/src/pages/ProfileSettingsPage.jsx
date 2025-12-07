import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDoctorProfile } from '../hooks/useDoctorProfile';
import { authAPI, clinicAPI } from '../services/api';
import { ContentContainer, PageHeader } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  ProfessionalInfoSection,
  CabinetInfoSection,
  IdentifiersSection,
} from '../components/ProfileSettingsSections';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * ProfileSettingsPage Component
 * Complete doctor profile settings page matching the design in the screenshots
 */
const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { user, setUserData } = useAuth();
  const { profile, loading, updateProfile, refreshProfile } =
    useDoctorProfile();

  // Separate editing states for each section
  const [isEditingProfessional, setIsEditingProfessional] = useState(false);
  const [isEditingCabinet, setIsEditingCabinet] = useState(false);
  const [isEditingIdentifiers, setIsEditingIdentifiers] = useState(false);

  // Form data
  const [formData, setFormData] = useState({});
  const [isSavingProfessional, setIsSavingProfessional] = useState(false);
  const [isSavingCabinet, setIsSavingCabinet] = useState(false);
  const [isSavingIdentifiers, setIsSavingIdentifiers] = useState(false);

  const populateFormFromProfile = useCallback(
    (currentProfile) => {
      if (!currentProfile) {
        return;
      }

      let birthDateValue = '';
      if (currentProfile.dateOfBirth) {
        const parsedDate = new Date(currentProfile.dateOfBirth);
        if (!Number.isNaN(parsedDate.getTime())) {
          birthDateValue = parsedDate.toISOString().split('T')[0];
        }
      }

      setFormData({
        rppsNumber: currentProfile.rppsNumber || '',
        sirenNumber: currentProfile.sirenNumber || '',
        languagesSpoken: currentProfile.languagesSpoken || '',
        diplomas: currentProfile.diplomas || '',
        additionalDiplomas: currentProfile.additionalDiplomas || '',
        publications: currentProfile.publications || '',
        signature: currentProfile.signature || '',
        absenceMessage: currentProfile.absenceMessage || '',
        tooManyAbsencesInfo: currentProfile.tooManyAbsencesInfo || '',
        cabinetName: currentProfile.clinic?.name || '',
        cabinetGender: currentProfile.clinic?.gender || 'masculin',
        clinicAddress: currentProfile.clinic?.address || '',
        clinicAddress2: currentProfile.clinic?.address2 || '',
        clinicPostalCode: currentProfile.clinic?.postalCode || '',
        clinicCity: currentProfile.clinic?.city || '',
        clinicPhone: currentProfile.clinic?.phone || '',
        prmAccess: Boolean(currentProfile.clinic?.prmAccess),
        videoSurveillance: Boolean(currentProfile.clinic?.videoSurveillance),
        profession: currentProfile.specialization || '',
        professionalStatus: currentProfile.professionalStatus || '',
        title: currentProfile.title || '',
        firstName: currentProfile.user?.firstName || '',
        lastName: currentProfile.user?.lastName || '',
        gender: currentProfile.gender || '',
        birthDate: birthDateValue,
        email: currentProfile.user?.email || '',
        mobilePhone: currentProfile.user?.phone || '',
        confidentialCode: currentProfile.confidentialCode || '',
      });
    },
    [setFormData]
  );

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      populateFormFromProfile(profile);
    }
  }, [profile, populateFormFromProfile]);

  // Handle field changes
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle save Professional Section
  const handleSaveProfessional = async () => {
    try {
      setIsSavingProfessional(true);
      // Only send professional fields for this section
      const professionalData = {
        rppsNumber: formData.rppsNumber,
        sirenNumber: formData.sirenNumber,
        languagesSpoken: formData.languagesSpoken,
        diplomas: formData.diplomas,
        additionalDiplomas: formData.additionalDiplomas,
        publications: formData.publications,
        signature: formData.signature,
        absenceMessage: formData.absenceMessage,
        tooManyAbsencesInfo: formData.tooManyAbsencesInfo,
      };
      console.log(
        '[ProfileSettingsPage] Saving professional data:',
        professionalData
      );
      await updateProfile(professionalData, {
        successMessage: 'Informations professionnelles mises à jour !',
      });
      console.log('[ProfileSettingsPage] Professional data saved successfully');
      setIsEditingProfessional(false);
    } catch (error) {
      console.error('Error saving professional info:', error);
    } finally {
      setIsSavingProfessional(false);
    }
  };

  // Handle cancel Professional Section
  const handleCancelProfessional = () => {
    setIsEditingProfessional(false);
    // Reset professional fields to original profile data
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        rppsNumber: profile.rppsNumber || '',
        sirenNumber: profile.sirenNumber || '',
        languagesSpoken: profile.languagesSpoken || '',
        diplomas: profile.diplomas || '',
        additionalDiplomas: profile.additionalDiplomas || '',
        publications: profile.publications || '',
        signature: profile.signature || '',
        absenceMessage: profile.absenceMessage || '',
        tooManyAbsencesInfo: profile.tooManyAbsencesInfo || '',
      }));
    }
  };

  // Handle save Cabinet Section
  const handleSaveCabinet = async () => {
    try {
      setIsSavingCabinet(true);
      // Use clinic API with mapped field names
      const cabinetData = {
        name: formData.cabinetName,
        gender: formData.cabinetGender,
        address: formData.clinicAddress,
        address2: formData.clinicAddress2,
        postalCode: formData.clinicPostalCode,
        city: formData.clinicCity,
        phone: formData.clinicPhone,
        prmAccess: formData.prmAccess,
        videoSurveillance: formData.videoSurveillance,
      };
      console.log('[ProfileSettingsPage] Saving cabinet data:', cabinetData);
      await clinicAPI.updateMyClinic(cabinetData);
      console.log('[ProfileSettingsPage] Cabinet data saved successfully');

      // Refresh the profile to get updated clinic data
      const updatedProfile = await refreshProfile({ showLoader: false });
      if (updatedProfile) {
        populateFormFromProfile(updatedProfile);
      }

      toast.success('Clinic information updated successfully!');
      setIsEditingCabinet(false);
    } catch (error) {
      console.error('Error saving cabinet info:', error);
      toast.error('Failed to update clinic information');
    } finally {
      setIsSavingCabinet(false);
    }
  };

  // Handle cancel Cabinet Section
  const handleCancelCabinet = () => {
    setIsEditingCabinet(false);
    // Reset cabinet fields to original profile data
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        cabinetName: profile.clinic?.name || '',
        cabinetGender: profile.clinic?.gender || 'masculin',
        clinicAddress: profile.clinic?.address || '',
        clinicAddress2: profile.clinic?.address2 || '',
        clinicPostalCode: profile.clinic?.postalCode || '',
        clinicCity: profile.clinic?.city || '',
        clinicPhone: profile.clinic?.phone || '',
        prmAccess: profile.clinic?.prmAccess || false,
        videoSurveillance: profile.clinic?.videoSurveillance || false,
      }));
    }
  };

  const handleSaveIdentifiers = async () => {
    try {
      setIsSavingIdentifiers(true);
      const identifierData = {
        specialization: formData.profession || null,
        professionalStatus: formData.professionalStatus || null,
        title: formData.title || null,
        gender: formData.gender || null,
        dateOfBirth: formData.birthDate
          ? new Date(formData.birthDate).toISOString()
          : null,
        confidentialCode: formData.confidentialCode || null,
      };
      console.log(
        '[ProfileSettingsPage] Saving identifier data:',
        identifierData
      );

      await updateProfile(identifierData, { showToast: false });

      const emailValue = (formData.email || '').trim();
      const userPayload = {
        firstName: (formData.firstName || '').trim(),
        lastName: (formData.lastName || '').trim(),
        phone: (formData.mobilePhone || '').trim(),
        email: emailValue || profile?.user?.email || '',
      };

      const updatedUser = await authAPI.updateProfile(userPayload);
      setUserData(updatedUser);

      const updatedProfile = await refreshProfile({ showLoader: false });
      if (updatedProfile) {
        populateFormFromProfile(updatedProfile);
      }

      toast.success('Identifiants mis à jour avec succès !');
      setIsEditingIdentifiers(false);
    } catch (error) {
      console.error('Error saving identifier info:', error);
      toast.error('Impossible de mettre à jour les identifiants');
    } finally {
      setIsSavingIdentifiers(false);
    }
  };

  const handleCancelIdentifiers = () => {
    setIsEditingIdentifiers(false);
    if (profile) {
      let birthDateValue = '';
      if (profile.dateOfBirth) {
        const parsedDate = new Date(profile.dateOfBirth);
        if (!Number.isNaN(parsedDate.getTime())) {
          birthDateValue = parsedDate.toISOString().split('T')[0];
        }
      }

      setFormData((prev) => ({
        ...prev,
        profession: profile.specialization || '',
        professionalStatus: profile.professionalStatus || '',
        title: profile.title || '',
        firstName: profile.user?.firstName || '',
        lastName: profile.user?.lastName || '',
        gender: profile.gender || '',
        birthDate: birthDateValue,
        email: profile.user?.email || '',
        mobilePhone: profile.user?.phone || '',
        confidentialCode: profile.confidentialCode || '',
      }));
    }
  };

  const handleResetConfidentialCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData((prev) => ({
      ...prev,
      confidentialCode: newCode,
    }));
  };

  // Check if user is a doctor
  if (!user || user.role !== 'DOCTOR') {
    return (
      <ContentContainer>
        <div className='py-8 px-4'>
          <Card className='border-yellow-200 bg-yellow-50'>
            <CardContent className='pt-6'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
                <div>
                  <h3 className='font-semibold text-yellow-900'>
                    Access Denied
                  </h3>
                  <p className='text-sm text-yellow-800 mt-1'>
                    Only doctors can access profile settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ContentContainer>
    );
  }

  if (loading) {
    return (
      <ContentContainer>
        <div className='py-8 px-4'>
          <div className='animate-pulse space-y-6'>
            <div className='h-12 bg-gray-200 rounded-lg' />
            <div className='h-64 bg-gray-200 rounded-lg' />
            <div className='h-64 bg-gray-200 rounded-lg' />
          </div>
        </div>
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <div className='py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-4 mb-4'>
            <button
              onClick={() => navigate('/settings')}
              className='text-gray-600 hover:text-gray-900 transition'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <PageHeader title='Paramètres du profil' />
              <p className='text-sm text-gray-600 mt-2'>
                Gérez vos informations professionnelles et celles de votre
                cabinet
              </p>
            </div>
          </div>
        </div>

        {/* Information Banner */}
        {!isEditingIdentifiers &&
          !isEditingProfessional &&
          !isEditingCabinet && (
            <Card className='mb-6 border-blue-100 bg-blue-50'>
              <CardContent className='pt-6'>
                <div className='flex items-start gap-3'>
                  <AlertCircle className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
                  <p className='text-sm text-blue-800'>
                    Cliquez sur le bouton "Modifier" pour editer vos
                    informations.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Form Sections */}
        <div className='space-y-8'>
          {/* Identifiers Section */}
          <div>
            <IdentifiersSection
              profile={formData}
              onChange={handleFieldChange}
              isEditing={isEditingIdentifiers}
              onResetConfidentialCode={handleResetConfidentialCode}
            />
            <div className='mt-4 flex gap-3 px-6 pb-4'>
              {!isEditingIdentifiers ? (
                <Button
                  onClick={() => setIsEditingIdentifiers(true)}
                  className='bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-2 rounded-full shadow-md transition'
                >
                  Modifier
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSaveIdentifiers}
                    disabled={isSavingIdentifiers}
                    className='bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-2 rounded-full shadow-md transition disabled:opacity-50'
                  >
                    {isSavingIdentifiers ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                  <Button
                    onClick={handleCancelIdentifiers}
                    variant='outline'
                    className='px-6 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50'
                  >
                    Annuler
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Professional Information Section */}
          <div>
            <ProfessionalInfoSection
              profile={formData}
              onChange={handleFieldChange}
              isEditing={isEditingProfessional}
            />
            {/* Professional Section Action Buttons */}
            <div className='mt-4 flex gap-3 px-6 pb-4'>
              {!isEditingProfessional ? (
                <Button
                  onClick={() => setIsEditingProfessional(true)}
                  className='bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-2 rounded-full shadow-md transition'
                >
                  Modifier
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSaveProfessional}
                    disabled={isSavingProfessional}
                    className='bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-2 rounded-full shadow-md transition disabled:opacity-50'
                  >
                    {isSavingProfessional ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                  <Button
                    onClick={handleCancelProfessional}
                    variant='outline'
                    className='px-6 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50'
                  >
                    Annuler
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Cabinet Information Section */}
          <div>
            <CabinetInfoSection
              profile={formData}
              onChange={handleFieldChange}
              isEditing={isEditingCabinet}
            />
            {/* Cabinet Section Action Buttons */}
            <div className='mt-4 flex gap-3 px-6 pb-4'>
              {!isEditingCabinet ? (
                <Button
                  onClick={() => setIsEditingCabinet(true)}
                  className='bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-2 rounded-full shadow-md transition'
                >
                  Modifier
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSaveCabinet}
                    disabled={isSavingCabinet}
                    className='bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-2 rounded-full shadow-md transition disabled:opacity-50'
                  >
                    {isSavingCabinet ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                  <Button
                    onClick={handleCancelCabinet}
                    variant='outline'
                    className='px-6 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50'
                  >
                    Annuler
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ContentContainer>
  );
};

export default ProfileSettingsPage;
