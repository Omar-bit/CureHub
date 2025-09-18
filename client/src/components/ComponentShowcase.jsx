import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Search,
  Filter,
  Download,
  Plus,
  Mail,
  Phone,
  User,
  Eye,
  EyeOff,
  Lock,
  Send,
  Heart,
  Star,
} from 'lucide-react';

// Example component showcasing the enhanced Input and Button components
const ComponentShowcase = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className='p-8 max-w-4xl mx-auto space-y-8'>
      <div>
        <h2 className='text-2xl font-bold mb-4'>Enhanced UI Components</h2>
        <p className='text-muted-foreground mb-8'>
          Examples of Input and Button components with built-in icon support.
        </p>
      </div>

      {/* Input Examples */}
      <section>
        <h3 className='text-lg font-semibold mb-4'>Input Components</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Basic inputs with left icons */}
          <div>
            <label className='block text-sm font-medium mb-1'>Search</label>
            <Input placeholder='Search anything...' leftIcon={<Search />} />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>Email</label>
            <Input
              type='email'
              placeholder='Enter your email'
              leftIcon={<Mail />}
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>Phone</label>
            <Input type='tel' placeholder='Phone number' leftIcon={<Phone />} />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>Full Name</label>
            <Input placeholder='Enter your name' leftIcon={<User />} />
          </div>

          {/* Password input with both left and right icons */}
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium mb-1'>Password</label>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder='Enter your password'
              leftIcon={<Lock />}
              rightIcon={
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='text-muted-foreground hover:text-foreground'
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              }
            />
          </div>

          {/* Search with filter button */}
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium mb-1'>
              Advanced Search
            </label>
            <Input
              placeholder='Search with filters...'
              leftIcon={<Search />}
              rightIcon={
                <Button variant='ghost' size='sm' className='h-6 px-2'>
                  <Filter className='h-3 w-3' />
                </Button>
              }
            />
          </div>
        </div>
      </section>

      {/* Button Examples */}
      <section>
        <h3 className='text-lg font-semibold mb-4'>Button Components</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {/* Basic buttons with left icons */}
          <Button leftIcon={<Plus />}>Add New</Button>

          <Button variant='outline' leftIcon={<Download />}>
            Download
          </Button>

          <Button variant='secondary' leftIcon={<Filter />}>
            Filter
          </Button>

          {/* Buttons with right icons */}
          <Button rightIcon={<Send />}>Send Message</Button>

          <Button variant='outline' rightIcon={<Mail />}>
            Contact Us
          </Button>

          {/* Loading button */}
          <Button
            loading={isLoading}
            loadingText='Sending...'
            onClick={handleSubmit}
            leftIcon={<Send />}
          >
            Submit Form
          </Button>

          {/* Icon-only buttons */}
          <Button variant='ghost' size='icon'>
            <Search />
          </Button>

          <Button
            variant={isFavorited ? 'default' : 'outline'}
            size='icon'
            onClick={() => setIsFavorited(!isFavorited)}
          >
            <Heart className={isFavorited ? 'fill-current' : ''} />
          </Button>

          <Button variant='secondary' size='icon'>
            <Star />
          </Button>
        </div>
      </section>

      {/* Form Example */}
      <section>
        <h3 className='text-lg font-semibold mb-4'>Complete Form Example</h3>
        <div className='max-w-md mx-auto bg-card p-6 rounded-lg border'>
          <form className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Full Name
              </label>
              <Input placeholder='John Doe' leftIcon={<User />} />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>Email</label>
              <Input
                type='email'
                placeholder='john@example.com'
                leftIcon={<Mail />}
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>Phone</label>
              <Input
                type='tel'
                placeholder='+1 (555) 123-4567'
                leftIcon={<Phone />}
              />
            </div>

            <div className='flex gap-2 pt-4'>
              <Button type='submit' className='flex-1' leftIcon={<Send />}>
                Submit
              </Button>
              <Button type='button' variant='outline' className='flex-1'>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default ComponentShowcase;
