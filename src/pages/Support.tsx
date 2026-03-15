import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Truck, RotateCcw, HelpCircle, Info, FileText } from 'lucide-react';

const content: Record<string, { title: string; icon: any; text: string[] }> = {
  about: {
    title: 'About Aura Perfumes',
    icon: Info,
    text: [
      'Aura Perfumes is a premium fragrance house dedicated to the art of fine perfumery. Founded with a passion for rare ingredients and masterful blending, we create scents that are more than just fragrances—they are memories captured in a bottle.',
      'Our journey started in Dhaka, with a simple mission: to bring world-class luxury fragrances to the people of Bangladesh. Every bottle of Aura Perfume is a testament to our commitment to quality, elegance, and sophistication.',
      'We believe that a fragrance is a powerful form of self-expression. That\'s why we work with the finest essential oils and traditional techniques to ensure every scent leaves a lasting impression.'
    ]
  },
  shipping: {
    title: 'Shipping & Delivery',
    icon: Truck,
    text: [
      'We offer reliable shipping across all of Bangladesh. Our goal is to get your favorite fragrances to your doorstep as quickly and safely as possible.',
      'Inside Dhaka: Delivery typically takes 1-3 business days. Shipping fee is ৳70.',
      'Outside Dhaka: Delivery typically takes 3-5 business days. Shipping fee is ৳130.',
      'Once your order is shipped, you will receive a confirmation message with tracking details. We use trusted courier services to ensure your package arrives in perfect condition.'
    ]
  },
  returns: {
    title: 'Returns & Exchanges',
    icon: RotateCcw,
    text: [
      'Your satisfaction is our priority. If you are not completely happy with your purchase, we are here to help.',
      'Returns: You can return unopened and unused products within 7 days of delivery for a full refund or exchange.',
      'Damaged Items: If you receive a damaged or incorrect item, please contact us immediately with photos of the product. We will arrange for a replacement at no extra cost to you.',
      'Please note that for hygiene reasons, we cannot accept returns for products that have been opened or used unless they are defective.'
    ]
  },
  faq: {
    title: 'Frequently Asked Questions',
    icon: HelpCircle,
    text: [
      'Q: Are your perfumes long-lasting?\nA: Yes, we use high concentrations of fragrance oils to ensure our scents last for 8-12 hours or more, depending on the specific fragrance and skin type.',
      'Q: Do you offer samples?\nA: We have a Discovery Set available for purchase that includes 5 of our signature scents in mini bottles, perfect for finding your favorite.',
      'Q: Is it safe to buy online?\nA: Absolutely. We use secure payment gateways and offer Cash on Delivery for your peace of mind.',
      'Q: Can I customize a gift message?\nA: Yes, during checkout, you can add a personalized gift message that we will include with your order.'
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    icon: Shield,
    text: [
      'At Aura Perfumes, we value your privacy. This policy explains how we collect, use, and protect your personal information.',
      'Information Collection: We collect information you provide when placing an order, such as your name, address, phone number, and email.',
      'Use of Information: Your data is used solely for processing orders, providing customer support, and sending occasional updates if you opt-in.',
      'Data Security: We implement industry-standard security measures to protect your data from unauthorized access. We never sell or share your personal information with third parties for marketing purposes.'
    ]
  },
  terms: {
    title: 'Terms of Service',
    icon: FileText,
    text: [
      'By using our website and purchasing our products, you agree to the following terms and conditions.',
      'Product Accuracy: We strive to display our products as accurately as possible. However, actual colors and packaging may vary slightly.',
      'Pricing: All prices are in Bangladeshi Taka (৳) and are subject to change without notice.',
      'Order Acceptance: We reserve the right to refuse or cancel any order for reasons such as product unavailability or errors in pricing.',
      'Intellectual Property: All content on this website, including text, images, and logos, is the property of Aura Perfumes and protected by copyright laws.'
    ]
  }
};

export default function Support() {
  const location = useLocation();
  const path = location.pathname.split('/')[1] || 'about';
  const data = content[path] || content.about;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  const Icon = data.icon;

  return (
    <div className="min-h-screen bg-charcoal-950 pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-panel p-8 md:p-12 rounded-3xl border border-white/5 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center border border-gold-500/20">
              <Icon className="w-8 h-8 text-gold-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-white">{data.title}</h1>
          </div>

          <div className="space-y-6">
            {data.text.map((paragraph, index) => (
              <p key={index} className="text-gray-300 leading-relaxed text-lg whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-gray-400 text-sm">
              Need more help? Contact our support team at <span className="text-gold-400">auraperfumes@gmail.com</span> or call us at <span className="text-gold-400">+880 1913745672</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
