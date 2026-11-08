// The finalized design (Emote — Journal Page Concepts mockups) uses a plain
// serif "Emote" wordmark with no icon mark anywhere — sign-in, landing, and
// the in-app nav all show text only. Kept as a component (returning null) so
// call sites that render `<Logo /> <span>Emote</span>` don't need touching.
export default function Logo() {
  return null;
}
