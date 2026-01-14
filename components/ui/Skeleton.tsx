
import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height, count = 1 }) => {
    return (
        <div className="space-y-2">
            {[...Array(count)].map((_, i) => (
                <div
                    key={i}
                    className={`bg-gray-200 dark:bg-gray-700 animate-pulse rounded ${className}`}
                    style={{
                        width: width || '100%',
                        height: height || '1rem'
                    }}
                ></div>
            ))}
        </div>
    );
};
