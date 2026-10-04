import React, { useState, useEffect } from 'react';
import { MEMBERSHIP_PLANS } from '../data/gymData';
import { Check, Flame, ShieldCheck, X } from 'lucide-react';
import { getActiveMarketCountry, getMembershipPrice } from '../utils/marketService';
import { MarketCountry } from '../types';

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planName: string) => void;
}

export const MembershipModal: React.FC<MembershipModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan
}) => {
  const [activeMarketCountry, setActiveMarketCountryState] = useState<MarketCountry>(getActiveMarketCountry());

  useEffect(() => {
    const handleMarketChange = (e: Event) => {
      const customEvt = e as CustomEvent<{ country: MarketCountry }>;
      if (customEvt.detail?.country) {
        setActiveMarketCountryState(customEvt.detail.country);
      } else {
        setActiveMarketCountryState(getActiveMarketCountry());
      }
    };
    window.addEventListener('bxstrength_market_changed', handleMarketChange);
    return () => window.removeEventListener('bxstrength_market_changed', handleMarketChange);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-gray-200 overflow-hidden flex flex-col my-0 sm:my-8 animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="bg-[#111111] text-white p-6 flex items-center justify-between border-b border-gray-800">
          <div>
            <span className="text-xs font-black text-[#E52165] uppercase tracking-widest">
              JOIN BXSTRENGTH PERFORMANCE CLUB
            </span>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white mt-0.5">
              SELECT YOUR MEMBERSHIP PASS
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Plans Grid */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50">
          {MEMBERSHIP_PLANS.map((plan) => {
            const { amount, symbol } = getMembershipPrice(plan, activeMarketCountry);

            return (
              <div
                key={plan.id}
                className={`bg-white p-6 border flex flex-col justify-between relative transition-all ${
                  plan.popular 
                    ? 'border-2 border-[#E52165] shadow-xl' 
                    : 'border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#E52165] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow">
                    MOST POPULAR
                  </div>
                )}

                <div>
                  <h4 className="text-lg font-black text-gray-900 uppercase text-center mb-2">
                    {plan.name}
                  </h4>

                  <div className="text-center py-4 border-b border-gray-100">
                    <span className="text-4xl font-black text-gray-900">{symbol}{amount.toLocaleString()}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase"> / {plan.period}</span>
                  </div>

                  <ul className="py-6 space-y-3 text-xs text-gray-600">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#E52165] flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    onSelectPlan(plan.name);
                    onClose();
                  }}
                  className={`w-full font-black text-xs tracking-widest py-3.5 uppercase transition-colors cursor-pointer ${
                    plan.popular
                      ? 'bg-[#E52165] hover:bg-[#c41551] text-white shadow-md shadow-pink-500/20'
                      : 'bg-gray-900 hover:bg-[#E52165] text-white'
                  }`}
                >
                  SELECT {plan.name}
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
