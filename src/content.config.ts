import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { playlistLocation } from './lib/music-playlist';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      category: z.enum(['Coding', 'Music', 'AI']),
      readTime: z.string(),
      sample: z.boolean().default(false),
      draft: z.boolean().default(false),
      playlist: z
        .string()
        .refine((value) => {
          try {
            playlistLocation(value);
            return true;
          } catch {
            return false;
          }
        }, 'Use a public Apple Music playlist URL.')
        .optional(),
      playlistOrder: z
        .enum(['newest-last', 'newest-first'])
        .default('newest-last'),
      playlistLayout: z.enum(['grid', 'list']).default('list'),
      playlistLimit: z.number().int().min(1).max(100).default(10),
    })
    .refine((post) => !post.playlist || post.category === 'Music', {
      message: 'Playlist sections require category: Music.',
      path: ['playlist'],
    }),
});
export const collections = { blog };
