import HeroSlider from '@/components/HeroSlider';
import ToolsSection from '@/components/ToolsSection';
import CommunityGallery from '@/components/CommunityGallery';

const Home = () => {
  return (
    <main className="flex-1" data-testid="home-page">
      <HeroSlider />
      <ToolsSection />
      <CommunityGallery />
    </main>
  );
};

export default Home;
