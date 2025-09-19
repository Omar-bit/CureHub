import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { ContentContainer, PageHeader, Section } from '../components/Layout';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  MessageCircle,
  Send,
  Users,
  Search,
  Plus,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
} from 'lucide-react';

const MessagingPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  // Mock conversations data
  const conversations = [
    {
      id: 1,
      name: 'Dr. Defamille',
      lastMessage: 'Thank you for the consultation notes',
      time: '10:30',
      unread: 2,
      avatar: 'DF',
      online: true,
    },
    {
      id: 2,
      name: 'Dr. Zen',
      lastMessage: 'Patient follow-up scheduled for tomorrow',
      time: '09:45',
      unread: 0,
      avatar: 'DZ',
      online: false,
    },
    {
      id: 3,
      name: 'Dr. Détendu',
      lastMessage: 'Can you review the lab results?',
      time: 'Yesterday',
      unread: 1,
      avatar: 'DD',
      online: true,
    },
    {
      id: 4,
      name: 'Nursing Team',
      lastMessage: 'Room 205 is ready for next patient',
      time: 'Yesterday',
      unread: 0,
      avatar: 'NT',
      online: false,
    },
  ];

  // Mock messages for selected conversation
  const messages = selectedConversation
    ? [
        {
          id: 1,
          sender: 'Dr. Defamille',
          content: 'Hello! How are you doing today?',
          time: '10:25',
          isOwn: false,
        },
        {
          id: 2,
          sender: 'You',
          content:
            "Hello Dr. Defamille! I'm doing well, thank you. I wanted to discuss the patient consultation notes.",
          time: '10:27',
          isOwn: true,
        },
        {
          id: 3,
          sender: 'Dr. Defamille',
          content:
            "Of course! I've reviewed the notes you sent. The patient's condition seems to be improving.",
          time: '10:28',
          isOwn: false,
        },
        {
          id: 4,
          sender: 'You',
          content:
            "That's great to hear. Should we schedule a follow-up appointment?",
          time: '10:29',
          isOwn: true,
        },
        {
          id: 5,
          sender: 'Dr. Defamille',
          content: 'Thank you for the consultation notes',
          time: '10:30',
          isOwn: false,
        },
      ]
    : [];

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      // Here you would typically send the message to your backend
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <PageHeader
        title='Messagery'
        subtitle='Communicate with your colleagues and team members'
      />

      <ContentContainer className='py-8 max-w-7xl'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-12rem)]'>
          <div className='flex h-full'>
            {/* Conversations Sidebar */}
            <div className='w-1/3 border-r border-gray-200 flex flex-col'>
              {/* Search and New Message */}
              <div className='p-4 border-b border-gray-200'>
                <div className='flex items-center space-x-2 mb-3'>
                  <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                    <input
                      type='text'
                      placeholder='Search conversations...'
                      className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                  <Button size='sm'>
                    <Plus className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              {/* Conversations List */}
              <div className='flex-1 overflow-y-auto'>
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                        : ''
                    }`}
                  >
                    <div className='flex items-center space-x-3'>
                      <div className='relative'>
                        <div className='w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium'>
                          {conversation.avatar}
                        </div>
                        {conversation.online && (
                          <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white'></div>
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-sm font-medium text-gray-900 truncate'>
                            {conversation.name}
                          </h3>
                          <span className='text-xs text-gray-500'>
                            {conversation.time}
                          </span>
                        </div>
                        <div className='flex items-center justify-between mt-1'>
                          <p className='text-sm text-gray-600 truncate'>
                            {conversation.lastMessage}
                          </p>
                          {conversation.unread > 0 && (
                            <span className='bg-blue-500 text-white text-xs rounded-full px-2 py-1'>
                              {conversation.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className='flex-1 flex flex-col'>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className='p-4 border-b border-gray-200 flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='relative'>
                        <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium'>
                          {selectedConversation.avatar}
                        </div>
                        {selectedConversation.online && (
                          <div className='absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white'></div>
                        )}
                      </div>
                      <div>
                        <h3 className='text-sm font-medium text-gray-900'>
                          {selectedConversation.name}
                        </h3>
                        <p className='text-xs text-gray-500'>
                          {selectedConversation.online
                            ? 'Online'
                            : 'Last seen 2h ago'}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Button variant='ghost' size='sm'>
                        <Phone className='h-4 w-4' />
                      </Button>
                      <Button variant='ghost' size='sm'>
                        <Video className='h-4 w-4' />
                      </Button>
                      <Button variant='ghost' size='sm'>
                        <MoreVertical className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isOwn ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.isOwn
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className='text-sm'>{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.isOwn ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {message.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className='p-4 border-t border-gray-200'>
                    <div className='flex items-center space-x-2'>
                      <Button variant='ghost' size='sm'>
                        <Paperclip className='h-4 w-4' />
                      </Button>
                      <div className='flex-1 relative'>
                        <input
                          type='text'
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === 'Enter' && handleSendMessage()
                          }
                          placeholder='Type your message...'
                          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        />
                      </div>
                      <Button variant='ghost' size='sm'>
                        <Smile className='h-4 w-4' />
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        size='sm'
                        disabled={!newMessage.trim()}
                      >
                        <Send className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                /* No Conversation Selected */
                <div className='flex-1 flex items-center justify-center'>
                  <div className='text-center'>
                    <MessageCircle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      Select a conversation
                    </h3>
                    <p className='text-gray-500'>
                      Choose a conversation from the sidebar to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ContentContainer>
    </div>
  );
};

export default MessagingPage;
