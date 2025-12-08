/**
 * @file 行业切换组件
 * @description 提供在不同行业场景间快速切换的功能
 * @module industry
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Briefcase, Globe, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

/**
 * 行业选项接口
 */
interface IndustryOption {
  id: string;
  code: string;
  name: string;
  icon?: React.ReactNode;
}

/**
 * 行业切换组件Props
 */
interface IndustrySwitcherProps {
  className?: string;
}

/**
 * 行业切换组件
 * 允许用户在不同行业场景间快速切换
 */
const IndustrySwitcher = ({ className = '' }: IndustrySwitcherProps) => {
  const { currentIndustry, switchIndustry } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 模拟可用行业列表
  const availableIndustries: IndustryOption[] = [
    { id: 'data_center', code: 'DATA_CENTER', name: '数据中心', icon: <Globe className="w-4 h-4" /> },
    { id: 'finance', code: 'FINANCE', name: '金融行业', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'education', code: 'EDUCATION', name: '教育行业', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'healthcare', code: 'HEALTHCARE', name: '医疗行业', icon: <Briefcase className="w-4 h-4" /> },
  ];

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理行业切换
  const handleIndustryChange = async (industry: IndustryOption) => {
    try {
      await switchIndustry(industry.id, industry.code, industry.name);
      setIsOpen(false);
    } catch (error) {
      console.error('切换行业失败:', error);
    }
  };

  // 处理键盘导航
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div 
      ref={dropdownRef} 
      className={`relative inline-block ${className}`}
      data-testid="industry-switcher"
    >
      {/* 行业切换按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-lg border border-slate-700 transition-all duration-200 backdrop-blur-sm"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="font-medium">{currentIndustry?.name || '选择行业'}</span>
        <span className="text-xs px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full">切换</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* 行业下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg bg-slate-900 border border-slate-800 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-2 bg-slate-800 text-sm text-slate-400 border-b border-slate-700">
            选择行业场景
          </div>
          <div className="max-h-64 overflow-y-auto">
            {availableIndustries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => handleIndustryChange(industry)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${currentIndustry?.id === industry.id 
                  ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500' 
                  : 'hover:bg-slate-800 text-slate-300'}`}
              >
                <span className="flex-shrink-0">
                  {industry.icon || <Briefcase className="w-4 h-4 text-slate-500" />}
                </span>
                <span className="font-medium">{industry.name}</span>
                {currentIndustry?.id === industry.id && (
                  <span className="ml-auto text-xs px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full">
                    当前
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="px-4 py-2 bg-slate-800/50 border-t border-slate-700 flex justify-between items-center">
            <span className="text-xs text-slate-500">{availableIndustries.length} 个行业</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw size={12} />
              刷新
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndustrySwitcher;
