import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  FileText,
  DollarSign,
  Calendar,
  Users,
  Bell,
  Phone,
  Globe,
  Tag,
  BarChart3,
  Stethoscope,
  Briefcase,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Add animation styles
const animationStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes profileSectionExpand {
    from {
      opacity: 0;
      max-height: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      max-height: 250px;
      transform: translateY(0);
    }
  }

  @keyframes profileSectionCollapse {
    from {
      opacity: 1;
      max-height: 250px;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      max-height: 0;
      transform: translateY(-10px);
    }
  }

  @keyframes avatarToRight {
    from {
      transform: scale(1) translateX(0) translateY(0);
      opacity: 1;
    }
    to {
      transform: scale(0.5) translateX(35px) translateY(-10px);
      opacity: 1;
    }
  }

  @keyframes avatarToCenter {
    from {
      transform: scale(0.5) translateX(35px) translateY(-10px);
      opacity: 1;
    }
    to {
      transform: scale(1) translateX(0) translateY(0);
      opacity: 1;
    }
  }

  .avatar-collapse {
    animation: avatarToRight 0.5s ease-in forwards;
  }

  .avatar-expand {
    animation: avatarToCenter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .profile-section-collapse {
    animation: profileSectionCollapse 0.5s ease-in forwards;
  }

  .profile-section-expand {
    animation: profileSectionExpand 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  /* Blur navbar when sidebar is open */
  header[data-sidebar-open="true"] {
    filter: blur(4px) !important;
    opacity: 0.9 !important;
  }
`;

const ProfileDialog = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [selectedSection, setSelectedSection] = useState('informations');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isProfileMinimized, setIsProfileMinimized] = useState(false);

  // Apply blur effect to navbar when sidebar is expanded
  React.useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      if (isOpen && isExpanded) {
        // Use filter instead of backdrop-filter for more reliable blur
        header.style.setProperty('filter', 'blur(4px)', 'important');
        header.style.setProperty('opacity', '0.9', 'important');
        header.style.transition = 'all 0.3s ease-out';
        header.setAttribute('data-sidebar-open', 'true');
      } else {
        header.style.removeProperty('filter');
        header.style.removeProperty('opacity');
        header.removeAttribute('data-sidebar-open');
      }
    }
    return () => {
      if (header) {
        header.style.removeProperty('filter');
        header.style.removeProperty('opacity');
        header.removeAttribute('data-sidebar-open');
      }
    };
  }, [isExpanded, isOpen]);

  if (!isOpen) return null;

  const profileSections = [
    {
      id: 'informations',
      label: 'Informations',
      icon: FileText,
    },
    {
      id: 'actes',
      label: 'Actes',
      icon: Stethoscope,
    },
    {
      id: 'honoraires',
      label: 'Honoraires',
      icon: DollarSign,
    },
    {
      id: 'conges',
      label: 'Congés',
      icon: Calendar,
    },
    {
      id: 'remplacs',
      label: 'Remplacs',
      icon: Users,
    },
    {
      id: 'equipe',
      label: 'Équipe',
      icon: Briefcase,
    },
    {
      id: 'annonces',
      label: 'Annonces',
      icon: Bell,
    },
    {
      id: 'telephonie',
      label: 'Téléphonie',
      icon: Phone,
    },
    {
      id: 'site',
      label: 'Site Internet',
      icon: Globe,
    },
    {
      id: 'tarifs',
      label: 'Tarifs',
      icon: Tag,
    },
    {
      id: 'recettes',
      label: 'Recettes',
      icon: ClipboardList,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
    },
    {
      id: 'statistiques',
      label: 'Statistiques',
      icon: BarChart3,
    },
  ];

  return (
    <>
      {/* Animation Styles */}
      <style>{animationStyles}</style>

      {/* Backdrop Blur when sidebar is open */}
      {isExpanded && (
        <div 
          className='fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300'
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Interactive Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-screen z-50 bg-gradient-to-b from-emerald-50 via-emerald-50 to-teal-50 backdrop-blur-3xl border-r border-emerald-100 border-opacity-60 shadow-2xl transition-all duration-300 ease-out flex flex-col
          ${isExpanded ? 'w-80' : 'w-20'}
        `}
      >
        {/* Header - Close & Toggle */}
        <div className='px-4 py-4 flex justify-between items-center border-b border-emerald-100 border-opacity-40 bg-gradient-to-r from-white/40 to-emerald-50/40'>
          {/* Close button visible only when expanded */}
          {isExpanded && (
            <button
              onClick={onClose}
              className='text-emerald-700 hover:bg-emerald-200 hover:bg-opacity-40 rounded-full p-2 transition-all duration-200'
            >
              <X className='h-5 w-5' />
            </button>
          )}
          
          {/* Toggle button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='text-emerald-700 hover:bg-emerald-200 hover:bg-opacity-40 rounded-full p-2 transition-all duration-200 ml-auto'
          >
            {isExpanded ? <ChevronLeft className='h-5 w-5' /> : <ChevronRight className='h-5 w-5' />}
          </button>
        </div>

        {/* Profile Section */}
        <div className={`border-b border-emerald-100 border-opacity-40 bg-gradient-to-b from-white/30 to-transparent overflow-hidden transition-all duration-500 ${
          isProfileMinimized ? 'py-2' : 'py-6'
        }`}>
          {/* Clickable Profile Container - Photo + Name */}
          <button
            onClick={() => setIsProfileMinimized(!isProfileMinimized)}
            className='w-full px-4 flex flex-col items-center focus:outline-none group'
          >
            {/* Avatar - Animates position and scale */}
            <div className={`flex-shrink-0 transition-all duration-500 ${
              isProfileMinimized 
                ? 'transform scale-50 translate-x-8 -translate-y-1' 
                : 'transform scale-100 translate-x-0 translate-y-0'
            }`}>
              <div className='bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-400 rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-3 border-white/80 group-hover:shadow-xl transition-shadow'>
                <span className='text-2xl'>👤</span>
              </div>
            </div>

            {/* Name - Expands/Collapses */}
            <div className={`w-full transition-all duration-500 text-center ${
              isProfileMinimized 
                ? 'opacity-0 max-h-0 overflow-hidden mt-0' 
                : 'opacity-100 max-h-20 mt-4'
            }`}>
              <h2 className='text-lg font-bold text-gray-900 tracking-tight leading-tight'>
                Dr {user?.doctorProfile?.name || user?.name || 'Doctor'}
              </h2>
            </div>

            {/* Minimized Name - Shows compact */}
            <div className={`w-full transition-all duration-500 text-center ${
              isProfileMinimized 
                ? 'opacity-100 max-h-10 mt-1' 
                : 'opacity-0 max-h-0 overflow-hidden'
            }`}>
              <h3 className='text-xs font-bold text-gray-900 leading-tight truncate'>
                {(user?.doctorProfile?.name || user?.name || 'Doctor').split(' ')[0]}
              </h3>
            </div>
          </button>
        </div>

        {/* Menu Items */}
        <div className='flex-1 overflow-y-auto px-2 py-4 space-y-2 scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent'>
          {profileSections.map((section) => {
            const Icon = section.icon;
            const isSelected = selectedSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => {
                  setSelectedSection(section.id);
                  if (!isExpanded) setIsExpanded(true);
                }}
                title={isExpanded ? '' : section.label}
                className={`w-full flex items-center justify-center transition-all duration-200 group relative
                  ${isExpanded ? 'gap-3 px-4 py-3 rounded-lg justify-start' : 'p-3 rounded-lg'}
                  ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-200/70 to-teal-200/50 text-emerald-900 shadow-md border border-emerald-200/60'
                      : 'text-emerald-700 hover:bg-emerald-100/50 hover:shadow-sm'
                  }
                `}
              >
                <Icon className={`flex-shrink-0 transition-all duration-200 ${isSelected ? 'scale-110' : 'group-hover:scale-110'} ${isExpanded ? 'h-5 w-5' : 'h-5 w-5'}`} />
                
                {/* Label - visible only when expanded */}
                {isExpanded && (
                  <span className='text-sm font-medium truncate'>{section.label}</span>
                )}

                {/* Tooltip when collapsed */}
                {!isExpanded && (
                  <div className='absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50'>
                    {section.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer - visible only when expanded */}
        {isExpanded && (
          <div className='border-t border-emerald-100 border-opacity-40 p-4 bg-gradient-to-r from-white/30 to-emerald-50/30'></div>
        )}
      </div>

      {/* Spacer when sidebar is open */}
      {isExpanded && (
        <div className='fixed inset-0 left-80 z-0' onClick={() => setIsExpanded(false)} />
      )}
    </>
  );
};

export default ProfileDialog;
