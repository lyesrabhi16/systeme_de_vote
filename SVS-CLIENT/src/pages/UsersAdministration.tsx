import { Card, CardContent } from '@/components/ui/card';
import AppContainer from '@/components/utils/AppContainer';
import { routes } from '@/services/routing';
import { LucideUsers2, LucideUserStar } from 'lucide-react';
import { Link } from 'react-router';

function UsersAdministration() {
  return (
    <AppContainer admin>
      <div className='mt-12 flex flex-col gap-24 items-center w-full h-full'>
        <h1 className='text-2xl font-semibold'>
          Administration des Utilisateurs
        </h1>
        <Card className='w-full max-w-4xl p-8'>
          <CardContent>
            <div className='text-lg font-medium mb-4'>
              Gérer les Utilisateurs et Administrateurs
            </div>
            <div className='text-sm text-gray-600'>
              Ici, vous pouvez gérer les utilisateurs et administrateurs du
              système. Vous pouvez ajouter, supprimer ou modifier les rôles et
              permissions des utilisateurs.
            </div>
          </CardContent>
        </Card>
        <div className='flex flex-row gap-8 flex-wrap justify-center items-center'>
          <Link to={routes.USERS_ADMINISTRATION}>
            <Card className='hover:border-green-400 hover:scale-110 focus:border-green-400 focus:scale-110 cursor-pointer w-48 h-32'>
              <CardContent>
                <div>
                  <LucideUsers2 size={48} className='mb-2 mx-auto' />
                  <div className='text-center font-medium'>Utilisateurs</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to={routes.ADMIN_ADMINISTRATION}>
            <Card className='hover:border-green-400 hover:scale-110 focus:border-green-400 focus:scale-110 cursor-pointer w-48 h-32'>
              <CardContent>
                <div>
                  <LucideUserStar size={48} className='mb-2 mx-auto' />
                  <div className='text-center font-medium'>Administrateurs</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppContainer>
  );
}

export default UsersAdministration;
