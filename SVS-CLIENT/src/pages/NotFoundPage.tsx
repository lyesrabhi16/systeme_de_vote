import { Card } from '@/components/ui/card';
import { LucideAlertCircle } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div>
      <div className='flex items-center justify-center min-h-screen'>
        <Card className='w-full max-w-md p-8 text-center space-y-6'>
          <div className='flex justify-center'>
            <div className='rounded-full bg-yellow-100 p-4 flex justify-center items-center'>
              <LucideAlertCircle className='h-12 w-12 text-yellow-600' />
            </div>
          </div>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Page Non Trouvée
            </h1>
            <p className='text-gray-600'>
              La page que vous recherchez n'existe pas ou a été supprimée.
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

export default NotFoundPage;
