import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, X, Minus } from "lucide-react";
import Lottie from "lottie-react";
import chatbot from "@/assets/chatbot.json";
import { useAuth } from "@/hooks/useAuth";
import { apiCall, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

type Position = {
  x: number;
  y: number;
};

type DragTarget = "launcher" | "chat";

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const getLauncherSize = () => {
  if (window.innerWidth < 380) return 118;
  if (window.innerWidth < 640) return 135;
  return 210;
};

const getChatWidth = () => {
  if (window.innerWidth < 640) return window.innerWidth - 20;
  return 470;
};

const getChatHeight = (isMinimized = false) => {
  if (isMinimized) return 84;

  if (window.innerWidth < 640) {
    return Math.min(window.innerHeight - 24, 560);
  }

  return Math.min(window.innerHeight - 32, 640);
};

const ChatBot = () => {
  const { t, i18n } = useTranslation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [predictionId, setPredictionId] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [hideHintPermanently, setHideHintPermanently] = useState(false);
  const [displayedHint, setDisplayedHint] = useState("");
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  const [launcherPosition, setLauncherPosition] = useState<Position | null>(
    null
  );
  const [chatPosition, setChatPosition] = useState<Position | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const welcomeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasDraggedRef = useRef(false);

  const dragRef = useRef<{
    target: DragTarget;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const { user } = useAuth();

  const userRole = String(
    (user as any)?.role ||
      (user as any)?.user_type ||
      (user as any)?.profile?.role ||
      ""
  )
    .trim()
    .toLowerCase();

  const shouldShowChatBot = userRole === "patient";

  const hintMessages = useMemo(
    () => [t("chatBot.floatingMessage1"), t("chatBot.floatingMessage2")],
    [t, i18n.language]
  );

  useEffect(() => {
    const setDefaultPositions = () => {
      const launcherSize = getLauncherSize();
      const chatWidth = getChatWidth();
      const chatHeight = getChatHeight(isMinimized);

      setLauncherPosition((prev) => {
        const nextPosition = prev || {
          x: window.innerWidth - launcherSize - 12,
          y: window.innerHeight - launcherSize - 12,
        };

        return {
          x: clamp(nextPosition.x, 8, window.innerWidth - launcherSize - 8),
          y: clamp(nextPosition.y, 8, window.innerHeight - launcherSize - 8),
        };
      });

      setChatPosition((prev) => {
        const nextPosition = prev || {
          x: window.innerWidth - chatWidth - 10,
          y: Math.max(12, window.innerHeight - chatHeight - 12),
        };

        return {
          x: clamp(nextPosition.x, 8, window.innerWidth - chatWidth - 8),
          y: clamp(nextPosition.y, 8, window.innerHeight - chatHeight - 8),
        };
      });
    };

    setDefaultPositions();

    window.addEventListener("resize", setDefaultPositions);
    window.addEventListener("orientationchange", setDefaultPositions);

    return () => {
      window.removeEventListener("resize", setDefaultPositions);
      window.removeEventListener("orientationchange", setDefaultPositions);
    };
  }, [isMinimized]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragRef.current) return;

      const dx = event.clientX - dragRef.current.startX;
      const dy = event.clientY - dragRef.current.startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragRef.current.moved = true;
        wasDraggedRef.current = true;
      }

      if (dragRef.current.target === "launcher") {
        const launcherSize = getLauncherSize();

        setLauncherPosition({
          x: clamp(
            dragRef.current.originX + dx,
            8,
            window.innerWidth - launcherSize - 8
          ),
          y: clamp(
            dragRef.current.originY + dy,
            8,
            window.innerHeight - launcherSize - 8
          ),
        });
      }

      if (dragRef.current.target === "chat") {
        const chatWidth = getChatWidth();
        const chatHeight = getChatHeight(isMinimized);

        setChatPosition({
          x: clamp(
            dragRef.current.originX + dx,
            8,
            window.innerWidth - chatWidth - 8
          ),
          y: clamp(
            dragRef.current.originY + dy,
            8,
            window.innerHeight - chatHeight - 8
          ),
        });
      }
    };

    const handlePointerUp = () => {
      dragRef.current = null;

      window.setTimeout(() => {
        wasDraggedRef.current = false;
      }, 0);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isMinimized]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      loadLastPrediction();
    }
  }, [isChatOpen, messages.length]);

  useEffect(() => {
    return () => {
      if (welcomeTimeoutRef.current) {
        clearTimeout(welcomeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isChatOpen || hideHintPermanently || hintMessages.length === 0) {
      setShowHint(false);
      setDisplayedHint("");
      return;
    }

    let typingInterval: ReturnType<typeof setInterval> | undefined;
    let deletingInterval: ReturnType<typeof setInterval> | undefined;
    let holdTimeout: ReturnType<typeof setTimeout> | undefined;
    let hideTimeout: ReturnType<typeof setTimeout> | undefined;
    let nextMessageTimeout: ReturnType<typeof setTimeout> | undefined;

    const fullText = hintMessages[currentHintIndex] || "";
    let charIndex = 0;

    setShowHint(true);
    setDisplayedHint("");

    typingInterval = setInterval(() => {
      charIndex += 1;
      setDisplayedHint(fullText.slice(0, charIndex));

      if (charIndex >= fullText.length) {
        if (typingInterval) clearInterval(typingInterval);

        holdTimeout = setTimeout(() => {
          deletingInterval = setInterval(() => {
            charIndex -= 1;
            setDisplayedHint(fullText.slice(0, charIndex));

            if (charIndex <= 0) {
              if (deletingInterval) clearInterval(deletingInterval);

              hideTimeout = setTimeout(() => {
                setShowHint(false);

                nextMessageTimeout = setTimeout(() => {
                  setCurrentHintIndex((prev) => (prev + 1) % hintMessages.length);
                  setShowHint(true);
                }, 700);
              }, 150);
            }
          }, 25);
        }, 1400);
      }
    }, 45);

    return () => {
      if (typingInterval) clearInterval(typingInterval);
      if (deletingInterval) clearInterval(deletingInterval);
      if (holdTimeout) clearTimeout(holdTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);
      if (nextMessageTimeout) clearTimeout(nextMessageTimeout);
    };
  }, [isChatOpen, hideHintPermanently, currentHintIndex, hintMessages]);

  const startDrag = (
    event: React.PointerEvent<HTMLElement>,
    target: DragTarget
  ) => {
    const currentPosition = target === "launcher" ? launcherPosition : chatPosition;

    if (!currentPosition) return;

    dragRef.current = {
      target,
      startX: event.clientX,
      startY: event.clientY,
      originX: currentPosition.x,
      originY: currentPosition.y,
      moved: false,
    };

    wasDraggedRef.current = false;
  };

  const showProfessionalWelcomeSequence = () => {
    if (welcomeTimeoutRef.current) {
      clearTimeout(welcomeTimeoutRef.current);
    }

    setMessages([
      {
        role: "assistant",
        content: t("chatBot.welcomeInitial"),
      },
    ]);

    welcomeTimeoutRef.current = setTimeout(() => {
      setMessages([
        {
          role: "assistant",
          content: t("chatBot.welcomeFollowUp"),
        },
      ]);
    }, 2200);
  };

  const loadLastPrediction = async () => {
    try {
      const storedPredictions = localStorage.getItem("predictions");

      if (storedPredictions) {
        const predictions = JSON.parse(storedPredictions);
        if (predictions.length > 0) {
          const lastPred = predictions[0];
          setPredictionId(lastPred.id);
          showProfessionalWelcomeSequence();
          return;
        }
      }

      if (user) {
        try {
          const data = await apiCall<{ predictions: any[] }>(
            API_ENDPOINTS.GET_PREDICTIONS,
            { method: "GET" }
          );

          if (data.predictions && data.predictions.length > 0) {
            const lastPred = data.predictions[0];
            setPredictionId(lastPred.id);
            showProfessionalWelcomeSequence();
            return;
          }
        } catch (err) {
          console.warn("Could not fetch predictions");
        }
      }

      showProfessionalWelcomeSequence();
    } catch (error) {
      console.error("Error loading prediction:", error);
      showProfessionalWelcomeSequence();
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await apiCall<{
        bot_response: string;
        conversation_id: number;
      }>("/api/chatbot/", {
        method: "POST",
        body: JSON.stringify({
          ...(predictionId ? { prediction_id: predictionId } : {}),
          message: userMsg,
          conversation_id: conversationId || undefined,
        }),
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.bot_response,
          timestamp: response.conversation_id
            ? new Date().toISOString()
            : undefined,
        },
      ]);

      if (response.conversation_id && !conversationId) {
        setConversationId(response.conversation_id);
      }
    } catch (error: any) {
      console.error("Chat error:", error);

      const fallbackResponses: Record<string, string> = {
        why: t("chatBot.fallbackResponses.why"),
        how: t("chatBot.fallbackResponses.how"),
        serious: t("chatBot.fallbackResponses.serious"),
        treatment: t("chatBot.fallbackResponses.treatment"),
      };

      let fallback = t("chatBot.fallbackError");

      for (const [key, value] of Object.entries(fallbackResponses)) {
        if (userMsg.toLowerCase().includes(key.toLowerCase())) {
          fallback = value;
          break;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `${fallback} ${t("chatBot.temporarilyDisabled")}`,
        },
      ]);

      toast.error(t("chatBot.unavailableToast"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpenChat = () => {
    if (wasDraggedRef.current) return;

    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setIsMinimized(false);
    setMessages([]);
    setInputMessage("");
    setConversationId(null);
    setPredictionId(null);
    setIsLoading(false);

    if (welcomeTimeoutRef.current) {
      clearTimeout(welcomeTimeoutRef.current);
    }
  };

  if (!shouldShowChatBot) {
    return null;
  }

  const launcherSizeClass =
    "h-[118px] w-[118px] min-[380px]:h-[135px] min-[380px]:w-[135px] sm:h-[210px] sm:w-[210px]";

  const launcherContainerClass =
    "relative h-[118px] w-[118px] min-[380px]:h-[135px] min-[380px]:w-[135px] sm:h-[210px] sm:w-[210px] pointer-events-none";

  return (
    <>
      <style>
        {`
          @keyframes chatbot-float {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-8px);
            }
          }

          @keyframes hint-fade {
            0% {
              opacity: 0;
              transform: translateY(6px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .chatbot-float {
            animation: chatbot-float 2.6s ease-in-out infinite;
          }

          .chatbot-hint {
            animation: hint-fade 0.3s ease;
          }
        `}
      </style>

      {!isChatOpen && launcherPosition && (
        <div
          className="fixed z-[999] pointer-events-none"
          style={{
            left: launcherPosition.x,
            top: launcherPosition.y,
          }}
        >
          <div className={launcherContainerClass}>
            {showHint && (
              <div
                dir={i18n.language === "ar" ? "rtl" : "ltr"}
                className="chatbot-hint z-20 pointer-events-auto absolute bottom-[92px] right-[72px] w-[160px] rounded-2xl border bg-background px-3 py-2 shadow-xl min-[380px]:bottom-[105px] min-[380px]:right-[85px] sm:top-[10px] sm:bottom-auto sm:right-[132px] sm:w-[195px]"
              >
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowHint(false);
                    setHideHintPermanently(true);
                  }}
                  className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
                  aria-label={t("chatBot.closeHintAriaLabel")}
                >
                  <X className="h-3 w-3" />
                </button>

                <p className="pr-4 text-[11px] sm:text-sm font-medium leading-5 text-foreground min-h-[20px]">
                  {displayedHint}
                  <span className="ms-1 inline-block h-4 w-[1px] align-middle bg-current animate-pulse" />
                </p>

                <span className="absolute bottom-3 -right-1.5 h-3 w-3 rotate-45 border-r border-b bg-background" />
              </div>
            )}

            <button
              onPointerDown={(e) => startDrag(e, "launcher")}
              onClick={handleOpenChat}
              className="z-10 pointer-events-auto absolute bottom-0 right-0 flex cursor-grab active:cursor-grabbing items-center justify-center border-0 bg-transparent p-0 shadow-none transition-all duration-200 hover:scale-105 chatbot-float"
              aria-label={t("chatBot.openAriaLabel")}
              type="button"
            >
              <Lottie
                animationData={chatbot}
                loop
                className={`pointer-events-none ${launcherSizeClass}`}
              />
            </button>
          </div>
        </div>
      )}

      {isChatOpen && chatPosition && (
        <div
          dir={i18n.language === "ar" ? "rtl" : "ltr"}
          className={`fixed z-[999] w-[calc(100vw-1.25rem)] sm:w-[430px] md:w-[470px] bg-background/95 backdrop-blur-xl border border-border/60 rounded-[24px] sm:rounded-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden transition-[height] duration-300 flex flex-col ${
            isMinimized
              ? "h-[84px]"
              : "h-[min(calc(100vh-1.5rem),560px)] sm:h-[min(calc(100vh-2rem),640px)]"
          }`}
          style={{
            left: chatPosition.x,
            top: chatPosition.y,
          }}
        >
          <div
            onPointerDown={(e) => startDrag(e, "chat")}
            className="cursor-move px-4 sm:px-5 py-3 sm:py-4 border-b border-border/50 bg-gradient-to-b from-background to-background/90 shrink-0"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full overflow-hidden bg-transparent shrink-0">
                  <Lottie
                    animationData={chatbot}
                    loop
                    className="h-12 w-12 sm:h-16 sm:w-16 pointer-events-none"
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-semibold truncate">
                    {t("chatBot.title")}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate mt-0.5">
                    {predictionId
                      ? t("chatBot.connectedToLastPrediction")
                      : t("chatBot.generalMode")}
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-1 shrink-0"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setIsMinimized((prev) => !prev)}
                  className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted transition"
                  aria-label={t("chatBot.minimizeAriaLabel")}
                  type="button"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <button
                  onClick={handleCloseChat}
                  className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted transition"
                  aria-label={t("chatBot.closeAriaLabel")}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {!isMinimized && (
            <>
              <ScrollArea className="flex-1 min-h-0 bg-gradient-to-b from-background via-background to-muted/20">
                <div className="px-4 sm:px-5 py-5 space-y-4">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[84%] px-4 py-3 shadow-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-[26px] rounded-br-md"
                            : "bg-accent text-accent-foreground rounded-[26px] rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm leading-6 whitespace-pre-wrap">
                          {msg.content}
                        </p>

                        {msg.timestamp && (
                          <p className="text-[11px] opacity-60 mt-2">
                            {new Date(msg.timestamp).toLocaleTimeString(
                              i18n.language === "ar" ? "ar-EG" : "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-accent text-accent-foreground rounded-[26px] rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            {t("chatBot.typing")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="px-4 sm:px-5 py-4 border-t border-border/50 bg-background/95 shrink-0">
                <div className="flex items-end gap-2">
                  <div className="flex-1 rounded-full border border-border/70 bg-background shadow-sm px-2 py-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={t("chatBot.inputPlaceholder")}
                      disabled={isLoading}
                      className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10 px-3"
                    />
                  </div>

                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    size="icon"
                    aria-label={t("chatBot.sendAriaLabel")}
                    className="h-12 w-12 rounded-full shadow-sm shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBot;