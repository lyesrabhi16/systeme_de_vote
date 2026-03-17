import AppContainer from '@/components/utils/AppContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mail, User, MessageSquare } from 'lucide-react';

const ContactPage = () => {
  return (
    <AppContainer>
      <div className='min-h-screen w-full bg-gray-50 p-6 flex items-center justify-center'>
        <div className='max-w-3xl w-full space-y-6'>
          <h1 className='text-3xl font-bold text-center'>Contact</h1>
          <p className='text-center text-gray-600'>
            Une question ou un problème ? Contactez-nous et nous vous répondrons
            rapidement.
          </p>

          <Card className='rounded-2xl shadow-sm'>
            <CardContent className='p-6 space-y-4'>
              <div className='flex items-center gap-2'>
                <User className='w-5 h-5' />
                <Input placeholder='Votre nom' />
              </div>

              <div className='flex items-center gap-2'>
                <Mail className='w-5 h-5' />
                <Input type='email' placeholder='Votre email' />
              </div>

              <div className='flex items-start gap-2'>
                <MessageSquare className='w-5 h-5 mt-2' />
                <Textarea placeholder='Votre message' rows={5} />
              </div>

              <Button className='w-full rounded-xl'>Envoyer le message</Button>
            </CardContent>
          </Card>

          <div className='text-center text-sm text-gray-500'>
            © 2026 Système de Vote Sécurisé
          </div>
        </div>
      </div>
    </AppContainer>
  );
};

export default ContactPage;
