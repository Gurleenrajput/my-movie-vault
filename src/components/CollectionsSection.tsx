import { useCollectionsWithMovies } from "@/hooks/useCollections";
import { CollectionCard } from "./CollectionCard";
import { Skeleton } from "@/components/ui/skeleton";

export function CollectionsSection() {
  const { data: collections, isLoading } = useCollectionsWithMovies();

  if (isLoading) {
    return (
      <section className="mb-12">
        <h2 className="font-display text-2xl text-foreground mb-6">Collections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-video rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!collections || collections.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="font-display text-2xl text-foreground mb-6">Collections</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}
