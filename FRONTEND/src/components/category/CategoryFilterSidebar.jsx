// import { Tree } from "primereact/tree";
// import { Divider } from "primereact/divider";
// import { Slider } from "primereact/slider";
// import { useState } from "react";
// import { useTheme } from "../../context/ThemeContext";
// import { Skeleton } from "primereact/skeleton";
// import { InputNumber } from "primereact/inputnumber";

// function CategoryFilterSidebar({ ...props}) {
//   const { isLoading, categoryTree } = props;
//   const { darkMode } = useTheme();

//   const [selectedKeys, setSelectedKeys] = useState({});
//   const [priceRange, setPriceRange] = useState([500, 5000]);

//   const mapTreeForPrime = (nodes = []) =>
//   nodes.map((n) => ({
//     key: String(n.category_id),
//     label: n.category_name,
//     data: n,
//     children: mapTreeForPrime(n.children || []),
//   }));

//   const treeNodes = mapTreeForPrime(categoryTree);

//   // const categoryNodes = [
//   //   {
//   //     key: "0",
//   //     label: "Electronics",
//   //     children: [
//   //       { key: "0-0", label: "Mobiles" },
//   //       { key: "0-1", label: "Laptops" },
//   //     ],
//   //   },
//   //   {
//   //     key: "1",
//   //     label: "Fashion",
//   //     children: [
//   //       { key: "1-0", label: "Men" },
//   //       { key: "1-1", label: "Women" },
//   //     ],
//   //   },
//   // ];

//   return (
//     <div
//       className={`w-full lg:w-72 rounded-2xl border p-5 ${
//         darkMode
//           ? "border-[#1f2933] bg-[#151e22] text-slate-200"
//           : "border-gray-200 bg-white text-gray-800"
//       }`}
//     >
//       {/* ===== LOADING STATE ===== */}
//       {isLoading ? (
//         <div className="space-y-6">
//           {/* Filters Title */}
//           <Skeleton width="100px" height="24px" />

//           {/* Category Section */}
//           <div className="space-y-3">
//             <Skeleton width="120px" height="18px" />
//             <Skeleton height="18px" />
//             <Skeleton height="18px" />
//             <Skeleton height="18px" />
//             <Skeleton height="18px" />
//           </div>

//           <Divider />

//           {/* Price Section */}
//           <div className="space-y-4">
//             <Skeleton width="100px" height="18px" />
//             <Skeleton height="10px" />
//             <div className="flex justify-between">
//               <Skeleton width="60px" height="18px" />
//               <Skeleton width="60px" height="18px" />
//             </div>
//           </div>
//         </div>
//       ) : (
//         <>
//           <h3 className="text-base font-semibold mb-3">Filters</h3>

//           {/* CATEGORY TREE */}
//           <div>
//             <h4 className="text-xs font-semibold uppercase tracking-wide mb-2 text-gray-500">
//               Categories
//             </h4>

//             <Tree
//               value={categoryNodes}
//               selectionMode="checkbox"
//               selectionKeys={selectedKeys}
//               onSelectionChange={(e) => setSelectedKeys(e.value)}
//               className="category-filter-tree border-none w-full text-sm"
//             />
//           </div>

//           <Divider />

//           {/* PRICE SLIDER */}
//           <div>
//             <h4 className="text-sm font-semibold uppercase tracking-wide mb-3">
//               Price Range
//             </h4>

//             <Slider
//               value={priceRange}
//               onChange={(e) => setPriceRange(e.value)}
//               range
//               min={0}
//               max={10000}
//             />

//             <div className="flex justify-between mt-3 text-sm font-medium text-gray-600">
//               <span>₹{priceRange[0]}</span>
//               <span>₹{priceRange[1]}</span>
//             </div>

//             <div className="flex items-center gap-3">
//               <InputNumber
//   value={priceRange[0]}
//   onValueChange={(e) =>
//     setPriceRange([e.value || 0, priceRange[1]])
//   }
//   mode="currency"
//   currency="INR"
//   locale="en-IN"
//   min={0}
//   max={priceRange[1]}
//   className="w-full"
//   inputClassName="!w-full !rounded-lg !px-2 !py-1.5 !text-sm !border !border-gray-300 focus:!border-amber-500 focus:!ring-0"
// />

//               <span className="text-sm font-medium">-</span>

//               <InputNumber
//                 value={priceRange[1]}
//                 onValueChange={(e) =>
//                   setPriceRange([priceRange[0], e.value || 0])
//                 }
//                 mode="currency"
//                 currency="INR"
//                 locale="en-IN"
//                 min={priceRange[0]}
//                 max={10000}
//                 className="w-full"
//                 inputClassName="!w-full !rounded-lg !px-2 !py-1.5 !text-sm !border !border-gray-300 focus:!border-amber-500 focus:!ring-0"
//                 placeholder="Max"
//               />
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// export default CategoryFilterSidebar;

import { Tree } from "primereact/tree";
import { Divider } from "primereact/divider";
import { Slider } from "primereact/slider";
import { useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Skeleton } from "primereact/skeleton";
import { InputNumber } from "primereact/inputnumber";

