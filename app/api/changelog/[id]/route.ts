// CHANGELOG FEATURE DISABLED - COMMENTED OUT FOR FUTURE DEVELOPMENT
/*
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request, { params }) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id } = params;

    const { data, error } = await supabase
      .from('changelog')
      .select(`
        *,
        author:users(id, full_name, first_name, last_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching changelog entry:', error);
      return NextResponse.json(
        { error: 'Changelog entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/changelog/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
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

    const { id } = params;
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

    const updateData = {
      title,
      version: version || null,
      description: description || null,
      content,
      type: type || 'feature',
      published: published || false,
      featured: featured || false,
      published_at: published && !body.published_at ? new Date().toISOString() : body.published_at,
    };

    const { data, error } = await supabaseAdmin
      .from('changelog')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        author:users(id, full_name, first_name, last_name)
      `)
      .single();

    if (error) {
      console.error('Error updating changelog entry:', error);
      return NextResponse.json(
        { error: 'Failed to update changelog entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PUT /api/changelog/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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

    const { id } = params;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabaseAdmin
      .from('changelog')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting changelog entry:', error);
      return NextResponse.json(
        { error: 'Failed to delete changelog entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/changelog/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
*/

// Return disabled response for all changelog API calls
export async function GET() {
  return new Response(JSON.stringify({ error: 'Changelog feature is currently disabled' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function PUT() {
  return new Response(JSON.stringify({ error: 'Changelog feature is currently disabled' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function DELETE() {
  return new Response(JSON.stringify({ error: 'Changelog feature is currently disabled' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}
