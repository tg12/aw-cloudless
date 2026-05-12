import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { defaultLocale, isSupportedLocale } from "@/lib/i18n";

interface AdminRedirectPageProps {
  params: { slug?: string[] };
}

export default function AdminRedirectPage({ params }: AdminRedirectPageProps) {
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value;
  const locale =
    cookieLocale && isSupportedLocale(cookieLocale)
      ? cookieLocale
      : defaultLocale;

  const path = params.slug?.join("/") ?? "";
  const destination = `/${locale}/admin${path ? `/${path}` : ""}`;

  redirect(destination);
}
