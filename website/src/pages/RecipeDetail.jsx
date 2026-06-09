import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { recipes } from '../data/recipes';
import { Play, Clock, ChefHat, ArrowLeft, Share2, Facebook, Twitter, Link as LinkIcon, Check } from 'lucide-react';

const RecipeDetail = () => {
  const { id } = useParams();
  const [lang, setLang] = useState('en');
  const [copied, setCopied] = useState(false);
  const recipe = recipes.find(r => r.id === id);

  useEffect(() => {
    if (recipe) {
      document.title = `${recipe[lang].title} | KC Traders Recipes`;
      // Update meta description
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = recipe[lang].excerpt;
    }
  }, [recipe, lang]);

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-500">
        <h2>Recipe not found</h2>
      </div>
    );
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const content = recipe[lang];

  return (
    <div className="min-h-screen pt-28 pb-24 bg-stone-50 dark:bg-[#1a1412] selection:bg-mustard-500/30">
      
      {/* Hero Image Header */}
      <div className="w-full h-[50vh] md:h-[60vh] relative group overflow-hidden">
        <img 
          src={recipe.image} 
          alt={content.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:px-24 text-white">
          <Link to="/recipes" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-stone-300 hover:text-mustard-400 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Recipes
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-mustard-500 text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              {recipe.category}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-black leading-tight max-w-4xl">
            {content.title}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-24 mt-12 flex flex-col lg:flex-row gap-12">
        
        {/* Main Content */}
        <div className="lg:w-2/3">
          <div className="flex items-center justify-between pb-8 border-b border-stone-200 dark:border-stone-800 mb-8">
            <div className="flex items-center gap-8 text-sm font-bold text-stone-500 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-mustard-600 dark:text-mustard-400" /> {recipe.author}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-mustard-600 dark:text-mustard-400" /> {recipe.prepTime}
              </div>
            </div>
            
            {/* Language Toggle for Article */}
            <div className="flex bg-white dark:bg-[#251e1a] p-1 rounded-lg border border-stone-200 dark:border-stone-800">
              <button onClick={() => setLang('en')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${lang === 'en' ? 'bg-mustard-500 text-black' : 'text-stone-500'}`}>EN</button>
              <button onClick={() => setLang('hi')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${lang === 'hi' ? 'bg-mustard-500 text-black' : 'text-stone-500'}`}>HI</button>
            </div>
          </div>

          <p className="text-xl md:text-2xl text-stone-700 dark:text-stone-300 leading-relaxed font-serif mb-12">
            {content.excerpt}
          </p>

          <div className="mb-12">
            <h2 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6 font-display">
              {lang === 'en' ? 'Ingredients' : 'सामग्री'}
            </h2>
            <ul className="space-y-4 bg-white dark:bg-[#251e1a] p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
              {content.ingredients.map((item, idx) => (
                <li key={idx} className="flex items-start gap-4 text-stone-700 dark:text-stone-300 text-lg">
                  <div className="w-2 h-2 rounded-full bg-mustard-500 mt-2.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6 font-display">
              {lang === 'en' ? 'Instructions' : 'निर्देश'}
            </h2>
            <div className="space-y-8">
              {content.instructions.map((step, idx) => (
                <div key={idx} className="flex gap-6">
                  <div className="w-10 h-10 rounded-full bg-mustard-100 dark:bg-mustard-900/30 text-mustard-700 dark:text-mustard-400 flex items-center justify-center font-black text-xl flex-shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-lg text-stone-700 dark:text-stone-300 leading-relaxed pt-1">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-1/3">
          <div className="sticky top-32 space-y-8">
            
            {/* Share Widget */}
            <div className="bg-white dark:bg-[#251e1a] p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-mustard-500" /> Share this Recipe
              </h3>
              <div className="flex gap-4">
                <button className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </button>
                <button className="w-12 h-12 rounded-full bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 flex items-center justify-center hover:bg-sky-600 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </button>
                <button onClick={copyLink} className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <LinkIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Promo Card */}
            <div className="bg-gradient-to-br from-mustard-500 to-amber-600 p-8 rounded-3xl text-black shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10" />
              <h3 className="text-2xl font-black mb-3">Cook with the Best</h3>
              <p className="font-medium mb-6 opacity-90">Experience authentic flavors with KC Traders premium oils.</p>
              <Link to="/shop" className="block w-full py-3 bg-black text-mustard-500 text-center font-bold rounded-xl hover:bg-black/80 transition-colors">
                Shop Now
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default RecipeDetail;
