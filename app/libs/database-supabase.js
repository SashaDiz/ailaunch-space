import { getSupabaseAdmin } from './supabase.js';

// Supabase Database Manager
// This provides a similar interface to the MongoDB database manager
// to make migration easier
export class SupabaseDatabaseManager {
  constructor() {
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      this.client = getSupabaseAdmin();
    }
    
    if (!this.client) {
      console.error('Supabase client is not initialized. Check environment variables.');
      throw new Error('Database client not initialized. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    
    return this.client;
  }

  // Collection name to table name mapping
  getTableName(collectionName) {
    // Most collection names map directly, but handle any special cases
    const tableMap = {
      apps: 'apps',
      users: 'users',
      categories: 'categories',
      competitions: 'competitions',
      votes: 'votes',
      payments: 'payments',
      newsletter: 'newsletter',
      sidebar_content: 'sidebar_content',
      backlinks: 'backlinks',
      analytics: 'analytics',
      external_webhooks: 'external_webhooks',
    };

    return tableMap[collectionName] || collectionName;
  }

  // Convert MongoDB-style filter to Supabase filter
  applyFilters(query, filter) {
    if (!filter || Object.keys(filter).length === 0) {
      return query;
    }

    for (const [key, value] of Object.entries(filter)) {
      if (key === '$and') {
        // Handle $and operator
        for (const condition of value) {
          query = this.applyFilters(query, condition);
        }
      } else if (key === '$or') {
        // Handle $or operator using Supabase's or() method
        try {
          const orConditions = value.map(condition => {
            const entries = Object.entries(condition);
            if (entries.length === 1) {
              const [field, val] = entries[0];
              if (typeof val === 'object' && val !== null) {
                if (val.$regex) {
                  const pattern = val.$regex.source || val.$regex;
                  // Escape % for LIKE pattern
                  const escapedPattern = String(pattern).replace(/%/g, '\\%').replace(/_/g, '\\_');
                  return `${field}.ilike.*${escapedPattern}*`;
                } else if (val.$in) {
                  // Handle array fields in OR conditions
                  if (field === 'categories' || field === 'tags') {
                    // For array fields, we need multiple conditions
                    return val.$in.map(v => `${field}.ov.{${v}}`).join(',');
                  } else {
                    return val.$in.map(v => `${field}.eq.${v}`).join(',');
                  }
                } else if (val.$ne !== undefined) {
                  return `${field}.neq.${val.$ne}`;
                } else if (val.$exists !== undefined) {
                  // $exists: false means field is null
                  // $exists: true means field is not null
                  return val.$exists ? `${field}.not.is.null` : `${field}.is.null`;
                } else if (val.$gt !== undefined) {
                  const compareValue = val.$gt instanceof Date ? val.$gt.toISOString() : val.$gt;
                  return `${field}.gt.${compareValue}`;
                } else if (val.$gte !== undefined) {
                  const compareValue = val.$gte instanceof Date ? val.$gte.toISOString() : val.$gte;
                  return `${field}.gte.${compareValue}`;
                } else if (val.$lt !== undefined) {
                  const compareValue = val.$lt instanceof Date ? val.$lt.toISOString() : val.$lt;
                  return `${field}.lt.${compareValue}`;
                } else if (val.$lte !== undefined) {
                  const compareValue = val.$lte instanceof Date ? val.$lte.toISOString() : val.$lte;
                  return `${field}.lte.${compareValue}`;
                }
              }
              return `${field}.eq.${val}`;
            }
            return null;
          }).filter(Boolean);
          
          if (orConditions.length > 0) {
            query = query.or(orConditions.join(','));
          }
        } catch (e) {
          console.warn('$or operator handling failed:', e.message, '- skipping condition');
        }
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        // Handle operators like $in, $gt, $gte, $lt, $lte, etc.
        if (value.$in) {
          // Special handling for JSONB array columns like 'categories'
          // Use overlaps for array fields, in for scalar fields
          if (key === 'categories' || key === 'tags') {
            query = query.overlaps(key, value.$in);
          } else {
            // Use .in() for standard $in queries on scalar columns
            query = query.in(key, value.$in);
          }
        } else if (value.$overlaps) {
          // Explicit overlaps operator for array columns
          query = query.overlaps(key, value.$overlaps);
        } else if (value.$contains) {
          // Contains operator for array columns
          query = query.contains(key, value.$contains);
        } else if (value.$regex) {
          // Handle regex search
          const pattern = value.$regex.source || value.$regex;
          query = query.ilike(key, `%${pattern}%`);
        } else if (value.$gt !== undefined) {
          // Convert Date objects to ISO strings for PostgreSQL
          const compareValue = value.$gt instanceof Date ? value.$gt.toISOString() : value.$gt;
          query = query.gt(key, compareValue);
        } else if (value.$gte !== undefined) {
          const compareValue = value.$gte instanceof Date ? value.$gte.toISOString() : value.$gte;
          query = query.gte(key, compareValue);
        } else if (value.$lt !== undefined) {
          const compareValue = value.$lt instanceof Date ? value.$lt.toISOString() : value.$lt;
          query = query.lt(key, compareValue);
        } else if (value.$lte !== undefined) {
          const compareValue = value.$lte instanceof Date ? value.$lte.toISOString() : value.$lte;
          query = query.lte(key, compareValue);
        } else if (value.$ne !== undefined) {
          query = query.neq(key, value.$ne);
        } else if (value.$not) {
          // Handle $not operator
          if (value.$not.$regex) {
            const pattern = value.$not.$regex.source || value.$not.$regex;
            query = query.not(key, 'ilike', `%${pattern}%`);
          }
        } else if (value.$exists !== undefined) {
          if (value.$exists) {
            query = query.not(key, 'is', null);
          } else {
            query = query.is(key, null);
          }
        }
      } else {
        // Simple equality - convert Date objects to ISO strings
        const compareValue = value instanceof Date ? value.toISOString() : value;
        query = query.eq(key, compareValue);
      }
    }

    return query;
  }

  // INSERT ONE
  async insertOne(collectionName, document) {
    const table = this.getTableName(collectionName);
    const client = this.getClient();

    // Remove MongoDB-specific fields and timestamp fields (handled by DB defaults/triggers)
    const { _id, created_at, updated_at, createdAt, updatedAt, ...cleanDoc } = document;

    const { data, error } = await client
      .from(table)
      .insert(cleanDoc)
      .select()
      .single();

    if (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }

    return { insertedId: data.id };
  }

  // INSERT MANY
  async insertMany(collectionName, documents) {
    const table = this.getTableName(collectionName);
    const client = this.getClient();

    // Remove MongoDB-specific fields and timestamp fields from all documents (handled by DB defaults/triggers)
    const cleanDocs = documents.map(({ _id, created_at, updated_at, createdAt, updatedAt, ...doc }) => doc);

    const { data, error } = await client
      .from(table)
      .insert(cleanDocs)
      .select();

    if (error) {
      throw new Error(`Insert many failed: ${error.message}`);
    }

    return { insertedIds: data.map(d => d.id), insertedCount: data.length };
  }

  // Convert MongoDB-style projection to Supabase select string
  convertProjection(projection) {
    if (!projection) return '*';
    if (typeof projection === 'string') return projection;
    
    // Convert MongoDB-style projection object to Supabase select string
    // { slug: 1, updated_at: 1 } => "slug,updated_at"
    const fields = Object.entries(projection)
      .filter(([_, value]) => value === 1 || value === true)
      .map(([key, _]) => key);
    
    return fields.length > 0 ? fields.join(',') : '*';
  }

  // FIND ONE
  async findOne(collectionName, query = {}, options = {}) {
    const table = this.getTableName(collectionName);
    const client = this.getClient();

    const selectFields = this.convertProjection(options.projection);
    let supabaseQuery = client.from(table).select(selectFields);

    // Apply filters
    supabaseQuery = this.applyFilters(supabaseQuery, query);
    
    // Apply sorting if provided
    if (options.sort) {
      for (const [field, direction] of Object.entries(options.sort)) {
        supabaseQuery = supabaseQuery.order(field, {
          ascending: direction === 1 || direction === 'asc',
          nullsFirst: false, // Always put null values at the end
        });
      }
    }

    // Use .limit(1) and get first result instead of .single() to avoid 406 errors
    const { data, error } = await supabaseQuery.limit(1);

    if (error) {
      console.error(`FindOne error: ${error.message}`);
      return null;
    }

    // Return the first item or null if empty array
    return data && data.length > 0 ? data[0] : null;
  }

  // FIND
  async find(collectionName, query = {}, options = {}) {
    const table = this.getTableName(collectionName);
    const client = this.getClient();

    const selectFields = this.convertProjection(options.projection);
    let supabaseQuery = client.from(table).select(selectFields);

    // Apply filters
    supabaseQuery = this.applyFilters(supabaseQuery, query);

    // Apply sorting
    if (options.sort) {
      for (const [field, direction] of Object.entries(options.sort)) {
        supabaseQuery = supabaseQuery.order(field, {
          ascending: direction === 1 || direction === 'asc',
          nullsFirst: false, // Always put null values at the end
        });
      }
    }

    // Apply pagination
    if (options.skip !== undefined && options.limit) {
      const from = options.skip;
      const to = options.skip + options.limit - 1;
      supabaseQuery = supabaseQuery.range(from, to);
    } else if (options.limit) {
      supabaseQuery = supabaseQuery.limit(options.limit);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Supabase find error:', {
        table,
        query: JSON.stringify(query, null, 2),
        error: error,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        errorCode: error.code
      });
      throw new Error(`Find failed: ${error.message}`);
    }

