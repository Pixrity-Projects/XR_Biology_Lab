export const HOTSPOTS_DATA = [
  // Row 1: Genetics & Cell Core (z: -3.5)
  { id: 'nucleus', title: 'The Nucleus', desc: 'The command center of the cell. It acts like a vault, safely storing all of your DNA.', pos: [-2.8, 1.4, -3.5], color: 0x4ecdc4, type: 'nucleus' },
  { id: 'chromosome', title: 'Chromosome', desc: 'To fit inside the cell, DNA is tightly coiled and packed into X-shaped structures called chromosomes.', pos: [-1.2, 1.4, -3.5], color: 0xffe66d, type: 'chromosome' },
  { id: 'dna', title: 'Double Helix', desc: 'The famous double helix. It looks like a twisted ladder, made of two long strands winding around each other.', pos: [1.2, 1.4, -3.5], color: 0xff6b6b, type: 'dna' },
  { id: 'basepair', title: 'Base Pairs', desc: 'The rungs of the ladder. Adenine pairs with Thymine, and Cytosine pairs with Guanine. Your genetic code!', pos: [2.8, 1.4, -3.5], color: 0xc4b5fd, type: 'basepair' },

  // Row 2: Cellular Organelles (z: -7.5)
  { id: 'mitochondria', title: 'Mitochondria', desc: 'Known as the powerhouse of the cell. It takes in nutrients and creates energy-rich molecules.', pos: [-2.8, 1.4, -7.5], color: 0xf97316, type: 'mitochondria', model: 'models/mitochondria.glb', modelScale: 0.4 },
  { id: 'ribosome', title: 'Ribosomes', desc: 'The protein builders of the cell. They connect amino acids together in specific chains to build proteins.', pos: [-1.2, 1.4, -7.5], color: 0x3b82f6, type: 'ribosome', model: 'models/ribosome.glb', modelScale: 0.4 },
  { id: 'er', title: 'Endoplasmic Reticulum', desc: 'A network of membranes functioning like a manufacturing and packaging system. It helps fold proteins.', pos: [1.2, 1.4, -7.5], color: 0x14b8a6, type: 'er', model: 'models/er.glb', modelScale: 0.4 },
  { id: 'golgi', title: 'Golgi Apparatus', desc: 'The shipping center. It gathers simple molecules, combines them into complex ones, and packages them.', pos: [2.8, 1.4, -7.5], color: 0x84cc16, type: 'golgi', model: 'models/golgi.glb', modelScale: 0.4 },

  // Row 3: Human Anatomy & Systems (z: -11.5)
  { id: 'heart', title: 'Human Heart', desc: 'A muscular organ that pumps blood through the circulatory system, delivering oxygen and nutrients to your body.', pos: [-2.8, 1.4, -11.5], color: 0xef4444, type: 'heart', model: 'models/heart.glb', modelScale: 0.4 },
  { id: 'brain', title: 'Human Brain', desc: 'The complex organ that controls thought, memory, emotion, touch, motor skills, and regulates our body.', pos: [-1.2, 1.4, -11.5], color: 0xf472b6, type: 'brain', model: 'models/brain.glb', modelScale: 0.4 },
  { id: 'lungs', title: 'The Lungs', desc: 'A pair of spongy, air-filled organs. They bring oxygen into the bloodstream and remove carbon dioxide.', pos: [1.2, 1.4, -11.5], color: 0xfca5a5, type: 'lungs', model: 'models/lungs.glb', modelScale: 0.4 },
  { id: 'bone', title: 'Bones', desc: 'Bones provide structure, protect organs, and anchor muscles. This represents a human femur bone.', pos: [2.8, 1.4, -11.5], color: 0xfef08a, type: 'bone', model: 'models/bone.glb', modelScale: 0.4 }
];
