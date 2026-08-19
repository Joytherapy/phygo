// Salva questo file come: seed-balance-final.js (nella cartella principale del progetto, ~/Downloads/phygo)
// Esegui con: node seed-balance-final.js
// SICURO: controlla automaticamente quali esercizi esistono già (per titolo) e salta i duplicati.

const items = [
  {
    title: 'Feet-Together Stance',
    goal: 'Trains a stable position on a narrower base of support',
    level: 'Gentle',
    body_position: 'Standing with support',
    equipment: 'Chair or counter',
    steps: [
      { label: 'Start', description: 'Stand behind a chair with feet together' },
      { label: 'Hold', description: 'Loosen the grip while staying upright' },
      { label: 'Breathe', description: 'Hold the position, breathing normally' },
    ],
    reps_duration: '20-30 seconds',
    easier_option: 'Keep feet slightly apart with hands on the support',
    harder_option: 'Use a fingertip-only support, or briefly lift the hands',
    tip: 'Keep the weight evenly distributed on both feet',
  },
  {
    title: 'Semi-Tandem Stance',
    goal: 'Trains balance with one foot positioned slightly ahead',
    level: 'Gentle',
    body_position: 'Standing with support',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Place one foot half a step ahead of the other' },
      { label: 'Hold', description: 'Use a light touch on the chair' },
      { label: 'Switch', description: 'Hold, then switch which foot is forward' },
    ],
    reps_duration: '20 seconds per side',
    easier_option: 'Widen the stance',
    harder_option: 'Bring the feet closer, toward a heel-to-toe position',
    tip: 'Keep the hips facing forward',
  },
  {
    title: 'Tandem Stance',
    goal: 'Challenges balance in a heel-to-toe position',
    level: 'Active',
    body_position: 'Standing with support',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Place one foot directly in front of the other' },
      { label: 'Hold', description: 'Hold the chair lightly' },
      { label: 'Switch', description: 'Stay upright, then switch foot positions' },
    ],
    reps_duration: '15-30 seconds per side',
    easier_option: 'Leave a small gap between the feet',
    harder_option: 'Reduce hand support, or add slow head turns',
    tip: 'Look straight ahead',
  },
  {
    title: 'Single-Leg Toe Tap',
    goal: 'Shifts weight onto one leg while the other stays available for support',
    level: 'Gentle',
    body_position: 'Standing with support',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Stand tall with a light hand support' },
      { label: 'Shift', description: 'Shift the weight onto one leg' },
      { label: 'Tap', description: 'Lightly tap the other foot forward, then return' },
    ],
    reps_duration: '8-10 taps per side',
    easier_option: 'Keep more weight on both feet',
    harder_option: 'Tap in front, to the side, and behind',
    tip: 'Keep the standing knee soft, not locked',
  },
  {
    title: 'Single-Leg Stand',
    goal: 'Trains brief single-leg balance near a support',
    level: 'Active',
    body_position: 'Standing with support',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Stand behind a chair' },
      { label: 'Lift', description: 'Lift one foot slightly off the floor' },
      { label: 'Hold and switch', description: 'Hold, lower, and switch sides' },
    ],
    reps_duration: '5-15 seconds per side',
    easier_option: 'Keep the toes lightly touching the floor',
    harder_option: 'Use a fingertip-only support, or slowly move the lifted foot',
    tip: 'Stay tall over the supporting leg',
  },
  {
    title: 'Forward Weight Shift',
    goal: 'Trains shifting body weight forward and backward with control',
    level: 'Gentle',
    body_position: 'Standing with support',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Stand with one foot slightly ahead' },
      { label: 'Shift forward', description: 'Shift the weight toward the front foot' },
      { label: 'Shift back', description: 'Return toward the back foot without lifting either foot' },
    ],
    reps_duration: '8-12 shifts per side',
    easier_option: 'Use both hands and a narrower stance',
    harder_option: 'Reduce hand support, or use a wider stance',
    tip: 'Keep the movement controlled',
  },
  {
    title: 'Lateral Weight Shift',
    goal: 'Trains a controlled side-to-side weight shift',
    level: 'Gentle',
    body_position: 'Standing with support',
    equipment: 'Counter or chair',
    steps: [
      { label: 'Start', description: 'Stand with feet wider than hip-width' },
      { label: 'Shift', description: 'Shift the weight onto one leg' },
      { label: 'Return', description: 'Return to center and shift to the other side' },
    ],
    reps_duration: '10-16 total shifts',
    easier_option: 'Use a smaller shift',
    harder_option: 'Lift the heel of the unloaded foot, or add a side reach',
    tip: 'Keep both feet pointing forward',
  },
  {
    title: 'Clock Taps',
    goal: 'Trains foot movement in multiple directions',
    level: 'Active',
    body_position: 'Standing with support',
    equipment: 'Chair; floor markers optional',
    steps: [
      { label: 'Start', description: 'Stand on one leg with light support' },
      { label: 'Tap', description: 'Tap the other foot forward, to the side, and behind, like clock positions' },
      { label: 'Return', description: 'Return to center after each tap, then switch legs' },
    ],
    reps_duration: '2-4 rounds per side',
    easier_option: 'Use only the forward and side taps',
    harder_option: 'Reach further, or reduce hand support',
    tip: 'Keep most of the weight on the standing leg',
  },
  {
    title: 'Heel-to-Toe Walk',
    goal: 'Trains a narrow, controlled walking pattern',
    level: 'Active',
    body_position: 'Walking',
    equipment: 'Wall or counter nearby',
    steps: [
      { label: 'Start', description: 'Stand beside a wall or counter' },
      { label: 'Walk', description: 'Walk forward placing the heel directly in front of the other foot\'s toes' },
      { label: 'Continue', description: 'Continue with slow, controlled steps' },
    ],
    reps_duration: '6-12 steps',
    easier_option: 'Use more hand support',
    harder_option: 'Walk with less support, or add a return walking backward',
    tip: 'Look ahead rather than down',
  },
  {
    title: 'Backward Walk',
    goal: 'Trains controlled steps backward',
    level: 'Challenge',
    body_position: 'Walking',
    equipment: 'Wall or counter nearby',
    steps: [
      { label: 'Start', description: 'Stand tall beside a stable support' },
      { label: 'Step back', description: 'Take small steps backward' },
      { label: 'Return', description: 'Pause, then walk forward back to the starting point' },
    ],
    reps_duration: '6-10 steps per direction',
    easier_option: 'Take one step back at a time and return',
    harder_option: 'Reduce hand support, or increase the distance',
    tip: 'Take small steps and lift the feet fully off the floor',
  },
  {
    title: 'Lateral Step at the Counter',
    goal: 'Trains a controlled sideways stepping movement',
    level: 'Active',
    body_position: 'Walking',
    equipment: 'Counter',
    steps: [
      { label: 'Start', description: 'Stand beside the counter with soft knees' },
      { label: 'Step', description: 'Take a side step with one foot' },
      { label: 'Follow', description: 'Bring the other foot in and continue' },
    ],
    reps_duration: '6-10 steps per direction',
    easier_option: 'Keep both hands on the counter',
    harder_option: 'Use one hand, or add a small squat between steps',
    tip: 'Keep the toes pointing forward',
  },
  {
    title: 'Step Over a Line',
    goal: 'Trains foot clearance and controlled forward stepping',
    level: 'Active',
    body_position: 'Standing',
    equipment: 'Tape or marker on the floor; chair nearby',
    steps: [
      { label: 'Start', description: 'Stand behind a line on the floor' },
      { label: 'Step over', description: 'Step one foot over the line' },
      { label: 'Return', description: 'Step back behind the line and switch legs' },
    ],
    reps_duration: '8-12 total steps',
    easier_option: 'Tap over the line without transferring full weight',
    harder_option: 'Use a low foam obstacle instead of a line',
    tip: 'Lift the foot fully rather than dragging it',
  },
  {
    title: 'Turn in Place',
    goal: 'Trains controlled changes of direction',
    level: 'Active',
    body_position: 'Standing',
    equipment: 'Chair nearby',
    steps: [
      { label: 'Start', description: 'Stand tall with feet in a comfortable position' },
      { label: 'Turn', description: 'Take several small steps to turn a quarter circle' },
      { label: 'Pause', description: 'Pause, then continue or reverse direction' },
    ],
    reps_duration: '2-4 turns per direction',
    easier_option: 'Practice only quarter turns with support',
    harder_option: 'Complete a full turn using fewer steps',
    tip: 'Use small steps instead of pivoting on one foot',
  },
  {
    title: 'Stand, Pause, and Sit',
    goal: 'Trains stability immediately after standing up',
    level: 'Active',
    body_position: 'Seated to standing',
    equipment: 'Chair',
    steps: [
      { label: 'Stand', description: 'Stand up from the chair' },
      { label: 'Pause', description: 'Pause for 3 seconds without rushing forward' },
      { label: 'Sit', description: 'Sit back down with control' },
    ],
    reps_duration: '6-10 reps',
    easier_option: 'Use the armrests',
    harder_option: 'Hold a light object, or reduce hand support',
    tip: 'Find your balance before taking any step',
  },
  {
    title: 'Standing March with Support',
    goal: 'Trains alternating weight shifts and foot lifting',
    level: 'Gentle',
    body_position: 'Standing with support',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Stand tall behind a chair' },
      { label: 'March', description: 'Lift one knee, lower it, and switch sides' },
      { label: 'Continue', description: 'Continue at a steady pace' },
    ],
    reps_duration: '20-40 total steps',
    easier_option: 'Lift the feet only slightly',
    harder_option: 'Use one hand, or add the opposite arm swing',
    tip: 'Avoid leaning from side to side',
  },
  {
    title: 'Standing Head Turns',
    goal: 'Trains maintaining balance while looking around',
    level: 'Active',
    body_position: 'Standing with support',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Stand with feet hip-width apart and light support' },
      { label: 'Turn', description: 'Slowly turn the head left and right' },
      { label: 'Face forward', description: 'Keep the body facing forward throughout' },
    ],
    reps_duration: '5-8 turns per side',
    easier_option: 'Perform seated',
    harder_option: 'Use a narrower stance, or reduce hand support',
    tip: 'Move the eyes and head together',
  },
  {
    title: 'Reach Outside the Base',
    goal: 'Trains a controlled reach while remaining stable',
    level: 'Active',
    body_position: 'Standing with support',
    equipment: 'Chair; light object',
    steps: [
      { label: 'Start', description: 'Stand beside a chair or counter' },
      { label: 'Reach', description: 'Reach one hand slightly forward or to the side' },
      { label: 'Return', description: 'Return to center before reaching again' },
    ],
    reps_duration: '6-10 reaches per side',
    easier_option: 'Perform the reach while seated',
    harder_option: 'Reach further, or move an object between targets',
    tip: 'Move from the ankles and hips rather than stepping, unless needed',
  },
  {
    title: 'Four-Corner Step',
    goal: 'Trains stepping forward, sideways, backward, and diagonally',
    level: 'Challenge',
    body_position: 'Standing',
    equipment: 'Four floor markers',
    steps: [
      { label: 'Start', description: 'Stand at the center of four markers' },
      { label: 'Step', description: 'Step toward one marker and return to center' },
      { label: 'Continue', description: 'Continue toward each marker, then change the order' },
    ],
    reps_duration: '2-4 rounds',
    easier_option: 'Use only the front and side markers, with chair support',
    harder_option: 'Follow a called-out sequence by voice or color',
    tip: 'Return fully to center after every step',
  },
  {
    title: 'Walking on Unstable Surfaces',
    goal: 'Challenges balance and ankle control by walking on a compliant surface',
    level: 'Challenge',
    body_position: 'Walking',
    equipment: 'Foam pad or cushioned mat; chair or wall nearby',
    steps: [
      { label: 'Start', description: 'Stand at the edge of a foam pad or cushioned surface with support nearby' },
      { label: 'Walk', description: 'Walk slowly across the unstable surface with controlled steps' },
      { label: 'Continue', description: 'Continue to the far edge, then turn and repeat' },
    ],
    reps_duration: '2-4 crossings',
    easier_option: 'Use a thinner or firmer surface, and keep a hand on support throughout',
    harder_option: 'Use a thicker foam pad, or reduce hand support',
    tip: 'Take smaller steps than usual and keep the gaze forward',
    safety_note: 'Requires close supervision and a stable support within reach at all times',
  },
  {
    title: 'Eyes-Closed Balance, Feet Together',
    goal: 'Challenges balance without visual input, in a stable standing position',
    level: 'Challenge',
    body_position: 'Standing with support',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Stand with feet together beside a chair, eyes open' },
      { label: 'Close eyes', description: 'Close the eyes and hold the position' },
      { label: 'Open and reset', description: 'Open the eyes, reset, and repeat' },
    ],
    reps_duration: '30 seconds, feet together',
    easier_option: 'Keep the eyes open, or widen the stance',
    harder_option: 'Reduce hand support before closing the eyes',
    tip: 'Stop immediately and open the eyes if balance feels unsteady',
    safety_note: 'Perform only with a support within immediate reach and, ideally, someone present',
  },
  {
    title: 'Eyes-Closed Single-Leg Balance',
    goal: 'Challenges single-leg balance without visual input',
    level: 'Challenge',
    body_position: 'Standing with support',
    equipment: 'Chair',
    steps: [
      { label: 'Start', description: 'Stand on one leg beside a chair, eyes open, other foot lifted slightly' },
      { label: 'Close eyes', description: 'Close the eyes and hold the position briefly' },
      { label: 'Open and switch', description: 'Open the eyes, lower the foot, and switch sides' },
    ],
    reps_duration: '5-10 seconds per side',
    easier_option: 'Keep the eyes open, or keep the toes lightly touching the floor',
    harder_option: 'Hold for longer, or reduce hand support',
    tip: 'Open the eyes right away if the balance feels lost',
    safety_note: 'Perform only with a support within immediate reach and, ideally, someone present',
  },
  {
    title: 'Resisting Manual Perturbations',
    goal: 'Trains a quick balance response to unexpected pushes, guided by a clinician',
    level: 'Challenge',
    body_position: 'Standing',
    equipment: 'Clinician assistance',
    steps: [
      { label: 'Start', description: 'Stand tall in a stable, ready position' },
      { label: 'Perturbation', description: 'The clinician applies a light, unpredictable push at the shoulders, hips, or trunk' },
      { label: 'Recover', description: 'Regain balance and reset to the starting position' },
    ],
    reps_duration: '6-10 pushes, varying direction and body area',
    easier_option: 'Use lighter, more predictable pushes with advance warning',
    harder_option: 'Use less predictable timing and direction, or a wider base of instability',
    tip: 'Keep the knees soft and stay ready to take a step if needed',
    safety_note: 'Performed only with a trained clinician present and in control of the force applied',
  },
  {
    title: 'Walking Ball Toss with Clinician',
    goal: 'Combines walking with a reactive upper-body task, guided by a clinician',
    level: 'Challenge',
    body_position: 'Walking',
    equipment: 'Soft ball; clinician assistance',
    steps: [
      { label: 'Start', description: 'Stand facing the clinician a few steps apart' },
      { label: 'Walk and toss', description: 'Walk forward while tossing the ball back and forth with the clinician' },
      { label: 'Reverse', description: 'Walk backward while continuing the ball toss, then repeat' },
    ],
    reps_duration: '2-4 passes in each direction',
    easier_option: 'Stand still while tossing, without walking',
    harder_option: 'Increase walking pace, or vary the toss height and direction',
    tip: 'Keep the steps small and controlled, prioritizing balance over catching every toss',
    safety_note: 'Performed only with a trained clinician present, in a clear, obstacle-free space',
  },
];

async function seed() {
  const base = 'http://localhost:3000';

  console.log('Recupero esercizi già esistenti...');
  const listRes = await fetch(`${base}/api/library/admin`);
  const listData = await listRes.json();

  const cat = listData.categories.find((c) => c.slug === 'senior-rehabilitation');
  const sub = listData.subcategories.find(
    (s) => s.slug === 'balance' && s.category_id === cat.id
  );

  if (!sub) {
    console.error('Sottocategoria Balance non trovata. Creala prima con lo SQL apposito.');
    return;
  }

  const existingTitles = new Set(
    listData.items.filter((i) => i.subcategory_id === sub.id).map((i) => i.title)
  );

  console.log(`Trovati ${existingTitles.size} esercizi già presenti in Balance.`);

  const toInsert = items.filter((item) => !existingTitles.has(item.title));
  console.log(`Da inserire: ${toInsert.length} nuovi esercizi (${items.length - toInsert.length} già presenti, saltati).`);

  let sortOrder = existingTitles.size + 1;
  for (const item of toInsert) {
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
