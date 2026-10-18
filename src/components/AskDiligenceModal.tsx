import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, HelpCircle, ShieldAlert } from 'lucide-react';
import { Property, UserProfile } from '../types';
import { COUNTRY_PACKS } from '../data/countryPacks';
import { api } from '../services/api';

interface AskDiligenceModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AskDiligenceModal: React.FC<AskDiligenceModalProps> = ({
  property,
  isOpen,
  onClose,
  userProfile,
}) => {
  if (!isOpen) return null;

  const countryPack = property ? COUNTRY_PACKS[property.country] : null;

  const defaultSuggestedQuestions = property
    ? [
        `What are the foreign buyer restrictions for ${property.city}?`,
        `Are there any known strata management issues or sinking fund risks with ${property.title}?`,
        `What total stamp duty and legal fees should I budget for?`,
        `What questions should I ask during a physical site inspection here?`,
      ]
    : [
        'How does a Debt Service Ratio (DSR) stress test protect a homebuyer?',
        'What is the difference between Master Title and Strata Title in Malaysia?',
        'How does 99-year lease decay impact property resale in Singapore?',
        'Why is a 30-year Encumbrance Certificate critical in India?',
      ];

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: property
        ? `Hello! I'm your Homestory Due Diligence Copilot. I'm ready to evaluate legal, financial, strata, and structural due diligence questions for "${property.title}" under ${property.country} law.`
        : `Hello! I'm your Homestory Due Diligence Copilot. How can I assist your real estate underwriting and due diligence research today?`,
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (qToSend?: string) => {
    const question = qToSend || inputQuestion;
    if (!question.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const answer = await api.askDiligenceQuestion({
        question,
        property: property as any,
        countryPack,
        residencyStatus: userProfile.residencyStatus,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I encountered an issue connecting to the diligence service. Please ensure all regulatory title searches and bank pre-approvals are conducted directly.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#FAF7F0] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[#E5DEC9] h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E5DEC9] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1E2A44] flex items-center justify-center text-[#C98A3E] shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#1E2A44] flex items-center gap-2">
                Due Diligence AI Copilot
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Gemini 3.8 Flash
                </span>
              </h3>
              <p className="text-xs text-[#1E2A44]/70">
                {property ? `Assessing: ${property.title} (${property.country})` : 'Cross-border real estate advisory'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-[#E5DEC9] hover:bg-gray-100 text-[#1E2A44] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                  m.role === 'user'
                    ? 'bg-[#C98A3E] text-white'
                    : 'bg-[#1E2A44] text-[#C98A3E]'
                }`}
              >
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] ${
                  m.role === 'user'
                    ? 'bg-[#1E2A44] text-white rounded-tr-none'
                    : 'bg-white border border-[#E5DEC9] text-[#1E2A44] rounded-tl-none shadow-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#1E2A44] flex items-center justify-center text-[#C98A3E] text-xs shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#E5DEC9] text-xs text-[#1E2A44]/70 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-[#1E2A44]/30 border-t-[#1E2A44] rounded-full animate-spin" />
                <span>Evaluating against regulatory guidelines...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        <div className="px-4 py-2 bg-white/60 border-t border-[#E5DEC9] shrink-0">
          <div className="text-[11px] font-bold text-[#1E2A44]/60 uppercase tracking-wider mb-1.5">
            Suggested Diligence Prompts:
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {defaultSuggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#E5DEC9] hover:border-[#C98A3E] text-[11px] text-[#1E2A44] shrink-0 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[#E5DEC9] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask about title search, foreign quotas, tax rules, defect risks..."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5DEC9] bg-[#FAF7F0] focus:ring-1 focus:ring-[#C98A3E] focus:outline-none text-[#1E2A44]"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuestion.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-[#C98A3E]" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>

          <p className="text-[10px] text-center text-[#1E2A44]/50 mt-2 flex items-center justify-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            Decision-support analysis grounded in statutory frameworks. Not official legal counsel.
          </p>
        </div>
      </div>
    </div>
  );
};
