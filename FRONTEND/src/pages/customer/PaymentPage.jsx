import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { CreditCard } from "lucide-react";

function PaymentPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fff8ee] dark:bg-[#0b151b] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center py-20">
          <div className="w-16 h-16 bg-[#2f7a6f]/10 rounded-full flex items-center justify-center mb-6">
            <CreditCard className="w-8 h-8 text-[#2f7a6f]" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 dark:text-slate-100 mb-3">
            Payment
          </h1>
          <p className="text-gray-500 dark:text-slate-400 max-w-md mb-6">
            Payment page is ready for integration. Configure your payment gateway here.
          </p>
          <Button
            label="Back to Dashboard"
            icon="pi pi-arrow-left"
            onClick={() => navigate("/dashboard")}
            className="!bg-[#2f7a6f] !border-none !text-white !rounded-xl hover:!bg-[#265c54]"
          />
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
