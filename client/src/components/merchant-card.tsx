import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Merchant, type BadgePreset } from "@shared/schema";
import { useCategoryEmojis } from "@/hooks/use-category-emojis";
import { useCountryEmojis } from "@/hooks/use-country-emojis";
import { Zap, Clock, Copy, Check, Heart, Bookmark, Upload, X as XIcon, Mail, ExternalLink, MessageSquare, ChevronUp, ChevronDown } from "lucide-react";
import BitcoinLogo from "@/components/bitcoin-logo";
import { useRef, useEffect, useState, memo, useCallback } from "react";
import { useComments, useSubmitComment, useDeleteComment, useIsAdmin, useMerchantRating, useMyComment, useMasterPubkey } from "@/hooks/use-comments";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

/* ── Minimal brand-icon SVGs ── */
function IconX() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
function IconReddit() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}
import { Link } from "wouter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNostr } from "@/context/NostrContext";

const COUNTRY_EMOJI_MAP: Record<string, string> = {
  "USA": "🇺🇸", "United States": "🇺🇸", "Canada": "🇨🇦", "Sweden": "🇸🇪",
  "UK": "🇬🇧", "United Kingdom": "🇬🇧", "Germany": "🇩🇪", "Japan": "🇯🇵",
  "Portugal": "🇵🇹", "Netherlands": "🇳🇱", "Worldwide": "🌍", "Europe": "🇪🇺",
  "Australia": "🇦🇺", "El Salvador": "🇸🇻", "South Africa": "🇿🇦", "Italy": "🇮🇹",
  "France": "🇫🇷", "Spain": "🇪🇸", "Brazil": "🇧🇷", "Mexico": "🇲🇽",
  "Colombia": "🇨🇴", "Columbia": "🇨🇴", "Argentina": "🇦🇷", "India": "🇮🇳",
  "China": "🇨🇳", "South Korea": "🇰🇷", "Singapore": "🇸🇬", "Thailand": "🇹🇭",
  "Vietnam": "🇻🇳", "Indonesia": "🇮🇩", "Philippines": "🇵🇭", "Malaysia": "🇲🇾",
  "New Zealand": "🇳🇿", "Ireland": "🇮🇪", "Switzerland": "🇨🇭", "Austria": "🇦🇹",
  "Belgium": "🇧🇪", "Denmark": "🇩🇰", "Finland": "🇫🇮", "Norway": "🇳🇴",
  "Poland": "🇵🇱", "Czech Republic": "🇨🇿", "Romania": "🇷🇴", "Greece": "🇬🇷",
  "Turkey": "🇹🇷", "Israel": "🇮🇱", "United Arab Emirates": "🇦🇪", "UAE": "🇦🇪",
  "Saudi Arabia": "🇸🇦", "Nigeria": "🇳🇬", "Kenya": "🇰🇪", "Egypt": "🇪🇬",
  "Morocco": "🇲🇦", "Chile": "🇨🇱", "Peru": "🇵🇪", "Costa Rica": "🇨🇷",
  "Panama": "🇵🇦", "Lithuania": "🇱🇹", "Latvia": "🇱🇻", "Estonia": "🇪🇪",
  "Monaco": "🇲🇨", "Curacao": "🇨🇼", "Curacoa": "🇨🇼", "Iceland": "🇮🇸",
  "Luxembourg": "🇱🇺", "Malta": "🇲🇹", "Croatia": "🇭🇷", "Hungary": "🇭🇺",
  "Slovakia": "🇸🇰", "Slovenia": "🇸🇮", "Bulgaria": "🇧🇬", "Serbia": "🇷🇸",
  "Ukraine": "🇺🇦", "Taiwan": "🇹🇼", "Hong Kong": "🇭🇰", "Pakistan": "🇵🇰",
  "Bangladesh": "🇧🇩", "Sri Lanka": "🇱🇰", "Uruguay": "🇺🇾", "Paraguay": "🇵🇾",
  "Ecuador": "🇪🇨", "Bolivia": "🇧🇴", "Venezuela": "🇻🇪", "Dominican Republic": "🇩🇴",
  "Jamaica": "🇯🇲", "Trinidad and Tobago": "🇹🇹", "Guatemala": "🇬🇹", "Honduras": "🇭🇳",
  "Nicaragua": "🇳🇮", "Cuba": "🇨🇺", "Puerto Rico": "🇵🇷", "Ghana": "🇬🇭",
  "Ethiopia": "🇪🇹", "Tanzania": "🇹🇿", "Uganda": "🇺🇬", "Mozambique": "🇲🇿",
  "Zambia": "🇿🇲", "Zimbabwe": "🇿🇼", "Botswana": "🇧🇼", "Namibia": "🇳🇦",
  "Rwanda": "🇷🇼", "Senegal": "🇸🇳", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
};


