"use client"
import { createAuthClient } from "better-auth/react"
import { useEffect, useState } from "react"
import { APP_BASE_PATH } from "@/lib/app-path"

const authBaseURL = typeof window !== "undefined"
  ? `${window.location.origin}${APP_BASE_PATH}`
  : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${APP_BASE_PATH}`;

export const authClient = createAuthClient({
   baseURL: authBaseURL,
  fetchOptions: {
      headers: {
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem("bearer_token") : ""}`,
      },
      onSuccess: (ctx) => {
          const authToken = ctx.response.headers.get("set-auth-token")
          // Store the token securely (e.g., in localStorage)
          if(authToken){
            // Split token at "." and take only the first part
            const tokenPart = authToken.includes('.') ? authToken.split('.')[0] : authToken;
            localStorage.setItem("bearer_token", tokenPart);
          }
      }
  }
});

type SessionData = ReturnType<typeof authClient.useSession>

export function useSession(): any {
   const [session, setSession] = useState<any>(null);
   const [isPending, setIsPending] = useState(true);
   const [isRefetching, setIsRefetching] = useState(false);
   const [error, setError] = useState<any>(null);

   const refetch = async () => {
      setIsRefetching(true);
      setError(null);
      await fetchSession();
      setIsRefetching(false);
   };

   const fetchSession = async () => {
      try {
         const res = await (authClient as any).getSession({
            fetchOptions: {
               auth: {
                  type: "Bearer",
                  token: typeof window !== 'undefined' ? localStorage.getItem("bearer_token") || "" : "",
               },
            },
         });
         setSession(res.data);
         setError(null);
      } catch (err) {
         setSession(null);
         setError(err);
      } finally {
         setIsPending(false);
      }
   };

   useEffect(() => {
      fetchSession();
   }, []);

   return { data: session, isPending, isRefetching, error, refetch };
}