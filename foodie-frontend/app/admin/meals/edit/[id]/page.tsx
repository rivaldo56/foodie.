import { MealForm } from '@/components/admin/MealForm';

interface EditMealPageProps {
  params: {
    id: string;
  };
}

export default function EditMealPage({ params }: EditMealPageProps) {
  return <MealForm mealId={params.id} />;
}
