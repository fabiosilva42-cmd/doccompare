import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";
import { useTranslation } from "@/i18n/LanguageProvider";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{t("notFound.hint")}</p>
          <Button asChild className="w-full">
            <Link to="/dashboard">{t("notFound.home")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
