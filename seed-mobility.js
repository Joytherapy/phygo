// Salva questo file come: seed-mobility.js (nella cartella principale del progetto, ~/Downloads/phygo)
// Esegui con: node seed-mobility.js

const items = [
  {
    title: 'Seated Neck Rotation',
    goal: 'Improves comfortable neck turning for everyday movements',
    level: 'Gentle',
    body_position: 'Seated',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Sit tall with a straight back, looking forward' },
      { label: 'Turn', description: 'Slowly turn the head to one side' },
      { label: 'Return', description: 'Return to center and repeat on the other side' },
    ],
    reps_duration: '5-8 reps per side',
    easier_option: 'Use a smaller range of motion',
    harder_option: 'Pause for 2 seconds at each side',
    tip: 'Keep the shoulders facing forward throughout',
  },
  {
    title: 'Chin Tuck',
    goal: 'Supports well-aligned neck and head posture',
    level: 'Gentle',
    body_position: 'Seated',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Look straight ahead' },
      { label: 'Tuck', description: 'Gently draw the chin backward, as if making a double chin' },
      { label: 'Return', description: 'Return to a neutral position' },
    ],
    reps_duration: '8-10 reps',
    easier_option: 'Use a very small movement',
    harder_option: 'Hold each tuck for 3 seconds',
    tip: 'Avoid tilting the head up or down',
  },
  {
    title: 'Shoulder Rolls',
    goal: 'Warms up the shoulders and upper back',
    level: 'Gentle',
    body_position: 'Seated or standing',
    equipment: 'None',
    steps: [
      { label: 'Start', description: 'Gently lift the shoulders toward the ears' },
      { label: 'Roll', description: 'Roll them backward and down' },
      { label: 'Repeat', description: 'Continue with smooth circles, then reverse direction' },
    ],
    reps_duration: '6-10 circles per direction',
    easier_option: 'Use smaller circles',
    harder_option: 'Alternate one shoulder at a time',
    tip: 'Move slowly without tensing the shoulders',
  },
  {
    title: 'Arm Circles',
    goal: 'Improves shoulder movement and warms up the arms',
    level: 'Active',
    body_position: 'Standing or seated',
    equipment: 'None',
    steps: [
      { label: 'Start', description: 'Extend the arms lightly out to the sides' },
      { label: 'Circle', description: 'Make small forward circles' },
      { label: 'Reverse', description: 'Reverse the direction, widening the circles if comfortable' },
    ],
    reps_duration: '8-12 circles per direction',
    easier_option: 'Keep the elbows bent and circles small',
    harder_option: 'Use wider circles or alternate direction',
    tip: 'Keep the shoulders relaxed and down',
  },
  {
    title: 'Seated Cross-Body Reach',
    goal: 'Improves rotation and reach across the body',
    level: 'Gentle',
    body_position: 'Seated',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Sit tall with feet firmly planted' },
      { label: 'Reach', description: 'Reach one hand toward the opposite side' },
      { label: 'Return', description: 'Return to center and switch arms' },
    ],
    reps_duration: '6-10 reps per side',
    easier_option: 'Reach only to the midline',
    harder_option: 'Add a gentle trunk twist while reaching',
    tip: 'Keep both hips grounded on the chair',
  },
  {
    title: 'Seated Trunk Rotation',
    goal: 'Improves comfortable rotation through the upper body',
    level: 'Active',
    body_position: 'Seated',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Cross the arms over the chest or rest hands on shoulders' },
      { label: 'Rotate', description: 'Rotate the chest to one side' },
      { label: 'Return', description: 'Return to center and rotate to the other side' },
    ],
    reps_duration: '5-8 reps per side',
    easier_option: 'Keep hands on thighs and use a smaller rotation',
    harder_option: 'Hold each side for 3 seconds',
    tip: 'Keep the knees facing forward throughout',
  },
  {
    title: 'Side Trunk Stretch',
    goal: 'Improves side bending mobility through the torso',
    level: 'Gentle',
    body_position: 'Seated',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Sit tall with one hand resting near the hip' },
      { label: 'Bend', description: 'Raise the other arm overhead and bend gently to the side' },
      { label: 'Return', description: 'Return to center and switch sides' },
    ],
    reps_duration: '5-8 reps per side',
    easier_option: 'Keep the raised hand at shoulder height',
    harder_option: 'Hold the stretch for 3 seconds',
    tip: 'Keep the hips grounded on the seat',
  },
  {
    title: 'Pelvic Tilt',
    goal: 'Improves awareness and movement of the pelvis and lower back',
    level: 'Gentle',
    body_position: 'Seated',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Sit centered on the chair in a neutral position' },
      { label: 'Tilt forward', description: 'Gently tilt the pelvis forward, arching the lower back slightly' },
      { label: 'Tilt back', description: 'Tilt the pelvis backward, rounding the lower back, then return to neutral' },
    ],
    reps_duration: '8-12 reps',
    easier_option: 'Use a smaller movement',
    harder_option: 'Coordinate the movement with slow breathing',
    tip: 'Move the pelvis rather than the shoulders',
  },
  {
    title: 'Seated Hip Open-Close',
    goal: 'Warms up the hips with a gentle inward and outward movement',
    level: 'Gentle',
    body_position: 'Seated',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Sit tall with knees bent' },
      { label: 'Open', description: 'Move one knee outward while keeping the foot in place' },
      { label: 'Close', description: 'Bring the knee back in and switch sides' },
    ],
    reps_duration: '8-10 reps per side',
    easier_option: 'Use a smaller outward movement',
    harder_option: 'Move both knees outward together',
    tip: 'Keep the foot grounded throughout',
  },
  {
    title: 'Seated Knee Lift',
    goal: 'Trains a controlled hip movement useful for walking',
    level: 'Gentle',
    body_position: 'Seated',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Sit tall with feet resting on the floor' },
      { label: 'Lift', description: 'Raise one knee with a comfortable movement' },
      { label: 'Lower', description: 'Lower the foot and switch sides' },
    ],
    reps_duration: '10-16 total lifts',
    easier_option: 'Slide the foot forward and back instead of lifting',
    harder_option: 'Pause for 2 seconds at the top',
    tip: 'Avoid leaning backward',
  },
  {
    title: 'Ankle Pumps',
    goal: 'Moves the ankle between flexed and pointed positions',
    level: 'Gentle',
    body_position: 'Seated or lying',
    equipment: 'None',
    steps: [
      { label: 'Start', description: 'Keep the heel resting on the floor or a support' },
      { label: 'Point', description: 'Point the feet forward' },
      { label: 'Flex', description: 'Pull the feet back toward the shins' },
    ],
    reps_duration: '10-20 reps',
    easier_option: 'Move one foot at a time',
    harder_option: 'Add slow ankle circles combined with the pumps',
    tip: 'Keep the movement focused at the ankle',
  },
  {
    title: 'Ankle Circles',
    goal: 'Improves ankle movement in multiple directions',
    level: 'Gentle',
    body_position: 'Seated',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Lift one foot slightly off the floor' },
      { label: 'Circle', description: 'Draw slow circles with the toes' },
      { label: 'Reverse', description: 'Reverse direction and switch feet' },
    ],
    reps_duration: '6-10 circles per direction',
    easier_option: 'Keep the heel on the floor and draw a smaller circle',
    harder_option: 'Trace the alphabet with the foot',
    tip: 'Move slowly without swinging the leg',
  },
  {
    title: 'Heel Slides',
    goal: 'Improves knee and hip bending and straightening',
    level: 'Gentle',
    body_position: 'Lying down',
    equipment: 'Mat or bed',
    steps: [
      { label: 'Start', description: 'Lie on the back with legs extended' },
      { label: 'Slide', description: 'Slide one heel toward the hips, bending the knee' },
      { label: 'Return', description: 'Slide the leg back to extended and switch sides' },
    ],
    reps_duration: '8-12 reps per side',
    easier_option: 'Use a shorter sliding distance',
    harder_option: 'Pause at the deepest comfortable bend',
    tip: 'Keep the heel in contact with the surface throughout',
  },
  {
    title: 'Standing Hip Circles',
    goal: 'Warms up the hips with a controlled circular movement',
    level: 'Active',
    body_position: 'Standing with support',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Stand tall with one hand on a chair' },
      { label: 'Lift', description: 'Lift one knee slightly' },
      { label: 'Circle', description: 'Draw a small circle with the knee, then reverse direction' },
    ],
    reps_duration: '5 circles per direction, per leg',
    easier_option: 'Keep the toes on the floor and draw a smaller circle',
    harder_option: 'Use a slightly wider circle with less hand support',
    tip: 'Keep the torso upright throughout',
  },
  {
    title: 'Standing Leg Swing with Support',
    goal: 'Improves forward and backward hip movement',
    level: 'Active',
    body_position: 'Standing with support',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Stand tall holding a stable support' },
      { label: 'Swing forward', description: 'Swing one leg gently forward with control' },
      { label: 'Swing back', description: 'Swing the leg back and repeat before switching sides' },
    ],
    reps_duration: '8-12 swings per leg',
    easier_option: 'Tap the foot forward and back instead of swinging',
    harder_option: 'Increase the swing range slightly, or reduce hand support',
    tip: 'Keep the chest upright throughout',
  },
  {
    title: 'Standing Heel-Toe Rock',
    goal: 'Moves the ankle through flexion during a light weight shift',
    level: 'Gentle',
    body_position: 'Standing with support',
    equipment: 'Chair or counter',
    steps: [
      { label: 'Start', description: 'Stand tall with light hand support' },
      { label: 'Rock forward', description: 'Rock forward onto the balls of the feet' },
      { label: 'Rock back', description: 'Rock back toward the heels with control' },
    ],
    reps_duration: '10-15 reps',
    easier_option: 'Perform seated, alternating heel and toe lifts',
    harder_option: 'Reduce hand support, or pause at each end',
    tip: 'Keep the movement smooth and contained',
  },
  {
    title: 'Standing Wall Shoulder Slide',
    goal: 'Trains raising the arms with the guidance of a wall',
    level: 'Active',
    body_position: 'Standing',
    equipment: 'Wall',
    steps: [
      { label: 'Start', description: 'Stand facing a wall with fingertips lightly touching' },
      { label: 'Slide up', description: 'Slide the hands upward within a comfortable range' },
      { label: 'Slide down', description: 'Slide slowly back down' },
    ],
    reps_duration: '6-10 reps',
    easier_option: 'Use one arm at a time',
    harder_option: 'Stand slightly further from the wall and reach higher',
    tip: 'Keep the shoulders relaxed throughout',
  },
  {
    title: 'Warm-Up March and Stretch',
    goal: 'Combines light marching with arm movement to warm up the whole body',
    level: 'Active',
    body_position: 'Standing or seated',
    equipment: 'None',
    steps: [
      { label: 'March', description: 'March gently in place' },
      { label: 'Reach', description: 'Bring one arm forward as the opposite knee lifts' },
      { label: 'Alternate', description: 'Continue alternating sides at a comfortable pace' },
    ],
    reps_duration: '30-60 seconds',
    easier_option: 'Perform seated with smaller arm reaches',
    harder_option: 'Reach overhead, or increase the pace slightly',
    tip: 'Move smoothly and breathe normally',
  },
];

async function seed() {
  const base = 'http://localhost:3000';

  console.log('Recupero categorie...');
  const listRes = await fetch(`${base}/api/library/admin`);
  const listData = await listRes.json();

  const cat = listData.categories.find((c) => c.slug === 'senior-rehabilitation');
  const sub = listData.subcategories.find(
    (s) => s.slug === 'mobility' && s.category_id === cat.id
  );

  if (!sub) {
    console.error('Sottocategoria Mobility non trovata. Esegui prima lo SQL di creazione.');
    return;
  }

  console.log(`Sottocategoria trovata: ${sub.id}`);
  console.log(`Inserisco ${items.length} esercizi...`);

  let sortOrder = 1;
  for (const item of items) {
    const res = await fetch(`${base}/api/library/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...item,
        subcategory_id: sub.id,
        sort_order: sortOrder,
      }),
    });
    const data = await res.json();
    if (data.success) {
      console.log(`✓ ${item.title}`);
    } else {
      console.error(`✗ ${item.title} — ${data.error}`);
    }
    sortOrder++;
  }

  console.log('Fatto!');
}

seed();
