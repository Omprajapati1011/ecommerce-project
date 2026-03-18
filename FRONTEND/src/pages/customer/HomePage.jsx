import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SmartImage from "../../components/common/SmartImage";
import {
  getAllCategories,
  getAllProducts,
  getBestSellers,
} from "../../services/categoryApi";

const extractCategoryTree = (response) => {
  const data = response?.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const extractProducts = (response) => {
  const data = response?.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const extractBestSellers = (response) => {
  const data = response?.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.product_id || product.id}`}
      className="group overflow-hidden rounded-2xl border border-amber-200/70 bg-white/85 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-100/70 dark:border-[#1f2933] dark:bg-[#151e22]"
    >
      <div className="h-48 overflow-hidden bg-[#f8f3ea] dark:bg-[#10171b]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.display_name || product.name || "Product"}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
          {product.display_name || product.name}
        </h3>
        <p className="text-xl font-bold text-amber-600">
          ₹{Number(product.discounted_price ?? product.price ?? 0).toLocaleString("en-IN")}
        </p>
        <span className="inline-flex items-center text-sm font-semibold text-amber-700 dark:text-amber-300">
          View Product
        </span>
      </div>
    </Link>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-80 animate-pulse rounded-2xl border border-amber-200/70 bg-white/70" />
      ))}
    </div>
  );
}

function SectionHeader({ title, subtitle, href }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h2 className="font-serif text-3xl text-gray-900 dark:text-slate-100">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {subtitle}
        </p>
      </div>
      {href && (
        <Link
          to={href}
          className="text-sm font-semibold text-amber-600 transition hover:text-amber-700 dark:text-amber-400"
        >
          View all →
        </Link>
      )}
    </div>
  );
}

function HomePage() {
  const [newReleases, setNewReleases] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hash } = useLocation();

  // Scroll to anchor after content finishes loading
  useEffect(() => {
    if (!hash || loading) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash, loading]);

  useEffect(() => {
    let active = true;

    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, newReleasesRes, bestSellersRes] = await Promise.all([
          getAllCategories(),
          getAllProducts({ page: 1, limit: 4, sortField: "created_at", sortOrder: "desc" }),
          getBestSellers(4),
        ]);

        if (!active) return;

        const categories = extractCategoryTree(categoriesRes)
          .flatMap((category) => [category, ...(category.children || [])])
          .filter(Boolean);

        setFeaturedCategories(categories);
        setNewReleases(extractProducts(newReleasesRes).slice(0, 4));
        setBestSellers(extractBestSellers(bestSellersRes).slice(0, 4));
      } catch {
        if (!active) return;
        setFeaturedCategories([]);
        setNewReleases([]);
        setBestSellers([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadHomeData();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-white p-10 dark:bg-[#151e22] md:p-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(217,119,6,0.12),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(11,17,20,0.4),transparent_40%)] dark:opacity-70" />
        <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-accent text-sm uppercase tracking-[0.2em] text-amber-600">
              New Collection 2026
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-gray-900 dark:text-slate-100 md:text-5xl">
              Everything You Need in One Storefront
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-500 dark:text-slate-300">
              Discover curated electronics, gaming, fashion, and appliances
              tailored for every part of your daily life.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="rounded-lg bg-amber-600 px-6 py-3 font-accent font-medium text-white shadow-lg shadow-amber-600/20 transition-all hover:bg-amber-700"
              >
                Explore
              </Link>
              <Link
                to="/shop"
                className="rounded-lg border-2 border-amber-600 px-6 py-3 font-accent font-medium text-amber-600 transition-all hover:bg-amber-50 dark:hover:bg-amber-500/10"
              >
                View Collection
              </Link>
            </div>
          </div>
          <SmartImage
            src="https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1200&q=80"
            alt="Ecommerce hero"
            wrapperClassName="h-80 w-full rounded-2xl md:h-[420px]"
            className="h-80 w-full rounded-2xl object-cover md:h-[420px]"
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
      </section>

      {/* Shop by Category */}
      <section>
        <SectionHeader
          title="Shop by Category"
          subtitle="Explore the collections already available in the store."
          href="/shop"
        />
        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 w-36 min-w-[144px] animate-pulse rounded-2xl border border-amber-200/70 bg-white/70" />
            ))}
          </div>
        ) : (
          <div
            className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#f59e0b transparent" }}
          >
            {featuredCategories.map((category) => (
              <Link
                key={category.category_id}
                to={`/shop?category=${category.category_id}`}
                className="group flex min-w-[144px] flex-col justify-between rounded-2xl border border-amber-200/70 bg-white/85 px-4 py-3 transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md hover:shadow-amber-100/80 dark:border-[#1f2933] dark:bg-[#151e22] dark:hover:border-amber-500/50"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-500">
                  Category
                </p>
                <h3 className="mt-1 font-serif text-sm font-semibold leading-snug text-gray-900 dark:text-slate-100">
                  {category.category_name}
                </h3>
                <span className="mt-2 text-[11px] font-semibold text-amber-700 transition group-hover:translate-x-0.5 dark:text-amber-400">
                  Explore →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Best Sellers */}
      <section id="bestsellers">
        <SectionHeader
          title="Best Sellers"
          subtitle="Our most popular products based on sales."
          href="/shop"
        />
        {loading ? (
          <ProductGridSkeleton />
        ) : bestSellers.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.product_id || product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-slate-500">No best sellers yet.</p>
        )}
      </section>

      {/* New Releases */}
      <section id="new-releases">
        <SectionHeader
          title="New Releases"
          subtitle="The latest additions to our catalog."
          href="/shop"
        />
        {loading ? (
          <ProductGridSkeleton />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {newReleases.map((product) => (
              <ProductCard key={product.product_id || product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;
