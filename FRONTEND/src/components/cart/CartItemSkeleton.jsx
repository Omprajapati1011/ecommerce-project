import { Skeleton } from "primereact/skeleton";

export function CartItemSkeleton() {
  return (
    <div className="bg-white dark:bg-[#151e22] rounded-2xl p-4 md:p-6 shadow-sm border border-[#e8dccf] dark:border-[#243440]">
      <div className="flex gap-4 md:gap-6">
        {/* Image Skeleton */}
        <div className="flex-shrink-0">
          <Skeleton 
            width="128px" 
            height="128px" 
            borderRadius="12px" 
            className="bg-gray-200 dark:bg-[#243440]"
          />
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton width="60%" height="24px" className="bg-gray-200 dark:bg-[#243440]" />
              <Skeleton width="40%" height="16px" className="bg-gray-200 dark:bg-[#243440]" />
            </div>
            <Skeleton width="80px" height="28px" className="bg-gray-200 dark:bg-[#243440]" />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Skeleton width="60px" height="24px" borderRadius="4px" className="bg-gray-200 dark:bg-[#243440]" />
            <Skeleton width="80px" height="24px" borderRadius="4px" className="bg-gray-200 dark:bg-[#243440]" />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#243440]">
            <div className="flex items-center gap-2">
              <Skeleton width="80px" height="36px" borderRadius="8px" className="bg-gray-200 dark:bg-[#243440]" />
            </div>
            <Skeleton width="100px" height="36px" borderRadius="8px" className="bg-gray-200 dark:bg-[#243440]" />
          </div>
        </div>
      </div>
    </div>
  );
}
