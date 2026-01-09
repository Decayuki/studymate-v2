/**
 * Markdown to Notion Blocks Converter
 * 
 * Converts markdown content to Notion block format
 * Supports: headings, paragraphs, lists, bold, italic, code
 */

export interface NotionBlock {
  object: 'block';
  type: string;
  [key: string]: any;
}

export interface RichTextElement {
  type: 'text';
  text: {
    content: string;
    link?: { url: string };
  };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
}

/**
 * Convert markdown text to Notion blocks
 */
export function markdownToNotionBlocks(markdown: string): NotionBlock[] {
  const blocks: NotionBlock[] = [];
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines
    if (trimmedLine === '') {
      i++;
      continue;
    }

    // Handle headings
    if (trimmedLine.startsWith('# ')) {
      blocks.push(createHeadingBlock('heading_1', trimmedLine.substring(2)));
      i++;
      continue;
    }

    if (trimmedLine.startsWith('## ')) {
      blocks.push(createHeadingBlock('heading_2', trimmedLine.substring(3)));
      i++;
      continue;
    }

    if (trimmedLine.startsWith('### ')) {
      blocks.push(createHeadingBlock('heading_3', trimmedLine.substring(4)));
      i++;
      continue;
    }

    // Handle bullet lists
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        if (currentLine.startsWith('- ') || currentLine.startsWith('* ')) {
          listItems.push(currentLine.substring(2));
          i++;
        } else if (currentLine === '') {
          i++;
        } else {
          break;
        }
      }
      
      listItems.forEach(item => {
        blocks.push(createBulletListItemBlock(item));
      });
      continue;
    }

    // Handle numbered lists
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        const match = currentLine.match(/^(\d+)\.\s+(.+)/);
        if (match) {
          listItems.push(match[2]);
          i++;
        } else if (currentLine === '') {
          i++;
        } else {
          break;
        }
      }
      
      listItems.forEach(item => {
        blocks.push(createNumberedListItemBlock(item));
      });
      continue;
    }

    // Handle code blocks
    if (trimmedLine.startsWith('```')) {
      const codeLines: string[] = [];
      i++; // Skip opening ```
      
      while (i < lines.length) {
        const currentLine = lines[i];
        if (currentLine.trim().startsWith('```')) {
          i++; // Skip closing ```
          break;
        }
        codeLines.push(currentLine);
        i++;
      }
      
      blocks.push(createCodeBlock(codeLines.join('\n')));
      continue;
    }

    // Handle blockquotes
    if (trimmedLine.startsWith('> ')) {
      blocks.push(createQuoteBlock(trimmedLine.substring(2)));
      i++;
      continue;
    }

    // Handle regular paragraphs
    const paragraphLines: string[] = [line];
    i++;
    
    // Collect consecutive non-empty lines for paragraph
    while (i < lines.length) {
      const nextLine = lines[i];
      const nextTrimmed = nextLine.trim();
      
      if (nextTrimmed === '' || 
          nextTrimmed.startsWith('#') || 
          nextTrimmed.startsWith('- ') || 
          nextTrimmed.startsWith('* ') ||
          nextTrimmed.match(/^(\d+)\.\s+/) ||
          nextTrimmed.startsWith('```') ||
          nextTrimmed.startsWith('> ')) {
        break;
      }
      
      paragraphLines.push(nextLine);
      i++;
    }
    
    const paragraphText = paragraphLines.join('\n').trim();
    if (paragraphText) {
      blocks.push(createParagraphBlock(paragraphText));
    }
  }

  return blocks;
}

/**
 * Create heading block
 */
function createHeadingBlock(type: string, text: string): NotionBlock {
  return {
    object: 'block',
    type,
    [type]: {
      rich_text: parseRichText(text),
    },
  };
}

/**
 * Create paragraph block
 */
function createParagraphBlock(text: string): NotionBlock {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: parseRichText(text),
    },
  };
}

/**
 * Create bullet list item block
 */
function createBulletListItemBlock(text: string): NotionBlock {
  return {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: parseRichText(text),
    },
  };
}

/**
 * Create numbered list item block
 */
function createNumberedListItemBlock(text: string): NotionBlock {
  return {
    object: 'block',
    type: 'numbered_list_item',
    numbered_list_item: {
      rich_text: parseRichText(text),
    },
  };
}

/**
 * Create code block
 */
function createCodeBlock(code: string): NotionBlock {
  return {
    object: 'block',
    type: 'code',
    code: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: code,
          },
        },
      ],
      language: 'plain text',
    },
  };
}

/**
 * Create quote block
 */
function createQuoteBlock(text: string): NotionBlock {
  return {
    object: 'block',
    type: 'quote',
    quote: {
      rich_text: parseRichText(text),
    },
  };
}

/**
 * Parse text with markdown formatting to Notion rich text
 */
function parseRichText(text: string): RichTextElement[] {
  const richText: RichTextElement[] = [];
  let currentIndex = 0;

  // Simple parsing - could be enhanced with a proper markdown parser
  while (currentIndex < text.length) {
    // Look for bold **text**
    const boldMatch = text.substring(currentIndex).match(/^\*\*(.*?)\*\*/);
    if (boldMatch) {
      richText.push({
        type: 'text',
        text: { content: boldMatch[1] },
        annotations: { bold: true },
      });
      currentIndex += boldMatch[0].length;
      continue;
    }

    // Look for italic *text*
    const italicMatch = text.substring(currentIndex).match(/^\*(.*?)\*/);
    if (italicMatch) {
      richText.push({
        type: 'text',
        text: { content: italicMatch[1] },
        annotations: { italic: true },
      });
      currentIndex += italicMatch[0].length;
      continue;
    }

    // Look for inline code `text`
    const codeMatch = text.substring(currentIndex).match(/^`(.*?)`/);
    if (codeMatch) {
      richText.push({
        type: 'text',
        text: { content: codeMatch[1] },
        annotations: { code: true },
      });
      currentIndex += codeMatch[0].length;
      continue;
    }

    // Regular text - find next special character or end
    const nextSpecial = text.substring(currentIndex).search(/[\*`]/);
    const endIndex = nextSpecial === -1 ? text.length : currentIndex + nextSpecial;
    
    if (endIndex > currentIndex) {
      const content = text.substring(currentIndex, endIndex);
      if (content) {
        richText.push({
          type: 'text',
          text: { content },
        });
      }
      currentIndex = endIndex;
    } else {
      // No special character found, add the rest
      const content = text.substring(currentIndex);
      if (content) {
        richText.push({
          type: 'text',
          text: { content },
        });
      }
      break;
    }
  }

  return richText.length > 0 ? richText : [{ type: 'text', text: { content: text } }];
}