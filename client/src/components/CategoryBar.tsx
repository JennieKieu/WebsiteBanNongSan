import { Link, useSearchParams } from "react-router-dom";
import {
  RiLeafLine,
  RiPlantLine,
  RiSeedlingLine,
  RiApps2Line,
} from "react-icons/ri";
import {
  GiGrapes,
  GiWheat,
  GiMushroomGills,
  GiHerbsBundle,
} from "react-icons/gi";
import { useApi } from "../hooks/useApi";

const iconMap: Record<string, React.ReactNode> = {
  rau: <RiSeedlingLine />,
  qua: <GiGrapes />,
  "ngu-coc": <GiWheat />,
  "dac-san": <RiLeafLine />,
  cu: <GiMushroomGills />,
  "gia-vi": <GiHerbsBundle />,
};

function getCatIcon(slug: string) {
  return iconMap[slug] || <RiPlantLine />;
}

export default function CategoryBar() {
  const { data: categories } = useApi<any[]>("/categories", []);
  const [params] = useSearchParams();
  const activeCatId = params.get("categoryId") || "";

  if (!categories?.length) return null;

  return (
    <div className="category-bar">
      <div className="category-bar-inner">
        <Link
          to="/shop"
          className={`category-chip ${!activeCatId ? "active" : ""}`}
        >
          <RiApps2Line /> Tất cả
        </Link>
        {categories.map((cat: any) => (
          <Link
            key={cat._id}
            to={`/shop?categoryId=${cat._id}`}
            className={`category-chip ${activeCatId === cat._id ? "active" : ""}`}
          >
            {getCatIcon(cat.slug)} {cat.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
