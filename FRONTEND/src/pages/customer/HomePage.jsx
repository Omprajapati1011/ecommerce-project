import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BadgePercent,
  ChevronRight,
  Headphones,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import SmartImage from "../../components/common/SmartImage";
import {
  getAllCategories,
  getAllProducts,
  getBestSellers,
} from "../../services/categoryApi";

const heroImage =
  "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1400&q=85";

const dealTiles = [
  {
    title: "Electronics Deals",
    copy: "Smart devices, accessories, and everyday tech.",
    href: "/shop?search=electronics",
    tone: "from-emerald-900 to-[#2f7a6f]",
  },
  {
    title: "Fashion Finds",
    copy: "Fresh styles and wardrobe essentials.",
    href: "/shop?search=fashion",
    tone: "from-slate-900 to-amber-700",
  },
  {
    title: "New Arrivals",
    copy: "Recently added picks across the store.",
    href: "/shop?sortField=created_at&sortOrder=desc",
    tone: "from-[#17202a] to-[#6b4f2a]",
  },
];

const serviceItems = [
  { label: "Secure checkout", icon: ShieldCheck },
  { label: "Fast delivery", icon: Truck },
  { label: "Easy shopping", icon: ShoppingBag },
  { label: "Customer support", icon: Headphones },
];

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

const formatINR = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const getProductPrice = (product) =>
  Number(product?.discounted_price ?? product?.price ?? 0);

const getOriginalPrice = (product) => Number(product?.price ?? 0);

const getDiscountPercent = (product) => {
  const price = getProductPrice(product);
  const original = getOriginalPrice(product);
  if (!original || price >= original) return 0;
  return Math.round(((original - price) / original) * 100);
};

function ProductCard({ product }) {
  const productId = product.product_id || product.id;
  const price = getProductPrice(product);
  const original = getOriginalPrice(product);
  const discount = getDiscountPercent(product);

  return (
    <Link
      to={`/products/${productId}`}
      className="home-product-card group"
    >
      <div className="home-product-media">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.display_name || product.name || "Product"}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}
        {discount > 0 ? (
          <span className="home-product-discount">{discount}% OFF</span>
        ) : null}
      </div>
      <div className="home-product-body">
        <h3>{product.display_name || product.name}</h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <p className="home-product-price">₹{formatINR(price)}</p>
          {discount > 0 ? (
            <p className="home-product-original">₹{formatINR(original)}</p>
          ) : null}
        </div>
        <span className="home-product-link">
          View Product <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="home-product-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-72 animate-pulse rounded-2xl border border-amber-200/70 bg-white/70" />
      ))}
    </div>
  );
}

function SectionHeader({ title, subtitle, href }) {
  return (
    <div className="home-section-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {href ? (
        <Link to={href} className="home-section-link">
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function HomePage() {
  const [newReleases, setNewReleases] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hash } = useLocation();

  const heroCategories = useMemo(
    () => featuredCategories.slice(0, 6),
    [featuredCategories],
  );

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
        const [categoriesRes, newReleasesRes, bestSellersRes] =
          await Promise.all([
            getAllCategories(),
            getAllProducts({
              page: 1,
              limit: 8,
              sortField: "created_at",
              sortOrder: "desc",
            }),
            getBestSellers(8),
          ]);

        if (!active) return;

        const categories = extractCategoryTree(categoriesRes)
          .flatMap((category) => [category, ...(category.children || [])])
          .filter(Boolean);

        setFeaturedCategories(categories);
        setNewReleases(extractProducts(newReleasesRes).slice(0, 8));
        setBestSellers(extractProducts(bestSellersRes).slice(0, 8));
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
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="home-storefront">
      <section className="home-hero">
        <SmartImage
          src={heroImage}
          alt="ShopSphere storefront"
          wrapperClassName="home-hero-media"
          className="h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
        />
        <div className="home-hero-overlay" />
        <div className="home-hero-content">
          <p className="home-eyebrow">ShopSphere</p>
          <h1>Everything You Need, Ready To Shop</h1>
          <p className="home-hero-copy">
            Discover electronics, fashion, gaming, appliances, and daily
            essentials in one fast, simple storefront.
          </p>
          <div className="home-hero-actions">
            <Link to="/shop" className="home-primary-link">
              Start Shopping
            </Link>
            <Link to="/shop?sortField=price&sortOrder=asc" className="home-secondary-link">
              Today&apos;s Deals
            </Link>
          </div>
          <div className="home-hero-category-row">
            {heroCategories.map((category) => (
              <Link
                key={category.category_id}
                to={`/shop?category=${category.category_id}`}
              >
                {category.category_name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-service-strip">
        {serviceItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="home-service-item">
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </div>
          );
        })}
      </section>

      <section className="home-deal-grid">
        {dealTiles.map((deal) => (
          <Link
            key={deal.title}
            to={deal.href}
            className={`home-deal-tile bg-gradient-to-br ${deal.tone}`}
          >
            <BadgePercent className="h-6 w-6 text-amber-200" />
            <div>
              <h2>{deal.title}</h2>
              <p>{deal.copy}</p>
            </div>
            <span>
              Explore <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </section>

      <section>
        <SectionHeader
          title="Shop by Category"
          subtitle="Jump straight into the collections customers browse most."
          href="/shop"
        />
        {loading ? (
          <div className="home-category-row">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 min-w-[150px] animate-pulse rounded-2xl border border-amber-200/70 bg-white/70" />
            ))}
          </div>
        ) : (
          <div className="home-category-row">
            {featuredCategories.slice(0, 12).map((category) => (
              <Link
                key={category.category_id}
                to={`/shop?category=${category.category_id}`}
                className="home-category-card"
              >
                <span>Category</span>
                <strong>{category.category_name}</strong>
                <small>Shop now</small>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section id="bestsellers">
        <SectionHeader
          title="Best Sellers"
          subtitle="Popular picks customers are buying now."
          href="/shop"
        />
        {loading ? (
          <ProductGridSkeleton />
        ) : bestSellers.length > 0 ? (
          <div className="home-product-grid">
            {bestSellers.slice(0, 8).map((product) => (
              <ProductCard key={product.product_id || product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="home-empty-text">No best sellers yet.</p>
        )}
      </section>

      <section className="home-collection-band">
        <div>
          <p className="home-eyebrow">Fresh Drops</p>
          <h2>New products added for every kind of shopper</h2>
          <p>
            Browse recently listed items and find something useful before it
            sells out.
          </p>
        </div>
        <Link to="/shop?sortField=created_at&sortOrder=desc">
          Browse New Arrivals
        </Link>
      </section>

      <section id="new-releases">
        <SectionHeader
          title="New Releases"
          subtitle="The latest additions to the catalog."
          href="/shop?sortField=created_at&sortOrder=desc"
        />
        {loading ? (
          <ProductGridSkeleton />
        ) : newReleases.length > 0 ? (
          <div className="home-product-grid">
            {newReleases.slice(0, 8).map((product) => (
              <ProductCard key={product.product_id || product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="home-empty-text">No new releases yet.</p>
        )}
      </section>
    </div>
  );
}

export default HomePage;
