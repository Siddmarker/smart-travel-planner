'use client';

import { Card } from '@/components/ui/card';
import { discoveryCategories, DiscoveryCategory } from '@/data/mockDiscovery';

interface CategoryGridProps {
    onSelectCategory?: (categoryId: string) => void;
    selectedCategory?: string;
}

export function CategoryGrid({ onSelectCategory, selectedCategory }: CategoryGridProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {discoveryCategories.map((category) => (
                <Card
                    key={category.id}
                    className={`p-4 cursor-pointer hover:shadow-lg transition-all ${selectedCategory === category.id ? 'ring-2 ring-primary' : ''
                        }`}
                    onClick={() => onSelectCategory?.(category.id)}
                >
                    <div className="text-center">
                        <div className="text-3xl mb-2">{category.icon}</div>
                        <h3 className="font-medium text-sm">{category.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{category.count} places</p>
                    </div>
                </Card>
            ))}
        </div>
    );
}
