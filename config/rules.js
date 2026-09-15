module.exports = [
  {
    name: "mandatory_language",
    weight: 4,
    regex:
      /\b(shall|must|required|required to|shall not|must not|not permitted|not allowed|prohibited|mandatory)\b/i,
  },
  {
    name: "missing_or_uncertain_input",
    weight: 4,
    regex:
      /\b(TBD|pending|not yet|no dedicated|not currently available|not available|future campaign|future study|preliminary|assumed|assumption|to be inserted|to be confirmed|will be provided|further studies|under evaluation)\b/i,
  },
  {
    name: "pressure_temperature_depth",
    weight: 3,
    regex:
      /\b(design pressure|design temperature|shut[- ]?in pressure|wellhead pressure|water depth|installation depth|design life|service life|psi|psia|barg|bara|bar|°C|degrees C)\b/i,
  },
  {
    name: "flow_assurance_integrity",
    weight: 3,
    regex:
      /\b(hydrate|MEG|methanol|corrosion|corrosion allowance|CO2|CO₂|H2S|H₂S|scale|wax|inhibitor|13Cr|Super 13Cr|cathodic protection|erosion)\b/i,
  },
  {
    name: "subsea_equipment_interface",
    weight: 2,
    regex:
      /\b(HIPPS|Xmas Tree|Christmas Tree|flowline|pipeline|jumper|umbilical|FLET|UTA|SCM|manifold|subsea hub|control system|COPS)\b/i,
  },
  {
    name: "brownfield_interface",
    weight: 3,
    regex:
      /\b(existing|host facility|tie[- ]?back|integration|compatible|compatibility|reuse|re-use|repurposed|spare|shutdown|outage|Cluster|trunkline|brownfield)\b/i,
  },
  {
    name: "commercial_capacity_schedule",
    weight: 3,
    regex:
      /\b(debottlenecking|modification|capacity|flowrate|MMSCFD|lead time|schedule|cost|availability|uptime|work window)\b/i,
  },
  {
    name: "safety_regulatory",
    weight: 3,
    regex:
      /\b(HSE|HAZID|HAZOP|ESHIA|ALARP|regulation|regulatory|law|standard|code|ISO|API|classification society|environmental|discharge|flaring|venting|SIMOPS|CONOPS)\b/i,
  },
  {
    name: "acceptance_performance_limit",
    weight: 2,
    regex:
      /(≤|≥|<|>|\bmaximum\b|\bminimum\b|\bmax\b|\bmin\b|\blimit\b|\bspecification\b|\brated\b|\btarget\b|\bacceptance\b)/i,
  },
];
