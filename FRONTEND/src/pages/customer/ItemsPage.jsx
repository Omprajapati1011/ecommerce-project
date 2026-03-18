import { useParams } from "react-router-dom";

function ItemsPage() {
  const { id } = useParams();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Cart Items</h1>
        <p className="mt-3 text-sm text-gray-600">
          Placeholder cart page for /items/{id}
        </p>
      </div>
    </div>
  );
}

export default ItemsPage;
