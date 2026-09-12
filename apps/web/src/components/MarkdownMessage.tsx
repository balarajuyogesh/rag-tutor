import { Children, type ReactNode } from "react";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import { Box, Chip, Link, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

interface MarkdownMessageProps {
  children: string;
}

/** Convert the alternate LaTeX delimiters models commonly emit into remark-math syntax. */
function normalizeMath(markdown: string) {
  return markdown
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, equation: string) => `\n\n$$\n${equation.trim()}\n$$\n\n`)
    .replace(/\\\((.+?)\\\)/g, (_, equation: string) => `$${equation.trim()}$`);
}

function withCitationBadges(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child !== "string") return child;

    const parts = child.split(
      /(\[(?:Source:\s*[^,\]]+|source),\s*p\.\s*\d+\])/gi,
    );
    return parts.map((part, index) => {
      const match = part.match(
        /^\[(?:Source:\s*([^,\]]+)|source),\s*p\.\s*(\d+)\]$/i,
      );
      if (!match) return part;

      const title = match[1]?.trim() || "Source";

      return (
        <Chip
          key={`${title}-${match[2]}-${index}`}
          icon={<ArticleOutlinedIcon />}
          label={`${title} · p. ${match[2]}`}
          size="small"
          variant="outlined"
          className="citation-badge"
        />
      );
    });
  });
}

export function MarkdownMessage({ children }: MarkdownMessageProps) {
  const markdown = normalizeMath(children);

  return (
    <Box className="markdown-message">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({ children: label, ...props }) => (
            <Link {...props} target="_blank" rel="noreferrer">
              {label}
            </Link>
          ),
          p: ({ children: content }) => (
            <Typography component="p" variant="body1">
              {withCitationBadges(content)}
            </Typography>
          ),
          h1: ({ children: content }) => <Typography variant="h4">{content}</Typography>,
          h2: ({ children: content }) => <Typography variant="h5">{content}</Typography>,
          h3: ({ children: content }) => <Typography variant="h6">{content}</Typography>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </Box>
  );
}
