// The hint: a short English word for the front of the card.
// It uses the first meaning in `en` and drops notes in brackets.
// Example: "grandma (dad's mom)" → "grandma", "Mr.; husband" → "Mr.".
// The full meaning stays on the answer side.
export function hintText(en) {
  const first = en.split(/;| \/ /)[0];
  const short = first.replace(/\s*\([^)]*\)/g, '').trim();
  return short || en.trim();
}
