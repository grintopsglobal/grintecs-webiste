import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './lib/categories';

// ID entry = path tanpa ekstensi, mis. "id/erp-implementation".
// Glob loader default memakai field `slug` sebagai ID, yang akan bentrok antar bahasa.
const loader = (dir: string, pattern = '**/*.md') =>
  glob({ base: `./src/content/${dir}`, pattern, generateId: ({ entry }) => entry.replace(/\.(md|ya?ml)$/, '') });

// Decap menulis "" untuk field kosong, jadi string opsional selalu punya default "".
const str = z.string().nullish().transform((v) => v ?? '');
const list = <T extends z.ZodType>(item: T) => z.array(item).nullish().transform((v) => v ?? []);
const cta = z.object({ label: z.string(), href: z.string() });
// ID tracking dari CMS disisipkan ke script inline, jadi formatnya dikunci ketat (atau kosong).
const trackingId = (re: RegExp, hint: string) =>
  z
    .string()
    .nullish()
    .transform((v) => (v ?? '').trim())
    .refine((v) => v === '' || re.test(v), { message: `Format tidak valid, contoh: ${hint}` });

const services = defineCollection({
  loader: loader('services'),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    icon: z.string(),
    excerpt: z.string(),
    heroImage: str,
    order: z.number().default(99),
    features: list(z.string()),
    relatedSolutions: list(z.string()),
  }),
});

// Sub-layanan di bawah satu layanan (mis. Phishing Simulation di bawah Cyber Security). URL: /services/<parent>/<slug>/
const subservices = defineCollection({
  loader: loader('subservices'),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    parent: z.string(),
    icon: z.string(),
    excerpt: z.string(),
    tagline: str,
    heroImage: str,
    order: z.number().default(99),
    process: list(z.string()),
    deliverables: list(z.string()),
    pricing: str,
    faq: list(z.object({ q: z.string(), a: z.string() })),
    ctaLabel: str,
  }),
});

const solutions = defineCollection({
  loader: loader('solutions'),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    icon: z.string(),
    excerpt: z.string(),
    heroImage: str,
    order: z.number().default(99),
    outcomes: list(z.string()),
    relatedServices: list(z.string()),
  }),
});

const industries = defineCollection({
  loader: loader('industries'),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    icon: z.string(),
    excerpt: z.string(),
    image: str,
    order: z.number().default(99),
  }),
});

const insights = defineCollection({
  loader: loader('insights'),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    category: z.enum(CATEGORIES),
    tags: list(z.string()),
    cover: str,
    excerpt: z.string(),
    draft: z.boolean().default(false),
  }),
});

const section = { heading: z.string(), intro: str };

const home = z.object({
  type: z.literal('home'),
  seo: z.object({ title: z.string(), description: z.string() }),
  hero: z.object({
    headline: z.string(),
    highlight: str,
    subheadline: z.string(),
    primaryCta: cta,
    secondaryCta: cta,
    video: str,
    videoMp4: str,
    poster: z.string(),
  }),
  valueProps: z.object({ ...section, items: list(z.object({ icon: z.string(), title: z.string(), text: z.string() })) }),
  servicesSection: z.object(section),
  solutionsSection: z.object(section),
  industriesSection: z.object(section),
  // Kosongkan `items` selama belum ada angka bersumber: section otomatis disembunyikan.
  stats: z.object({ ...section, items: list(z.object({ value: z.string(), label: z.string(), source: str })) }),
  process: z.object({ ...section, steps: list(z.object({ title: z.string(), text: z.string() })) }),
  insightsSection: z.object(section),
  cta: z.object({ heading: z.string(), text: z.string(), buttonLabel: z.string() }),
});

const about = z.object({
  type: z.literal('about'),
  seo: z.object({ title: z.string(), description: z.string() }),
  heading: z.string(),
  intro: z.string(),
  history: z.object({ heading: z.string(), body: z.string() }),
  vision: z.object({ heading: z.string(), body: z.string() }),
  mission: z.object({ heading: z.string(), items: list(z.string()) }),
  values: z.object({ heading: z.string(), items: list(z.object({ title: z.string(), text: z.string() })) }),
  team: z.object({
    heading: z.string(),
    intro: str,
    members: list(z.object({ name: z.string(), role: z.string(), photo: str, bio: str })),
  }),
});

const contact = z.object({
  type: z.literal('contact'),
  seo: z.object({ title: z.string(), description: z.string() }),
  heading: z.string(),
  intro: z.string(),
  successMessage: z.string(),
  errorMessage: z.string(),
});

const pages = defineCollection({
  loader: loader('pages', '**/*.yml'),
  schema: z.discriminatedUnion('type', [home, about, contact]),
});

const settings = defineCollection({
  loader: loader('settings', '**/*.yml'),
  schema: z.object({
    companyName: z.string(),
    legalName: str,
    tagline: z.string(),
    description: z.string(),
    ogImage: z.string(),
    address: str,
    email: str,
    phone: str,
    whatsapp: str,
    socials: list(z.object({ platform: z.enum(['instagram', 'youtube', 'linkedin']), url: str })),
    form: z.object({
      endpoint: str,
      turnstileSiteKey: str,
    }),
    tracking: z.object({
      gscVerification: trackingId(/^[A-Za-z0-9_-]{10,100}$/, 'kode dari content="..." Search Console'),
      gtmId: trackingId(/^GTM-[A-Z0-9]{4,12}$/, 'GTM-ABC1234'),
      ga4Id: trackingId(/^G-[A-Z0-9]{4,15}$/, 'G-ABC123XYZ'),
      metaPixelId: trackingId(/^\d{10,20}$/, '1234567890123456'),
      metaTags: list(z.object({ name: z.string().regex(/^[A-Za-z0-9:._-]{1,80}$/), content: z.string().max(300) })),
    }),
  }),
});

export const collections = { services, subservices, solutions, industries, insights, pages, settings };
