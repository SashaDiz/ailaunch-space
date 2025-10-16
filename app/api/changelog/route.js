import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const featured = searchParams.get('featured');

    let query = supabase
      .from('changelog')
      .select(`
        *,
        author:users(id, full_name, first_name, last_name)
      `)
      .order('published_at', { ascending: false });

    if (published !== null) {
      query = query.eq('published', published === 'true');
    }

    if (featured !== null) {
      query = query.eq('featured', featured === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching changelog:', error);
      return NextResponse.json(
        { error: 'Failed to fetch changelog entries' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/changelog:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(
      supabaseUrl,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Cookie: cookieStore.toString(),
          },
        },
      }
    );

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData || (!userData.is_admin && userData.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, version, description, content, type, published, featured } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const changelogData = {
      title,
      version: version || null,
      description: description || null,
      content,
      type: type || 'feature',
      published: published || false,
      featured: featured || false,
      author_id: user.id,
      published_at: published ? new Date().toISOString() : null,
    };

    const { data, error } = await supabaseAdmin
      .from('changelog')
      .insert([changelogData])
      .select(`
        *,
        author:users(id, full_name, first_name, last_name)
      `)
      .single();

    if (error) {
      console.error('Error creating changelog entry:', error);
      return NextResponse.json(
        { error: 'Failed to create changelog entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/changelog:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
