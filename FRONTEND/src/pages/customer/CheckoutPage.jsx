import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { ArrowRight } from "lucide-react";

function CheckoutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fff8ee] dark:bg-[#0b151b] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center py-20">
          <div className="w-16 h-16 bg-[#2f7a6f]/10 rounded-full flex items-center justify-center mb-6">
            <ArrowRight className="w-8 h-8 text-[#2f7a6f]" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 dark:text-slate-100 mb-3">
            Checkout
          </h1>
          <p className="text-gray-500 dark:text-slate-400 max-w-md mb-6">
            Checkout page is ready for integration. Complete your order processing flow here.
          </p>
          <Button
            label="Back to Cart"
            icon="pi pi-arrow-left"
            onClick={() => navigate("/cart")}
            className="!bg-[#2f7a6f] !border-none !text-white !rounded-xl hover:!bg-[#265c54]"
          />
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
