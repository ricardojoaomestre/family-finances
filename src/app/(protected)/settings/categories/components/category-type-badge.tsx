import { Badge } from '@/components/ui/badge';
import {
  categoryTypeLabels,
  type CategoryType,
} from '@/lib/categories/category-type';

const categoryTypeBadgeVariant: Record<
  CategoryType,
  'default' | 'secondary' | 'outline' | 'success'
> = {
  spending: 'default',
  income: 'success',
  transfer: 'secondary',
  saving: 'outline',
};

type CategoryTypeBadgeProps = {
  type: CategoryType;
};

export function CategoryTypeBadge({ type }: CategoryTypeBadgeProps) {
  return (
    <Badge variant={categoryTypeBadgeVariant[type]}>
      {categoryTypeLabels[type]}
    </Badge>
  );
}
