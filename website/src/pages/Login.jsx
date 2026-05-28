import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Store, User, Lock, Mail, ArrowRight, ShieldAlert, Key } from 'lucide-react';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginRole, setLoginRole] = useState('customer'); // For registration context
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRegistering) {
        const res = await register(formData.name, formData.email, formData.password, loginRole);
        if (res.success) {
            // Auto login after reg
            const loginRes = await login(formData.email, formData.password);
            if (loginRes.success) navigate(loginRole === 'admin' ? '/dashboard' : '/shop');
        } else {
            setErrorMsg(res.error);
        }
    } else {
        const res = await login(formData.email, formData.password);
        if (res.success) {
            navigate(res.role === 'admin' ? '/dashboard' : '/shop');
        } else {
            setErrorMsg(res.error);
        }
    }
  };

  return (
    <div className="min-h-screen pt-24 bg-slate-50 dark:bg-earth-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
            Secure Authentication
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Powered by modern cryptography
          </p>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden shadow-2xl p-2 relative">
          
          {isRegistering && (
             <div className="flex relative items-center gap-2 justify-center p-4 bg-slate-100 dark:bg-white/5 rounded-2xl mb-4 mx-4 mt-4">
                 <ShieldAlert className="text-green-500 w-5 h-5"/>
                 <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Bank-level bcrypt hashing initialized</p>
             </div>
          )}

          {isRegistering && (
            <div className="flex flex-wrap md:flex-nowrap relative z-10 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl mb-8 mx-4 mt-4 gap-1">
              <button
                type="button"
                onClick={() => setLoginRole('customer')}
                className={`flex-1 py-3 px-2 text-xs md:text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-1 md:gap-2 ${
                  loginRole === 'customer' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                <User className="w-4 h-4" /> Customer
              </button>
              <button
                type="button"
                onClick={() => setLoginRole('shopkeeper')}
                className={`flex-1 py-3 px-2 text-xs md:text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-1 md:gap-2 ${
                  loginRole === 'shopkeeper' ? 'bg-mustard-500 text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Store className="w-4 h-4" /> Shopkeeper
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-5 mt-6">
            
            {errorMsg && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-bold">
                    {errorMsg}
                </div>
            )}

            {isRegistering && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" required value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white"
                      placeholder="Rahul Sharma"
                    />
                  </div>
                </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" required value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" required value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 mt-6 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 interactive bg-slate-900 hover:bg-slate-800 dark:bg-mustard-500 dark:hover:bg-mustard-600 text-white dark:text-slate-900"
            >
              {isRegistering ? 'Create Secure Account' : 'Sign In Securely'} <ArrowRight className="w-5 h-5" />
            </button>
            
            <p className="text-center text-sm text-slate-500 mt-4">
               {isRegistering ? 'Already have an account?' : 'Need a KC Traders account?'}
               <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="ml-2 font-bold text-mustard-600 dark:text-mustard-400 hover:underline">
                   {isRegistering ? 'Log In' : 'Register Here'}
               </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
