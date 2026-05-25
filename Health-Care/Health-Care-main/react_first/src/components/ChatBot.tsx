import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, X, Minus } from "lucide-react";
import Lottie from "lottie-react";
import chatbot from "@/assets/chatbot.json";
import { useAuth } from "@/hooks/useAuth";
import { apiCall } from "@/lib/api";
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

  const hintMessages = useMemo(
    () => [t("chatBot.floatingMessage1"), t("chatBot.floatingMessage2")],
    [t, i18n.language]
  );

  useEffect(() => {
    const setDefaultPositions = () => {
      const launcherSize = window.innerWidth < 640 ? 170 : 210;
      const chatWidth = window.innerWidth < 640 ? window.innerWidth - 24 : 470;
      const chatHeight = 640;

      setLauncherPosition((prev) => {
        if (prev) return prev;

        return {
          x: window.innerWidth - launcherSize - 20,
          y: window.innerHeight - launcherSize - 20,
        };
      });

      setChatPosition((prev) => {
        if (prev) return prev;

        return {
          x: window.innerWidth - chatWidth - 20,
          y: Math.max(20, window.innerHeight - chatHeight - 20),
        };
      });
    };

    setDefaultPositions();

    window.addEventListener("resize", setDefaultPositions);

    return () => {
      window.removeEventListener("resize", setDefaultPositions);
    };
  }, []);

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
        const launcherSize = window.innerWidth < 640 ? 170 : 210;

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
        const chatWidth = window.innerWidth < 640 ? window.innerWidth - 24 : 470;
        const chatHeight = isMinimized ? 84 : 640;

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
            `${import.meta.env.VITE_API_URL}/api/predictions/`,
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
      const predId = predictionId || 1;

      const response = await apiCall<{
        bot_response: string;
        conversation_id: number;
      }>(`${import.meta.env.VITE_API_URL}/api/chatbot/`, {
        method: "POST",
        body: JSON.stringify({
          prediction_id: predId,
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
          <div className="relative w-[170px] sm:w-[210px] h-[170px] sm:h-[210px] pointer-events-none">
            {showHint && (
              <div
                dir={i18n.language === "ar" ? "rtl" : "ltr"}
                className="chatbot-hint z-20 pointer-events-auto absolute top-[6px] right-[105px] sm:top-[10px] sm:right-[132px] w-[170px] sm:w-[195px] rounded-2xl border bg-background px-3 py-2 shadow-xl"
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

                <p className="pr-4 text-[12px] sm:text-sm font-medium leading-5 text-foreground min-h-[20px]">
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
                className="pointer-events-none h-[170px] w-[170px] sm:h-[210px] sm:w-[210px]"
              />
            </button>
          </div>
        </div>
      )}

      {isChatOpen && chatPosition && (
        <div
          dir={i18n.language === "ar" ? "rtl" : "ltr"}
          className={`fixed z-[999] w-[calc(100vw-1.5rem)] sm:w-[430px] md:w-[470px] bg-background/95 backdrop-blur-xl border border-border/60 rounded-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden transition-[height] duration-300 flex flex-col ${
            isMinimized ? "h-[84px]" : "h-[640px]"
          }`}
          style={{
            left: chatPosition.x,
            top: chatPosition.y,
          }}
        >
          <div
            onPointerDown={(e) => startDrag(e, "chat")}
            className="cursor-move px-5 py-4 border-b border-border/50 bg-gradient-to-b from-background to-background/90 shrink-0"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-transparent shrink-0">
                  <Lottie
                    animationData={chatbot}
                    loop
                    className="h-16 w-16 pointer-events-none"
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold truncate">
                    {t("chatBot.title")}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
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
