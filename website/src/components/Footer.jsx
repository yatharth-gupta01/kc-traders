import { Droplet, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 dark:bg-black text-slate-300 py-16 border-t border-white/10">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <a href="#home" className="flex items-center gap-2 mb-6">
              <div className="relative w-8 h-8 text-mustard-500">
                <Droplet className="w-full h-full fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl text-white tracking-tight">K.C. TRADERS</span>
                <span className="text-[10px] text-mustard-500 tracking-widest uppercase">Pure Mustard Oil</span>
              </div>
            </a>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Serving purity from the golden fields of Jarar, Bah, Agra to your dining table. Experience the authentic taste of tradition.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-mustard-500 hover:text-white transition"><Facebook className="w-5 h-5"/></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-mustard-500 hover:text-white transition"><Instagram className="w-5 h-5"/></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-mustard-500 hover:text-white transition"><Twitter className="w-5 h-5"/></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#home" className="hover:text-mustard-400 transition">Home</a></li>
              <li><a href="#about" className="hover:text-mustard-400 transition">Our Story</a></li>
              <li><a href="#products" className="hover:text-mustard-400 transition">Products</a></li>
              <li><a href="#process" className="hover:text-mustard-400 transition">Manufacturing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Support & Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-mustard-400 transition">Distributor Inquiry</a></li>
              <li><a href="#" className="hover:text-mustard-400 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-mustard-400 transition">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-mustard-400 transition">FSSAI License Info</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Newsletter</h4>
            <p className="text-sm text-slate-400 mb-4">Subscribe to receive updates on new products and offers.</p>
            <form className="flex">
              <input type="email" placeholder="Your email" className="w-full px-4 py-2 rounded-l-lg bg-white/10 border border-white/10 focus:outline-none focus:border-mustard-500 text-sm" />
              <button type="button" className="px-4 py-2 bg-mustard-500 text-slate-900 font-bold rounded-r-lg hover:bg-mustard-600 transition">
                Subscribe
              </button>
            </form>
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} K.C. Traders, Agra. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Designed with &hearts; for purity.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
