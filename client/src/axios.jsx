import { supabase } from "./lib/supabase";

// Replace axios with Supabase client
export const makeRequest = {
  get: async (endpoint) => {
    // Convert old API endpoints to Supabase queries
    if (endpoint.startsWith('/posts')) {
      const { data, error } = await supabase.from('posts').select('*').order('published_at', { ascending: false });
      if (error) throw error;
      return { data };
    }
    if (endpoint.startsWith('/bookmarks')) {
      const { data, error } = await supabase.from('bookmarks').select('*');
      if (error) throw error;
      return { data };
    }
    throw new Error('Endpoint not implemented with Supabase');
  },
  post: async (endpoint, payload) => {
    if (endpoint.startsWith('/bookmarks')) {
      const { data, error } = await supabase.from('bookmarks').insert(payload);
      if (error) throw error;
      return { data };
    }
    throw new Error('Endpoint not implemented with Supabase');
  },
  delete: async (endpoint, payload) => {
    if (endpoint.startsWith('/bookmarks')) {
      const { data, error } = await supabase.from('bookmarks').delete().match(payload);
      if (error) throw error;
      return { data };
    }
    throw new Error('Endpoint not implemented with Supabase');
  }
};
