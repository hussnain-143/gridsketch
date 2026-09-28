export interface SampleImage {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  dataUrl: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sculpture',
    title: 'Classical Sculpture Bust',
    subtitle: 'Marble form study with dramatic directional light',
    category: 'Sculpture & Form',
    dataUrl:
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'portrait',
    title: 'Fine Art Portrait',
    subtitle: 'Facial anatomy with rich shadows and clear planes',
    category: 'Portrait Study',
    dataUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'still-life',
    title: 'Classical Still Life',
    subtitle: 'Floral & botanical forms with subtle tonal gradations',
    category: 'Still Life',
    dataUrl:
      'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'architecture',
    title: 'Gothic Architectural Portal',
    subtitle: 'Columns and arched vaults for linear perspective practice',
    category: 'Architecture & Perspective',
    dataUrl:
      'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=1200&q=80',
  },
];
