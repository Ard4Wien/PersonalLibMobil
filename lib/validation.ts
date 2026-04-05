import { z } from 'zod';

const BaseMediaSchema = z.object({
  title: z.string().trim().min(2, 'Adı en az 2 karakter olmalıdır').max(100, 'Adı en fazla 100 karakter olabilir'),
  status: z.string().optional(),
  coverImage: z.string().trim().url('Geçerli bir kapak görseli URL\'si girmelisiniz').or(z.string().length(0)).optional(),
});

const BookSchema = BaseMediaSchema.extend({
  author: z.string().trim().min(2, 'Yazar adı en az 2 karakter olmalıdır').max(100, 'Yazar adı en fazla 100 karakter olabilir'),
});

const MovieSchema = BaseMediaSchema.extend({
  director: z.string().trim().min(2, 'Yönetmen adı en az 2 karakter olmalıdır').max(100, 'Yönetmen adı en fazla 100 karakter olabilir'),
});

const SeriesSchema = BaseMediaSchema.extend({
  creator: z.string().trim().min(2, 'Yapımcı adı en az 2 karakter olmalıdır').max(100, 'Yapımcı adı en fazla 100 karakter olabilir'),
});

export const validateMedia = (data: any, type: 'book' | 'movie' | 'series'): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  let schema;
  switch (type) {
    case 'book': schema = BookSchema; break;
    case 'movie': schema = MovieSchema; break;
    case 'series': schema = SeriesSchema; break;
  }

  const result = schema.safeParse(data);

  if (!result.success) {
    result.error.issues.forEach((err) => {
      const field = err.path[0] as string;
      if (!errors[field]) {
        errors[field] = err.message;
      }
    });
  }

  return errors;
};
