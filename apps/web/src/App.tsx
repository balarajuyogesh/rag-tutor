import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
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
import { askTutor } from "./api";
import { MarkdownMessage } from "./components/MarkdownMessage";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
}

const suggestions = [
  "Explain the divergence theorem intuitively",
  "How do I compute a directional derivative?",
  "Compare curl and divergence with examples",
];

const starterMessage: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi — I’m **Vector**, your calculus study partner. Ask me a question and I’ll ground the explanation in your course material, with equations when they help.\n\nFor example, the gradient of a scalar field $f$ is\n\n$$\\nabla f = \\left(\\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}, \\frac{\\partial f}{\\partial z}\\right).$$",
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
  const controllerRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const submitQuestion = async (value = question) => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setError(null);
    setIsLoading(true);
    controllerRef.current = new AbortController();

    try {
      const response = await askTutor(trimmed, controllerRef.current.signal);
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
    setDrawerOpen(false);
  };

  const sidebar = (
    <Stack sx={{ height: "100%", p: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 0.5, mb: 3 }}>
        <Avatar sx={{ bgcolor: "primary.main", width: 38, height: 38 }}>
          <CalculateOutlinedIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography fontWeight={750} letterSpacing="-0.02em">Vector</Typography>
          <Typography variant="caption" color="text.secondary">RAG calculus tutor</Typography>
        </Box>
      </Stack>

      <Button variant="contained" size="large" onClick={resetChat} startIcon={<AutoAwesomeRoundedIcon />}>
        New conversation
      </Button>

      <Box sx={{ mt: 4 }}>
        <Typography variant="overline" color="text.secondary" fontWeight={700}>
          Study space
        </Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          <Box className="nav-card nav-card-active">
            <SchoolOutlinedIcon fontSize="small" />
            <Box>
              <Typography variant="body2" fontWeight={700}>Vector calculus</Typography>
              <Typography variant="caption" color="text.secondary">Course knowledge base</Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ mt: "auto", p: 2, bgcolor: "rgba(22, 93, 82, .07)", borderRadius: 3 }}>
        <Typography variant="body2" fontWeight={700}>Grounded answers</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.5 }}>
          Responses use the indexed Vector Calculus course material.
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
            bgcolor: "#fafbf8",
          },
        }}
      >
        {sidebar}
      </Drawer>

      <Box component="main" sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100dvh" }}>
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "rgba(245,246,241,.82)", backdropFilter: "blur(14px)" }}>
          <Toolbar sx={{ minHeight: "68px !important" }}>
            {!isDesktop && (
              <IconButton edge="start" onClick={() => setDrawerOpen(true)} aria-label="Open navigation" sx={{ mr: 1 }}>
                <MenuRoundedIcon />
              </IconButton>
            )}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box className="status-dot" />
              <Typography variant="body2" fontWeight={650}>Tutor online</Typography>
            </Stack>
            <Chip label="Vector calculus" size="small" variant="outlined" sx={{ ml: "auto", bgcolor: "background.paper" }} />
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
            {messages.length === 1 && (
              <Box sx={{ mb: 5 }}>
                <Typography variant="overline" color="primary.main" fontWeight={800}>Learn with clarity</Typography>
                <Typography variant="h1" sx={{ maxWidth: 650, mt: 0.5 }}>Make the math click.</Typography>
                <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 570, fontSize: "1.05rem", lineHeight: 1.7 }}>
                  Explore vector calculus through grounded explanations, worked equations, and focused follow-up questions.
                </Typography>
              </Box>
            )}

            <Stack spacing={3.5}>
              {messages.map((message) => (
                <Stack key={message.id} direction="row" spacing={1.5} className={`message-row ${message.role}`}>
                  {message.role === "assistant" && (
                    <Avatar className="tutor-avatar"><AutoAwesomeRoundedIcon fontSize="small" /></Avatar>
                  )}
                  <Box className="message-bubble">
                    {message.role === "assistant" ? (
                      <MarkdownMessage>{message.content}</MarkdownMessage>
                    ) : (
                      <Typography sx={{ whiteSpace: "pre-wrap" }}>{message.content}</Typography>
                    )}
                  </Box>
                </Stack>
              ))}

              {isLoading && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar className="tutor-avatar"><AutoAwesomeRoundedIcon fontSize="small" /></Avatar>
                  <Stack direction="row" alignItems="center" spacing={1.2} className="thinking-bubble">
                    <CircularProgress size={17} thickness={5} />
                    <Typography variant="body2" color="text.secondary">Working through it…</Typography>
                  </Stack>
                </Stack>
              )}
              {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
              <div ref={endRef} />
            </Stack>
          </Container>
        </Box>

        <Box sx={{ borderTop: "1px solid", borderColor: "divider", bgcolor: "rgba(250,251,248,.94)", px: 2, py: 2 }}>
          <Container maxWidth="md">
            {messages.length === 1 && (
              <Stack direction="row" spacing={1} sx={{ mb: 1.5, overflowX: "auto", pb: 0.5 }}>
                {suggestions.map((suggestion) => (
                  <Chip key={suggestion} label={suggestion} variant="outlined" onClick={() => void submitQuestion(suggestion)} sx={{ flexShrink: 0, bgcolor: "background.paper" }} />
                ))}
              </Stack>
            )}
            <Box component="form" onSubmit={handleSubmit} className="composer">
              <TextField
                fullWidth
                multiline
                maxRows={5}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about gradients, line integrals, divergence…"
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
              Enter to send · Shift + Enter for a new line · Verify important results
            </Typography>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
