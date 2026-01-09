import { Client } from '@notionhq/client';
import type { IContent } from '@studymate/shared';
import { markdownToNotionBlocks } from './markdown-converter';

/**
 * Notion Service for Publishing StudyMate Content
 * 
 * Handles publishing generated content to Notion workspace
 * Features:
 * - Create pages in specific database
 * - Convert markdown content to Notion blocks
 * - Handle rate limiting (3 req/sec)
 * - Track published page IDs
 */
export class NotionService {
  private client: Client;
  private databaseId: string;

  constructor(apiKey: string, databaseId: string) {
    this.client = new Client({
      auth: apiKey,
    });
    this.databaseId = databaseId;
  }

  /**
   * Publish content to Notion
   */
  async publishContent(content: IContent): Promise<string> {
    try {
      // Get the active version
      const activeVersion = content.versions[content.currentVersion || 0];
      if (!activeVersion) {
        throw new Error('No active version found');
      }

      // Create page properties
      const properties = {
        Name: {
          title: [
            {
              text: {
                content: content.title,
              },
            },
          ],
        },
        Type: {
          select: {
            name: this.getTypeDisplayName(content.type),
          },
        },
        Subject: {
          rich_text: [
            {
              text: {
                content: content.subject?.name || 'Unknown Subject',
              },
            },
          ],
        },
        'AI Model': {
          select: {
            name: this.getModelDisplayName(activeVersion.aiModel),
          },
        },
        Status: {
          select: {
            name: 'Published',
          },
        },
        'Created At': {
          date: {
            start: content.createdAt?.toISOString() || new Date().toISOString(),
          },
        },
      };

      // Convert markdown content to Notion blocks
      const children = markdownToNotionBlocks(activeVersion.content);

      // Create the page
      const response = await this.client.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties,
        children,
      });

      return response.id;
    } catch (error) {
      console.error('Failed to publish to Notion:', error);
      throw new Error(`Notion publish failed: ${error.message}`);
    }
  }


  /**
   * Get display name for content type
   */
  private getTypeDisplayName(type: string): string {
    const typeMap = {
      course: 'Cours',
      td: 'TD',
      control: 'Contrôle',
    };
    return typeMap[type] || type;
  }

  /**
   * Get display name for AI model
   */
  private getModelDisplayName(model: string): string {
    const modelMap = {
      gemini: 'Gemini 2.5 Pro',
      claude: 'Claude 3.5 Sonnet',
    };
    return modelMap[model] || model;
  }

  /**
   * Get page URL from page ID
   */
  getPageUrl(pageId: string): string {
    return `https://notion.so/${pageId.replace(/-/g, '')}`;
  }

  /**
   * Health check for Notion API
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to retrieve database info
      await this.client.databases.retrieve({
        database_id: this.databaseId,
      });
      return true;
    } catch (error) {
      console.error('Notion health check failed:', error);
      return false;
    }
  }
}