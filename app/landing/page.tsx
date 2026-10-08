import type { Metadata } from 'next';
import { FlowLanding } from './flow/FlowLanding';

export const metadata: Metadata = {
  title: 'Tier Trade | Toda a operação de grãos, da oferta ao caixa',
  description:
    'Sistema para tradings de grãos: ofertas, contratos, cargas, qualidade, estoque e liquidação num só lugar, com IA fazendo o trabalho de escritório e a sua equipe com as decisões.',
};

export default function LandingPage() {
  return <FlowLanding />;
}
