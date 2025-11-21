import { Button } from "@/ui-kit";
import { Badge } from "@/ui-kit";
import { ArrowLeft, MessageCircle, Instagram } from "lucide-react";
import { SafeAvatar } from "@/components/ui/SafeAvatar";
import { truncateName } from "@/utils/formatters";
import { Blogger } from "@/types/blogger";
import { normalizeUsername } from "@/utils/username";
import { useTopics } from "@/hooks/useTopics";

interface BloggerProfileHeaderProps {
  blogger: Blogger;
  onBack: () => void;
}

export const BloggerProfileHeader = ({
  blogger,
  onBack,
}: BloggerProfileHeaderProps) => {
  const { getCategoryNameById } = useTopics();

  return (
    <div className="bg-card border-b border-border-light">
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />К списку блогеров
        </Button>

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between space-y-4 md:space-y-0 md:space-x-8">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 flex-1">
            <SafeAvatar
              src={blogger.avatar}
              alt={blogger.name}
              id={blogger.id}
              className="w-32 h-32 border-4 border-border-light mx-auto md:mx-0 aspect-square"
              username={normalizeUsername(blogger.handle)}
              gender={blogger.gender}
              fallbackIcon={
                <Instagram className="w-16 h-16 text-muted-foreground" />
              }
            />

            <div className="text-center md:text-left flex-1">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-3">
                <h1
                  className="text-3xl md:text-4xl font-bold text-foreground"
                  title={blogger.name}
                >
                  {truncateName(blogger.name, 40)}
                </h1>
              </div>

              <p className="text-lg text-muted-foreground mb-4 max-w-2xl">
                {blogger.promoText}
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <Badge variant="secondary">@{normalizeUsername(blogger.handle)}</Badge>
                {blogger.topics?.map((topicId) => (
                  <Badge key={topicId} variant="secondary">
                    {getCategoryNameById(topicId) ?? `Тематика ${topicId}`}
                  </Badge>
                ))}
                {!blogger.topics?.length && blogger.category && (
                  <Badge variant="secondary">{blogger.category}</Badge>
                )}
                {blogger.allowsBarter && <Badge variant="secondary">Бартер возможен</Badge>}
                {blogger.inMartRegistry && (
                  <Badge variant="secondary" className="text-success border-success">
                    В реестре МАРТ
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {blogger.contact_url && (
            <Button
              className="bg-gradient-primary hover:bg-primary-hover w-full md:w-auto mx-auto md:mx-0"
              onClick={() => window.open(blogger.contact_url, "_blank")}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Связаться
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
