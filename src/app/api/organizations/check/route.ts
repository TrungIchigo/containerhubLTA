import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, type } = await request.json();
    
    if (!name || !type) {
      return new NextResponse('Missing name or type', { status: 400 });
    }

    const supabase = await createClient();
    
    console.log('API: Searching for organization:', { name, type });
    
    // Try function first, fallback to direct query
    let data, error;
    
    try {
      console.log('API: Trying fuzzy search function');
      const funcResult = await supabase.rpc('fuzzy_search_organizations', {
        search_term: name,
        org_type: type
      });
      
      if (funcResult.error) {
        console.log('API: Function failed, using direct query:', funcResult.error.message);
        // Fallback to direct query
        const directResult = await supabase
          .from('organizations')
          .select('*')
          .ilike('name', `%${name}%`)
          .eq('type', type)
          .eq('status', 'ACTIVE')
          .limit(5);
        
        data = directResult.data;
        error = directResult.error;
        console.log('API: Direct query result:', { data, error });
      } else {
        data = funcResult.data;
        error = funcResult.error;
        console.log('API: Function result:', { data, error });
      }
    } catch (queryError: any) {
      console.error('API: Query error:', queryError);
      // Final fallback - simple query without status filter
      try {
        const simpleResult = await supabase
          .from('organizations')
          .select('*')
          .ilike('name', `%${name}%`)
          .eq('type', type)
          .limit(5);
        
        data = simpleResult.data;
        error = simpleResult.error;
        console.log('API: Simple fallback result:', { data, error });
      } catch (finalError: any) {
        error = finalError;
        data = null;
      }
    }
    
    if (error) {
      console.error('Search error:', error);
      return new NextResponse(JSON.stringify({ error: error.message || 'Database query failed' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (data && data.length > 0) {
      console.log('API: Found organizations:', data);
      return NextResponse.json({ 
        found: true, 
        organization: data[0],
        suggestions: data // Return all matches for potential suggestions
      });
    } else {
      console.log('API: No organizations found');
      return NextResponse.json({ 
        found: false,
        suggestions: []
      });
    }
  } catch (error: any) {
    console.error('Organization check error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 