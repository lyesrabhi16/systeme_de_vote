import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import useAuth from '@/hooks/useAuth';
import { LucideLogIn } from 'lucide-react';

const AlreadyLoggedInCard = () => {
  const auth = useAuth();
  if (!auth.is_authenticated()) {
    return null;
  }
  return (
    <Card className='w-full max-w-md border-0 bg-transparent shadow-none sm:border sm:bg-card sm:shadow-sm'>
      <CardHeader>
        <CardTitle className='text-center text-3xl font-semibold'>
          <h1>Vous êtes déjà connecté</h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-center'>
          Vous êtes déjà connecté. Veuillez vous déconnecter avant de vous
          reconnecter.
        </p>
      </CardContent>
      <CardFooter className='flex-col gap-2'>
        <Button
          onClick={() => auth.logout()}
          className='w-fit hover:scale-105 transition-transform'
        >
          <LucideLogIn /> Se Déconnecter
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AlreadyLoggedInCard;
