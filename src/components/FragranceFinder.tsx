import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, RefreshCw, Check } from 'lucide-react';
import { useCart, Product } from '../store/useCart';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    value: string;
    icon: string;
  }[];
}

const questions: Question[] = [
  {
    id: 1,
    text: "How do you want to feel when wearing this fragrance?",
    options: [
      { text: "Fresh & Energetic", value: "fresh", icon: "🌊" },
      { text: "Bold & Sophisticated", value: "bold", icon: "🎩" },
      { text: "Sweet & Romantic", value: "sweet", icon: "🌸" },
      { text: "Clean & Minimal", value: "clean", icon: "✨" }
    ]
  },
  {
    id: 2,
    text: "What's the primary occasion for this scent?",
    options: [
      { text: "Everyday Wear", value: "daily", icon: "☀️" },
      { text: "Special Evenings", value: "evening", icon: "🌙" },
      { text: "Office / Professional", value: "office", icon: "💼" },
      { text: "Outdoor Adventures", value: "outdoor", icon: "🏔️" }
    ]
  },
  {
    id: 3,
    text: "Which scent family do you naturally gravitate towards?",
    options: [
      { text: "Woody & Earthy", value: "woody", icon: "🌲" },
      { text: "Floral & Fruity", value: "floral", icon: "🍎" },
      { text: "Citrus & Aquatic", value: "citrus", icon: "🍋" },
      { text: "Oriental & Spicy", value: "spicy", icon: "🌶️" }
    ]
  }
];

export default function FragranceFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      findRecommendations(newAnswers);
    }
  };

  const findRecommendations = async (finalAnswers: string[]) => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const products: Product[] = await res.json();
      
      // Simple recommendation logic based on keywords in description/category
      const filtered = products.filter(p => {
        const desc = p.description.toLowerCase();
        const cat = p.category.toLowerCase();
        const notes = `${p.top_notes} ${p.heart_notes} ${p.base_notes}`.toLowerCase();
        
        return finalAnswers.some(ans => 
          desc.includes(ans) || cat.includes(ans) || notes.includes(ans)
        );
      }).slice(0, 3);

      setRecommendations(filtered.length > 0 ? filtered : products.slice(0, 3));
      setStep(questions.length);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setRecommendations([]);
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold-500/5 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 relative">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm font-medium mb-4"
          >
            <Sparkles className="w-4 h-4" />
            Fragrance Finder
          </motion.div>
          <h2 className="text-4xl font-serif font-medium text-white mb-4">Find Your Signature Scent</h2>
          <p className="text-gray-400">Answer a few questions and we'll recommend the perfect fragrance for you.</p>
        </div>

        <div className="glass-panel p-8 sm:p-12 rounded-[2rem] border border-white/5 relative">
          <AnimatePresence mode="wait">
            {step < questions.length ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center mb-8">
                  <span className="text-xs font-mono text-gold-400 uppercase tracking-widest">Question {step + 1} of {questions.length}</span>
                  <div className="flex gap-1">
                    {questions.map((_, i) => (
                      <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i <= step ? 'bg-gold-500' : 'bg-charcoal-800'}`}></div>
                    ))}
                  </div>
                </div>

                <h3 className="text-2xl font-serif text-white text-center mb-12">{questions[step].text}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {questions[step].options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className="group p-6 rounded-2xl bg-charcoal-900/50 border border-white/5 hover:border-gold-500/50 hover:bg-gold-500/5 transition-all text-left flex items-center gap-4"
                    >
                      <span className="text-3xl group-hover:scale-110 transition-transform">{option.icon}</span>
                      <span className="text-lg text-gray-300 group-hover:text-white transition-colors">{option.text}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-8"
              >
                {loading ? (
                  <div className="py-12 flex flex-col items-center gap-4">
                    <RefreshCw className="w-12 h-12 text-gold-400 animate-spin" />
                    <p className="text-gray-400 animate-pulse">Analyzing your preferences...</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-serif text-white">Your Perfect Matches</h3>
                      <p className="text-gray-400">Based on your answers, we think you'll love these:</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {recommendations.map((product) => (
                        <motion.div
                          key={product.id}
                          whileHover={{ y: -5 }}
                          className="group cursor-pointer"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-3 border border-white/5">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                          </div>
                          <h4 className="text-white font-medium group-hover:text-gold-400 transition-colors">{product.name}</h4>
                          <p className="text-gold-400 text-sm">৳{product.price_6ml}</p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="pt-8 border-t border-white/5 flex justify-center gap-4">
                      <button
                        onClick={reset}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-charcoal-900 text-gray-400 hover:text-white transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Start Over
                      </button>
                      <button
                        onClick={() => navigate('/shop')}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gold-500 text-charcoal-950 font-medium hover:bg-gold-400 transition-colors"
                      >
                        View All Products
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
