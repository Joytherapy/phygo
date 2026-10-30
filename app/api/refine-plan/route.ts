// Not called by the app any more (it was the same prompt as
// /api/refine-exercises): kept reachable only through the same handler, so a
// direct request gets the same checks on the protocol and its diagnosis.
export { POST } from "../refine-exercises/route";
