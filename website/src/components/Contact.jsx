import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Send, MessageCircle } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pre-fill email client as backend is optional
    window.location.href = `mailto:info@kctraders.com?subject=Inquiry from ${formData.name}&body=${formData.message} (%0A%0A From: ${formData.email})`;
  };

  return (
    <section id="contact" className="py-24 bg-slate-50 dark:bg-earth-dark">
      <div className="container mx-auto px-6 lg:px-12">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-6">
            Get in <span className="text-gradient">Touch</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Have questions about bulk orders, distribution, or our process? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          
          {/* Contact Info & Map */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-2xl flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-mustard-100 dark:bg-mustard-900/30 text-mustard-600 dark:text-mustard-400 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Location</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Jarar, Bah,<br/>Agra, UP, India</p>
              </div>
              
              <div className="glass p-6 rounded-2xl flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-mustard-100 dark:bg-mustard-900/30 text-mustard-600 dark:text-mustard-400 rounded-full flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Contact</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">+91 7617787544</p>
              </div>
            </div>


          </motion.div>

          {/* Form */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 md:p-10 rounded-3xl"
          >
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Send us a Message</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-earth-dark/50 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white transition"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-earth-dark/50 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white transition"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message</label>
                <textarea 
                  required
                  rows="4"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-earth-dark/50 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white transition resize-none"
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="w-full py-4 bg-mustard-500 hover:bg-mustard-600 text-slate-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 interactive mt-2"
              >
                <Send className="w-5 h-5" />
                Submit Inquiry
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/917617787544" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 p-4 bg-green-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 interactive flex items-center justify-center animate-bounce"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-8 h-8" />
      </a>
    </section>
  );
};

export default Contact;
