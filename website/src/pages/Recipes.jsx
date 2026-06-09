import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { recipes } from '../data/recipes';
import { Search, Globe, Clock, ChefHat } from 'lucide-react';

const Recipes = () => {
  const [lang, setLang] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...new Set(recipes.map(r => r.category))];

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe[lang].title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          recipe[lang].excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || recipe.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pt-32 pb-24 bg-stone-50 dark:bg-[#1a1412] selection:bg-mustard-500/30">
      <div className="container mx-auto px-6 lg:px-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-display font-black text-stone-900 dark:text-stone-100 mb-4 tracking-tight">
              Culinary <span className="text-transparent bg-clip-text bg-gradient-to-r from-mustard-600 to-amber-500">Heritage</span>
            </h1>
            <p className="text-lg text-stone-600 dark:text-stone-400">
              {lang === 'en' 
                ? "Discover authentic Indian recipes that bring out the true flavors of KC Traders' pure mustard oil." 
                : "केसी ट्रेडर्स के शुद्ध सरसों के तेल के असली स्वाद को बाहर लाने वाली प्रामाणिक भारतीय रेसिपी खोजें।"}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-black/30 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <Globe className="w-5 h-5 text-stone-400 ml-3" />
            <div className="flex">
              <button 
                onClick={() => setLang('en')}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${lang === 'en' ? 'bg-mustard-500 text-black shadow-md' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'}`}
              >
                English
              </button>
              <button 
                onClick={() => setLang('hi')}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${lang === 'hi' ? 'bg-mustard-500 text-black shadow-md' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'}`}
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="flex overflow-x-auto no-scrollbar gap-2 w-full md:w-auto pb-2 md:pb-0">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap border ${
                  activeCategory === cat 
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-black border-stone-900 dark:border-stone-100' 
                    : 'bg-transparent text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700 hover:border-mustard-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
            <input
              type="text"
              placeholder={lang === 'en' ? "Search recipes..." : "रेसिपी खोजें..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white dark:bg-black/30 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-mustard-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Recipe Grid */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-24 glass-card bg-white dark:bg-black/20 rounded-3xl border border-stone-100 dark:border-stone-800">
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-stone-300 dark:text-stone-700" />
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">No recipes found</h3>
            <p className="text-stone-500">Try adjusting your search or category filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecipes.map((recipe, idx) => (
              <motion.div 
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link to={`/recipes/${recipe.id}`} className="group block bg-white dark:bg-[#251e1a] rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={recipe.image} 
                      alt={recipe[lang].title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-mustard-600 dark:text-mustard-400">
                      {recipe.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-3 group-hover:text-mustard-600 dark:group-hover:text-mustard-400 transition-colors line-clamp-2">
                      {recipe[lang].title}
                    </h3>
                    <p className="text-stone-600 dark:text-stone-400 text-sm mb-6 line-clamp-3">
                      {recipe[lang].excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800 text-xs font-bold text-stone-500 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {recipe.prepTime}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ChefHat className="w-4 h-4" />
                        {recipe.author}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recipes;
