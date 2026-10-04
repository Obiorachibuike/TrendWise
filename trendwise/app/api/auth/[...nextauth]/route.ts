import NextAuth from "next-auth";
import { authOptions } from "../../../lib/auth";

/**
 * Route handlers in the App Router may only export HTTP methods and a small set
 * of route-segment config fields — exporting `authOptions` from here makes
 * `next build` fail with "is not a valid Route export field". The options live
 * in app/lib/auth.ts so server components can also call getServerSession().
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
