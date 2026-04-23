import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes REQUIRE login
const isProtectedRoute = createRouteMatcher([
  "/portfolio(.*)",
  "/api/scrape(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect(); // This forces a navigation/redirect
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