const BADGE_STYLE_MAP: Record<string, string> = {
  green: "bg-green-500 text-white",
  gold: "bg-yellow-500 text-black",
  red: "bg-red-500 text-white",
  orange: "bg-orange-500 text-white",
  blue: "bg-blue-500 text-white",
  purple: "bg-purple-500 text-white",
};

function renderBadge(text: string, style: string) {
  if (style === "rainbow") {
    return (
      <span className="shrink-0 text-[11px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide animate-rainbow"
        style={{ background: "linear-gradient(90deg, #ff0000, #ff8800, #00ff00, #0088ff, #8800ff, #ff0088, #ff0000)", backgroundSize: "200% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        {text}
      </span>
    );
  }
  const cls = BADGE_STYLE_MAP[style] || BADGE_STYLE_MAP.green;
  return <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${cls}`}>{text}</span>;
}

interface MerchantCardProps {
  merchant: Merchant;
  expanded: boolean;
  onToggleExpand: () => void;
  scrollIntoView?: boolean;
  onScrolledIntoView?: () => void;
  badgePresets?: BadgePreset[];
}

export default memo(function MerchantCard({ merchant, expanded, onToggleExpand, scrollIntoView, onScrolledIntoView, badgePresets }: MerchantCardProps) {
  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { getCategoryWithEmoji } = useCategoryEmojis();
  const { getCountryEmoji } = useCountryEmojis();
  const { user, favourites, toggleFavourite, lists, toggleListMember, openLoginModal, likeCounts, fetchLikeCount, saveCounts, fetchSaveCount, publishEvent } = useNostr();
  const isAdmin = useIsAdmin();
  const masterPubkey = useMasterPubkey();
  const { data: commentsList = [], isLoading: commentsLoading } = useComments(merchant.id, expanded);
  const { data: ratingData } = useMerchantRating(merchant.id);
  const { data: myComment } = useMyComment(merchant.id, !!user && expanded);
  const submitComment = useSubmitComment(merchant.id);
  const deleteComment = useDeleteComment(merchant.id);

  // Pre-fill forms from the user's existing record when the card expands
  useEffect(() => {
    if (!expanded) return;
    setCommentBody(myComment?.body ?? "");
    setReviewRating(myComment?.rating ?? null);
    setReviewNote("");
  }, [expanded, myComment]);

  const publishToNostr = useCallback(async (body: string, rating: number | null) => {
    if (!user || !merchant.nostrEventId) return;
    try {
      const dTag = slugify(merchant.name);
      const tags: string[][] = [
        ['K', '30402'], ['k', '30402'],
        ['E', merchant.nostrEventId], ['e', merchant.nostrEventId],
      ];
      if (masterPubkey) {
        tags.push(['A', `30402:${masterPubkey}:${dTag}`]);
        tags.push(['a', `30402:${masterPubkey}:${dTag}`]);
      }
      if (rating) tags.push(['rating', String(rating)]);
      await publishEvent({ kind: 1111, created_at: Math.floor(Date.now() / 1000), tags, content: body });
    } catch (err) {
      console.warn('[nostr] Failed to publish comment event:', err);
    }
  }, [user, merchant.nostrEventId, merchant.name, masterPubkey, publishEvent]);

  const handleCommentSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    // Preserve existing rating when updating the comment text
    const existingRating = myComment?.rating ?? null;
    await submitComment.mutateAsync({ body: commentBody, rating: existingRating });
    await publishToNostr(commentBody, existingRating);
  }, [commentBody, myComment, submitComment, publishToNostr]);

  const handleReviewSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRating) return;
    // Preserve existing body text when updating the star rating
    const existingBody = myComment?.body?.trim() || '';
    await submitComment.mutateAsync({ body: existingBody, rating: reviewRating });
    await publishToNostr(reviewNote || existingBody, reviewRating);
  }, [reviewRating, reviewNote, myComment, submitComment, publishToNostr]);

  // Reset panels when card collapses
  useEffect(() => {
    if (!expanded) { setShowComments(false); setShowReviews(false); }
  }, [expanded]);

  useEffect(() => {
    if (expanded && scrollIntoView && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        onScrolledIntoView?.();
      }, 300);
    }
  }, [expanded, scrollIntoView, onScrolledIntoView]);

  // Fetch public like + save counts lazily when the card is expanded
  useEffect(() => {
    if (expanded && !likeCounts.has(merchant.website)) fetchLikeCount(merchant.website);
    if (expanded && !saveCounts.has(merchant.website)) fetchSaveCount(merchant.website);
  }, [expanded, merchant.website, likeCounts, fetchLikeCount, saveCounts, fetchSaveCount]);

  const merchantUrl = `${window.location.origin}/merchant/${slugify(merchant.name)}`;

  const shippingText = merchant.shippingCountries.length > 0
    ? merchant.shippingCountries.some(c => c.toLowerCase().includes("worldwide"))
      ? "🌍 Worldwide availability"
      : merchant.shippingCountries.map(c => {
          const pureCountry = c.replace(/[^\w\s]/gi, '').trim();
          const hasEmoji = /\p{Emoji}/u.test(c);
          return hasEmoji ? c : `${getCountryEmoji(pureCountry)} ${c}`;
        }).slice(0, 2).join(", ") + (merchant.shippingCountries.length > 2 ? "..." : "") + " availability"
    : null;

  return (
    <div
      ref={cardRef}
      className="relative w-full bg-white dark:bg-card border border-border dark:border-border/80 hover:border-primary/30 rounded-lg transition-all duration-200 cursor-pointer group overflow-hidden"
      onClick={onToggleExpand}
      data-testid={`card-merchant-${merchant.id}`}
    >
      <div className="flex items-center gap-3 md:gap-4 p-4 md:p-4">
        <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-lg flex items-center justify-center overflow-hidden border-2 border-border bg-white dark:bg-muted">
          {(merchant.logo.startsWith("/") || merchant.logo.startsWith("http")) ? (
            <img
              src={merchant.logo}
              alt={merchant.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-xl">{merchant.logo}</span>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm md:text-base truncate">{merchant.name}</h3>
            {!expanded && ratingData && ratingData.count > 0 && (
              <span className="shrink-0 flex items-center gap-0.5 text-[11px] font-semibold text-amber-500 leading-none">
                <span>★</span>
                <span>{ratingData.average.toFixed(1)}</span>
                <span className="text-muted-foreground font-normal ml-0.5">({ratingData.count})</span>
              </span>
            )}
            {merchant.onchainSupported && (
              <BitcoinLogo className="h-3.5 w-3.5" spin />
            )}
            {merchant.lightningSupported && (
              <span className="shrink-0 flex items-center gap-0">
                <Zap className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 animate-lightning-zap drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] dark:drop-shadow-none" />
                {merchant.name === "Obscura VPN" && (
                  <img src="/assets/firedone.apng" alt="" className="h-5 object-contain" style={{ marginLeft: "-2px", marginTop: "-3px" }} />
                )}
              </span>
            )}
            {merchant.cashuSupported && (
              <span className="shrink-0 text-xs leading-none animate-nut-wobble inline-block" title="Cashu">🥜</span>
            )}
            {merchant.liquidSupported && (
              <span className="shrink-0 text-xs leading-none animate-liquid-drip inline-block" title="Liquid">💧</span>
            )}
            {merchant.bitcoinDiscount ? (() => {
              const preset = badgePresets?.find(p => p.label.toLowerCase() === merchant.bitcoinDiscount!.toLowerCase());
              const style = preset ? preset.style : (merchant.bitcoinDiscount.toUpperCase() === "NEW" ? "rainbow" : "green");
              return renderBadge(merchant.bitcoinDiscount, style);
            })() : null}
          </div>
          {!expanded && <p className="text-xs md:text-sm text-muted-foreground truncate">{merchant.description}</p>}
          {!expanded && (
            <div className="flex items-center gap-2">
              {shippingText && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                  {shippingText}
                </Badge>
              )}
              <div className="flex md:hidden items-center gap-1.5">
                {merchant.categories.slice(0, 1).map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-[10px] py-0 px-1.5">
                    {getCategoryWithEmoji(cat)}
                  </Badge>
                ))}
              </div>
              <div className="hidden md:flex items-center gap-1.5">
                {merchant.categories.slice(0, 2).map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-[10px] py-0 px-1.5">
                    {getCategoryWithEmoji(cat)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 self-start mt-1 hidden md:flex items-center px-1">
          {expanded
            ? <ChevronDown className="h-5 w-5 text-muted-foreground/40" />
            : <ChevronUp className="h-5 w-5 text-muted-foreground/40" />
          }
        </div>
      </div>

      {/* Footer row — social buttons always on desktop; full row (Visit+social) when expanded */}
      <div
        className={`border-t border-border/40 px-3 md:px-4 pt-2 pb-2${!expanded ? ' hidden md:block' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-0`}>
          {expanded && (
            <div className="sm:flex-1 sm:flex sm:justify-center">
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto self-start" data-testid={`link-visit-${merchant.id}`}>
                <a href={merchant.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" /> Visit website
                </a>
              </Button>
            </div>
          )}
          <div className={`flex items-center w-full sm:gap-0${expanded ? ' sm:flex-[5]' : ''}`}>
            <div className="flex-1 flex justify-center">
              <button
                onClick={() => { setShowComments(v => !v); setShowReviews(false); }}
                data-testid={`button-comments-${merchant.id}`}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-muted ${showComments ? "text-blue-500" : "text-muted-foreground"}`}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs tabular-nums">{commentsList.length}</span>
              </button>
            </div>
            <div className="flex-1 flex justify-center">
              <button
                onClick={() => { setShowReviews(v => !v); setShowComments(false); }}
                data-testid={`button-reviews-${merchant.id}`}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-muted ${showReviews ? "text-amber-500" : "text-muted-foreground"}`}
              >
                <span className={`text-base leading-none ${showReviews ? "text-amber-400" : "text-muted-foreground"}`}>★</span>
                {ratingData && ratingData.count > 0
                  ? <span className="text-xs tabular-nums">{ratingData.average.toFixed(1)}</span>
                  : <span className="text-xs font-semibold tracking-wide">NEW</span>
                }
              </button>
            </div>
            <div className="flex-1 flex justify-center">
              <button
                onClick={() => toggleFavourite(merchant.website)}
                data-testid={`button-favourite-${merchant.id}`}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-muted ${user && favourites.has(merchant.website) ? "text-red-500" : "text-muted-foreground"}`}
              >
                <Heart className={`h-4 w-4 ${user && favourites.has(merchant.website) ? "fill-current" : ""}`} />
                <span className="text-xs tabular-nums">{likeCounts.get(merchant.website) ?? 0}</span>
              </button>
            </div>
            <div className="flex-1 flex justify-center">
              {!user ? (
                <button
                  onClick={openLoginModal}
                  data-testid={`button-add-to-list-${merchant.id}`}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Bookmark className="h-4 w-4" />
                  <span className="text-xs tabular-nums">{saveCounts.get(merchant.website) ?? 0}</span>
                </button>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      data-testid={`button-add-to-list-${merchant.id}`}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-muted ${lists.some(l => l.urls.includes(merchant.website)) ? "text-blue-500" : "text-muted-foreground"}`}
                    >
                      <Bookmark className={`h-4 w-4 ${lists.some(l => l.urls.includes(merchant.website)) ? "fill-current" : ""}`} />
                      <span className="text-xs tabular-nums">{saveCounts.get(merchant.website) ?? 0}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-2" align="start">
                    {lists.length === 0 ? (
                      <div className="py-2 text-center space-y-1">
                        <p className="text-xs text-muted-foreground">No lists yet.</p>
                        <Link href="/lists" className="text-xs text-primary hover:underline">Create a list</Link>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5 px-1">Save to list</p>
                        {lists.map(list => {
                          const inList = list.urls.includes(merchant.website);
                          return (
                            <button
                              key={list.dTag}
                              type="button"
                              onClick={() => toggleListMember(list.dTag, merchant.website, inList)}
                              className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                              data-testid={`button-toggle-list-${list.dTag}-${merchant.id}`}
                            >
                              <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${inList ? "bg-primary border-primary" : "border-input"}`}>
                                {inList && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                              </div>
                              <span className="truncate text-left">{list.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <div className="flex-1 flex justify-center">
              <button
                onClick={() => setShowShare(true)}
                data-testid={`button-share-${merchant.id}`}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                <Upload className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/30 px-3 md:px-4 py-4 space-y-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-muted-foreground">{merchant.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {merchant.categories.length > 0 && (
              <div className="space-y-1">
                <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Category</span>
                <div className="flex flex-col gap-1 text-foreground">
                  {merchant.categories.map(cat => (
                    <span key={cat}>{getCategoryWithEmoji(cat)}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Payment</span>
              <div className="flex flex-col gap-1 text-foreground">
                {merchant.onchainSupported && (
                  <span className="flex items-center gap-1 text-orange-500">
                    <BitcoinLogo className="h-3 w-3" spin /> On-Chain
                  </span>
                )}
                {merchant.lightningSupported && (
                  <span className="flex items-center gap-1 text-yellow-500">
                    <Zap className="h-3 w-3 fill-current animate-lightning-zap" /> Lightning
                  </span>
                )}
                {merchant.cashuSupported && (
                  <span className="flex items-center gap-1">
                    <span className="animate-nut-wobble inline-block">🥜</span> Cashu
                  </span>
                )}
                {merchant.liquidSupported && (
                  <span className="flex items-center gap-1">
                    <span className="animate-liquid-drip inline-block">💧</span> Liquid
                  </span>
                )}
              </div>
            </div>

            {merchant.shippingCountries.length > 0 && (
              <div className="space-y-1">
                <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Availability</span>
                <div className="flex flex-col gap-1 text-foreground">
                  {merchant.shippingCountries.some(c => c.toLowerCase().includes("worldwide"))
                    ? <span>🌍 Worldwide</span>
                    : merchant.shippingCountries.map(c => {
                        const pureCountry = c.replace(/[^\w\s]/gi, '').trim();
                        const hasEmoji = /\p{Emoji}/u.test(c);
                        return <span key={c}>{hasEmoji ? c : `${getCountryEmoji(pureCountry)} ${c}`}</span>;
                      })}
                </div>
              </div>
            )}

            {merchant.countryMadeIn && (
              <div className="space-y-1">
                <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Made in</span>
                <p className="text-foreground">{(() => { const hasEmoji = /\p{Emoji}/u.test(merchant.countryMadeIn); const pure = merchant.countryMadeIn.replace(/[^\w\s]/gi, '').trim(); return hasEmoji ? merchant.countryMadeIn : `${getCountryEmoji(pure)} ${merchant.countryMadeIn}`; })()}</p>
              </div>
            )}

            {merchant.paymentProvider && (
              <div className="space-y-1">
                <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Provider</span>
                <p className="text-foreground">{merchant.paymentProvider}</p>
              </div>
            )}

            {merchant.lastSurveyed && (
              <div className="space-y-1">
                <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Last Surveyed</span>
                <p className="text-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(merchant.lastSurveyed).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            )}

          </div>

          {/* ── Comments panel ───────────────────────────────────────────── */}
          {showComments && <div className="border-t border-border/30 pt-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Comments{commentsList.length > 0 && ` · ${commentsList.length}`}
            </p>

            {commentsLoading && <p className="text-xs text-muted-foreground">Loading…</p>}

            {!commentsLoading && commentsList.length > 0 && (
              <div className="space-y-3">
                {commentsList.filter(c => c.body?.trim()).map(c => (
                  <div key={c.id} className="flex gap-2 group/comment">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-bold text-muted-foreground uppercase">
                      {c.authorName.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold">{c.authorName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        {isAdmin && (
                          <button
                            className="ml-auto opacity-0 group-hover/comment:opacity-100 transition-opacity text-muted-foreground hover:text-destructive text-[10px]"
                            onClick={() => deleteComment.mutate(c.id)}
                            title="Delete comment"
                          >Delete</button>
                        )}
                      </div>
                      <p className="text-xs text-foreground/90 mt-0.5 break-words">{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!commentsLoading && commentsList.filter(c => c.body?.trim()).length === 0 && (
              <p className="text-xs text-muted-foreground">No comments yet. Be the first!</p>
            )}

            {user ? (
              <form onSubmit={handleCommentSubmit} className="space-y-2">
                <Textarea
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  placeholder="Share your thoughts on this merchant…"
                  className="text-xs min-h-[60px] resize-none"
                  maxLength={1000}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{commentBody.length}/1000</span>
                  <Button type="submit" size="sm" disabled={!commentBody.trim() || submitComment.isPending} className="h-7 text-xs">
                    {submitComment.isPending ? "Posting…" : (myComment?.body ? "Update" : "Post comment")}
                  </Button>
                </div>
              </form>
            ) : (
              <button className="text-xs text-primary hover:underline" onClick={openLoginModal}>
                Sign in to leave a comment
              </button>
            )}
          </div>}

          {/* ── Reviews panel ────────────────────────────────────────────── */}
          {showReviews && <div className="border-t border-border/30 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Reviews{ratingData && ratingData.count > 0 && ` · ${ratingData.count}`}
              </p>
              {ratingData && ratingData.count > 0 && (
                <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                  <span>★</span>
                  <span>{ratingData.average.toFixed(1)}</span>
                  <span className="text-muted-foreground font-normal text-xs">/ 5</span>
                </span>
              )}
            </div>

            {commentsLoading && <p className="text-xs text-muted-foreground">Loading…</p>}

            {!commentsLoading && commentsList.filter(c => c.rating != null).length > 0 && (
              <div className="space-y-3">
                {commentsList.filter(c => c.rating != null).map(c => (
                  <div key={c.id} className="flex gap-2 group/comment">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-bold text-muted-foreground uppercase">
                      {c.authorName.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold">{c.authorName}</span>
                        <span className="flex items-center gap-0.5 text-amber-400 text-[11px] leading-none">
                          {[1,2,3,4,5].map(s => (
                            <span key={s} className={s <= c.rating! ? "text-amber-400" : "text-muted-foreground/30"}>★</span>
                          ))}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        {isAdmin && (
                          <button
                            className="ml-auto opacity-0 group-hover/comment:opacity-100 transition-opacity text-muted-foreground hover:text-destructive text-[10px]"
                            onClick={() => deleteComment.mutate(c.id)}
                            title="Delete review"
                          >Delete</button>
                        )}
                      </div>
                      {c.body?.trim() && <p className="text-xs text-foreground/90 mt-0.5 break-words">{c.body}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!commentsLoading && commentsList.filter(c => c.rating != null).length === 0 && (
              <p className="text-xs text-muted-foreground">No reviews yet. Be the first to rate this merchant!</p>
            )}

            {user ? (
              <form onSubmit={handleReviewSubmit} className="space-y-2">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-muted-foreground mr-1">Your rating:</span>
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`text-xl leading-none transition-colors ${
                        (hoverRating ?? reviewRating ?? 0) >= star ? "text-amber-400" : "text-muted-foreground/30 hover:text-amber-300"
                      }`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setReviewRating(reviewRating === star ? null : star)}
                      title={`${star} star${star > 1 ? "s" : ""}`}
                    >★</button>
                  ))}
                  {reviewRating && <span className="text-[10px] text-muted-foreground ml-1">{reviewRating}/5</span>}
                </div>
                <Textarea
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Optional: add a note about your rating…"
                  className="text-xs min-h-[48px] resize-none"
                  maxLength={500}
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={!reviewRating || submitComment.isPending} className="h-7 text-xs">
                    {submitComment.isPending ? "Saving…" : (myComment?.rating ? "Update rating" : "Submit rating")}
                  </Button>
                </div>
              </form>
            ) : (
              <button className="text-xs text-primary hover:underline" onClick={openLoginModal}>
                Sign in to leave a review
              </button>
            )}
          </div>}
        </div>
      )}

      {/* Share overlay */}
      {showShare && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg"
          onClick={(e) => { e.stopPropagation(); setShowShare(false); }}
        >
          <div
            className="bg-card rounded-lg p-5 w-full h-full flex flex-col justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-sm">Share {merchant.name}</p>
              <button
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
                onClick={() => setShowShare(false)}
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* QR code */}
              <div className="flex justify-center shrink-0">
                <div className="p-2 bg-white rounded-lg border border-border">
                  <QRCodeSVG value={merchantUrl} size={100} bgColor="#ffffff" fgColor="#000000" />
                </div>
              </div>

              {/* Right side: icons + copy */}
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                {/* Social icons — scrollable row */}
                <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    { label: "X",        icon: <IconX />,                   bg: "bg-black",                      href: `https://twitter.com/intent/tweet?text=Check+out+${encodeURIComponent(merchant.name)}&url=${encodeURIComponent(merchantUrl)}` },
                    { label: "WhatsApp", icon: <IconWhatsApp />,             bg: "bg-[#25D366]",                  href: `https://wa.me/?text=${encodeURIComponent(merchant.name + ' ' + merchantUrl)}` },
                    { label: "Facebook", icon: <IconFacebook />,             bg: "bg-[#1877F2]",                  href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(merchantUrl)}` },
                    { label: "LinkedIn", icon: <IconLinkedIn />,             bg: "bg-[#0A66C2]",                  href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(merchantUrl)}` },
                    { label: "Reddit",   icon: <IconReddit />,               bg: "bg-[#FF4500]",                  href: `https://reddit.com/submit?url=${encodeURIComponent(merchantUrl)}&title=${encodeURIComponent(merchant.name)}` },
                    { label: "Email",    icon: <Mail className="h-5 w-5" />, bg: "bg-muted border border-border", href: `mailto:?subject=${encodeURIComponent(merchant.name)}&body=${encodeURIComponent(merchantUrl)}` },
                  ].map(({ label, icon, bg, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex flex-col items-center gap-1.5 transition-opacity hover:opacity-80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={`h-11 w-11 rounded-full flex items-center justify-center text-white ${bg}`}>
                        {icon}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
                    </a>
                  ))}
                </div>

                {/* Copy link */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50">
                  <span className="flex-1 min-w-0 truncate text-xs text-muted-foreground">
                    {(() => { const s = merchantUrl; return s.length > 40 ? s.slice(0, 37) + "…" : s; })()}
                  </span>
                  <button
                    className="shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-background border border-border hover:bg-muted transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(merchantUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied
                      ? <><Check className="h-3 w-3 text-green-500" /> Copied</>
                      : <><Copy className="h-3 w-3" /> Copy</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
