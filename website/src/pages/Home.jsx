import React from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import Products from '../components/Products';
import Storytelling from '../components/Storytelling';
import Quality from '../components/Quality';
import Gallery from '../components/Gallery';
import Testimonials from '../components/Testimonials';
import Contact from '../components/Contact';

const Home = () => {
  return (
    <div className="relative w-full overflow-x-clip">
      <Hero />
      <About />
      <Products />
      <Storytelling />
      <Quality />
      <Gallery />
      <Testimonials />
      <Contact />
    </div>
  );
};

export default Home;
