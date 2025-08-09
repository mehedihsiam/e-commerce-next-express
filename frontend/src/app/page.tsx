import { Hero } from "../components/home";
import Categories from "../components/home/Categories";
import FeaturedProducts from "../components/home/FeaturedProducts";
import Features from "../components/home/Features";
import Newsletter from "../components/home/Newsletter";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Categories />
      <FeaturedProducts />
      <Features />
      <Newsletter />
    </main>
  );
}
