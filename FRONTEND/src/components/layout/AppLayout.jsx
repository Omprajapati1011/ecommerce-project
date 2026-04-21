import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ScrollToTop from "../common/ScrollToTop";
import { getAllCategories } from "../../services/categoryApi";

const extractCategoryTree = (response) => {
  const data = response?.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

function AppLayout() {
  const { darkMode } = useTheme();
  const [categoryTree, setCategoryTree] = useState([]);
  const [isCategoryTreeLoading, setIsCategoryTreeLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        setIsCategoryTreeLoading(true);
        const response = await getAllCategories();
        if (!active) return;
        setCategoryTree(extractCategoryTree(response));
      } catch {
        if (!active) return;
        setCategoryTree([]);
      } finally {
        if (active) {
          setIsCategoryTreeLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className={`flex min-h-screen flex-col font-sans ${darkMode ? "bg-[#0b1114] text-slate-200" : "bg-gray-50 text-gray-900"}`}
    >
      <ScrollToTop />
      <Navbar categoryTree={categoryTree} />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-8 pt-3 md:px-8 md:pb-10 md:pt-4 lg:px-12 lg:pt-5">
        <Outlet context={{ categoryTree, isCategoryTreeLoading }} />
      </main>
      <Footer />
    </div>
  );
}

export default AppLayout;
