import React from 'react';
import SkeletonLoader from '../common/SkeletonLoader';

const ShiftCardSkeleton: React.FC = () => {
  return (
    <div className="border-l-8 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-dark-800 mb-4 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <SkeletonLoader width="180px" height="20px" />
            <SkeletonLoader width="120px" height="16px" />
          </div>
          <div>
            <SkeletonLoader type="circle" width="40px" height="40px" />
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <SkeletonLoader type="rectangle" height="12px" width="70%" />
          <SkeletonLoader type="circle" width="32px" height="32px" />
        </div>
        
        <div className="mt-4 md:mt-2 flex flex-col md:flex-row md:items-center">
          <div className="md:order-2 md:ml-4 mt-1 md:mt-0 md:pr-2">
            <SkeletonLoader width="80px" height="24px" className="rounded-full" />
          </div>
          <div className="md:order-1 flex flex-col md:items-start">
            <SkeletonLoader width="100px" height="20px" />
            <div className="mt-1">
              <SkeletonLoader width="90px" height="26px" className="rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftCardSkeleton; 