function CategoryFilterSidebar({
  isLoading,
  categoryTree = [],
  selectedKeys = {},
  onSelectionChange,
  priceRange = [0, 0],
  minPrice = 0,
  maxPrice = 0,
  onPriceRangeChange,
}) {
  const { darkMode } = useTheme();

  const rangeMax = Math.max(minPrice, maxPrice);

  const mapTreeForPrime = (nodes = [],depth = 0) =>
    nodes.map((n) => ({
      key: String(n.category_id),
      label: n.category_name,
      data: n,
      children: depth < 1 ? mapTreeForPrime(n.children || [], depth + 1) : [],
    }));

  const treeNodes = useMemo(
    () => mapTreeForPrime(categoryTree),
    [categoryTree],
  );

  return (
    <div
      className={`category-filter-panel w-full lg:w-72 rounded-2xl border p-5 lg:sticky lg:top-28 ${
        darkMode
          ? "border-[#1f2933] bg-[#151e22] text-slate-200"
          : "border-gray-200 bg-white text-gray-800"
      }`}
    >
      {/* ===== LOADING STATE ===== */}
      {isLoading ? (
        <div className="space-y-6">
          {/* Filters Title */}
          <Skeleton width="100px" height="24px" />

          {/* Category Section */}
          <div className="space-y-3">
            <Skeleton width="120px" height="18px" />
            <Skeleton height="18px" />
            <Skeleton height="18px" />
            <Skeleton height="18px" />
            <Skeleton height="18px" />
          </div>

          <Divider />

          {/* Price Section */}
          <div className="space-y-4">
            <Skeleton width="100px" height="18px" />
            <Skeleton height="10px" />
            <div className="flex justify-between">
              <Skeleton width="60px" height="18px" />
              <Skeleton width="60px" height="18px" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <h3 className="text-base font-semibold mb-3">Filters</h3>

          {/* CATEGORY TREE */}
          <div>
            <h4
              className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                darkMode ? "text-slate-400" : "text-gray-500"
              }`}
            >
              Categories
            </h4>

            <div
              className={`rounded-xl border p-2 ${
                darkMode
                  ? "border-[#1f2933] bg-[#0f161a]"
                  : "border-gray-200 bg-white"
              }`}
              style={{ maxHeight: "52vh", overflow: "auto" }}
            >
              <Tree
                value={treeNodes}
                selectionMode="checkbox"
                selectionKeys={selectedKeys}
                onSelectionChange={(e) => onSelectionChange?.(e.value)}
                propagateSelectionDown
                propagateSelectionUp
                metaKeySelection={false}
                className={`category-filter-tree border-none w-full text-sm ${
                  darkMode ? "category-filter-tree-dark" : ""
                }`}
              />
            </div>
          </div>

          <Divider />

          {/* PRICE SLIDER */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide mb-3">
              Price Range
            </h4>

            <Slider
              value={priceRange}
              onChange={(e) => onPriceRangeChange?.(e.value)}
              range
              min={minPrice}
              max={rangeMax}
            />

            <div
              className={`flex justify-between mt-3 text-sm font-medium ${
                darkMode ? "text-slate-400" : "text-gray-600"
              }`}
            >
              <span>₹{priceRange[0]}</span>
              <span>₹{priceRange[1]}</span>
            </div>

            <div className="flex items-center gap-3">
              <InputNumber
                value={priceRange[0]}
                onValueChange={(e) =>
                  onPriceRangeChange?.([e.value || minPrice, priceRange[1]])
                }
                mode="currency"
                currency="INR"
                locale="en-IN"
                min={minPrice}
                max={priceRange[1]}
                className="w-full"
                inputClassName={`!w-full !rounded-lg !px-2 !py-1.5 !text-sm !border focus:!ring-0 ${
                  darkMode
                    ? "!bg-[#0f161a] !border-[#223038] !text-slate-100 placeholder:!text-slate-500 focus:!border-[#2f7a6f]"
                    : "!bg-white !border-gray-300 !text-gray-800 placeholder:!text-gray-400 focus:!border-amber-500"
                }`}
              />

              <span
                className={`text-sm font-medium ${
                  darkMode ? "text-slate-400" : "text-gray-600"
                }`}
              >
                -
              </span>

              <InputNumber
                value={priceRange[1]}
                onValueChange={(e) =>
                  onPriceRangeChange?.([priceRange[0], e.value || rangeMax])
                }
                mode="currency"
                currency="INR"
                locale="en-IN"
                min={priceRange[0]}
                max={rangeMax}
                className="w-full"
                inputClassName={`!w-full !rounded-lg !px-2 !py-1.5 !text-sm !border focus:!ring-0 ${
                  darkMode
                    ? "!bg-[#0f161a] !border-[#223038] !text-slate-100 placeholder:!text-slate-500 focus:!border-[#2f7a6f]"
                    : "!bg-white !border-gray-300 !text-gray-800 placeholder:!text-gray-400 focus:!border-amber-500"
                }`}
                placeholder="Max"
              />
            </div>
          </div>
          {darkMode ? (
            <style>{`
              .category-filter-tree-dark .p-treenode-label {
                color: #ffffff;
              }
              .category-filter-tree-dark .p-treenode-content:hover {
                background: #1a2327;
              }
              .category-filter-tree-dark .p-tree-toggler {
                color: #e2e8f0;
              }
              .category-filter-tree-dark .p-tree-checkbox .p-checkbox-box {
                background: #0f161a;
                border: 1px solid #223038;
              }
              .category-filter-tree-dark .p-tree-checkbox .p-checkbox-box.p-highlight {
                background: #2f7a6f;
                border-color: #2f7a6f;
              }
              .category-filter-panel .p-divider.p-divider-horizontal:before {
                border-top-color: ${darkMode ? "#1f2933" : "#e5e7eb"};
              }
            `}</style>
          ) : null}
        </>
      )}
    </div>
  );
}

export default CategoryFilterSidebar;