    return data || [];
  }

  // UPDATE ONE
  async updateOne(collectionName, filter, update, options = {}) {
    const table = this.getTableName(collectionName);
    const client = this.getClient();

    // Handle $inc operator (uses read-modify-write pattern)
    // Note: This is not truly atomic, but reduces race conditions significantly
    // For production-critical counters, consider using PostgreSQL functions
    if (update.$inc && Object.keys(update.$inc).length > 0) {
      console.log('[$inc] Starting increment operation:', {
        table,
        filter,
        increments: update.$inc
      });
      
      // Fetch the current record to get current values
      let fetchQuery = client.from(table).select('*');
      fetchQuery = this.applyFilters(fetchQuery, filter);
      
      const { data: records, error: fetchError } = await fetchQuery.limit(1);
      
      if (fetchError || !records || records.length === 0) {
        console.error('[$inc] Fetch failed:', fetchError);
        // If no record found, return 0 matched
        return { modifiedCount: 0, matchedCount: 0 };
      }
      
      const currentRecord = records[0];

      console.log('[$inc] Current record found:', {
        id: currentRecord.id,
        currentValues: Object.keys(update.$inc).reduce((acc, field) => {
          acc[field] = currentRecord[field];
          return acc;
        }, {})
      });

      // Calculate new values with increments
      let updateData = {};
      
      if (update.$set) {
        updateData = { ...updateData, ...update.$set };
      }

      // Apply increments with GREATEST-like logic to prevent negative values
      for (const [field, incrementValue] of Object.entries(update.$inc)) {
        const currentValue = currentRecord[field] || 0;
        updateData[field] = Math.max(0, currentValue + incrementValue);
      }

      console.log('[$inc] New values calculated:', updateData);

      // Remove updated_at if it exists (trigger will handle it)
      delete updateData.updatedAt;
      delete updateData.updated_at;

      // Now update with the new values
      let updateQuery = client.from(table).update(updateData);
      updateQuery = this.applyFilters(updateQuery, filter);
      
      const { data, error } = await updateQuery.select();

      if (error) {
        console.error('[$inc] Update failed:', error);
        throw new Error(`Update with increment failed: ${error.message}`);
      }

      console.log('[$inc] Update successful:', {
        modifiedCount: data ? data.length : 0,
        updatedRecord: data?.[0]
      });

      return {
        modifiedCount: data ? data.length : 0,
        matchedCount: data ? data.length : 0,
      };
    }

    // Handle regular updates (no $inc)
    let updateData = {};

    if (update.$set) {
      updateData = { ...updateData, ...update.$set };
    }

    // Remove updated_at if it exists (trigger will handle it)
    delete updateData.updatedAt;
    delete updateData.updated_at;

    let supabaseQuery = client.from(table).update(updateData);

    // Apply filters to find the record to update
    supabaseQuery = this.applyFilters(supabaseQuery, filter);

    const { data, error } = await supabaseQuery.select();

    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }

    return {
      modifiedCount: data ? data.length : 0,
      matchedCount: data ? data.length : 0,
    };
  }

  // UPDATE MANY
  async updateMany(collectionName, filter, update, options = {}) {
    // Similar to updateOne but doesn't use .single()
    return await this.updateOne(collectionName, filter, update, options);
  }

  // DELETE ONE
  async deleteOne(collectionName, filter) {
    const table = this.getTableName(collectionName);
    const client = this.getClient();

    let supabaseQuery = client.from(table).delete();

    // Apply filters
    supabaseQuery = this.applyFilters(supabaseQuery, filter);

    const { data, error } = await supabaseQuery.select();

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return { deletedCount: data ? data.length : 0 };
  }

  // DELETE MANY
  async deleteMany(collectionName, filter) {
    return await this.deleteOne(collectionName, filter);
  }

  // COUNT
  async count(collectionName, query = {}) {
    const table = this.getTableName(collectionName);
    const client = this.getClient();

    let supabaseQuery = client
      .from(table)
      .select('id', { count: 'exact', head: true });

    // Apply filters
    supabaseQuery = this.applyFilters(supabaseQuery, query);

    const { count, error } = await supabaseQuery;

    if (error) {
      console.error('Count error details:', error);
      console.error('Count query filter:', JSON.stringify(query, null, 2));
      throw new Error(`Count failed: ${error.message || error.details || JSON.stringify(error)}`);
    }

    return count || 0;
  }

  // AGGREGATE (limited support)
  async aggregate(collectionName, pipeline = []) {
    console.warn('Aggregate is not directly supported. Consider using views or RPC functions.');
    // For complex aggregations, create PostgreSQL views or use RPC functions
    throw new Error('Aggregate not implemented. Use PostgreSQL views or RPC functions.');
  }

  // CREATE INDEX (not needed - define in schema)
  async createIndex(collectionName, indexSpec, options = {}) {
    console.warn('Indexes should be defined in the SQL schema.');
    return true;
  }

  // GET COLLECTION NAMES
  async getCollectionNames() {
    // This would require querying PostgreSQL system tables
    const tables = [
      'users',
      'apps',
      'categories',
      'competitions',
      'votes',
      'payments',
      'newsletter',
      'sidebar_content',
      'backlinks',
      'analytics',
      'external_webhooks',
    ];
    return tables;
  }

  // Helper: Execute RPC function
  async rpc(functionName, params = {}) {
    const client = this.getClient();
    const { data, error } = await client.rpc(functionName, params);

    if (error) {
      throw new Error(`RPC ${functionName} failed: ${error.message}`);
    }

    return data;
  }

  // Helper: Increment field (uses RPC for atomic operation)
  async incrementField(tableName, id, fieldName, amount = 1) {
    const client = this.getClient();
    
    // First, get the current value
    const { data: current, error: fetchError } = await client
      .from(tableName)
      .select(fieldName)
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Fetch failed: ${fetchError.message}`);
    }

    const newValue = (current[fieldName] || 0) + amount;

    const { error: updateError } = await client
      .from(tableName)
      .update({ [fieldName]: newValue })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Update failed: ${updateError.message}`);
    }

    return { success: true };
  }
}

// Export a singleton instance
export const db = new SupabaseDatabaseManager();

