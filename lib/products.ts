export type Product = {
  id: string
  name: string
  category: 'Pelvic Floor' | 'Low Back' | 'Posture' | 'Mobility' | 'Recovery'
  description: string
  price: string
  amazonUrl: string
}

// Placeholder Amazon links — replace with your real Amazon Associates links.
export const products: Product[] = [
  {
    id: 'resistance-bands-set',
    name: 'Resistance Bands Set (5 levels)',
    category: 'Mobility',
    description: 'Latex loop bands for progressive strength and mobility work, ideal for home exercise programs.',
    price: '€15–20',
    amazonUrl: 'https://www.amazon.it/s?k=resistance+bands+set',
  },
  {
    id: 'foam-roller',
    name: 'High-Density Foam Roller',
    category: 'Recovery',
    description: 'Standard 33cm roller for myofascial release and post-session recovery.',
    price: '€20–30',
    amazonUrl: 'https://www.amazon.it/s?k=foam+roller',
  },
  {
    id: 'lumbar-support-cushion',
    name: 'Lumbar Support Cushion',
    category: 'Low Back',
    description: 'Ergonomic cushion for desk chairs and car seats, helps maintain lumbar curve during long sitting.',
    price: '€25–35',
    amazonUrl: 'https://www.amazon.it/s?k=lumbar+support+cushion',
  },
  {
    id: 'kegel-balls',
    name: 'Pelvic Floor Training Weights',
    category: 'Pelvic Floor',
    description: 'Graduated weight set for progressive pelvic floor strengthening exercises.',
    price: '€20–30',
    amazonUrl: 'https://www.amazon.it/s?k=pelvic+floor+trainer',
  },
  {
    id: 'posture-corrector',
    name: 'Posture Corrector Brace',
    category: 'Posture',
    description: 'Adjustable back brace for postural awareness training, for short daily wear periods.',
    price: '€15–25',
    amazonUrl: 'https://www.amazon.it/s?k=posture+corrector',
  },
  {
    id: 'yoga-mat',
    name: 'Non-Slip Exercise Mat',
    category: 'Mobility',
    description: 'Thick, non-slip mat for floor-based rehab exercises and stretching routines.',
    price: '€20–30',
    amazonUrl: 'https://www.amazon.it/s?k=exercise+mat',
  },
  {
    id: 'massage-ball-set',
    name: 'Trigger Point Massage Ball Set',
    category: 'Recovery',
    description: 'Small firm balls for targeted trigger point release in glutes, feet, and shoulders.',
    price: '€10–15',
    amazonUrl: 'https://www.amazon.it/s?k=massage+ball+trigger+point',
  },
  {
    id: 'lumbar-pillow-sleep',
    name: 'Knee Pillow for Side Sleepers',
    category: 'Low Back',
    description: 'Contoured pillow to maintain spinal alignment for side sleepers with low back pain.',
    price: '€15–20',
    amazonUrl: 'https://www.amazon.it/s?k=knee+pillow+side+sleeper',
  },
  {
    id: 'balance-pad',
    name: 'Balance & Stability Pad',
    category: 'Mobility',
    description: 'Foam balance pad for proprioception and ankle stability training.',
    price: '€20–25',
    amazonUrl: 'https://www.amazon.it/s?k=balance+pad',
  },
  {
    id: 'standing-desk-converter',
    name: 'Standing Desk Converter',
    category: 'Posture',
    description: 'Height-adjustable desktop riser to alternate sitting and standing during work.',
    price: '€60–100',
    amazonUrl: 'https://www.amazon.it/s?k=standing+desk+converter',
  },
]

export const categories = ['Pelvic Floor', 'Low Back', 'Posture', 'Mobility', 'Recovery'] as const