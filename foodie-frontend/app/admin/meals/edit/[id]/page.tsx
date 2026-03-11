import { MealForm } from '@/components/admin/MealForm';

interface EditMealPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditMealPage({ params }: EditMealPageProps) {
  const { id } = await params;
  return <MealForm mealId={id} />;
}
