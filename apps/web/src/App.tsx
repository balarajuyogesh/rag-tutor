import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import LocalLibraryOutlinedIcon from "@mui/icons-material/LocalLibraryOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { askTutor, getDocuments, type LibraryDocument } from "./api";
import { DocumentPicker } from "./components/DocumentPicker";
import { MarkdownMessage } from "./components/MarkdownMessage";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: Array<{ id: string; title: string }>;
}

const suggestions = [
  "Summarize the central idea of this book",
  "Explain a difficult concept in simple terms",
  "Create five study questions from the material",
];

const starterMessage: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to the reading room. I’m **Folio**, your guide through the books in this library. Ask about an idea, request a summary, or work through a difficult passage with me.\n\nI’ll answer from the indexed pages and leave page references along the way, so you can always return to the source.",
};

const drawerWidth = 280;

function App() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([starterMessage]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<LibraryDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const controller = new AbortController();
    getDocuments(controller.signal)
      .then(setDocuments)
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setDocumentsError("Book attachments are temporarily unavailable.");
      })
      .finally(() => setDocumentsLoading(false));
    return () => controller.abort();
  }, []);

  const submitQuestion = async (value = question) => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      attachments: selectedDocuments.map((document) => ({
        id: document.document_id,
        title: document.title,
      })),
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setError(null);
    setIsLoading(true);
    controllerRef.current = new AbortController();

    try {
      const response = await askTutor(
        trimmed,
        selectedDocuments.map((document) => document.document_id),
        controllerRef.current.signal,
      );
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: response.answer },
      ]);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
      controllerRef.current = null;
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitQuestion();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitQuestion();
    }
  };

  const resetChat = () => {
    controllerRef.current?.abort();
    setMessages([starterMessage]);
    setError(null);
    setIsLoading(false);
    setSelectedDocuments([]);
    setDrawerOpen(false);
  };

  const sidebar = (
    <Stack sx={{ height: "100%", p: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 0.5, mb: 3 }}>
        <Avatar className="brand-mark">
          <AutoStoriesOutlinedIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography fontWeight={750} letterSpacing="-0.02em">Folio</Typography>
          <Typography variant="caption" color="text.secondary">Your reading companion</Typography>
        </Box>
      </Stack>

      <Button variant="contained" size="large" onClick={resetChat} startIcon={<BookmarkBorderRoundedIcon />}>
        Start a new thread
      </Button>

      <Box sx={{ mt: 4 }}>
        <Typography variant="overline" color="text.secondary" fontWeight={700}>
          The reading room
        </Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          <Box className="nav-card nav-card-active">
            <LocalLibraryOutlinedIcon fontSize="small" />
            <Box>
              <Typography variant="body2" fontWeight={700}>Your PDF library</Typography>
              <Typography variant="caption" color="text.secondary">Indexed and ready to explore</Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      <Box className="library-note" sx={{ mt: "auto", p: 2, borderRadius: 3 }}>
        <Typography variant="overline" color="secondary.main" fontWeight={800}>A note from Folio</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.5 }}>
          Every answer begins in your books. Look for page markers to trace an idea back to its source.
        </Typography>
      </Box>
    </Stack>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <Drawer
        variant={isDesktop ? "permanent" : "temporary"}
        open={isDesktop || drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isDesktop ? drawerWidth : 0,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
            bgcolor: "#fbf7ef",
          },
        }}
      >
        {sidebar}
      </Drawer>

      <Box component="main" sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100dvh" }}>
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "rgba(246,241,231,.84)", backdropFilter: "blur(14px)" }}>
          <Toolbar sx={{ minHeight: "68px !important" }}>
            {!isDesktop && (
              <IconButton edge="start" onClick={() => setDrawerOpen(true)} aria-label="Open navigation" sx={{ mr: 1 }}>
                <MenuRoundedIcon />
              </IconButton>
            )}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box className="status-dot" />
              <Typography variant="body2" fontWeight={650}>The library is open</Typography>
            </Stack>
            <Chip icon={<AutoStoriesOutlinedIcon />} label={`${documents.length} ${documents.length === 1 ? "book" : "books"} indexed`} size="small" variant="outlined" sx={{ ml: "auto", bgcolor: "background.paper" }} />
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
            {messages.length === 1 && (
              <Box sx={{ mb: 5 }}>
                <Typography variant="overline" color="secondary.main" fontWeight={800}>A conversation with your library</Typography>
                <Typography variant="h1" sx={{ maxWidth: 650, mt: 0.5 }}>Read between the lines.</Typography>
                <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 570, fontSize: "1.05rem", lineHeight: 1.7 }}>
                  Turn dense pages into clear ideas. Folio reads alongside you, connects passages, and keeps every answer grounded in your books.
                </Typography>
              </Box>
            )}

            <Stack spacing={3.5}>
              {messages.map((message) => (
                <Stack key={message.id} direction="row" spacing={1.5} className={`message-row ${message.role}`}>
                  {message.role === "assistant" && (
                    <Avatar className="tutor-avatar"><AutoStoriesOutlinedIcon fontSize="small" /></Avatar>
                  )}
                  <Box className="message-bubble">
                    {message.role === "assistant" ? (
                      <MarkdownMessage>{message.content}</MarkdownMessage>
                    ) : (
                      <Box>
                        {!!message.attachments?.length && (
                          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                            {message.attachments.map((attachment) => (
                              <Chip key={attachment.id} icon={<AutoStoriesOutlinedIcon />} label={attachment.title} size="small" className="message-attachment" />
                            ))}
                          </Stack>
                        )}
                        <Typography sx={{ whiteSpace: "pre-wrap" }}>{message.content}</Typography>
                      </Box>
                    )}
                  </Box>
                </Stack>
              ))}

              {isLoading && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar className="tutor-avatar"><AutoStoriesOutlinedIcon fontSize="small" /></Avatar>
                  <Stack direction="row" alignItems="center" spacing={1.2} className="thinking-bubble">
                    <CircularProgress size={17} thickness={5} />
                    <Typography variant="body2" color="text.secondary">Turning through the pages…</Typography>
                  </Stack>
                </Stack>
              )}
              {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
              <div ref={endRef} />
            </Stack>
          </Container>
        </Box>

        <Box sx={{ borderTop: "1px solid", borderColor: "divider", bgcolor: "rgba(251,247,239,.95)", px: 2, py: 2 }}>
          <Container maxWidth="md">
            {messages.length === 1 && (
              <Stack direction="row" spacing={1} sx={{ mb: 1.5, overflowX: "auto", pb: 0.5 }}>
                {suggestions.map((suggestion) => (
                  <Chip key={suggestion} label={suggestion} variant="outlined" onClick={() => void submitQuestion(suggestion)} sx={{ flexShrink: 0, bgcolor: "background.paper" }} />
                ))}
              </Stack>
            )}
            {(documentsLoading || documents.length > 0) && (
              <Box className="attachment-picker">
                <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 0.75, px: 0.25 }}>
                  <Typography variant="caption" fontWeight={750} color="text.secondary">
                    Optional book attachments
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedDocuments.length ? `${selectedDocuments.length} selected` : "All books searched by default"}
                  </Typography>
                </Stack>
                <DocumentPicker
                  documents={documents}
                  selected={selectedDocuments}
                  onChange={setSelectedDocuments}
                  loading={documentsLoading}
                  disabled={isLoading}
                />
              </Box>
            )}
            {documentsError && (
              <Typography variant="caption" color="warning.main" sx={{ display: "block", mb: 1 }}>
                {documentsError} Questions will search the full library.
              </Typography>
            )}
            <Box component="form" onSubmit={handleSubmit} className="composer">
              <TextField
                fullWidth
                multiline
                maxRows={5}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your books…"
                slotProps={{ htmlInput: { maxLength: 4000, "aria-label": "Ask the tutor" } }}
                sx={{ "& fieldset": { border: 0 }, "& .MuiInputBase-root": { py: 1.1 } }}
              />
              <Tooltip title={isLoading ? "Stop response" : "Send message"}>
                <span>
                  <IconButton
                    type={isLoading ? "button" : "submit"}
                    color="primary"
                    onClick={isLoading ? () => controllerRef.current?.abort() : undefined}
                    disabled={!isLoading && !question.trim()}
                    className="send-button"
                    aria-label={isLoading ? "Stop response" : "Send message"}
                  >
                    {isLoading ? <StopRoundedIcon /> : <SendRoundedIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 1 }}>
              Enter to send · Shift + Enter for a new line · Answers include page references
            </Typography>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
