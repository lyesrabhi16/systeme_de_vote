import { Card } from '@/components/ui/card';
import { LucideAlertCircle } from 'lucide-react';

const ForbiddenPage = () => {
  return (
    <div>
      <div className='flex items-center justify-center min-h-screen'>
        <Card className='w-full max-w-md p-8 text-center space-y-6'>
          <div className='flex justify-center'>
            <div className='rounded-full bg-red-100 p-4 flex justify-center items-center w-fit h-fit'>
              <LucideAlertCircle className='h-12 w-12 text-red-600' />
            </div>
          </div>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Accès Interdit
            </h1>
            <p className='text-gray-600'>
              Vous n'avez pas la permission d'accéder à cette page.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = '/')}
            className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition'
          >
            Retour à l'accueil
          </button>
        </Card>
      </div>
    </div>
  );
};

export default ForbiddenPage;
