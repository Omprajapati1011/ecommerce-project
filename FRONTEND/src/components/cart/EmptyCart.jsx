import { Link } from "react-router-dom";
import { Button } from "primereact/button";

export function EmptyCart({ onContinueShopping }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-48 h-48 mb-8 relative">
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Shopping cart illustration */}
          <circle cx="100" cy="100" r="80" className="fill-[#f3ecdf] dark:fill-[#243440]" />
          <path
            d="M60 70H140L130 140H70L60 70Z"
            stroke="#2f7a6f"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M50 70H150"
            stroke="#2f7a6f"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M65 55L70 70"
            stroke="#2f7a6f"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M135 55L130 70"
            stroke="#2f7a6f"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="85" cy="150" r="8" stroke="#2f7a6f" strokeWidth="3" fill="none" />
          <circle cx="115" cy="150" r="8" stroke="#2f7a6f" strokeWidth="3" fill="none" />
          {/* Sad face */}
          <circle cx="90" cy="95" r="3" fill="#2f7a6f" />
          <circle cx="110" cy="95" r="3" fill="#2f7a6f" />
          <path
            d="M95 105 Q100 100 105 105"
            stroke="#2f7a6f"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      <h2 className="font-serif text-2xl md:text-3xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
        Your cart is empty
      </h2>
      <p className="text-gray-500 dark:text-slate-400 text-center max-w-md mb-8">
        Looks like you haven't added anything to your cart yet. 
        Explore our products and find something you love!
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          label="Continue Shopping"
          icon="pi pi-arrow-right"
          iconPos="right"
          onClick={onContinueShopping}
          className="px-6 py-3 bg-[#2f7a6f] border-none text-white rounded-xl hover:bg-[#265c54] transition-all shadow-lg shadow-[#2f7a6f]/20"
        />
        <Link to="/dashboard">
          <Button
            label="View Dashboard"
            icon="pi pi-th-large"
            className="px-6 py-3 bg-white dark:bg-[#151e22] text-[#2f7a6f] border-2 border-[#2f7a6f] rounded-xl hover:bg-[#2f7a6f]/5 transition-all"
          />
        </Link>
      </div>
    </div>
  );
}
