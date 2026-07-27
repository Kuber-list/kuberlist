import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listingAPI } from "../../api/index.js";
import {
  PageHeader,
  Spinner,
  StatusBadge,
  EmptyState,
  formatINR,
  formatDate,
} from "../../components/ui/index.jsx";
import {
  Building2,
  Plus,
  Eye,
  ArrowRight,
  MapPin,
  Sprout,
  Wallet,
  Inbox,
} from "lucide-react";

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listingAPI
      .getAll()
      .then((r) => setListings(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="anim-up">
      <PageHeader
        title="My Listings"
        subtitle={`${listings.length} listing${listings.length !== 1 ? "s" : ""}`}
        actions={
          <Link
            to="/seeker/listings/new"
            className="btn-navy inline-flex items-center gap-2"
          >
            <Plus size={15} />
            New Listing
          </Link>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="No listings yet"
          description="Create your first funding listing to start attracting investors."
          action={
            <Link to="/seeker/listings/new" className="btn-navy inline-flex">
              <>
                Create Listing
                <ArrowRight size={15} />
              </>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3 stagger">
          {listings.map((l) => (
            <Link
              key={l.id}
              to={`/seeker/listings/${l.id}`}
              className="card-hover group block"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-display text-lg font-semibold text-navy group-hover:text-gold transition-colors">
                      {l.name}
                    </h3>
                    <StatusBadge status={l.status} />

                    <span className="badge-gray">{l.entity_type}</span>
                  </div>
                  {l.status === "INACTIVE" && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5">
                      ✕ Listing deactivated — edit and resubmit for review
                    </div>
                  )}
                  <p className="text-muted text-sm line-clamp-2 mb-3 leading-relaxed">
                    {l.summary}
                  </p>
                  <div className="flex items-center gap-5 text-xs text-dim flex-wrap">
                    <span>
                      <MapPin size={13} /> {l.location_city || "India"}
                    </span>
                    <span>
                      <Building2 size={13} /> {l.sector}
                    </span>
                    <span>
                      <Sprout size={13} /> {l.stage}
                    </span>
                    <span>
                      <Wallet size={13} />
                      Raising
                      {formatINR(l.funding_ask)}
                    </span>
                    <span>
                      <Inbox size={13} /> {l._count?.interests || 0} interests
                    </span>
                    <span>
                      <Eye size={13} />
                      {l.view_count || 0} views
                    </span>
                    <span className="ml-auto">{formatDate(l.created_at)}</span>
                  </div>
                </div>
                <span className="text-dim group-hover:text-gold transition-colors mt-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
