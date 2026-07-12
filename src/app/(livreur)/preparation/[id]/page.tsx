import { PreparationInterface } from '@/components/commandes/PreparationInterface';

export default function LivreurPreparationPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
      <PreparationInterface id={params.id} />
    </div>
  );
}
