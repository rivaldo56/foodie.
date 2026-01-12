import RecipeFeed from '@/components/recipes/RecipeFeed';
import Navbar from '@/components/Navbar';
import BottomDock from '@/components/BottomDock';

export default function Home() {
  return (
    <main className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="md:pl-20 max-w-7xl mx-auto w-full pt-16 md:pt-6">
        <RecipeFeed />
      </div>
      <BottomDock />
    </main>
  );
}
