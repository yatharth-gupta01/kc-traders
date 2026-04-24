import React from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import Products from '../components/Products';
import Process from '../components/Process';
import Quality from '../components/Quality';
import Gallery from '../components/Gallery';
import Testimonials from '../components/Testimonials';
import Contact from '../components/Contact';

const Home = () => {
  return (
    <div className="relative w-full overflow-hidden">
      <Hero />
      <About />
      <Products />
      <Process />
      <Quality />
      <Gallery />
      <Testimonials />
      <Contact />
    </div>
  );
};

export default Home;
