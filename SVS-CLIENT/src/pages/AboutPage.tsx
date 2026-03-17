import AppContainer from '@/components/utils/AppContainer';
import { ShieldCheck, Lock, Database, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AboutPage = () => {
  return (
    <AppContainer>
      <div className='w-full bg-gray-50 py-12 px-6 flex items-center justify-center'>
        <div className='max-w-4xl w-full space-y-10'>
          {/* Header */}
          <div className='space-y-4 text-center'>
            <h1 className='text-3xl md:text-4xl font-bold'>
              Système de Vote Sécurisé
            </h1>
            <p className='text-gray-600 max-w-2xl mx-auto'>
              Une plateforme de vote numérique moderne, centrée sur la
              confidentialité, garantissant transparence, intégrité et sécurité
              pour chaque électeur.
            </p>
          </div>

          {/* Cards */}
          <div className='grid md:grid-cols-2 gap-6'>
            <Card className='rounded-2xl shadow-sm'>
              <CardContent className='p-6 flex items-start gap-4'>
                <ShieldCheck className='w-6 h-6 mt-1' />
                <div className='space-y-1'>
                  <h2 className='font-semibold text-lg'>Sécurité</h2>
                  <p className='text-sm text-gray-600 leading-relaxed'>
                    Des techniques cryptographiques avancées protègent les votes
                    contre toute falsification.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className='rounded-2xl shadow-sm'>
              <CardContent className='p-6 flex items-start gap-4'>
                <Lock className='w-6 h-6 mt-1' />
                <div className='space-y-1'>
                  <h2 className='font-semibold text-lg'>Confidentialité</h2>
                  <p className='text-sm text-gray-600 leading-relaxed'>
                    Les votes restent anonymes et ne peuvent pas être reliés aux
                    électeurs.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className='rounded-2xl shadow-sm'>
              <CardContent className='p-6 flex items-start gap-4'>
                <Database className='w-6 h-6 mt-1' />
                <div className='space-y-1'>
                  <h2 className='font-semibold text-lg'>Intégrité</h2>
                  <p className='text-sm text-gray-600 leading-relaxed'>
                    Les votes sont stockés de manière sécurisée et comptabilisés
                    sans modification.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className='rounded-2xl shadow-sm'>
              <CardContent className='p-6 flex items-start gap-4'>
                <EyeOff className='w-6 h-6 mt-1' />
                <div className='space-y-1'>
                  <h2 className='font-semibold text-lg'>Anonymat</h2>
                  <p className='text-sm text-gray-600 leading-relaxed'>
                    Personne ne peut consulter les votes individuels, seuls les
                    résultats globaux sont accessibles.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <p className='text-center text-sm text-gray-500 pt-6'>
            Conçu pour garantir la confiance et la transparence.
          </p>
        </div>
      </div>
    </AppContainer>
  );
};

export default AboutPage;
