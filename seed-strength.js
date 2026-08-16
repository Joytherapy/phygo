// Salva questo file come: seed-strength.js (nella cartella principale del progetto, ~/Downloads/phygo)
// Esegui con: node seed-strength.js
// Richiede che il server sia già acceso (npm run dev) in un altro terminale.

const items = [
  {
    title: 'Seated Knee Extension',
    goal: 'Strengthens the thigh muscles that support walking and stair climbing',
    level: 'Gentle',
    body_position: 'Seated',
    equipment: 'Sturdy chair',
    steps: [
      { label: 'Start', description: 'Sit tall with both feet flat on the floor' },
      { label: 'Extend', description: 'Straighten one knee until the leg is comfortably extended' },
      { label: 'Return', description: 'Lower slowly and switch sides' },
    ],
    reps_duration: '8-12 reps per leg',
    easier_option: 'Reduce the range of motion',
    harder_option: 'Add a light ankle weight, or hold the top position for 3 seconds',
    tip: 'Keep the thigh resting on the chair throughout the movement',
  },
  {
    title: 'Standing Heel Raise',
    goal: 'Strengthens the calves used to push off while walking',
    level: 'Gentle',
    body_position: 'Standing with support',
    equipment: 'Chair or counter',
    steps: [
      { label: 'Start', description: 'Stand tall with light hand support' },
      { label: 'Lift', description: 'Rise onto the balls of both feet' },
      { label: 'Lower', description: 'Pause, then lower the heels slowly' },
    ],
    reps_duration: '10-15 reps',
    easier_option: 'Lift the heels only partway',
    harder_option: 'Use one hand for support, or alternate one leg at a time',
    tip: 'Rise straight upward rather than leaning forward',
  },
  {
    title: 'Standing Toe Raise',
    goal: 'Strengthens the front of the lower leg to help lift the foot while walking',
    level: 'Gentle',
    body_position: 'Standing with support',
    equipment: 'Chair or counter',
    steps: [
      { label: 'Start', description: 'Stand tall with heels grounded and light hand support' },
      { label: 'Lift', description: 'Raise the toes and front of the feet, keeping heels down' },
      { label: 'Lower', description: 'Lower slowly back to the start' },
    ],
    reps_duration: '10-15 reps',
    easier_option: 'Perform seated',
    harder_option: 'Reduce hand support, or hold each lift for 3 seconds',
    tip: 'Keep the body upright and avoid rocking backward',
  },
  {
    title: 'Standing Hip Abduction',
    goal: 'Strengthens the outer hip for side-to-side stability',
    level: 'Active',
    body_position: 'Standing with support',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Stand tall behind a chair for support' },
      { label: 'Lift', description: 'Keep one leg straight and move it out to the side' },
      { label: 'Return', description: 'Bring it back slowly without letting the foot swing' },
    ],
    reps_duration: '8-12 reps per side',
    easier_option: 'Use a smaller range of motion',
    harder_option: 'Add a light band above the knees',
    tip: 'Keep the toes pointing forward throughout',
  },
  {
    title: 'Standing Hip Extension',
    goal: 'Strengthens the hips and glutes for walking and posture',
    level: 'Active',
    body_position: 'Standing with support',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Stand tall with both hands on a chair' },
      { label: 'Extend', description: 'Move one straight leg backward without leaning forward' },
      { label: 'Return', description: 'Bring it back with control' },
    ],
    reps_duration: '8-12 reps per side',
    easier_option: 'Move the leg back just a few inches',
    harder_option: 'Add a light ankle weight or a resistance band',
    tip: 'Keep the core gently engaged and move with control',
  },
  {
    title: 'Standing Knee Flexion',
    goal: 'Strengthens the hamstrings for walking and bending with control',
    level: 'Active',
    body_position: 'Standing with support',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Stand tall with a light hand support' },
      { label: 'Bend', description: 'Bend one knee, bringing the heel toward the seat' },
      { label: 'Lower', description: 'Lower slowly and switch sides' },
    ],
    reps_duration: '8-12 reps per leg',
    easier_option: 'Use a smaller bend',
    harder_option: 'Add a light ankle weight',
    tip: 'Keep the knees close together throughout',
  },
  {
    title: 'Mini Squat with Chair Support',
    goal: 'Strengthens the legs for standing activities and controlled lowering',
    level: 'Active',
    body_position: 'Standing with support',
    equipment: 'Chair or counter',
    steps: [
      { label: 'Start', description: 'Stand with feet hip-width apart, holding onto support' },
      { label: 'Lower', description: 'Push the hips back and bend the knees slightly' },
      { label: 'Rise', description: 'Push through the feet to return to standing' },
    ],
    reps_duration: '8-12 reps',
    easier_option: 'Use a very shallow bend',
    harder_option: 'Hold a light ball, or pause at the bottom',
    tip: 'Keep the chest lifted and heels grounded',
  },
  {
    title: 'Standing Wall Push-Up',
    goal: 'Strengthens the chest, shoulders and arms for pushing movements',
    level: 'Gentle',
    body_position: 'Standing',
    equipment: 'Wall',
    steps: [
      { label: 'Start', description: 'Place both hands on the wall at chest height' },
      { label: 'Lower', description: 'Bend the elbows, bringing the chest toward the wall' },
      { label: 'Push', description: 'Push back to the starting position' },
    ],
    reps_duration: '8-15 reps',
    easier_option: 'Stand closer to the wall',
    harder_option: 'Stand further away, or slow down the lowering phase',
    tip: 'Keep the body in a straight line throughout',
  },
  {
    title: 'Seated Bicep Curl',
    goal: 'Strengthens the arms for everyday lifting and carrying',
    level: 'Gentle',
    body_position: 'Seated',
    equipment: 'Light weights or water bottles',
    steps: [
      { label: 'Start', description: 'Sit tall, arms at the sides, palms facing forward' },
      { label: 'Curl', description: 'Bend the elbows, bringing the weights toward the shoulders' },
      { label: 'Lower', description: 'Lower slowly back down' },
    ],
    reps_duration: '8-12 reps',
    easier_option: 'Skip the weights, or work one arm at a time',
    harder_option: 'Use a slightly heavier object, or alternate slowly',
    tip: 'Keep the elbows close to the ribs',
  },
  {
    title: 'Seated Overhead Press',
    goal: 'Strengthens the shoulders and arms for reaching and lifting overhead',
    level: 'Active',
    body_position: 'Seated',
    equipment: 'Light weights or water bottles',
    steps: [
      { label: 'Start', description: 'Hold the weights at shoulder height' },
      { label: 'Press', description: 'Push them upward within a comfortable range' },
      { label: 'Lower', description: 'Lower with control back to shoulder height' },
    ],
    reps_duration: '6-10 reps',
    easier_option: 'Press one arm at a time, or stop short of full extension',
    harder_option: 'Pause for 2 seconds at the top',
    tip: 'Keep the ribs down and sit tall throughout',
  },
  {
    title: 'Seated Row with Resistance Band',
    goal: 'Strengthens the upper back to support posture and pulling movements',
    level: 'Active',
    body_position: 'Seated',
    equipment: 'Resistance band',
    steps: [
      { label: 'Start', description: 'Sit tall holding the band with arms extended forward' },
      { label: 'Pull', description: 'Draw the elbows back, gently squeezing the shoulder blades' },
      { label: 'Return', description: 'Return slowly to the starting position' },
    ],
    reps_duration: '8-12 reps',
    easier_option: 'Use a lighter band, or shorten the pulling distance',
    harder_option: 'Use a stronger band, or pause with elbows back',
    tip: 'Keep the shoulders relaxed throughout',
  },
  {
    title: 'Seated Chest Press with Resistance Band',
    goal: 'Strengthens the chest and arms with a simple forward press',
    level: 'Active',
    body_position: 'Seated',
    equipment: 'Resistance band and chair',
    steps: [
      { label: 'Start', description: 'Loop the band behind the upper back, holding one end in each hand' },
      { label: 'Press', description: 'Push both hands forward at chest height' },
      { label: 'Return', description: 'Return slowly until the elbows are beside the body' },
    ],
    reps_duration: '8-12 reps',
    easier_option: 'Use a lighter band, or press one arm at a time',
    harder_option: 'Use a stronger band, or slow the return phase',
    tip: 'Keep the wrists straight throughout',
  },
  {
    title: 'Seated Marching with Resistance',
    goal: 'Strengthens the hip flexors used to take steps and lift the foot',
    level: 'Active',
    body_position: 'Seated',
    equipment: 'Resistance band (optional)',
    steps: [
      { label: 'Start', description: 'Sit tall with both feet resting on the floor' },
      { label: 'Lift', description: 'Raise one knee a few inches' },
      { label: 'Lower', description: 'Lower and alternate sides' },
    ],
    reps_duration: '10-16 lifts',
    easier_option: 'March with a minimal lift, no band',
    harder_option: 'Add a light band above the knees',
    tip: 'Avoid leaning backward while lifting',
  },
  {
    title: 'Bridge',
    goal: 'Strengthens the hips and core for bed mobility and body control',
    level: 'Active',
    body_position: 'Lying down',
    equipment: 'Mat',
    steps: [
      { label: 'Start', description: 'Lie on the back with knees bent and feet flat' },
      { label: 'Lift', description: 'Push through the feet and raise the hips' },
      { label: 'Lower', description: 'Pause, then lower slowly' },
    ],
    reps_duration: '6-12 reps',
    easier_option: 'Lift just slightly',
    harder_option: 'Hold the top position for 5 seconds, or lift one foot briefly',
    tip: 'Keep the knees aligned above the feet',
  },
  {
    title: 'Side-Lying Hip Raise',
    goal: 'Strengthens the outer hip for walking and lateral stability',
    level: 'Active',
    body_position: 'Lying on one side',
    equipment: 'Mat; light band optional',
    steps: [
      { label: 'Start', description: 'Lie on one side with knees bent and feet together' },
      { label: 'Lift', description: 'Keeping the feet together, raise the top knee' },
      { label: 'Lower', description: 'Lower slowly without rolling backward' },
    ],
    reps_duration: '8-12 reps per side',
    easier_option: 'Use a smaller lift',
    harder_option: 'Add a light band above the knees',
    tip: 'Keep the hips stacked one above the other',
  },
  {
    title: 'Step-Up with Support',
    goal: 'Builds the leg strength needed for curbs, stairs and raised surfaces',
    level: 'Challenge',
    body_position: 'Standing',
    equipment: 'Low step and handrail',
    steps: [
      { label: 'Start', description: 'Place one full foot on a low step' },
      { label: 'Push', description: 'Press through that foot and step up' },
      { label: 'Lower', description: 'Step down with control and repeat before switching sides' },
    ],
    reps_duration: '6-10 reps per side',
    easier_option: 'Use a very low step and firm hand support',
    harder_option: 'Increase the step height slightly, or reduce hand support',
    tip: 'Place the whole foot on the step before pushing up',
  },
  {
    title: 'Counter Tricep Press',
    goal: 'Strengthens the back of the arms for pushing up from surfaces',
    level: 'Active',
    body_position: 'Standing',
    equipment: 'Counter or sturdy table',
    steps: [
      { label: 'Start', description: 'Stand facing a stable counter with hands on the edge' },
      { label: 'Lower', description: 'Bend the elbows, bringing the chest toward the counter' },
      { label: 'Push', description: 'Push through the hands to straighten the arms' },
    ],
    reps_duration: '8-12 reps',
    easier_option: 'Stand closer to the counter',
    harder_option: 'Stand further back, or slow the lowering phase',
    tip: 'Keep the elbows pointing backward, not outward',
  },
  {
    title: 'Seated Ball Squeeze',
    goal: 'Strengthens the inner thighs and improves body control',
    level: 'Gentle',
    body_position: 'Seated',
    equipment: 'Soft ball or folded cushion',
    steps: [
      { label: 'Start', description: 'Place a soft ball between the knees' },
      { label: 'Squeeze', description: 'Sit tall and gently squeeze the ball' },
      { label: 'Release', description: 'Hold briefly, then release without dropping the ball' },
    ],
    reps_duration: '10 squeezes, holding 3 seconds each',
    easier_option: 'Use a cushion and squeeze more gently',
    harder_option: 'Hold each squeeze for 5 seconds',
    tip: 'Keep both feet grounded throughout',
  },
  {
    title: 'Standing Lateral Step with Band',
    goal: 'Strengthens the hips and legs for side-to-side movement',
    level: 'Challenge',
    body_position: 'Standing',
    equipment: 'Loop band; counter nearby',
    steps: [
      { label: 'Start', description: 'Place the band above the knees or around the ankles' },
      { label: 'Step', description: 'Bend the knees slightly and take a step to the side' },
      { label: 'Follow', description: 'Bring the other foot in without letting the band go slack' },
    ],
    reps_duration: '6-10 steps per direction',
    easier_option: 'Perform without the band, holding onto a counter',
    harder_option: 'Use a stronger band, or take wider steps',
    tip: 'Keep the toes pointing forward throughout',
  },
];

async function seed() {
  const base = 'http://localhost:3000';

  console.log('Recupero categorie...');
  const listRes = await fetch(`${base}/api/library/admin`);
  const listData = await listRes.json();

  const strengthCat = listData.categories.find((c) => c.slug === 'senior-rehabilitation');
  const strengthSub = listData.subcategories.find(
    (s) => s.slug === 'strength' && s.category_id === strengthCat.id
  );

  if (!strengthSub) {
    console.error('Sottocategoria Strength non trovata. Controlla lo schema SQL.');
    return;
  }

  console.log(`Sottocategoria trovata: ${strengthSub.id}`);
  console.log(`Inserisco ${items.length} esercizi...`);

  let sortOrder = 2;
  for (const item of items) {
    const res = await fetch(`${base}/api/library/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...item,
        subcategory_id: strengthSub.id,
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
