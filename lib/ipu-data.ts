// lib/ipu-data.ts

export interface SubjectInfo {
  credits: number;
  maxMarks: number;
}

// ── IPU B.Tech Syllabus Data (Batch 2021-22 Onwards) ────────────────────────
export const IPU_SUBJECTS: Record<string, SubjectInfo> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // FIRST SEMESTER
  // ═══════════════════════════════════════════════════════════════════════════

  // Theory
  "ES101":  { credits: 3, maxMarks: 100 }, // Programming in 'C'
  "BS103":  { credits: 3, maxMarks: 100 }, // Applied Chemistry
  "BS121":  { credits: 3, maxMarks: 100 }, // Basic Chemistry (Alt)
  "BS105":  { credits: 3, maxMarks: 100 }, // Applied Physics - I
  "ES107":  { credits: 3, maxMarks: 100 }, // Electrical Science
  "BS109":  { credits: 3, maxMarks: 100 }, // Environmental Studies
  "BS111":  { credits: 3, maxMarks: 100 }, // Applied Mathematics - I
  "HS113":  { credits: 3, maxMarks: 100 }, // Communication Skills
  "HS115":  { credits: 2, maxMarks: 100 }, // Indian Constitution
  "HS117":  { credits: 2, maxMarks: 100 }, // Human Values and Ethics
  "ES119":  { credits: 3, maxMarks: 100 }, // Manufacturing Process

  // Practical
  "BS151":  { credits: 1, maxMarks: 100 }, // Physics-I Lab
  "ES153":  { credits: 1, maxMarks: 100 }, // Programming in 'C' Lab
  "BS155":  { credits: 1, maxMarks: 100 }, // Applied Chemistry Lab
  "ES157":  { credits: 1, maxMarks: 100 }, // Engineering Graphics-I
  "ES159":  { credits: 1, maxMarks: 100 }, // Electrical Science Lab
  "BS161":  { credits: 1, maxMarks: 100 }, // Environmental Studies Lab

  // Theory
  "ES102":  { credits: 3, maxMarks: 100 }, // Programming in 'C'
  "BS104":  { credits: 3, maxMarks: 100 }, // Applied Chemistry
  "BS120":  { credits: 3, maxMarks: 100 }, // Basic Chemistry (Alt)
  "BS106":  { credits: 3, maxMarks: 100 }, // Applied Physics - II
  "ES108":  { credits: 3, maxMarks: 100 }, // Electrical Science
  "BS110":  { credits: 3, maxMarks: 100 }, // Environmental Studies
  "BS112":  { credits: 3, maxMarks: 100 }, // Applied Mathematics - II
  "HS114":  { credits: 3, maxMarks: 100 }, // Communication Skills
  "HS116":  { credits: 2, maxMarks: 100 }, // Indian Constitution
  "HS118":  { credits: 1, maxMarks: 100 }, // Human Values and Ethics
  "ES114":  { credits: 3, maxMarks: 100 }, // Engineering Mechanics

  // Practical
  "BS152":  { credits: 1, maxMarks: 100 }, // Physics-II Lab
  "ES154":  { credits: 1, maxMarks: 100 }, // Programming in 'C' Lab
  "BS156":  { credits: 1, maxMarks: 100 }, // Applied Chemistry Lab
  "ES158":  { credits: 1, maxMarks: 100 }, // Engineering Graphics-II
  "ES160":  { credits: 1, maxMarks: 100 }, // Electrical Science Lab
  "BS162":  { credits: 1, maxMarks: 100 }, // Environmental Studies Lab
  "ES164":  { credits: 1, maxMarks: 100 }, // Workshop Practice 

  
  // Bridge courses (Lateral Entry, qualifying – not counted in CGPA)
  "BC181":  { credits: 0, maxMarks: 100 }, // Bridge Course in Mathematics
  "BC183":  { credits: 0, maxMarks: 100 }, // Bridge Course in Programming in C
 
  // ── NSS/NCC (evaluated end of Sem 6, NUES) ──────────────────────────────
  "HS352":  { credits: 2, maxMarks: 100 }, // NSS / NCC / Cultural Clubs
 
  // ═══════════════════════════════════════════════════════════════════════════
  // THIRD SEMESTER  (CSE / IT / CST / ITE and variants)
  // ═══════════════════════════════════════════════════════════════════════════
 
  // Theory
  "ES201":  { credits: 4, maxMarks: 100 }, // Computational Methods
  "HS203":  { credits: 2, maxMarks: 100 }, // Indian Knowledge System (NUES)
  "CIC205": { credits: 4, maxMarks: 100 }, // Discrete Mathematics
  "ECC207": { credits: 4, maxMarks: 100 }, // Digital Logic and Computer Design
  "CIC209": { credits: 4, maxMarks: 100 }, // Data Structures
  "CIC211": { credits: 4, maxMarks: 100 }, // Object-Oriented Programming using C++
 
  // Practical
  "ES251":  { credits: 1, maxMarks: 100 }, // Computational Methods Lab
  "ECC253": { credits: 1, maxMarks: 100 }, // Digital Logic and Computer Design Lab
  "CIC255": { credits: 1, maxMarks: 100 }, // Data Structures Lab
  "CIC257": { credits: 1, maxMarks: 100 }, // Object-Oriented Programming using C++ Lab
 
  // ─── ECE / EE / EEE – Third Semester ────────────────────────────────────
  "ECC201": { credits: 4, maxMarks: 100 }, // Network Analysis
  "ECC203": { credits: 4, maxMarks: 100 }, // Electronic Devices and Circuits
  "ECC205": { credits: 4, maxMarks: 100 }, // Signals and Systems
  "ECC209": { credits: 4, maxMarks: 100 }, // Electromagnetic Field Theory
  "ECC251": { credits: 1, maxMarks: 100 }, // Network Analysis Lab
  "ECC255": { credits: 1, maxMarks: 100 }, // Electronic Devices and Circuits Lab
  "ECC259": { credits: 1, maxMarks: 100 }, // Signals and Systems Lab
 
  // ─── ME – Third Semester ────────────────────────────────────────────────
  "MEC201": { credits: 4, maxMarks: 100 }, // Engineering Thermodynamics
  "MEC203": { credits: 4, maxMarks: 100 }, // Mechanics of Materials
  "MEC205": { credits: 4, maxMarks: 100 }, // Manufacturing Processes
  "MEC207": { credits: 4, maxMarks: 100 }, // Kinematics of Machines
  "MEC251": { credits: 1, maxMarks: 100 }, // Engineering Thermodynamics Lab
  "MEC253": { credits: 1, maxMarks: 100 }, // Mechanics of Materials Lab
  "MEC257": { credits: 1, maxMarks: 100 }, // Kinematics of Machines Lab
 
  // ─── CE – Third Semester ────────────────────────────────────────────────
  "CEC201": { credits: 4, maxMarks: 100 }, // Structural Analysis
  "CEC203": { credits: 4, maxMarks: 100 }, // Fluid Mechanics
  "CEC205": { credits: 4, maxMarks: 100 }, // Geotechnical Engineering
  "CEC207": { credits: 4, maxMarks: 100 }, // Surveying
  "CEC251": { credits: 1, maxMarks: 100 }, // Structural Analysis Lab
  "CEC253": { credits: 1, maxMarks: 100 }, // Fluid Mechanics Lab
  "CEC257": { credits: 1, maxMarks: 100 }, // Surveying Lab
 
  // ─── ICE – Third Semester ───────────────────────────────────────────────
  "ICC201": { credits: 4, maxMarks: 100 }, // Network Analysis
  "ICC203": { credits: 4, maxMarks: 100 }, // Electronic Devices and Circuits
  "ICC205": { credits: 4, maxMarks: 100 }, // Signals and Systems
  "ICC251": { credits: 1, maxMarks: 100 }, // Network Analysis Lab
  "ICC253": { credits: 1, maxMarks: 100 }, // Electronic Devices Lab
  "ICC259": { credits: 1, maxMarks: 100 }, // Signals and Systems Lab
 
  // ═══════════════════════════════════════════════════════════════════════════
  // FOURTH SEMESTER  (CSE / IT / CST / ITE and variants)
  // ═══════════════════════════════════════════════════════════════════════════
 
  // Theory
  "BS202":  { credits: 4, maxMarks: 100 }, // Probability, Statistics and Linear Programming
  "HS204":  { credits: 2, maxMarks: 100 }, // Technical Writing (NUES)
  "CIC206": { credits: 4, maxMarks: 100 }, // Theory of Computation
  "EEC208": { credits: 4, maxMarks: 100 }, // Circuits and Systems
  "CIC210": { credits: 4, maxMarks: 100 }, // Database Management Systems
  "CIC212": { credits: 4, maxMarks: 100 }, // Programming in Java
 
  // Practical
  "BS252":  { credits: 1, maxMarks: 100 }, // Probability, Statistics and LP Lab
  "EEC254": { credits: 1, maxMarks: 100 }, // Circuits and Systems Lab
  "CIC256": { credits: 1, maxMarks: 100 }, // Database Management Systems Lab
  "CIC258": { credits: 1, maxMarks: 100 }, // Programming in Java Lab
 
  // ─── ECE / EE / EEE – Fourth Semester ───────────────────────────────────
  "ECC202": { credits: 4, maxMarks: 100 }, // Analog Electronics
  "ECC204": { credits: 4, maxMarks: 100 }, // Digital Electronics
  "ECC206": { credits: 4, maxMarks: 100 }, // Control Systems
  "ECC208": { credits: 4, maxMarks: 100 }, // Communication Systems
  "ECC252": { credits: 1, maxMarks: 100 }, // Analog Electronics Lab
  "ECC254": { credits: 1, maxMarks: 100 }, // Digital Electronics Lab
  "ECC256": { credits: 1, maxMarks: 100 }, // Control Systems Lab
  "ECC258": { credits: 1, maxMarks: 100 }, // Communication Systems Lab
 
  // ─── EEC (Electrical Core) – Fourth Semester ────────────────────────────
  "EEC202": { credits: 4, maxMarks: 100 }, // Electrical Machines – I
  "EEC204": { credits: 4, maxMarks: 100 }, // Power Systems – I
  "EEC206": { credits: 4, maxMarks: 100 }, // Control Systems
  "EEC252": { credits: 1, maxMarks: 100 }, // Electrical Machines Lab
  "EEC256": { credits: 1, maxMarks: 100 }, // Control Systems Lab
 
  // ─── ME – Fourth Semester ───────────────────────────────────────────────
  "MEC202": { credits: 4, maxMarks: 100 }, // Dynamics of Machines
  "MEC204": { credits: 4, maxMarks: 100 }, // Heat Transfer
  "MEC206": { credits: 4, maxMarks: 100 }, // Fluid Mechanics and Machinery
  "MEC208": { credits: 4, maxMarks: 100 }, // Metrology and Quality Control
  "MEC252": { credits: 1, maxMarks: 100 }, // Dynamics of Machines Lab
  "MEC254": { credits: 1, maxMarks: 100 }, // Heat Transfer Lab
  "MEC256": { credits: 1, maxMarks: 100 }, // Fluid Mechanics Lab
 
  // ─── CE – Fourth Semester ───────────────────────────────────────────────
  "CEC202": { credits: 4, maxMarks: 100 }, // Structural Design
  "CEC204": { credits: 4, maxMarks: 100 }, // Hydraulics and Hydraulic Machines
  "CEC206": { credits: 4, maxMarks: 100 }, // Transportation Engineering
  "CEC208": { credits: 4, maxMarks: 100 }, // Environmental Engineering
  "CEC252": { credits: 1, maxMarks: 100 }, // Structural Design Lab
  "CEC254": { credits: 1, maxMarks: 100 }, // Hydraulics Lab
  "CEC258": { credits: 1, maxMarks: 100 }, // Environmental Engineering Lab
 
  // ─── ICE – Fourth Semester ──────────────────────────────────────────────
  "ICC202": { credits: 4, maxMarks: 100 }, // Analog Electronics
  "ICC204": { credits: 4, maxMarks: 100 }, // Control Systems
  "ICC206": { credits: 4, maxMarks: 100 }, // Digital Electronics
  "ICC252": { credits: 1, maxMarks: 100 }, // Analog Electronics Lab
  "ICC254": { credits: 1, maxMarks: 100 }, // Control Systems Lab
  "ICC256": { credits: 1, maxMarks: 100 }, // Digital Electronics Lab
 
  // ═══════════════════════════════════════════════════════════════════════════
  // FIFTH SEMESTER  (CSE / IT / CST / ITE and variants)
  // ═══════════════════════════════════════════════════════════════════════════
 
  // Theory
  "HS301":  { credits: 2, maxMarks: 100 }, // Economics for Engineers
  "CIC303": { credits: 3, maxMarks: 100 }, // Compiler Design
  "CIC305": { credits: 4, maxMarks: 100 }, // Operating Systems
  "CIC307": { credits: 4, maxMarks: 100 }, // Computer Networks
  "CIC309": { credits: 3, maxMarks: 100 }, // Software Engineering
  "CIC311": { credits: 4, maxMarks: 100 }, // Design and Analysis of Algorithm
 
  // Practical
  "CIC351": { credits: 1, maxMarks: 100 }, // Compiler Design Lab
  "CIC353": { credits: 1, maxMarks: 100 }, // Operating Systems Lab
  "CIC355": { credits: 1, maxMarks: 100 }, // Computer Networks Lab
  "CIC357": { credits: 1, maxMarks: 100 }, // Software Engineering Lab
  "CIC359": { credits: 1, maxMarks: 100 }, // Design and Analysis of Algorithm Lab
  "ES361":  { credits: 1, maxMarks: 100 }, // Summer Training Report – 1 (NUES)
 
  // ─── ECE – Fifth Semester ───────────────────────────────────────────────
  "ECC301": { credits: 4, maxMarks: 100 }, // Microprocessors and Microcontrollers
  "ECC303": { credits: 4, maxMarks: 100 }, // Digital Signal Processing
  "ECC305": { credits: 4, maxMarks: 100 }, // VLSI Design
  "ECC307": { credits: 4, maxMarks: 100 }, // Antenna and Wave Propagation
  "ECC351": { credits: 1, maxMarks: 100 }, // Microprocessors Lab
  "ECC353": { credits: 1, maxMarks: 100 }, // Digital Signal Processing Lab
  "ECC355": { credits: 1, maxMarks: 100 }, // VLSI Design Lab
 
  // ─── EE / EEE – Fifth Semester ──────────────────────────────────────────
  "EEC301": { credits: 4, maxMarks: 100 }, // Power Electronics
  "EEC303": { credits: 4, maxMarks: 100 }, // Electrical Machines – II
  "EEC305": { credits: 4, maxMarks: 100 }, // Power Systems – II
  "EEC351": { credits: 1, maxMarks: 100 }, // Power Electronics Lab
  "EEC353": { credits: 1, maxMarks: 100 }, // Electrical Machines – II Lab
 
  // ─── ME – Fifth Semester ────────────────────────────────────────────────
  "MEC301": { credits: 4, maxMarks: 100 }, // Design of Machine Elements
  "MEC303": { credits: 4, maxMarks: 100 }, // Industrial Engineering
  "MEC305": { credits: 4, maxMarks: 100 }, // Refrigeration and Air Conditioning
  "MEC351": { credits: 1, maxMarks: 100 }, // Design of Machine Elements Lab
  "MEC353": { credits: 1, maxMarks: 100 }, // Industrial Engineering Lab
  "MEC355": { credits: 1, maxMarks: 100 }, // Refrigeration and AC Lab
 
  // ─── CE – Fifth Semester ────────────────────────────────────────────────
  "CEC301": { credits: 4, maxMarks: 100 }, // Steel Structures Design
  "CEC303": { credits: 4, maxMarks: 100 }, // Water Resources Engineering
  "CEC305": { credits: 4, maxMarks: 100 }, // Foundation Engineering
  "CEC351": { credits: 1, maxMarks: 100 }, // Steel Design Lab
  "CEC353": { credits: 1, maxMarks: 100 }, // Water Resources Lab
  "CEC355": { credits: 1, maxMarks: 100 }, // Foundation Engineering Lab
 
  // ─── ICE – Fifth Semester ───────────────────────────────────────────────
  "ICC301": { credits: 4, maxMarks: 100 }, // Process Control
  "ICC303": { credits: 4, maxMarks: 100 }, // Industrial Instrumentation
  "ICC305": { credits: 4, maxMarks: 100 }, // Microprocessors and Microcontrollers
  "ICC351": { credits: 1, maxMarks: 100 }, // Process Control Lab
  "ICC353": { credits: 1, maxMarks: 100 }, // Industrial Instrumentation Lab
  "ICC355": { credits: 1, maxMarks: 100 }, // Microprocessors Lab
 
  // ═══════════════════════════════════════════════════════════════════════════
  // SIXTH SEMESTER  (all branches – fixed/common papers only)
  // PCE / EAE / OAE elective codes are institution-assigned; not listed here.
  // ═══════════════════════════════════════════════════════════════════════════
 
  "MS302":  { credits: 3, maxMarks: 100 }, // Principles of Management for Engineers
  "HS304":  { credits: 1, maxMarks: 100 }, // Universal Human Values (NUES)
  // HS-352 (NSS/NCC) evaluated at end of Sem 6 – already listed under Sem 1/2 above
 
  // ─── ECE – Sixth Semester ───────────────────────────────────────────────
  "ECC302": { credits: 4, maxMarks: 100 }, // Microwave Engineering
  "ECC304": { credits: 4, maxMarks: 100 }, // Wireless Communication
  "ECC306": { credits: 4, maxMarks: 100 }, // Embedded Systems
  "ECC352": { credits: 1, maxMarks: 100 }, // Microwave Engineering Lab
  "ECC354": { credits: 1, maxMarks: 100 }, // Wireless Communication Lab
  "ECC356": { credits: 1, maxMarks: 100 }, // Embedded Systems Lab
 
  // ─── EE / EEE – Sixth Semester ──────────────────────────────────────────
  "EEC302": { credits: 4, maxMarks: 100 }, // Switchgear and Protection
  "EEC304": { credits: 4, maxMarks: 100 }, // High Voltage Engineering
  "EEC306": { credits: 4, maxMarks: 100 }, // Electrical Drives
  "EEC352": { credits: 1, maxMarks: 100 }, // Switchgear Lab
  "EEC356": { credits: 1, maxMarks: 100 }, // Electrical Drives Lab
 
  // ─── ME – Sixth Semester ────────────────────────────────────────────────
  "MEC302": { credits: 4, maxMarks: 100 }, // Computer Aided Design and Manufacturing
  "MEC304": { credits: 4, maxMarks: 100 }, // Operations Research
  "MEC306": { credits: 4, maxMarks: 100 }, // Automobile Engineering
  "MEC352": { credits: 1, maxMarks: 100 }, // CAD/CAM Lab
  "MEC354": { credits: 1, maxMarks: 100 }, // Operations Research Lab
 
  // ─── CE – Sixth Semester ────────────────────────────────────────────────
  "CEC302": { credits: 4, maxMarks: 100 }, // Construction Technology and Management
  "CEC304": { credits: 4, maxMarks: 100 }, // Quantity Surveying
  "CEC306": { credits: 4, maxMarks: 100 }, // Remote Sensing and GIS
  "CEC352": { credits: 1, maxMarks: 100 }, // Construction Technology Lab
  "CEC356": { credits: 1, maxMarks: 100 }, // Remote Sensing Lab
 
  // ─── ICE – Sixth Semester ───────────────────────────────────────────────
  "ICC302": { credits: 4, maxMarks: 100 }, // Digital Control Systems
  "ICC304": { credits: 4, maxMarks: 100 }, // Biomedical Instrumentation
  "ICC306": { credits: 4, maxMarks: 100 }, // VLSI Design
  "ICC352": { credits: 1, maxMarks: 100 }, // Digital Control Systems Lab
  "ICC354": { credits: 1, maxMarks: 100 }, // Biomedical Instrumentation Lab
 
  // ═══════════════════════════════════════════════════════════════════════════
  // SEVENTH SEMESTER  (all branches – fixed/common papers only)
  // PCE / EAE / OAE codes are institution-assigned; elective theory = 4 credits each
  // ═══════════════════════════════════════════════════════════════════════════
 
  "MS401":  { credits: 2, maxMarks: 100 }, // Principles of Entrepreneurship Mindset
  "ES451":  { credits: 3, maxMarks: 100 }, // Minor Project
  "ES453":  { credits: 1, maxMarks: 100 }, // Summer Training Report – 2 (NUES)
 
  // ═══════════════════════════════════════════════════════════════════════════
  // EIGHTH SEMESTER  (all branches – fixed/common papers only)
  // PCE / EAE / OAE codes are institution-assigned; elective theory = 4 credits each
  // ═══════════════════════════════════════════════════════════════════════════
 
  "ES452":  { credits: 10, maxMarks: 100 }, // Major Project (dissertation)
  "ES454":  { credits:  1, maxMarks: 100 }, // Seminar
 
  // ═══════════════════════════════════════════════════════════════════════════
  // PROGRAMME CORE ELECTIVES  (PCE) – CSE / IT  (Sem 6 / 7)
  // Credits: 4 each (theory) + 1 each (lab, if applicable)
  // ═══════════════════════════════════════════════════════════════════════════
 
  // -- CSE/IT PCE slot papers (representative; institution may choose subset) -
  "CIC-PCE-ML":   { credits: 4, maxMarks: 100 }, // Machine Learning
  "CIC-PCE-AI":   { credits: 4, maxMarks: 100 }, // Artificial Intelligence
  "CIC-PCE-NLP":  { credits: 4, maxMarks: 100 }, // Natural Language Processing
  "CIC-PCE-IS":   { credits: 4, maxMarks: 100 }, // Information Security
  "CIC-PCE-CC":   { credits: 4, maxMarks: 100 }, // Cloud Computing
  "CIC-PCE-IOT":  { credits: 4, maxMarks: 100 }, // Internet of Things
  "CIC-PCE-BD":   { credits: 4, maxMarks: 100 }, // Big Data Analytics
  "CIC-PCE-WD":   { credits: 4, maxMarks: 100 }, // Web Development
  "CIC-PCE-MC":   { credits: 4, maxMarks: 100 }, // Mobile Computing
  "CIC-PCE-DIP":  { credits: 4, maxMarks: 100 }, // Digital Image Processing
  "CIC-PCE-PPL":  { credits: 4, maxMarks: 100 }, // Principles of Programming Languages
  "CIC-PCE-SPM":  { credits: 4, maxMarks: 100 }, // Software Project Management
  "CIC-PCE-DS":   { credits: 4, maxMarks: 100 }, // Distributed Systems
  "CIC-PCE-BC":   { credits: 4, maxMarks: 100 }, // Blockchain Technology
  "CIC-PCE-CV":   { credits: 4, maxMarks: 100 }, // Computer Vision
  "CIC-PCE-RL":   { credits: 4, maxMarks: 100 }, // Reinforcement Learning
};

// ── Normalize code: strip hyphens, uppercase ─────────────────────────────────
// The portal sends codes like "ES101" or "ES-101" inconsistently.
function normalize(code: string): string {
  return code.replace(/-/g, "").toUpperCase().trim();
}

// ── Public Lookup Functions ───────────────────────────────────────────────────
export function getSubjectInfo(code: string, name: string): SubjectInfo {
  const key = normalize(code);
  if (IPU_SUBJECTS[key]) return IPU_SUBJECTS[key];

  // Unknown code — return 0 credits so it shows as AUDIT
  console.warn(`[ipu-data] Unknown subject code: "${code}" (${name}) — treating as 0 credits`);
  return { credits: 0, maxMarks: 100 };
}

export function getCredits(code: string, name: string): number {
  return getSubjectInfo(code, name).credits;
}

export function getMaxMarks(code: string, name: string): number {
  return getSubjectInfo(code, name).maxMarks;
}