// CHANGELOG FEATURE DISABLED - COMMENTED OUT FOR FUTURE DEVELOPMENT
/*
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';

export const metadata = {
  title: "Changelog - AI Launch Space",
  description: "See what's new and improved on AI Launch Space.",
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getChangelogEntries() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('changelog')
      .select(`
        *,
        author:users(id, full_name, first_name, last_name)
      `)
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching changelog:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getChangelogEntries:', error);
    return [];
  }
}

export default async function ChangelogPage() {
  const changelogEntries = await getChangelogEntries();

  const getTypeIcon = (type) => {
    const icons = {
      feature: "✨",
      bugfix: "🐛",
      improvement: "⚡",
      breaking: "💥",
      announcement: "📢",
    };
    return icons[type] || "📝";
  };

  const getTypeColor = (type) => {
    const colors = {
      feature: "badge-primary",
      bugfix: "badge-error",
      improvement: "badge-info",
      breaking: "badge-warning",
      announcement: "badge-success",
    };
    return colors[type] || "badge-ghost";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <main className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Changelog</h1>
          <p className="text-lg text-base-content/70">
            Track all updates, improvements, and new features
          </p>
        </div>

        <div className="space-y-8">
          {changelogEntries.length === 0 ? (
            <div className="card bg-base-200">
              <div className="card-body text-center">
                <h2 className="card-title justify-center">No Updates Yet</h2>
                <p className="text-base-content/70">
                  We're working hard on new features and improvements. Check back soon!
                </p>
              </div>
            </div>
          ) : (
            changelogEntries.map((entry, index) => (
              <div key={entry.id} className="card bg-base-200">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="card-title">{entry.title}</h2>
                      <span className={`badge ${getTypeColor(entry.type)}`}>
                        {getTypeIcon(entry.type)} {entry.type}
                      </span>
                      {entry.featured && (
                        <span className="badge badge-secondary">
                          ⭐ Featured
                        </span>
                      )}
                      {index === 0 && (
                        <span className="badge badge-primary">Latest</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4 text-sm text-base-content/60">
                    {entry.version && (
                      <span>Version {entry.version}</span>
                    )}
                    <span>{formatDate(entry.published_at || entry.created_at)}</span>
                    {entry.author?.full_name && (
                      <span>by {entry.author.full_name}</span>
                    )}
                  </div>

                  {entry.description && (
                    <p className="text-base-content/80 mb-4 font-medium">
                      {entry.description}
                    </p>
                  )}

                  <div className="text-base-content/70">
                    {entry.content.split('\n').map((line, lineIndex) => (
                      <p key={lineIndex} className="mb-2">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-center mt-12">
          <Link href="/" className="btn btn-ghost">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
*/

import Link from "next/link";

// Disabled changelog page - return simple message
export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Changelog</h1>
          <p className="text-lg text-base-content/70 mb-8">
            The changelog feature is currently disabled and will be available in a future update.
          </p>
          <Link href="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

