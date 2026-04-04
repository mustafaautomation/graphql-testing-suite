import {
  buildSchema,
  validateSchema,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLField,
} from 'graphql';

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    types: number;
    queries: number;
    mutations: number;
    fields: number;
  };
}

export function validateSchemaString(sdl: string): SchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let schema: GraphQLSchema;
  try {
    schema = buildSchema(sdl);
  } catch (err) {
    return {
      valid: false,
      errors: [`Schema parse error: ${(err as Error).message}`],
      warnings: [],
      stats: { types: 0, queries: 0, mutations: 0, fields: 0 },
    };
  }

  const validationErrors = validateSchema(schema);
  for (const err of validationErrors) {
    errors.push(err.message);
  }

  // Count stats
  const typeMap = schema.getTypeMap();
  const userTypes = Object.keys(typeMap).filter((t) => !t.startsWith('__'));

  const queryType = schema.getQueryType();
  const mutationType = schema.getMutationType();

  const queryFields = queryType ? Object.keys(queryType.getFields()) : [];
  const mutationFields = mutationType ? Object.keys(mutationType.getFields()) : [];

  // Warnings
  if (queryFields.length === 0) {
    warnings.push('Schema has no query fields defined');
  }
  if (mutationFields.length === 0) {
    warnings.push('Schema has no mutation fields defined');
  }

  // Check for missing descriptions
  for (const typeName of userTypes) {
    const type = typeMap[typeName];
    if (type instanceof GraphQLObjectType && !type.description) {
      warnings.push(`Type "${typeName}" has no description`);
    }
  }

  let totalFields = 0;
  for (const typeName of userTypes) {
    const type = typeMap[typeName];
    if (type instanceof GraphQLObjectType) {
      totalFields += Object.keys(type.getFields()).length;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      types: userTypes.length,
      queries: queryFields.length,
      mutations: mutationFields.length,
      fields: totalFields,
    },
  };
}

export function checkDeprecatedFields(
  sdl: string,
): Array<{ type: string; field: string; reason: string }> {
  let schema: GraphQLSchema;
  try {
    schema = buildSchema(sdl);
  } catch {
    return [];
  }

  const deprecated: Array<{ type: string; field: string; reason: string }> = [];
  const typeMap = schema.getTypeMap();

  for (const [typeName, type] of Object.entries(typeMap)) {
    if (typeName.startsWith('__')) continue;
    if (!(type instanceof GraphQLObjectType)) continue;

    const fields = type.getFields();
    for (const [fieldName, field] of Object.entries(fields)) {
      if ((field as GraphQLField<unknown, unknown>).deprecationReason) {
        deprecated.push({
          type: typeName,
          field: fieldName,
          reason:
            (field as GraphQLField<unknown, unknown>).deprecationReason || 'No reason provided',
        });
      }
    }
  }

  return deprecated;
}
