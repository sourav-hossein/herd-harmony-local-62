
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import EnhancedDashboard from '@/components/dashboard/EnhancedDashboard';
import { FeedDashboard } from '@/components/feed/FeedDashboard';
import FinanceDashboard from '@/components/finance/FinanceDashboard';
import { HealthAI } from '@/components/HealthAI';
import GrowthOptimizer from '@/components/GrowthOptimizer';
import BreedingPlanner from '@/components/breeding/BreedingPlanner';
import { WeatherDashboard } from '@/components/weather/WeatherDashboard';
import Settings from '@/components/settings/Settings';
import { WeightTracking } from '@/components/weight/WeightTracking';
import GoatManagement from '@/components/goats/GoatManagement';
import PedigreeAnalyzer from '@/components/pedigree/PedigreeAnalyzer';
import PastureMap from '@/components/farms/pastures/PastureMap';
import ShedList from '@/components/farms/sheds/ShedList';
import FarmAdvisor from '@/components/ai/FarmAdvisor';

export default function Index() {
  const [activeSection, setActiveSection] = useState('dashboard');


  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <EnhancedDashboard />;
      case 'goats':
        return <GoatManagement />;
      case 'weight':
        return <WeightTracking />;
      case 'pedigree':
        return <PedigreeAnalyzer />; 
      case 'breeding':
        return <BreedingPlanner />;
      case 'finance':
        return <FinanceDashboard />;
      case 'feed':
        return <FeedDashboard />;
      case 'weather':
        return <WeatherDashboard />;
      case 'health-ai':
        return <HealthAI />;
      case 'growth-optimizer':
        return <GrowthOptimizer />;
      case 'settings':
        return <Settings />;
      case 'pastures':
        return <PastureMap/>
      case 'sheds':
        return <ShedList />;
      case 'ai':
        return < FarmAdvisor/>
      default:
        return <EnhancedDashboard />;
    }
  };

  return (
    <Layout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderContent()}
    </Layout>
  );
}
