/**
 * @file 行业管理页面
 * @description 提供行业的增删改查管理界面
 * @route /industry
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React from 'react';
import IndustryManagement from '@/components/industry/industry-management';

/**
 * 行业管理页面组件
 */
export default function IndustryPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <IndustryManagement />
    </div>
  );
}